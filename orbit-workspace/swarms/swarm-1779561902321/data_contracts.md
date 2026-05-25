# Data Contracts for End-to-End Google Search

This document defines the data contracts for each layer of the Google Search data pipeline, ensuring clarity on schemas, Service Level Agreements (SLAs), and ownership.

## 1. Bronze Layer: Raw Web Ingestion

**Purpose**: Immutable, append-only storage of raw web page content as crawled.

**Schema**: (Schema-on-read, but expected structure)

*   `url`: `STRING` - The URL of the crawled page. (Primary Key)
*   `html_content`: `STRING` - The full HTML content of the page.
*   `crawl_timestamp`: `TIMESTAMP` - UTC timestamp when the page was crawled.
*   `http_status_code`: `INTEGER` - HTTP status code returned by the server.
*   `content_type`: `STRING` - Content-Type header from the HTTP response.
*   `_ingested_at`: `TIMESTAMP` - System timestamp of ingestion into Bronze. (Audit Column)
*   `_source_system`: `STRING` - Identifier for the crawling system. (Audit Column)
*   `_source_file`: `STRING` - Path to the raw source file/object. (Audit Column)

**SLAs**:

*   **Freshness**: New crawls available in Bronze within 5 minutes of completion by the crawler.
*   **Completeness**: >99.9% of successfully crawled pages are ingested.
*   **Availability**: 99.99% availability for read access.
*   **Retention**: Raw data retained for 90 days for replay/debugging.

**Ownership**: Web Crawling Team / Data Ingestion Team

**Consumers**: Silver Layer Processing (Document Processing)

## 2. Silver Layer: Document Processing & Indexing

**Purpose**: Cleanse, deduplicate, extract, and transform raw web data into structured documents suitable for initial indexing.

**Schema**: (Enforced Schema)

*   `doc_id`: `STRING` - Unique identifier for the processed document (e.g., SHA256 hash of canonical URL). (Primary Key)
*   `canonical_url`: `STRING` - The canonical URL of the document.
*   `title`: `STRING` - Extracted title of the page.
*   `cleaned_text`: `STRING` - Main textual content of the page, free of boilerplate.
*   `keywords`: `ARRAY<STRING>` - Extracted keywords/phrases.
*   `outbound_links`: `ARRAY<STRING>` - List of URLs linked from this page.
*   `inbound_links_count`: `INTEGER` - Count of known inbound links (updated incrementally).
*   `page_rank_score`: `DOUBLE` - Pre-computed PageRank-like score. (Updated incrementally)
*   `language`: `STRING` - Detected language of the document.
*   `document_type`: `STRING` - e.g., 'HTML', 'PDF', 'Image'.
*   `first_crawled_at`: `TIMESTAMP` - Timestamp of the first successful crawl.
*   `last_updated_at`: `TIMESTAMP` - Timestamp of the latest update to this document in Silver.
*   `_ingested_at`: `TIMESTAMP` - System timestamp of ingestion into Silver. (Audit Column)
*   `_source_system`: `STRING` - Identifier for the processing system. (Audit Column)

**SLAs**:

*   **Freshness**: Documents updated in Bronze are processed and available in Silver within 30 minutes.
*   **Completeness**: >99.5% of valid Bronze documents are processed into Silver.
*   **Data Quality**: 
    *   `doc_id` is unique and not null.
    *   `canonical_url` is not null.
    *   `cleaned_text` has a minimum length (e.g., > 50 characters).
    *   `language` is a valid ISO 639-1 code.
*   **Availability**: 99.9% availability for read access.

**Ownership**: Document Processing Team / Data Engineering Team

**Consumers**: Gold Layer (Search Index Builder), Ranking Feature Engineering

## 3. Gold Layer: Search Index & Ranking Signals

**Purpose**: Highly optimized, queryable search indexes and pre-computed ranking signals for fast retrieval and relevance scoring.

**Schema**: (Optimized for query, potentially denormalized or specialized index structures)

*   **Inverted Index**: (Conceptual, actual implementation varies by search engine)
    *   `term`: `STRING` - The indexed term.
    *   `postings_list`: `ARRAY<STRUCT<doc_id: STRING, positions: ARRAY<INTEGER>, term_frequency: INTEGER>>` - List of documents containing the term, with positions and frequency.
    *   `_last_indexed_at`: `TIMESTAMP` - Timestamp of the last update to this term's postings.

*   **Forward Index / Document Store**: (For retrieving document details post-query)
    *   `doc_id`: `STRING` - Unique document identifier. (Primary Key)
    *   `title`: `STRING` - Document title.
    *   `snippet_text`: `STRING` - Pre-computed snippet for display.
    *   `display_url`: `STRING` - URL to display in search results.
    *   `ranking_features`: `MAP<STRING, DOUBLE>` - Key-value pairs of pre-computed ranking features (e.g., BM25 score, freshness score, quality score, entity match scores).
    *   `last_modified_date`: `DATE` - Date of last known modification to the content.
    *   `_indexed_at`: `TIMESTAMP` - Timestamp when this document was added/updated in the Gold index.

**SLAs**:

*   **Freshness**: 
    *   Core index updates (new/updated documents) available within 1 hour of Silver layer update.
    *   Critical ranking signals (e.g., PageRank) updated daily.
*   **Query Latency**: P95 query response time < 100ms for single-term queries.
*   **Completeness**: >99% of Silver documents are successfully indexed.
*   **Data Quality**: 
    *   Index consistency: Inverted and Forward indexes are synchronized.
    *   Ranking features are within expected ranges.
*   **Availability**: 99.99% availability for query serving.

**Ownership**: Search Indexing Team / Data Engineering Team

**Consumers**: Search Query Engine, Ranking Models, A/B Testing Frameworks
