from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Union
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import json
import os
import shutil
from datetime import datetime, timedelta
import random
import uuid
from pathlib import Path

# Create directories for data and models
os.makedirs("./data", exist_ok=True)
os.makedirs("./models", exist_ok=True)

app = FastAPI(title="Predictive Maintenance API")

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class MaintenanceSchedule(BaseModel):
    equipment_id: str
    scheduled_date: str
    maintenance_type: str
    description: str

class PredictionRequest(BaseModel):
    equipment_id: str
    readings: Dict[str, float]

class ConnectorConfig(BaseModel):
    equipment_id: str
    name: str
    type: str
    config: Dict[str, Union[str, int, bool]]

# Mock database (replace with real DB in production)
equipment_db = {}
maintenance_history = []
connectors = []
sensor_readings = {}

# Load sample data if available
def load_sample_data():
    global equipment_db, maintenance_history, connectors
    try:
        # Sample equipment data
        equipment_list = [
            {
                "equipment_id": "EQ001",
                "name": "CNC Machine Alpha",
                "status": "operational",
                "installation_date": "2020-03-15",
                "last_maintenance_date": "2023-09-01",
                "location": "Building A, Floor 1",
                "model": "CNC-5000",
                "manufacturer": "MachineWorks Inc"
            },
            {
                "equipment_id": "EQ002",
                "name": "Hydraulic Press Beta",
                "status": "needs_maintenance",
                "installation_date": "2019-07-22",
                "last_maintenance_date": "2023-07-15",
                "location": "Building B, Floor 2",
                "model": "HP-2000",
                "manufacturer": "HydroTech"
            },
            {
                "equipment_id": "EQ003",
                "name": "Assembly Robot Gamma",
                "status": "operational",
                "installation_date": "2021-01-10",
                "last_maintenance_date": "2023-08-05",
                "location": "Building A, Floor 2",
                "model": "RoboAssembly-X3",
                "manufacturer": "AutomationPro"
            }
        ]
        
        for eq in equipment_list:
            equipment_db[eq["equipment_id"]] = eq
            # Generate some sample sensor readings
            readings = []
            current_date = datetime.now()
            for i in range(100):  # 100 data points
                timestamp = (current_date - timedelta(hours=i)).isoformat()
                readings.append({
                    "timestamp": timestamp,
                    "temperature": random.uniform(60, 85),
                    "vibration": random.uniform(2, 6),
                    "pressure": random.uniform(95, 115),
                    "oil_level": random.uniform(80, 100)
                })
            sensor_readings[eq["equipment_id"]] = readings
            
        # Sample maintenance history
        maintenance_history = [
            {
                "id": "M001",
                "equipment_id": "EQ001",
                "date": "2023-09-01",
                "type": "preventive",
                "description": "Regular inspection and oil change",
                "parts_replaced": ["Oil filter", "Lubricant"],
                "technician": "John Doe",
                "duration_hours": 2.5,
                "cost": 350
            },
            {
                "id": "M002",
                "equipment_id": "EQ002",
                "date": "2023-07-15",
                "type": "corrective",
                "description": "Hydraulic leak repair",
                "parts_replaced": ["Hydraulic seal", "Pressure valve"],
                "technician": "Jane Smith",
                "duration_hours": 4.0,
                "cost": 720
            },
            {
                "id": "M003",
                "equipment_id": "EQ003",
                "date": "2023-08-05",
                "type": "predictive",
                "description": "Bearing replacement based on vibration analysis",
                "parts_replaced": ["Ball bearing assembly"],
                "technician": "Robert Chen",
                "duration_hours": 3.0,
                "cost": 450
            }
        ]
        
        # Sample connectors
        connectors = [
            {
                "id": "CONN001",
                "equipment_id": "EQ001",
                "name": "CNC Sensor Feed",
                "type": "modbus",
                "status": "active",
                "last_data_received": "2023-10-05T08:30:00",
                "config": {
                    "ip": "192.168.1.100",
                    "port": 502,
                    "unit_id": 1,
                    "polling_interval": 60
                }
            },
            {
                "id": "CONN002",
                "equipment_id": "EQ002",
                "name": "Hydraulic Press Log",
                "type": "csv",
                "status": "active",
                "last_data_received": "2023-10-05T08:15:00",
                "config": {
                    "file_path": "/logs/press/",
                    "polling_interval": 3600,
                    "file_pattern": "press_log_*.csv"
                }
            }
        ]
        
        print("Sample data loaded successfully")
    except Exception as e:
        print(f"Error loading sample data: {e}")

