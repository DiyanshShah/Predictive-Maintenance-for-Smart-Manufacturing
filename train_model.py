import os
import pandas as pd
import numpy as np
from backend.models.data_processor import DataProcessor
from backend.models.prediction import FailurePredictor
from backend.models.anomaly_detection import AnomalyDetector

def train_models():
    print("Starting model training with datasets from training folder...")
    
    # Initialize models
    data_processor = DataProcessor()
    anomaly_detector = AnomalyDetector()
    failure_predictor = FailurePredictor()
    
    # Load and combine datasets
    training_datasets = [
        "backend/data/training/predictive_maintenance_dataset.csv",
        "backend/data/training/ai4i2020.csv"
    ]
    
    print(f"Loading {len(training_datasets)} datasets...")
    combined_data = None
    
    for dataset_path in training_datasets:
        print(f"Processing {dataset_path}...")
        
        # Load dataset
        try:
            data = data_processor.load_data(dataset_path)
            print(f"Loaded {len(data)} records from {dataset_path}")
            
            # Handle different column structures - map to common schema if needed
            if 'UDI' in data.columns and 'ai4i2020' in dataset_path:
                # AI4I dataset has different column names - map to common schema
                print("Mapping AI4I dataset to common schema...")
                data = data.rename(columns={
                    'UDI': 'equipment_id',
                    'Air temperature [K]': 'temperature',
                    'Process temperature [K]': 'process_temperature',
                    'Rotational speed [rpm]': 'rotation_speed',
                    'Torque [Nm]': 'torque',
                    'Tool wear [min]': 'tool_wear',
                    'Machine failure': 'is_failure',
                    'TWF': 'tool_wear_failure',
                    'HDF': 'heat_dissipation_failure',
                    'PWF': 'power_failure',
                    'OSF': 'overstrain_failure',
                    'RNF': 'random_failure'
                })
                
                # Add timestamp if not present
                if 'timestamp' not in data.columns:
                    data['timestamp'] = pd.date_range(start='2022-01-01', periods=len(data), freq='H')
            
            # Ensure is_failure is binary (0 or 1)
            if 'is_failure' in data.columns:
                print(f"Before conversion, is_failure unique values: {data['is_failure'].unique()}")
                # Convert to binary - any non-zero value is considered a failure
                data['is_failure'] = (data['is_failure'] > 0).astype(int)
                print(f"After conversion, is_failure unique values: {data['is_failure'].unique()}")
            
            # Prepare data for training
            processed_data = data_processor.prepare_training_data(data, target_column='is_failure')
            
            # Combine with other data
            if combined_data is None:
                combined_data = processed_data
            else:
                combined_data = pd.concat([combined_data, processed_data], ignore_index=True)
                
        except Exception as e:
            print(f"Error processing {dataset_path}: {str(e)}")
    
    if combined_data is not None and not combined_data.empty:
        print(f"Training models with {len(combined_data)} total records...")
        
        # Handle any missing values in the combined dataset
        print("Handling missing values...")
        # First, identify numerical columns
        data_processor.numerical_columns = combined_data.select_dtypes(include=["number"]).columns.tolist()
        
        # Fill NaN values in combined_data
        print("Before handling NaNs, dataset contains NaN values:", combined_data.isna().sum().sum() > 0)
        combined_data = data_processor._handle_missing_values(combined_data)
        print("After handling NaNs, dataset contains NaN values:", combined_data.isna().sum().sum() > 0)
        
        # Drop any remaining rows with NaN values if any persist
        if combined_data.isna().sum().sum() > 0:
            original_len = len(combined_data)
            combined_data = combined_data.dropna()
            print(f"Dropped {original_len - len(combined_data)} rows with NaN values")
        
        # Double-check that is_failure is binary for the classifier
        if 'is_failure' in combined_data.columns:
            print(f"Final is_failure unique values: {combined_data['is_failure'].unique()}")
            # Ensure it's int type (0 or 1) for classifier
            combined_data['is_failure'] = combined_data['is_failure'].astype(int)
        
        # Remove non-numeric columns for the anomaly detector
        numeric_combined_data = combined_data.select_dtypes(include=['number'])
        print(f"Using {len(numeric_combined_data.columns)} numeric features for anomaly detection")
        
        # Train the anomaly detector with numeric data only
        print("Training anomaly detection model...")
        anomaly_detector.train(numeric_combined_data)
        
        # Train the failure predictor (using Random Forest)
        print("Training failure prediction model (Random Forest)...")
        failure_predictor.train(combined_data, target_column='is_failure', use_neural_network=False)
        
        # Save models
        print("Saving trained models...")
        anomaly_detector.save("backend/models/anomaly_detector.joblib")
        failure_predictor.save("backend/models/failure_predictor.joblib")
        
        print("Model training completed successfully!")
    else:
        print("No valid data found for training. Please check your datasets.")

if __name__ == "__main__":
    train_models() 