
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

def build_model(input_shape):
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        MaxPooling2D((2, 2)),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(1, activation='sigmoid') # Binary classification (fish or no fish)
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

def train_model(processed_data_path, models_path, epochs=10, batch_size=32):
    print(f"Loading processed data from {processed_data_path}...")
    X_train = np.load(os.path.join(processed_data_path, 'X_train.npy'))
    y_train = np.load(os.path.join(processed_data_path, 'y_train.npy'))
    X_test = np.load(os.path.join(processed_data_path, 'X_test.npy'))
    y_test = np.load(os.path.join(processed_data_path, 'y_test.npy'))

    if X_train.size == 0 or y_train.size == 0:
        print("Training data not found or is empty. Please run data_preparation.py first.")
        return

    input_shape = X_train.shape[1:]
    model = build_model(input_shape)
    model.summary()

    # Callbacks for early stopping and model checkpointing
    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    model_checkpoint = ModelCheckpoint(
        filepath=os.path.join(models_path, 'fish_detection_model.h5'),
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )

    print("Starting model training...")
    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(X_test, y_test),
        callbacks=[early_stopping, model_checkpoint]
    )

    print("Model training complete.")
    print(f"Trained model saved to {os.path.join(models_path, 'fish_detection_model.h5')}")

    # Evaluate the best model on the test set
    best_model = tf.keras.models.load_model(os.path.join(models_path, 'fish_detection_model.h5'))
    loss, accuracy = best_model.evaluate(X_test, y_test, verbose=0)
    print(f"Best model test accuracy: {accuracy:.4f}")
    print(f"Best model test loss: {loss:.4f}")

if __name__ == "__main__":
    PROCESSED_DATA_PATH = 'data/processed'
    MODELS_PATH = 'models'
    os.makedirs(MODELS_PATH, exist_ok=True)
    train_model(PROCESSED_DATA_PATH, MODELS_PATH)
