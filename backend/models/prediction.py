import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
import joblib
import os
from datetime import datetime, timedelta

class FailurePredictor:
    def __init__(self, model_path=None):
        """
        Initialize the failure prediction model
        
        Args:
            model_path: Path to a saved model (if None, a new model will be created)
        """
        self.model = None
        self.scaler = StandardScaler()
        self.features = None
        self.use_neural_network = False
        
        # Load model if path is provided and file exists
        if model_path and os.path.exists(model_path):
            self.load(model_path)
        else:
            # Initialize with default model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
    
    def train(self, data, target_column='failure', use_neural_network=False):
        """
        Train the failure prediction model
        
        Args:
            data: DataFrame with sensor readings and failure labels
            target_column: Name of the target column
            use_neural_network: Whether to use a neural network instead of RandomForest
        """
        # Check if target column exists
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found in data")
        
        # Preprocess data
        X, y = self._preprocess_data(data, target_column)
        self.features = data.drop(columns=[target_column]).columns.tolist()
        
        # Create and train model
        if use_neural_network:
            self.use_neural_network = True
            # Create a simple neural network for binary classification
            self.model = keras.Sequential([
                keras.layers.Dense(64, activation='relu', input_shape=(X.shape[1],)),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(32, activation='relu'),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(1, activation='sigmoid')
            ])
            
            self.model.compile(
                optimizer='adam',
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            # Train the model
            self.model.fit(
                X, y,
                epochs=50,
                batch_size=32,
                validation_split=0.2,
                verbose=1
            )
        else:
            # Train Random Forest
            self.model.fit(X, y)
        
        return self
    
    def predict(self, data):
        """
        Predict failure probability
        
        Args:
            data: Dict or DataFrame with sensor readings
        
        Returns:
            Dict with prediction results
        """
        # Convert to DataFrame if input is a dict
        if isinstance(data, dict):
            # Extract sensor readings
            readings = data.get('readings', {})
            if not readings:
                raise ValueError("No sensor readings found in input data")
                
            # Convert dict to DataFrame
            data = pd.DataFrame([readings])
        
        # Preprocess data
        X = self._preprocess_data(data)
        
        # Make prediction
        if self.use_neural_network:
            # Neural network prediction
            probability = float(self.model.predict(X)[0][0])
        else:
            # Random Forest prediction
            probability = float(self.model.predict_proba(X)[0, 1])
        
        # Determine if maintenance is required based on probability threshold
        maintenance_required = probability > 0.5
        
        # Determine prediction text
        if probability < 0.3:
            prediction = "Normal operation"
        elif probability < 0.5:
            prediction = "Warning: Potential issues detected"
        elif probability < 0.7:
            prediction = "Alert: Maintenance recommended"
        else:
            prediction = "Critical: Immediate maintenance required"
        
        return {
            "prediction": prediction,
            "probability": probability,
            "maintenance_required": maintenance_required,
            "estimated_time_to_failure": self._estimate_time_to_failure(probability)
        }
    
    def _preprocess_data(self, data, target_column=None):
        """
        Preprocess data for the model
        
        Args:
            data: DataFrame with sensor readings
            target_column: Name of the target column (if None, no target is returned)
        
        Returns:
            Preprocessed features and targets (if target_column is provided)
        """
        # Get features
        if target_column:
            X = data.drop(columns=[target_column])
            y = data[target_column]
        else:
            X = data
            y = None
            
        # Get numerical columns only
        numeric_cols = X.select_dtypes(include=['number']).columns
        X = X[numeric_cols]
        
        # Scale the data
        X_scaled = self.scaler.fit_transform(X)
        
        if target_column:
            return X_scaled, y
        else:
            return X_scaled
    
    def _estimate_time_to_failure(self, probability):
        """
        Estimate time to failure based on probability
        
        Args:
            probability: Failure probability (0-1)
        
        Returns:
            Estimated days until failure
        """
        if probability < 0.3:
            # Low probability - estimate longer time
            days = int(30 + (1 - probability) * 60)
        elif probability < 0.5:
            # Medium probability
            days = int(15 + (0.5 - probability) * 30)
        elif probability < 0.7:
            # High probability
            days = int(5 + (0.7 - probability) * 20)
        else:
            # Critical probability
            days = max(1, int((1 - probability) * 10))
        
        return days
    
    def save(self, path="models/failure_predictor.joblib"):
        """Save the model to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        if self.use_neural_network:
            # For neural networks, we need a different approach
            model_dir = os.path.dirname(path)
            model_name = os.path.basename(path).split('.')[0]
            nn_path = os.path.join(model_dir, model_name)
            
            # Save the neural network model
            self.model.save(nn_path)
            
            # Save other components
            joblib.dump({
                "scaler": self.scaler,
                "features": self.features,
                "use_neural_network": self.use_neural_network,
                "nn_path": nn_path
            }, path)
        else:
            # Save the entire object for non-neural network models
            joblib.dump({
                "model": self.model,
                "scaler": self.scaler,
                "features": self.features,
                "use_neural_network": self.use_neural_network
            }, path)
    
    def load(self, path):
        """Load the model from disk"""
        if os.path.exists(path):
            saved_model = joblib.load(path)
            
            self.scaler = saved_model["scaler"]
            self.features = saved_model["features"]
            self.use_neural_network = saved_model.get("use_neural_network", False)
            
            if self.use_neural_network:
                # Load neural network model
                nn_path = saved_model["nn_path"]
                self.model = keras.models.load_model(nn_path)
            else:
                # Load traditional model
                self.model = saved_model["model"]
        else:
            raise FileNotFoundError(f"Model file not found at {path}")
        
        return self 