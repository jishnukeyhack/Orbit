
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
import ollama
import json

# --- Configuration ---
# For a real-world scenario, these would be configurable via environment variables or a config file.
OLLAMA_MODEL = 'phi3' # Or 'llama3', 'mistral' - must be available locally via Ollama
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2' # Local sentence-transformer model
CONFIDENCE_THRESHOLD = 0.75 # Minimum confidence for auto-fixing

SYSTEM_PROMPT = """You are a data transformation assistant.
Respond ONLY with this exact JSON structure:
{
  "transformation": "lambda x: <valid python expression>",
  "confidence_score": <float 0.0-1.0>,
  "reasoning": "<one sentence>",
  "pattern_type": "<date_format|encoding|type_cast|string_clean|null_handling>"
}
No markdown. No explanation. No preamble. JSON only."""

class DataLossException(Exception):
    """Custom exception for data loss events."""
    pass

def cluster_anomalies(suspect_rows: list[str], collection_name: str = "anomaly_clusters") -> chromadb.Collection:
    """
    Compress N anomalous rows into semantic clusters using a local embedding model.
    """
    print(f"Clustering {len(suspect_rows)} anomalous rows...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)  # local, no API
    embeddings = model.encode(suspect_rows).tolist()

    client = chromadb.Client()
    try:
        client.delete_collection(name=collection_name) # Clear previous collection if exists
    except:
        pass # Collection might not exist, ignore error

    collection = client.create_collection(collection_name)
    collection.add(
        embeddings=embeddings,
        documents=suspect_rows,
        ids=[str(i) for i in range(len(suspect_rows))]
    )
    print(f"Created ChromaDB collection '{collection_name}' with {len(suspect_rows)} documents.")
    return collection

def generate_fix_logic(sample_rows: list[str], column_name: str) -> dict:
    """
    Generates deterministic fix logic using a local SLM (Ollama).
    Includes strict safety gates for the generated lambda.
    """
    print(f"Generating fix logic for column '{column_name}' with {len(sample_rows)} samples...")
    user_content = (f"Column: '{column_name}'\n"
                f"Samples:\n" +
                "\n".join(sample_rows))
    
    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,  # local, air-gapped — zero external calls
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_content}
            ]
        )
        result = json.loads(response['message']['content'])
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from Ollama: {e}")
        print(f"Ollama raw response: {response.get('message', {}).get('content', 'N/A')}")
        raise ValueError("SLM did not return valid JSON.")
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        raise

    # Safety gate — reject anything that isn't a simple lambda
    forbidden = ['import', 'exec', 'eval', 'os.', 'subprocess', 'open(', 'file(']
    transformation_code = result.get('transformation', '')

    if not transformation_code.startswith('lambda'):
        raise ValueError("Rejected: output must be a lambda function")
    if any(term in transformation_code for term in forbidden):
        raise ValueError(f"Rejected: forbidden term found in lambda: {', '.join([t for t in forbidden if t in transformation_code])}")

    print(f"Generated fix logic: {result.get('transformation')}, Confidence: {result.get('confidence_score')}")
    return result

def apply_fix_to_cluster(df: pd.DataFrame, column: str, fix: dict) -> pd.DataFrame:
    """
    Applies AI-generated lambda across an entire DataFrame (cluster) using vectorized operations.
    Handles low-confidence fixes by routing to human review.
    """
    print(f"Applying fix to {len(df)} rows in column '{column}'...")
    if fix['confidence_score'] < CONFIDENCE_THRESHOLD:
        print(f"Low confidence ({fix['confidence_score']}) for fix. Routing to human review.")
        df['validation_status'] = 'HUMAN_REVIEW'
        df['quarantine_reason'] = f"Low confidence: {fix['confidence_score']}"
        return df

    try:
        # eval is safe here because the lambda has passed strict validation (lambda-only, no imports/exec/os)
        transform_fn = eval(fix['transformation']) 
        df[column] = df[column].map(transform_fn)
        df['validation_status'] = 'AI_FIXED'
        df['ai_reasoning'] = fix['reasoning']
        df['confidence_score'] = fix['confidence_score']
        print(f"Successfully applied fix: {fix['transformation']}")
    except Exception as e:
        print(f"Error applying transformation: {e}. Routing to human review.")
        df['validation_status'] = 'HUMAN_REVIEW'
        df['quarantine_reason'] = f"Error applying fix: {e}"
    return df

def reconciliation_check(source_count: int, success_count: int, quarantine_count: int):
    """
    Mathematical zero-data-loss guarantee.
    Any mismatch > 0 is an immediate Sev-1.
    """
    print(f"Reconciliation check: Source={source_count}, Success={success_count}, Quarantine={quarantine_count}")
    if source_count != success_count + quarantine_count:
        missing = source_count - (success_count + quarantine_count)
        # In a real system, this would trigger an alert (PagerDuty, Slack, etc.)
        print(f"🚨 SEV1 ALERT: DATA LOSS DETECTED! {missing} rows unaccounted for.")
        raise DataLossException(f"Reconciliation failed: {missing} missing rows")
    print("Reconciliation successful: All rows accounted for.")
    return True

