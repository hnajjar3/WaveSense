import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# Function to load and concatenate data from the directory
def load_data_from_directory(directory):
    all_data = []
    for filename in os.listdir(directory):
        if filename.endswith('.csv'):
            filepath = os.path.join(directory, filename)
            data = pd.read_csv(filepath)
            all_data.append(data)
    
    if not all_data:
        raise ValueError("No CSV files found in the specified directory.")
    
    combined_data = pd.concat(all_data, ignore_index=True)
    return combined_data

# Function to preprocess the data
def preprocess_data(data, scaler):
    data['Voltage'] = scaler.transform(data[['Voltage']]) * 100
    return data

# Function to extract single periods from each signal type and calculate derivatives
def extract_single_periods(data, period_length):
    periods = []
    num_periods = len(data) // period_length
    for i in range(num_periods):
        period = data.iloc[i * period_length:(i + 1) * period_length]['Voltage'].values
        first_derivative = np.gradient(period)
        second_derivative = np.gradient(first_derivative)
        features = np.concatenate([period, first_derivative, second_derivative])
        periods.append(features)
    return np.array(periods)

# Function to make predictions using the trained model
def predict_with_model(model_path, data_directory, period_length):
    # Load the trained model and label encoder
    model = joblib.load(f'{model_path}.joblib')
    label_encoder = joblib.load(f'{model_path}_label_encoder.joblib')
    
    # Load and preprocess the data
    data = load_data_from_directory(data_directory)
    print(f"Data before preprocessing:\n{data.head()}")
    
    # Assuming the same scaler was used during training
    scaler = StandardScaler()
    scaler.fit(data[['Voltage']])
    data = preprocess_data(data, scaler)
    print(f"Data after preprocessing:\n{data.head()}")
    
    # Extract single periods and calculate derivatives
    periods = extract_single_periods(data, period_length)
    
    # Flatten the periods for prediction
    periods = periods.reshape(len(periods), -1)
    
    # Make predictions
    predictions = model.predict(periods)
    predicted_labels = label_encoder.inverse_transform(predictions)
    
    # Print results and summary
    print(f"Predictions:\n{predicted_labels}")
    
    # Calculate and print the final classification as the maximum number of "label" predictions
    final_classification = max(set(predicted_labels), key=list(predicted_labels).count)
    print(f"Final Classification: {final_classification}")
    
    # Visualize the first few periods and their predictions
    fig, axes = plt.subplots(len(label_encoder.classes_), 3, figsize=(15, 10))
    for i, label in enumerate(label_encoder.classes_):
        period_indices = np.where(predictions == i)[0]
        if len(period_indices) == 0:
            continue
        period_signal = periods[period_indices[0]][:period_length]
        first_derivative = periods[period_indices[0]][period_length:2*period_length]
        second_derivative = periods[period_indices[0]][2*period_length:]
        axes[i, 0].plot(period_signal)
        axes[i, 0].set_title(f'Single Period - Predicted: {label}')
        axes[i, 1].plot(first_derivative)
        axes[i, 1].set_title(f'First Derivative - Predicted: {label}')
        axes[i, 2].plot(second_derivative)
        axes[i, 2].set_title(f'Second Derivative - Predicted: {label}')
    
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Predict using a trained Random Forest model on signal data.')
    parser.add_argument('model_path', type=str, help='Path to the trained model without file extension.')
    parser.add_argument('data_directory', type=str, help='Directory containing the CSV files for prediction.')
    parser.add_argument('period_length', type=int, help='Length of a single period in the signals.')
    args = parser.parse_args()
    
    predict_with_model(args.model_path, args.data_directory, args.period_length)