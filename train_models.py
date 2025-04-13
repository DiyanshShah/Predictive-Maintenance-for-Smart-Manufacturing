import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import joblib
import warnings
import glob

# ML libraries
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer

# Ignore warnings
warnings.filterwarnings('ignore')

# Create models directory if it doesn't exist
if not os.path.exists('models'):
    os.makedirs('models')

# Load datasets
def load_datasets():
    print("Loading datasets...")
    
    # Equipment metadata
    machine_inventory = pd.read_csv('datasets/machine_inventory.csv')
    
    # Sensor thresholds
    sensor_thresholds = pd.read_csv('datasets/sensor_thresholds.csv')
    
    # Failure history - with safe date parsing
    try:
        failure_history = pd.read_csv('datasets/failure_history.csv')
        # Try to safely convert the failure_date column
        try:
            failure_history['failure_date'] = pd.to_datetime(failure_history['failure_date'], errors='coerce')
            # Drop rows with invalid dates
            failure_history = failure_history.dropna(subset=['failure_date'])
            print(f"  Loaded {len(failure_history)} failure history records")
        except Exception as e:
            print(f"  Warning: Error converting failure dates: {e}")
            print("  Warning: Some failure dates may be incorrectly formatted")
    except Exception as e:
        print(f"  Warning: Could not load failure history: {e}")
        failure_history = pd.DataFrame(columns=['equipment_id', 'failure_date', 'failure_type'])
    
    # Maintenance history - with safe date parsing
    try:
        maintenance_history = pd.read_csv('datasets/maintenance_history.csv')
        # Try to safely convert date columns
        try:
            maintenance_history['maintenance_date'] = pd.to_datetime(maintenance_history['maintenance_date'], errors='coerce')
            # Drop rows with invalid dates
            maintenance_history = maintenance_history.dropna(subset=['maintenance_date'])
            print(f"  Loaded {len(maintenance_history)} maintenance history records")
        except Exception as e:
            print(f"  Warning: Error converting maintenance dates: {e}")
    except Exception as e:
        print(f"  Warning: Could not load maintenance history: {e}")
        maintenance_history = pd.DataFrame(columns=['equipment_id', 'maintenance_date', 'maintenance_type'])
    
    # Get all sensor reading files
    sensor_files = glob.glob('datasets/*_readings.csv')
    sensor_data = {}
    
    for file in sensor_files:
        equipment_id = os.path.basename(file).split('_')[0].upper()
        try:
            df = pd.read_csv(file)
            # Convert timestamps safely
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                # Drop rows with invalid timestamps
                df = df.dropna(subset=['timestamp'])
            except Exception as e:
                print(f"  Warning: Error converting timestamps for {equipment_id}: {e}")
            
            sensor_data[equipment_id] = df
            print(f"  Loaded {len(df)} records for {equipment_id}")
        except Exception as e:
            print(f"  Warning: Could not load data for {equipment_id}: {e}")
    
    print(f"Loaded data for {len(sensor_data)} pieces of equipment")
    
    # Also load machine inventory installation dates safely
    try:
        machine_inventory['installation_date'] = pd.to_datetime(machine_inventory['installation_date'], errors='coerce')
    except Exception as e:
        print(f"  Warning: Error converting installation dates: {e}")
    
    datasets = {
        'machine_inventory': machine_inventory,
        'sensor_thresholds': sensor_thresholds,
        'failure_history': failure_history,
        'maintenance_history': maintenance_history,
        'sensor_data': sensor_data
    }
    
    return datasets