# Example Usage (for demonstration purposes)
if __name__ == "__main__":
    # --- Step 1: Receive Anomalous Rows ---
    # In a real scenario, this would come from a data pipeline.
    anomalous_data = [
        {"id": 1, "value": "2023-10-26T10:00:00Z", "column_name": "event_timestamp"},
        {"id": 2, "value": "October 26, 2023 10:05 AM", "column_name": "event_timestamp"},
        {"id": 3, "value": "26/10/2023 10:10", "column_name": "event_timestamp"},
        {"id": 4, "value": "2023-10-26 10:15:00", "column_name": "event_timestamp"},
        {"id": 5, "value": "Invalid Date String", "column_name": "event_timestamp"},
        {"id": 6, "value": "2023-10-26T10:20:00Z", "column_name": "event_timestamp"},
        {"id": 7, "value": "October 26, 2023 10:25 AM", "column_name": "event_timestamp"},
        {"id": 8, "value": "26/10/2023 10:30", "column_name": "event_timestamp"},
        {"id": 9, "value": "2023-10-26 10:35:00", "column_name": "event_timestamp"},
        {"id": 10, "value": "Another Bad Date", "column_name": "event_timestamp"},
    ]

    # Convert to DataFrame for easier processing
    df_anomalies = pd.DataFrame(anomalous_data)
    source_row_count = len(df_anomalies)
    print(f"Received {source_row_count} anomalous rows.")

    # Assuming 'value' is the column with anomalies we want to fix
    column_to_fix = "value"
    
    # --- Step 2: Semantic Compression ---
    # Extract the anomalous values for clustering
    suspect_values = df_anomalies[column_to_fix].tolist()
    
    # This part is simplified for demonstration. In a real system, you'd query ChromaDB
    # to find clusters and representative samples. For now, we'll just take unique values
    # as "samples" for the SLM, simulating distinct patterns.
    unique_suspect_values = list(set(suspect_values))
    print(f"Unique anomalous values (simulating cluster samples): {unique_suspect_values}")

    # --- Step 3: Air-Gapped SLM Fix Generation ---
    # For each unique pattern (simulated cluster), generate a fix.
    # In a real system, you'd iterate through actual clusters from ChromaDB.
    generated_fixes = {}
    for sample_value in unique_suspect_values:
        # Create a dummy DataFrame for the "cluster" for this sample
        # In a real scenario, this would be a subset of df_anomalies belonging to a cluster
        cluster_df = df_anomalies[df_anomalies[column_to_fix] == sample_value].copy()
        if not cluster_df.empty:
            try:
                # Pass a list of samples from the "cluster" to the SLM
                fix_logic = generate_fix_logic(cluster_df[column_to_fix].tolist(), column_to_fix)
                generated_fixes[sample_value] = fix_logic
            except ValueError as e:
                print(f"Could not generate fix for sample '{sample_value}': {e}. Routing to human review.")
                # Mark these rows for human review
                df_anomalies.loc[df_anomalies[column_to_fix] == sample_value, 'validation_status'] = 'HUMAN_REVIEW'
                df_anomalies.loc[df_anomalies[column_to_fix] == sample_value, 'quarantine_reason'] = str(e)
        
    # --- Step 4: Cluster-Wide Vectorized Execution ---
    # Apply the generated fixes to the original DataFrame
    fixed_rows_count = 0
    quarantined_rows_count = 0

    for sample_value, fix_logic in generated_fixes.items():
        # Get the subset of the DataFrame corresponding to this "cluster"
        cluster_mask = (df_anomalies[column_to_fix] == sample_value) & (df_anomalies['validation_status'].isna())
        if cluster_mask.any():
            df_cluster = df_anomalies[cluster_mask].copy()
            df_fixed_cluster = apply_fix_to_cluster(df_cluster, column_to_fix, fix_logic)
            
            # Update the original DataFrame with the results
            df_anomalies.update(df_fixed_cluster)
            
    # After processing all clusters, count the results
    fixed_rows_count = df_anomalies[df_anomalies['validation_status'] == 'AI_FIXED'].shape[0]
    quarantined_rows_count = df_anomalies[df_anomalies['validation_status'] == 'HUMAN_REVIEW'].shape[0]
    
    # Ensure any rows not touched by AI (e.g., if no fix was generated) are also quarantined
    df_anomalies.loc[df_anomalies['validation_status'].isna(), 'validation_status'] = 'HUMAN_REVIEW'
    df_anomalies.loc[df_anomalies['quarantine_reason'].isna(), 'quarantine_reason'] = 'No AI fix attempted or generated'
    quarantined_rows_count = df_anomalies[df_anomalies['validation_status'] == 'HUMAN_REVIEW'].shape[0]


    print("
--- Remediation Summary ---")
    print(f"Total Source Rows: {source_row_count}")
    print(f"AI Fixed Rows: {fixed_rows_count}")
    print(f"Human Review / Quarantined Rows: {quarantined_rows_count}")
    print("
Final DataFrame after remediation:")
    print(df_anomalies)

    # --- Step 5: Reconciliation & Audit ---
    try:
        reconciliation_check(source_row_count, fixed_rows_count, quarantined_rows_count)
        print("Data remediation process completed successfully with zero data loss.")
    except DataLossException as e:
        print(f"Data remediation failed: {e}")
