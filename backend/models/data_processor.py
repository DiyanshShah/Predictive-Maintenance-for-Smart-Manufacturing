import pandas as pd
import numpy as np
from datetime import datetime
import json
import os

class DataProcessor:
    def __init__(self):
        """Initialize the data processor"""
        self.feature_columns = None
        self.categorical_columns = None
        self.numerical_columns = None
        self.time_column = "timestamp"
        self.equipment_id_column = "equipment_id"
        
    def process(self, data):
        """
        Process raw sensor data for model input
        
        Args:
            data: Dict or DataFrame with sensor readings
            
        Returns:
            Processed data ready for model input
        """
        # Convert to DataFrame if it's a dict
        if isinstance(data, dict):
            # If data has readings key, extract them
            if "readings" in data:
                readings = data["readings"]
                # Add metadata if available
                processed_data = {k: v for k, v in data.items() if k != "readings"}
                processed_data.update(readings)
            else:
                processed_data = data
                
            # Convert to DataFrame
            df = pd.DataFrame([processed_data])
        else:
            df = data.copy()
            
        # Convert timestamp to datetime if it exists
        if self.time_column in df.columns:
            df[self.time_column] = pd.to_datetime(df[self.time_column])
            
            # Extract time features
            df["hour"] = df[self.time_column].dt.hour
            df["day"] = df[self.time_column].dt.day
            df["month"] = df[self.time_column].dt.month
            df["year"] = df[self.time_column].dt.year
            df["day_of_week"] = df[self.time_column].dt.dayofweek
            
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Feature engineering
        df = self._engineer_features(df)
        
        return df
    
    def _handle_missing_values(self, df):
        """
        Handle missing values in the data
        
        Args:
            df: DataFrame with sensor readings
            
        Returns:
            DataFrame with handled missing values
        """
        # Identify numerical columns if not already done
        if self.numerical_columns is None:
            self.numerical_columns = df.select_dtypes(include=["number"]).columns.tolist()
            
        # Fill missing numerical values with mean
        for col in self.numerical_columns:
            if col in df.columns and df[col].isnull().any():
                df[col] = df[col].fillna(df[col].mean())
        
        # Fill other missing values with "unknown" or 0 depending on type
        for col in df.columns:
            if col not in self.numerical_columns and df[col].isnull().any():
                if df[col].dtype == 'object':
                    df[col] = df[col].fillna("unknown")
                else:
                    df[col] = df[col].fillna(0)
        
        return df
    
    def _engineer_features(self, df):
        """
        Perform feature engineering on the data
        
        Args:
            df: DataFrame with sensor readings
            
        Returns:
            DataFrame with engineered features
        """
        # Calculate rolling statistics if we have multiple rows
        if len(df) > 1 and self.numerical_columns:
            # Calculate rolling mean, std, min, max for numerical columns
            for col in self.numerical_columns:
                if col in df.columns:
                    # Create rolling features only if there's enough data
                    if len(df) >= 5:
                        df[f"{col}_rolling_mean"] = df[col].rolling(window=5, min_periods=1).mean()
                        df[f"{col}_rolling_std"] = df[col].rolling(window=5, min_periods=1).std().fillna(0)
                        df[f"{col}_rolling_min"] = df[col].rolling(window=5, min_periods=1).min()
                        df[f"{col}_rolling_max"] = df[col].rolling(window=5, min_periods=1).max()
                    
                    # Add rate of change if timestamps are available
                    if self.time_column in df.columns and len(df) > 1:
                        df[f"{col}_rate"] = df[col].diff() / df[self.time_column].diff().dt.total_seconds()
                        df[f"{col}_rate"] = df[f"{col}_rate"].fillna(0)
        
        # Create interaction features between numerical columns
        if self.numerical_columns and len(self.numerical_columns) >= 2:
            numerical_cols = [col for col in self.numerical_columns if col in df.columns]
            
            if len(numerical_cols) >= 2:
                # Create a few interaction features (to avoid explosion of features)
                for i in range(min(len(numerical_cols), 5)):
                    for j in range(i+1, min(len(numerical_cols), 5)):
                        col1 = numerical_cols[i]
                        col2 = numerical_cols[j]
                        
                        # Add product feature
                        df[f"{col1}_{col2}_product"] = df[col1] * df[col2]
                        
                        # Add ratio feature (handle division by zero)
                        df[f"{col1}_{col2}_ratio"] = df[col1] / df[col2].replace(0, 1e-10)
        
        return df
    
    def load_data(self, file_path):
        """
        Load data from a file (CSV or JSON)
        
        Args:
            file_path: Path to the data file
            
        Returns:
            DataFrame with loaded data
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == ".csv":
            # Load CSV file
            df = pd.read_csv(file_path)
        elif file_ext == ".json":
            # Load JSON file
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Handle different JSON formats
            if isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
        return df
    
    def prepare_training_data(self, df, target_column=None):
        """
        Prepare data for training models
        
        Args:
            df: DataFrame with sensor readings
            target_column: Name of the target column (if any)
            
        Returns:
            Processed DataFrame ready for training
        """
        # Process the data
        processed_df = self.process(df)
        
        # Store feature columns
        if target_column:
            self.feature_columns = [col for col in processed_df.columns if col != target_column]
        else:
            self.feature_columns = processed_df.columns.tolist()
            
        # Identify categorical and numerical columns
        self.categorical_columns = processed_df.select_dtypes(include=["object"]).columns.tolist()
        self.numerical_columns = processed_df.select_dtypes(include=["number"]).columns.tolist()
        
        return processed_df
    
    def save_metadata(self, path="models/data_processor_metadata.json"):
        """Save metadata to disk"""
        metadata = {
            "feature_columns": self.feature_columns,
            "categorical_columns": self.categorical_columns,
            "numerical_columns": self.numerical_columns,
            "time_column": self.time_column,
            "equipment_id_column": self.equipment_id_column
        }
        
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(metadata, f, indent=4)
    
    def load_metadata(self, path="models/data_processor_metadata.json"):
        """Load metadata from disk"""
        if os.path.exists(path):
            with open(path, 'r') as f:
                metadata = json.load(f)
                
            self.feature_columns = metadata.get("feature_columns")
            self.categorical_columns = metadata.get("categorical_columns")
            self.numerical_columns = metadata.get("numerical_columns")
            self.time_column = metadata.get("time_column", "timestamp")
            self.equipment_id_column = metadata.get("equipment_id_column", "equipment_id")
        else:
            raise FileNotFoundError(f"Metadata file not found at {path}") 