# Preprocess data for failure prediction model
def preprocess_for_failure_prediction(datasets):
    print("Preprocessing data for failure prediction models...")
    
    failure_history = datasets['failure_history']
    sensor_data = datasets['sensor_data']
    machine_inventory = datasets['machine_inventory']
    
    # Create a mapping from equipment_type
    equipment_type_map = dict(zip(machine_inventory['equipment_id'], machine_inventory['equipment_type']))
    
    X_data = []
    y_data = []
    equipment_ids = []
    
    # Process each equipment
    for equipment_id, readings in sensor_data.items():
        if equipment_id not in equipment_type_map:
            continue
            
        equipment_type = equipment_type_map[equipment_id]
        
        # Get failures for this equipment
        equipment_failures = failure_history[failure_history['equipment_id'] == equipment_id]
        
        if len(equipment_failures) == 0:
            print(f"  No failures found for {equipment_id}, skipping")
            continue
            
        # For each reading, determine if a failure occurred within the next 30 days
        for i, row in readings.iterrows():
            reading_date = row['timestamp']
            
            # Skip invalid timestamps
            if pd.isna(reading_date):
                continue
                
            # Check if any failure within the next 30 days
            next_30_days = reading_date + timedelta(days=30)
            failure_within_30_days = any((reading_date <= failure_date) & (failure_date <= next_30_days) 
                                        for failure_date in equipment_failures['failure_date'] if not pd.isna(failure_date))
            
            # Extract features from the reading
            features = row.drop(['timestamp']).to_dict()
            
            # Add equipment type and age as features
            try:
                install_date = pd.to_datetime(machine_inventory[machine_inventory['equipment_id'] == equipment_id]['installation_date'].iloc[0])
                if pd.isna(install_date):
                    equipment_age_days = 0  # Default if installation date is invalid
                else:
                    equipment_age_days = (reading_date - install_date).days
            except Exception as e:
                print(f"  Warning: Could not calculate age for {equipment_id}: {e}")
                equipment_age_days = 0  # Default if installation date is invalid
            
            features['equipment_type'] = equipment_type
            features['equipment_age_days'] = equipment_age_days
            
            X_data.append(features)
            y_data.append(1 if failure_within_30_days else 0)
            equipment_ids.append(equipment_id)
    
    # Convert to DataFrame
    X_df = pd.DataFrame(X_data)
    y_series = pd.Series(y_data, name='failure_within_30_days')
    
    # Add equipment_id for reference
    X_df['equipment_id'] = equipment_ids
    
    print(f"Prepared {len(X_df)} samples with {sum(y_data)} positive failure cases")
    
    return X_df, y_series

# Preprocess data for remaining useful life prediction
def preprocess_for_rul_prediction(datasets):
    print("Preprocessing data for remaining useful life (RUL) prediction...")
    
    failure_history = datasets['failure_history']
    sensor_data = datasets['sensor_data']
    machine_inventory = datasets['machine_inventory']
    
    # Create a mapping from equipment_type
    equipment_type_map = dict(zip(machine_inventory['equipment_id'], machine_inventory['equipment_type']))
    
    X_data = []
    y_data = []  # RUL in days
    equipment_ids = []
    
    # Process each equipment
    for equipment_id, readings in sensor_data.items():
        if equipment_id not in equipment_type_map:
            continue
            
        equipment_type = equipment_type_map[equipment_id]
        
        # Get failures for this equipment
        equipment_failures = failure_history[failure_history['equipment_id'] == equipment_id]
        
        if len(equipment_failures) == 0:
            print(f"  No failures found for {equipment_id}, skipping")
            continue
            
        # For each reading, find the days until the next failure
        for i, row in readings.iterrows():
            reading_date = row['timestamp']
            
            # Skip invalid timestamps
            if pd.isna(reading_date):
                continue
            
            # Find the next failure after this reading
            future_failures = equipment_failures[(equipment_failures['failure_date'] > reading_date) & 
                                                (~pd.isna(equipment_failures['failure_date']))]
            
            if len(future_failures) == 0:
                continue  # No future failures, skip this reading
                
            next_failure_date = future_failures['failure_date'].min()
            days_until_failure = (next_failure_date - reading_date).days
            
            # Only consider data points with RUL within 180 days
            if days_until_failure > 180:
                continue
                
            # Extract features from the reading
            features = row.drop(['timestamp']).to_dict()
            
            # Add equipment type and age as features
            try:
                install_date = pd.to_datetime(machine_inventory[machine_inventory['equipment_id'] == equipment_id]['installation_date'].iloc[0])
                if pd.isna(install_date):
                    equipment_age_days = 0  # Default if installation date is invalid
                else:
                    equipment_age_days = (reading_date - install_date).days
            except Exception as e:
                print(f"  Warning: Could not calculate age for {equipment_id}: {e}")
                equipment_age_days = 0  # Default if installation date is invalid
            
            features['equipment_type'] = equipment_type
            features['equipment_age_days'] = equipment_age_days
            
            X_data.append(features)
            y_data.append(days_until_failure)
            equipment_ids.append(equipment_id)
    
    # Convert to DataFrame
    X_df = pd.DataFrame(X_data)
    y_series = pd.Series(y_data, name='days_until_failure')
    
    # Add equipment_id for reference
    X_df['equipment_id'] = equipment_ids
    
    print(f"Prepared {len(X_df)} samples for RUL prediction")
    
    return X_df, y_series

