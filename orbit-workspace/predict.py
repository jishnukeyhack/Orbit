
import os
import cv2
import numpy as np
import tensorflow as tf
from scripts.data_preparation import preprocess_image # Re-use preprocessing logic

def load_model(model_path):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please train the model first.")
    model = tf.keras.models.load_model(model_path)
    return model

def predict_image(image_path, model, target_size=(128, 128)):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image from {image_path}")

    processed_img = preprocess_image(img, target_size)
    # Add batch dimension
    processed_img = np.expand_dims(processed_img, axis=0)

    prediction = model.predict(processed_img)[0][0]
    return prediction

def main(image_path, model_path='models/fish_detection_model.h5'):
    try:
        model = load_model(model_path)
        prediction_score = predict_image(image_path, model)

        if prediction_score > 0.5:
            print(f"The image '{image_path}' contains a fish (score: {prediction_score:.4f}).")
        else:
            print(f"The image '{image_path}' does not contain a fish (score: {prediction_score:.4f}).")
    except FileNotFoundError as e:
        print(e)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Example usage:
    # Create a dummy image for testing purposes
    dummy_image_path = 'data/raw/test_fish.jpg'
    if not os.path.exists('data/raw'):
        os.makedirs('data/raw')
    dummy_image = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.imwrite(dummy_image_path, dummy_image)
    print(f"Created a dummy image at {dummy_image_path} for testing.")

    # You would replace 'data/raw/test_image.jpg' with the actual path to your image
    # Before running this, ensure you have run data_preparation.py and model_training.py
    # and placed an image in data/raw for prediction.
    main(dummy_image_path)
