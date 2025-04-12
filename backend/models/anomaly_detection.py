import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

class AnomalyDetector:
    def __init__(self, model_path=None):
        """
        Initialize the anomaly detector
        
        Args:
            model_path: Path to a saved model (if None, a new model will be created)
        """
        self.model = None
        self.scaler = StandardScaler()
        
        # Load model if path is provided and file exists
        if model_path and os.path.exists(model_path):
            self.load(model_path)
        else:
            # Initialize with default model
            self.model = IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42
            )
    
    def train(self, data):
        """
        Train the anomaly detection model
        
        Args:
            data: DataFrame with sensor readings
        """
        # Preprocess data
        X = self._preprocess_data(data)
        
        # Train the model
        self.model.fit(X)
        
        return self
    
    def detect(self, data):
        """
        Detect anomalies in sensor data
        
        Args:
            data: Dict or DataFrame with sensor readings
        
        Returns:
            Dict with anomaly detection results
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
        
        # Get anomaly scores
        scores = self.model.decision_function(X)
        predictions = self.model.predict(X)
        
        # Convert predictions (-1 for anomalies, 1 for normal)
        # to boolean (True for anomalies)
        anomalies = predictions < 0
        
        return {
            "anomaly_detected": bool(anomalies[0]),
            "anomaly_score": float(scores[0]),
            "threshold": self.model.threshold_
        }
    
    def _preprocess_data(self, data):
        """
        Preprocess data for the model
        
        Args:
            data: DataFrame with sensor readings
        
        Returns:
            Preprocessed features
        """
        # Get numerical columns only
        if isinstance(data, pd.DataFrame):
            # Filter numeric columns
            numeric_cols = data.select_dtypes(include=['number']).columns
            X = data[numeric_cols]
        else:
            # For dictionaries or other formats
            X = pd.DataFrame(data)
            
        # Scale the data
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled
    
    def save(self, path="models/anomaly_detector.joblib"):
        """Save the model to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler
        }, path)
    
    def load(self, path):
        """Load the model from disk"""
        if os.path.exists(path):
            saved_model = joblib.load(path)
            self.model = saved_model["model"]
            self.scaler = saved_model["scaler"]
        else:
            raise FileNotFoundError(f"Model file not found at {path}")
        
        return self 