# Preprocess data for anomaly detection
def preprocess_for_anomaly_detection(datasets):
    print("Preprocessing data for anomaly detection...")
    
    sensor_data = datasets['sensor_data']
    machine_inventory = datasets['machine_inventory']
    sensor_thresholds = datasets['sensor_thresholds']
    
    # Create a mapping from equipment_type
    equipment_type_map = dict(zip(machine_inventory['equipment_id'], machine_inventory['equipment_type']))
    
    X_data = []
    equipment_ids = []
    timestamps = []
    
    # Process each equipment
    for equipment_id, readings in sensor_data.items():
        if equipment_id not in equipment_type_map:
            continue
            
        equipment_type = equipment_type_map[equipment_id]
        
        # Convert timestamp to datetime
        readings['timestamp'] = pd.to_datetime(readings['timestamp'])
            
        # For each reading, prepare features for anomaly detection
        for i, row in readings.iterrows():
            # Extract features from the reading
            features = row.drop(['timestamp']).to_dict()
            
            # Add equipment type and equipment_id for grouping later
            features['equipment_type'] = equipment_type
            
            X_data.append(features)
            equipment_ids.append(equipment_id)
            timestamps.append(row['timestamp'])
    
    # Convert to DataFrame
    X_df = pd.DataFrame(X_data)
    
    # Add metadata
    X_df['equipment_id'] = equipment_ids
    X_df['timestamp'] = timestamps
    
    print(f"Prepared {len(X_df)} samples for anomaly detection")
    
    return X_df

# Train failure prediction models
def train_failure_prediction_models(X, y):
    print("Training failure prediction models...")
    
    # Remove equipment_id for training
    equipment_ids = X['equipment_id']
    X = X.drop(columns=['equipment_id'])
    
    # Identify categorical and numerical features
    categorical_features = [col for col in X.columns if X[col].dtype == 'object']
    numerical_features = [col for col in X.columns if col not in categorical_features]
    
    # Print info about missing values
    print(f"  Data contains {X.isna().sum().sum()} missing values out of {X.size} total values")
    
    # Create preprocessing pipeline with imputer for missing values
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Dictionary to store trained models
    models = {}
    
    # Random Forest
    print("  Training Random Forest classifier...")
    rf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(random_state=42))
    ])
    
    rf_pipeline.fit(X_train, y_train)
    y_pred_rf = rf_pipeline.predict(X_test)
    
    rf_accuracy = accuracy_score(y_test, y_pred_rf)
    rf_precision = precision_score(y_test, y_pred_rf, zero_division=0)
    rf_recall = recall_score(y_test, y_pred_rf, zero_division=0)
    rf_f1 = f1_score(y_test, y_pred_rf, zero_division=0)
    
    print(f"  Random Forest results: Accuracy={rf_accuracy:.4f}, Precision={rf_precision:.4f}, Recall={rf_recall:.4f}, F1={rf_f1:.4f}")
    models['random_forest'] = rf_pipeline
    
    # Gradient Boosting
    print("  Training Gradient Boosting classifier...")
    gb_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', GradientBoostingClassifier(random_state=42))
    ])
    
    gb_pipeline.fit(X_train, y_train)
    y_pred_gb = gb_pipeline.predict(X_test)
    
    gb_accuracy = accuracy_score(y_test, y_pred_gb)
    gb_precision = precision_score(y_test, y_pred_gb, zero_division=0)
    gb_recall = recall_score(y_test, y_pred_gb, zero_division=0)
    gb_f1 = f1_score(y_test, y_pred_gb, zero_division=0)
    
    print(f"  Gradient Boosting results: Accuracy={gb_accuracy:.4f}, Precision={gb_precision:.4f}, Recall={gb_recall:.4f}, F1={gb_f1:.4f}")
    models['gradient_boosting'] = gb_pipeline
    
    # SVM
    print("  Training SVM classifier...")
    svm_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', SVC(probability=True, random_state=42))
    ])
    
    svm_pipeline.fit(X_train, y_train)
    y_pred_svm = svm_pipeline.predict(X_test)
    
    svm_accuracy = accuracy_score(y_test, y_pred_svm)
    svm_precision = precision_score(y_test, y_pred_svm, zero_division=0)
    svm_recall = recall_score(y_test, y_pred_svm, zero_division=0)
    svm_f1 = f1_score(y_test, y_pred_svm, zero_division=0)
    
    print(f"  SVM results: Accuracy={svm_accuracy:.4f}, Precision={svm_precision:.4f}, Recall={svm_recall:.4f}, F1={svm_f1:.4f}")
    models['svm'] = svm_pipeline
    
    # Neural Network
    print("  Training Neural Network classifier...")
    nn_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42))
    ])
    
    nn_pipeline.fit(X_train, y_train)
    y_pred_nn = nn_pipeline.predict(X_test)
    
    nn_accuracy = accuracy_score(y_test, y_pred_nn)
    nn_precision = precision_score(y_test, y_pred_nn, zero_division=0)
    nn_recall = recall_score(y_test, y_pred_nn, zero_division=0)
    nn_f1 = f1_score(y_test, y_pred_nn, zero_division=0)
    
    print(f"  Neural Network results: Accuracy={nn_accuracy:.4f}, Precision={nn_precision:.4f}, Recall={nn_recall:.4f}, F1={nn_f1:.4f}")
    models['neural_network'] = nn_pipeline
    
    # Select best model
    model_f1_scores = {
        'random_forest': rf_f1,
        'gradient_boosting': gb_f1,
        'svm': svm_f1,
        'neural_network': nn_f1
    }
    best_model_name = max(model_f1_scores, key=model_f1_scores.get)
    best_model = models[best_model_name]
    print(f"Best failure prediction model: {best_model_name}")
    
    # Save all models
    for name, model in models.items():
        joblib.dump(model, f"models/failure_prediction_{name}.pkl")
        
    print("All failure prediction models saved")
    
    # Return the best model
    return best_model