# Load sample data on startup
load_sample_data()

# Endpoints
@app.get("/")
def read_root():
    return {"message": "Predictive Maintenance API is running"}

@app.get("/api/machines")
def get_machines():
    return list(equipment_db.values())

@app.get("/api/machines/{equipment_id}")
def get_machine_details(equipment_id: str):
    if equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment_db[equipment_id]

@app.get("/api/machines/{equipment_id}/history")
def get_machine_history(equipment_id: str):
    if equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    history = [m for m in maintenance_history if m["equipment_id"] == equipment_id]
    return history

@app.get("/api/machines/{equipment_id}/readings")
def get_machine_readings(
    equipment_id: str, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    limit: int = Query(100, le=1000)
):
    if equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    readings = sensor_readings.get(equipment_id, [])
    
    # Filter by dates if provided
    if start_date:
        readings = [r for r in readings if r["timestamp"] >= start_date]
    if end_date:
        readings = [r for r in readings if r["timestamp"] <= end_date]
    
    # Apply limit
    readings = readings[:limit]
    
    return {
        "equipment_id": equipment_id,
        "readings": readings
    }

@app.post("/api/prediction")
def run_prediction(request: PredictionRequest):
    equipment_id = request.equipment_id
    readings = request.readings
    
    if equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Check if a trained model exists
    model_path = "./models/predictive_model.pkl"
    if not os.path.exists(model_path):
        # Fallback to a simple rule-based prediction if no model
        temperature = readings.get("temperature", 70)
        vibration = readings.get("vibration", 3)
        
        failure_probability = 0.0
        if temperature > 85:
            failure_probability += 0.4
        if vibration > 5:
            failure_probability += 0.4
        
        remaining_days = int(30 * (1 - failure_probability))
        
        return {
            "equipment_id": equipment_id,
            "prediction": {
                "failure_probability": failure_probability,
                "remaining_useful_life_days": remaining_days,
                "recommended_action": "maintenance" if failure_probability > 0.6 else "monitor",
                "confidence": 0.7
            },
            "note": "Using rule-based prediction (no trained model found)"
        }
    
    # Use the trained model for prediction
    try:
        model = joblib.load(model_path)
        
        # Prepare input features (ensure same order as training)
        features = [
            readings.get("temperature", 70),
            readings.get("vibration", 3),
            readings.get("pressure", 100),
            readings.get("oil_level", 90)
        ]
        
        # Make prediction
        failure_probability = float(model.predict_proba([features])[0][1])
        remaining_days = int(30 * (1 - failure_probability))
        
        return {
            "equipment_id": equipment_id,
            "prediction": {
                "failure_probability": failure_probability,
                "remaining_useful_life_days": remaining_days,
                "recommended_action": "maintenance" if failure_probability > 0.6 else "monitor",
                "confidence": 0.85
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/maintenance/schedule")
def schedule_maintenance(maintenance: MaintenanceSchedule):
    if maintenance.equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Create a new maintenance record
    new_maintenance = {
        "id": f"M{len(maintenance_history) + 1:03d}",
        "equipment_id": maintenance.equipment_id,
        "date": maintenance.scheduled_date,
        "type": maintenance.maintenance_type,
        "description": maintenance.description,
        "parts_replaced": [],
        "technician": "To be assigned",
        "duration_hours": 0,
        "cost": 0,
        "status": "scheduled"
    }
    
    maintenance_history.append(new_maintenance)
    
    # Update equipment last_maintenance_date if the scheduled date is today or earlier
    scheduled_date = datetime.fromisoformat(maintenance.scheduled_date.replace("Z", "+00:00"))
    if scheduled_date.date() <= datetime.now().date():
        equipment_db[maintenance.equipment_id]["last_maintenance_date"] = maintenance.scheduled_date
    
    return {"success": True, "maintenance_id": new_maintenance["id"]}

@app.post("/api/upload-historical-data")
async def upload_historical_data(file: UploadFile = File(...)):
    try:
        # Save the uploaded file
        file_location = f"./data/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Process the file based on its extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_location)
        elif file.filename.endswith('.json'):
            with open(file_location, 'r') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")
        
        # Save as the latest upload for training
        df.to_csv("./data/latest_upload.csv", index=False)
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/api/model/train")
async def train_model():
    try:
        # Check if training data exists
        data_path = "./data/latest_upload.csv"
        if not os.path.exists(data_path):
            raise HTTPException(status_code=400, detail="No training data available")
        
        # Load data
        df = pd.read_csv(data_path)
        
        # Perform basic data validation
        required_columns = ["temperature", "vibration", "pressure", "oil_level", "is_failure"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return {
                "success": False,
                "message": f"Missing required columns: {', '.join(missing_columns)}",
                "required_format": "CSV with columns: timestamp, equipment_id, temperature, vibration, pressure, oil_level, is_failure"
            }
        
        # Prepare features and target
        X = df[["temperature", "vibration", "pressure", "oil_level"]]
        y = df["is_failure"]
        
        # Import here to avoid requiring scikit-learn if not using this endpoint
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate model
        accuracy = model.score(X_test, y_test)
        
        # Save model
        joblib.dump(model, "./models/predictive_model.pkl")
        
        # Extract feature importance
        feature_importance = [
            {"name": "Temperature", "value": float(model.feature_importances_[0])},
            {"name": "Vibration", "value": float(model.feature_importances_[1])},
            {"name": "Pressure", "value": float(model.feature_importances_[2])},
            {"name": "Oil Level", "value": float(model.feature_importances_[3])}
        ]
        
        # Save feature importance for analytics
        with open("./models/feature_importance.json", "w") as f:
            json.dump(feature_importance, f)
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "metrics": {
                "accuracy": float(accuracy),
                "samples_used": len(df)
            },
            "feature_importance": feature_importance,
            "jobId": f"training_{uuid.uuid4().hex}",
            "estimatedCompletionTime": (datetime.now() + timedelta(minutes=1)).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@app.post("/api/connector/setup")
def setup_connector(connector: ConnectorConfig):
    # Check if equipment exists
    if connector.equipment_id not in equipment_db:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Create new connector
    new_connector = {
        "id": f"CONN{len(connectors) + 1:03d}",
        "equipment_id": connector.equipment_id,
        "name": connector.name,
        "type": connector.type,
        "status": "active",
        "last_data_received": datetime.now().isoformat(),
        "config": connector.config
    }
    
    connectors.append(new_connector)
    
    return {
        "success": True,
        "connector_id": new_connector["id"],
        "status": "active"
    }

@app.delete("/api/connector/{equipment_id}")
def stop_connector(equipment_id: str):
    # Find connectors for the equipment
    equipment_connectors = [c for c in connectors if c["equipment_id"] == equipment_id]
    
    if not equipment_connectors:
        raise HTTPException(status_code=404, detail="No connectors found for this equipment")
    
    # Update status of all connectors for this equipment
    for connector in equipment_connectors:
        connector["status"] = "inactive"
    
    return {
        "success": True,
        "message": f"Connectors for equipment {equipment_id} stopped"
    }

@app.get("/api/connector")
def list_connectors():
    return connectors

# Settings endpoints

@app.get("/api/settings/alerts")
def get_alert_config():
    return {
        "alertThreshold": 80,
        "sensorThresholds": {
            "temperature": { "warning": 80, "critical": 95 },
            "vibration": { "warning": 4.5, "critical": 7.1 },
            "pressure": { "warning": 110, "critical": 135 },
            "oil_level": { "warning": 25, "critical": 10 }
        }
    }

@app.post("/api/settings/alerts")
def save_alert_config(config: dict):
    # In a real application, you would save this to a database
    return {
        "success": True,
        "message": "Alert configuration saved successfully"
    }

@app.get("/api/settings/notifications")
def get_notification_settings():
    return {
        "emailNotifications": True,
        "smsNotifications": False,
        "notificationEmail": "admin@example.com",
        "notificationPhone": "",
        "notificationEvents": {
            "anomalyDetection": True,
            "maintenanceDue": True,
            "thresholdViolations": True,
            "systemUpdates": False
        }
    }

@app.post("/api/settings/notifications")
def save_notification_settings(settings: dict):
    # In a real application, you would save this to a database
    return {
        "success": True,
        "message": "Notification settings saved successfully"
    }

@app.get("/api/settings/model")
def get_model_settings():
    return {
        "algorithm": "random_forest",
        "trainingFrequency": "weekly",
        "dataRetentionPeriod": "1year"
    }

@app.post("/api/settings/model")
def save_model_settings(settings: dict):
    # In a real application, you would save this to a database
    return {
        "success": True,
        "message": "Model settings saved successfully"
    }

# Analytics endpoints
@app.get("/api/analytics/comparative")
def get_comparative_analytics(metric: str, equipmentIds: Optional[str] = None):
    equipment_ids = equipmentIds.split(",") if equipmentIds else []
    
    # If no specific equipment is requested, use all
    if not equipment_ids:
        equipment_ids = list(equipment_db.keys())
    
    result = {
        "metric": metric,
        "data": []
    }
    
    # Generate comparative analytics based on the metric
    for eq_id in equipment_ids:
        if eq_id in equipment_db:
            value = 0
            if metric == "temperature":
                # Average of last 10 temperature readings
                readings = sensor_readings.get(eq_id, [])[:10]
                if readings:
                    value = sum(r["temperature"] for r in readings) / len(readings)
            elif metric == "vibration":
                readings = sensor_readings.get(eq_id, [])[:10]
                if readings:
                    value = sum(r["vibration"] for r in readings) / len(readings)
            elif metric == "maintenance_frequency":
                # Count maintenance events for this equipment
                count = len([m for m in maintenance_history if m["equipment_id"] == eq_id])
                value = count
            elif metric == "downtime":
                # Sum of maintenance durations
                duration = sum(m["duration_hours"] for m in maintenance_history if m["equipment_id"] == eq_id)
                value = duration
            
            result["data"].append({
                "equipment_id": eq_id,
                "name": equipment_db[eq_id]["name"],
                "value": value,
                "average": random.uniform(value * 0.8, value * 1.2)  # Mock fleet average
            })
    
    return result

@app.get("/api/analytics/roi")
def get_maintenance_roi(period: str = "12months"):
    # In a real application, calculate ROI based on maintenance costs and savings
    total_savings = 127500
    
    return {
        "period": period,
        "totalSavings": total_savings,
        "previousPeriodChange": 0.23,  # 23% increase
        "breakdown": [
            {"name": "Predictive", "value": int(total_savings * 0.57), "color": "#ff9800"},
            {"name": "Preventive", "value": int(total_savings * 0.35), "color": "#ffb74d"},
            {"name": "Reactive", "value": int(total_savings * 0.08), "color": "#e0e0e0"}
        ]
    }

@app.get("/api/analytics/reliability")
def get_reliability_scores():
    scores = {
        "fleetScore": 78,
        "equipment": []
    }
    
    # Generate reliability scores for each equipment
    for eq_id, equipment in equipment_db.items():
        scores["equipment"].append({
            "equipment_id": eq_id,
            "name": equipment["name"],
            "score": random.randint(60, 95),
            "trend": random.choice(["up", "down", "stable"])
        })
    
    return scores

@app.get("/api/analytics/feature-importance")
def get_feature_importance():
    # Try to load actual feature importance if available
    try:
        if os.path.exists("./models/feature_importance.json"):
            with open("./models/feature_importance.json", "r") as f:
                return json.load(f)
    except:
        pass
    
    # Fallback to mock data
    return [
        {"name": "Temperature", "value": 0.32},
        {"name": "Vibration", "value": 0.28},
        {"name": "Operating Hours", "value": 0.18},
        {"name": "Pressure", "value": 0.12},
        {"name": "Oil Level", "value": 0.07},
        {"name": "Others", "value": 0.03}
    ]

# Run with: uvicorn main:app --reload --port 8000 