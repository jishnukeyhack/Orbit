
import os
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_model(processed_data_path, model_path):
    print(f"Loading processed data from {processed_data_path}...")
    X_test = np.load(os.path.join(processed_data_path, 'X_test.npy'))
    y_test = np.load(os.path.join(processed_data_path, 'y_test.npy'))

    if X_test.size == 0 or y_test.size == 0:
        print("Test data not found or is empty. Please run data_preparation.py first.")
        return

    print(f"Loading model from {model_path}...")
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Please train the model first.")
        return
    model = tf.keras.models.load_model(model_path)

    print("Evaluating model...")
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")

    y_pred_probs = model.predict(X_test)
    y_pred = (y_pred_probs > 0.5).astype(int)

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['no_fish', 'fish']))

    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['no_fish', 'fish'], yticklabels=['no_fish', 'fish'])
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.savefig('confusion_matrix.png')
    print("Confusion matrix saved as confusion_matrix.png")

if __name__ == "__main__":
    PROCESSED_DATA_PATH = 'data/processed'
    MODEL_PATH = 'models/fish_detection_model.h5'
    evaluate_model(PROCESSED_DATA_PATH, MODEL_PATH)