# Train remaining useful life (RUL) prediction models
def train_rul_prediction_models(X, y):
    print("Training remaining useful life (RUL) prediction models...")
    
    # Remove equipment_id for training
    equipment_ids = X['equipment_id']
    X = X.drop(columns=['equipment_id'])
    
    # Identify categorical and numerical features
    categorical_features = [col for col in X.columns if X[col].dtype == 'object']
    numerical_features = [col for col in X.columns if col not in categorical_features]
    
    # Print info about missing values
    print(f"  Data contains {X.isna().sum().sum()} missing values out of {X.size} total values")
    
    # Create preprocessing pipeline with imputer for missing values
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Dictionary to store trained models
    models = {}
    
    # Random Forest Regressor
    print("  Training Random Forest regressor...")
    rf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(random_state=42))
    ])
    
    rf_pipeline.fit(X_train, y_train)
    y_pred_rf = rf_pipeline.predict(X_test)
    
    rf_mse = mean_squared_error(y_test, y_pred_rf)
    rf_rmse = np.sqrt(rf_mse)
    rf_r2 = r2_score(y_test, y_pred_rf)
    
    print(f"  Random Forest results: RMSE={rf_rmse:.4f}, R²={rf_r2:.4f}")
    models['random_forest'] = rf_pipeline
    
    # Gradient Boosting Regressor
    print("  Training Gradient Boosting regressor...")
    gb_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', GradientBoostingRegressor(random_state=42))
    ])
    
    gb_pipeline.fit(X_train, y_train)
    y_pred_gb = gb_pipeline.predict(X_test)
    
    gb_mse = mean_squared_error(y_test, y_pred_gb)
    gb_rmse = np.sqrt(gb_mse)
    gb_r2 = r2_score(y_test, y_pred_gb)
    
    print(f"  Gradient Boosting results: RMSE={gb_rmse:.4f}, R²={gb_r2:.4f}")
    models['gradient_boosting'] = gb_pipeline
    
    # SVR
    print("  Training SVR regressor...")
    svr_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', SVR())
    ])
    
    svr_pipeline.fit(X_train, y_train)
    y_pred_svr = svr_pipeline.predict(X_test)
    
    svr_mse = mean_squared_error(y_test, y_pred_svr)
    svr_rmse = np.sqrt(svr_mse)
    svr_r2 = r2_score(y_test, y_pred_svr)
    
    print(f"  SVR results: RMSE={svr_rmse:.4f}, R²={svr_r2:.4f}")
    models['svr'] = svr_pipeline
    
    # Neural Network Regressor
    print("  Training Neural Network regressor...")
    nn_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', MLPRegressor(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42))
    ])
    
    nn_pipeline.fit(X_train, y_train)
    y_pred_nn = nn_pipeline.predict(X_test)
    
    nn_mse = mean_squared_error(y_test, y_pred_nn)
    nn_rmse = np.sqrt(nn_mse)
    nn_r2 = r2_score(y_test, y_pred_nn)
    
    print(f"  Neural Network results: RMSE={nn_rmse:.4f}, R²={nn_r2:.4f}")
    models['neural_network'] = nn_pipeline
    
    # Select best model based on RMSE
    model_rmse_scores = {
        'random_forest': rf_rmse,
        'gradient_boosting': gb_rmse,
        'svr': svr_rmse,
        'neural_network': nn_rmse
    }
    best_model_name = min(model_rmse_scores, key=model_rmse_scores.get)
    best_model = models[best_model_name]
    print(f"Best RUL prediction model: {best_model_name}")
    
    # Save all models
    for name, model in models.items():
        joblib.dump(model, f"models/rul_prediction_{name}.pkl")
        
    print("All RUL prediction models saved")
    
    # Return the best model
    return best_model

