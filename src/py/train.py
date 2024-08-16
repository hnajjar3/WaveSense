import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, precision_recall_curve, roc_curve, auc
from sklearn.model_selection import cross_val_score, StratifiedKFold
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# Function to add Gaussian noise
def add_gaussian_noise(data, mean=0, std=0.01):
    noise = np.random.normal(mean, std, data.shape)
    return data + noise

# Function to load and concatenate data from the directory
def load_data_from_directory(directory):
    all_data = []
    for filename in os.listdir(directory):
        if filename.endswith('.csv'):
            filepath = os.path.join(directory, filename)
            data = pd.read_csv(filepath)
            all_data.append(data)

    combined_data = pd.concat(all_data, ignore_index=True)
    return combined_data

# Preprocessing function
def preprocess_data(data):
    scaler = StandardScaler()
    data['voltage'] = add_gaussian_noise(data['voltage'].astype(float))  # Add noise here
    data['voltage'] = scaler.fit_transform(data[['voltage']]) * 100

    label_encoder = LabelEncoder()
    data['label'] = label_encoder.fit_transform(data['label'])

    return data, scaler, label_encoder

# Function to extract single periods from each signal type and calculate derivatives
def extract_single_periods(data, period_length):
    periods = []
    labels = []
    for label in data['label'].unique():
        class_data = data[data['label'] == label]
        num_periods = len(class_data) // period_length
        for i in range(num_periods):
            period = class_data.iloc[i * period_length:(i + 1) * period_length]['voltage'].values
            first_derivative = np.gradient(period)
            second_derivative = np.gradient(first_derivative)
            features = np.concatenate([period, first_derivative, second_derivative])
            periods.append(features)
            labels.append(label)

    return np.array(periods), np.array(labels)

# Function to split test data into segments of the same length as the period and calculate derivatives
def split_test_data(test_data, period_length):
    segments = []
    labels = []
    for label in test_data['label'].unique():
        class_data = test_data[test_data['label'] == label]
        num_segments = len(class_data) // period_length
        for i in range(num_segments):
            segment = class_data.iloc[i * period_length:(i + 1) * period_length]['voltage'].values
            first_derivative = np.gradient(segment)
            second_derivative = np.gradient(first_derivative)
            features = np.concatenate([segment, first_derivative, second_derivative])
            segments.append(features)
            labels.append(label)

    return np.array(segments), np.array(labels)

# Function to split the data into training and testing sets
def split_data(data, test_size=0.2):
    train_data = pd.DataFrame()
    test_data = pd.DataFrame()
    for label in data['label'].unique():
        class_data = data[data['label'] == label]
        split_point = int(len(class_data) * (1 - test_size))
        train_data = pd.concat([train_data, class_data.iloc[:split_point]])
        test_data = pd.concat([test_data, class_data.iloc[split_point:]])
    return train_data, test_data

# Main function
def main(directory, model_output_name, period_length):
    data = load_data_from_directory(directory)
    print(f"Data before preprocessing:\n{data.head()}")

    data, scaler, label_encoder = preprocess_data(data)
    print(f"Data after preprocessing:\n{data.head()}")

    # Split the data into training and test sets
    train_data, test_data = split_data(data)
    print(f"Train Data:\n{train_data.head()}")
    print(f"Test Data:\n{test_data.head()}")

    # Extract single periods for training
    train_periods, train_labels = extract_single_periods(train_data, period_length)
    test_segments, test_labels = split_test_data(test_data, period_length)

    print(f"Train Periods:\n{train_periods[:5]}")
    print(f"Train Labels:\n{train_labels[:5]}")

    # Visualize the signals
    fig, axes = plt.subplots(len(label_encoder.classes_), 3, figsize=(15, 10))
    labels = label_encoder.classes_
    for i, label in enumerate(labels):
        period_signal = train_periods[train_labels == i][0][:period_length]
        first_derivative = train_periods[train_labels == i][0][period_length:2*period_length]
        second_derivative = train_periods[train_labels == i][0][2*period_length:]
        axes[i, 0].plot(period_signal)
        axes[i, 0].set_title(f'Single Period - {label}')
        axes[i, 1].plot(first_derivative)
        axes[i, 1].set_title(f'First Derivative - {label}')
        axes[i, 2].plot(second_derivative)
        axes[i, 2].set_title(f'Second Derivative - {label}')

    plt.tight_layout()
    plt.show()

    # Flatten the periods for training
    train_periods = train_periods.reshape(len(train_periods), -1)
    test_segments = test_segments.reshape(len(test_segments), -1)

    # Train the Random Forest model with cross-validation
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf_model, train_periods, train_labels, cv=skf, scoring='accuracy')

    print(f"Cross-Validation Scores: {cv_scores}")
    print(f"Mean Cross-Validation Score: {cv_scores.mean():.4f}")

    # Fit the model on the entire training data
    rf_model.fit(train_periods, train_labels)

    train_pred = rf_model.predict(train_periods)
    test_pred = rf_model.predict(test_segments)

    print(f"Train Accuracy: {accuracy_score(train_labels, train_pred):.4f}")
    print(f"Test Accuracy: {accuracy_score(test_labels, test_pred):.4f}")

    print("Classification Report for Test Data:")
    print(classification_report(test_labels, test_pred, target_names=label_encoder.classes_))

    # Save the model and label encoder
    joblib.dump(rf_model, f'{model_output_name}.joblib')
    joblib.dump(label_encoder, f'{model_output_name}_label_encoder.joblib')

    # Confusion Matrix
    cm = confusion_matrix(test_labels, test_pred)
    plt.figure(figsize=(10, 7))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=label_encoder.classes_, yticklabels=label_encoder.classes_)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.show()

    # Precision-Recall Curve
    plt.figure(figsize=(10, 7))
    for i, label in enumerate(label_encoder.classes_):
        precision, recall, _ = precision_recall_curve(test_labels == i, rf_model.predict_proba(test_segments)[:, i])
        plt.plot(recall, precision, label=f'{label}')

    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend()
    plt.show()

    # ROC Curve
    plt.figure(figsize=(10, 7))
    for i, label in enumerate(label_encoder.classes_):
        fpr, tpr, _ = roc_curve(test_labels == i, rf_model.predict_proba(test_segments)[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f'{label} (AUC = {roc_auc:.2f})')

    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend()
    plt.show()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Train a Random Forest model on signal data.')
    parser.add_argument('directory', type=str, help='Directory containing the CSV files.')
    parser.add_argument('model_output_name', type=str, help='Output name for the trained model.')
    parser.add_argument('period_length', type=int, help='Length of a single period in the signals.')
    args = parser.parse_args()

    main(args.directory, args.model_output_name, args.period_length)
