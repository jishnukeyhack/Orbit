
import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split

def load_images_from_folder(folder):
    images = []
    labels = []
    for filename in os.listdir(folder):
        img_path = os.path.join(folder, filename)
        img = cv2.imread(img_path)
        if img is not None:
            images.append(img)
            # Assuming a simple binary classification for now: 'fish' or 'no_fish'
            # This part needs to be adapted based on actual dataset structure and labels
            if "fish" in filename.lower(): # Placeholder for labeling logic
                labels.append(1) # 1 for fish
            else:
                labels.append(0) # 0 for no fish
    return np.array(images), np.array(labels)

def preprocess_image(image, target_size=(128, 128)):
    # Resize image
    image = cv2.resize(image, target_size)
    # Normalize pixel values to [0, 1]
    image = image.astype('float32') / 255.0
    return image

def prepare_data(raw_data_path, processed_data_path, test_size=0.2, random_state=42):
    print(f"Loading images from {raw_data_path}...")
    images, labels = load_images_from_folder(raw_data_path)

    if len(images) == 0:
        print("No images found in the raw data folder. Please add images to data/raw.")
        return

    print(f"Found {len(images)} images. Preprocessing...")
    processed_images = np.array([preprocess_image(img) for img in images])

    print("Splitting data into training and testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        processed_images, labels, test_size=test_size, random_state=random_state, stratify=labels
    )

    # Save processed data
    os.makedirs(processed_data_path, exist_ok=True)
    np.save(os.path.join(processed_data_path, 'X_train.npy'), X_train)
    np.save(os.path.join(processed_data_path, 'X_test.npy'), X_test)
    np.save(os.path.join(processed_data_path, 'y_train.npy'), y_train)
    np.save(os.path.join(processed_data_path, 'y_test.npy'), y_test)

    print(f"Data preparation complete. Processed data saved to {processed_data_path}")
    print(f"Training set size: {len(X_train)} samples")
    print(f"Test set size: {len(X_test)} samples")

if __name__ == "__main__":
    # Example usage (assuming raw images are in data/raw)
    RAW_DATA_PATH = 'data/raw'
    PROCESSED_DATA_PATH = 'data/processed'
    prepare_data(RAW_DATA_PATH, PROCESSED_DATA_PATH)