# Train anomaly detection models
def train_anomaly_detection_models(X):
    print("Training anomaly detection models...")
    
    # Store original data for reference
    X_original = X.copy()
    
    # Remove metadata for training
    X = X.drop(columns=['equipment_id', 'timestamp'])
    
    # Identify categorical and numerical features
    categorical_features = [col for col in X.columns if X[col].dtype == 'object']
    numerical_features = [col for col in X.columns if col not in categorical_features]
    
    # Print info about missing values
    print(f"  Data contains {X.isna().sum().sum()} missing values out of {X.size} total values")
    
    # Unique equipment types for type-specific models
    equipment_types = X_original['equipment_type'].unique()
    
    # Create preprocessing pipeline with imputer for missing values
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    # Dictionary to store trained models
    models = {}
    
    # Train a general model for all equipment types
    
    # PCA with 95% variance retention
    print("  Training PCA-based anomaly detection...")
    X_preprocessed = preprocessor.fit_transform(X)
    
    pca = PCA(n_components=0.95, random_state=42)
    X_pca = pca.fit_transform(X_preprocessed)
    
    # Reconstruct the data
    X_reconstructed = pca.inverse_transform(X_pca)
    
    # Calculate reconstruction error
    reconstruction_errors = np.mean(np.square(X_preprocessed - X_reconstructed), axis=1)
    
    # Set threshold at 95th percentile of error
    threshold = np.percentile(reconstruction_errors, 95)
    
    pca_model = {
        'preprocessor': preprocessor,
        'pca': pca,
        'threshold': threshold
    }
    models['pca'] = pca_model
    
    # KMeans clustering
    print("  Training KMeans clustering for anomaly detection...")
    kmeans_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('kmeans', KMeans(n_clusters=5, random_state=42))
    ])
    
    kmeans_pipeline.fit(X)
    cluster_labels = kmeans_pipeline.named_steps['kmeans'].labels_
    cluster_centers = kmeans_pipeline.named_steps['kmeans'].cluster_centers_
    
    # Calculate distance to nearest cluster center
    X_preprocessed = kmeans_pipeline.named_steps['preprocessor'].transform(X)
    distances = []
    
    for i, point in enumerate(X_preprocessed):
        cluster = cluster_labels[i]
        center = cluster_centers[cluster]
        
        # Only works if OneHotEncoder output is included in the dimensions
        if len(point) == len(center):
            distance = np.sqrt(np.sum((point - center) ** 2))
            distances.append(distance)
        else:
            # Fallback if dimensions don't match
            distances.append(0)
    
    # Set threshold at 95th percentile of distances
    distance_threshold = np.percentile(distances, 95)
    
    kmeans_model = {
        'pipeline': kmeans_pipeline,
        'threshold': distance_threshold
    }
    models['kmeans'] = kmeans_model
    
    # DBSCAN clustering
    print("  Training DBSCAN clustering for anomaly detection...")
    dbscan_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('dbscan', DBSCAN(eps=0.5, min_samples=5))
    ])
    
    dbscan_pipeline.fit(X)
    dbscan_labels = dbscan_pipeline.named_steps['dbscan'].labels_
    
    # Label -1 indicates outliers/anomalies in DBSCAN
    anomaly_indices = np.where(dbscan_labels == -1)[0]
    
    dbscan_model = {
        'pipeline': dbscan_pipeline
    }
    models['dbscan'] = dbscan_model
    
    # Save all models
    joblib.dump(models, "models/anomaly_detection_models.pkl")
    
    print("All anomaly detection models saved")
    print(f"PCA model established with threshold {threshold:.4f}")
    print(f"KMeans model established with threshold {distance_threshold:.4f}")
    print(f"DBSCAN identified {len(anomaly_indices)} anomalies out of {len(X)} samples ({len(anomaly_indices)/len(X)*100:.2f}%)")
    
    return models

# Save feature importance information
def extract_feature_importance(models):
    print("Extracting feature importance information...")
    
    feature_importance = {}
    
    # Extract from failure prediction Random Forest
    failure_rf_model = joblib.load("models/failure_prediction_random_forest.pkl")
    if hasattr(failure_rf_model.named_steps['classifier'], 'feature_importances_'):
        # Get the preprocessor
        preprocessor = failure_rf_model.named_steps['preprocessor']
        
        # Get feature names after preprocessing
        if hasattr(preprocessor, 'get_feature_names_out'):
            feature_names = preprocessor.get_feature_names_out()
        else:
            # Fallback if no such method
            feature_names = [f'feature_{i}' for i in range(len(failure_rf_model.named_steps['classifier'].feature_importances_))]
        
        # Get feature importances
        importances = failure_rf_model.named_steps['classifier'].feature_importances_
        
        # Create a dataframe
        feature_importance['failure_prediction'] = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
    
    # Extract from RUL prediction Random Forest
    rul_rf_model = joblib.load("models/rul_prediction_random_forest.pkl")
    if hasattr(rul_rf_model.named_steps['regressor'], 'feature_importances_'):
        # Get the preprocessor
        preprocessor = rul_rf_model.named_steps['preprocessor']
        
        # Get feature names after preprocessing
        if hasattr(preprocessor, 'get_feature_names_out'):
            feature_names = preprocessor.get_feature_names_out()
        else:
            # Fallback if no such method
            feature_names = [f'feature_{i}' for i in range(len(rul_rf_model.named_steps['regressor'].feature_importances_))]
        
        # Get feature importances
        importances = rul_rf_model.named_steps['regressor'].feature_importances_
        
        # Create a dataframe
        feature_importance['rul_prediction'] = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
    
    # Save feature importances to CSV
    for model_type, importance_df in feature_importance.items():
        importance_df.to_csv(f"models/{model_type}_feature_importance.csv", index=False)
        
        # Plot feature importance for top 20 features
        plt.figure(figsize=(12, 8))
        top_features = importance_df.head(20)
        sns.barplot(x='importance', y='feature', data=top_features)
        plt.title(f'Top 20 Feature Importance for {model_type.replace("_", " ").title()}')
        plt.tight_layout()
        plt.savefig(f"models/{model_type}_feature_importance.png")
        plt.close()
    
    print("Feature importance information saved")
    return feature_importance

# Main function to train all models
def train_all_models():
    print("Starting model training process...")
    
    # Load all datasets
    datasets = load_datasets()
    
    # Check if datasets are loaded correctly
    if not all(key in datasets for key in ['machine_inventory', 'sensor_thresholds', 'failure_history', 'maintenance_history', 'sensor_data']):
        print("Error: Not all required datasets were loaded correctly.")
        return
    
    # Preprocess data for failure prediction
    X_failure, y_failure = preprocess_for_failure_prediction(datasets)
    
    # Train failure prediction models
    best_failure_model = train_failure_prediction_models(X_failure, y_failure)
    
    # Preprocess data for RUL prediction
    X_rul, y_rul = preprocess_for_rul_prediction(datasets)
    
    # Train RUL prediction models
    best_rul_model = train_rul_prediction_models(X_rul, y_rul)
    
    # Preprocess data for anomaly detection
    X_anomaly = preprocess_for_anomaly_detection(datasets)
    
    # Train anomaly detection models
    anomaly_models = train_anomaly_detection_models(X_anomaly)
    
    # Extract feature importance information
    feature_importance = extract_feature_importance({
        'failure_prediction': best_failure_model,
        'rul_prediction': best_rul_model
    })
    
    print("All models trained and saved successfully!")
    
    # Return the trained models
    models = {
        'failure_prediction': best_failure_model,
        'rul_prediction': best_rul_model,
        'anomaly_detection': anomaly_models,
        'feature_importance': feature_importance
    }
    
    return models

if __name__ == "__main__":
    # Train all models
    trained_models = train_all_models() 