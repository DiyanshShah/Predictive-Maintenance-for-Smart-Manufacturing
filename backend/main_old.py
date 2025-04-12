from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
import os
import json
import logging
from sqlalchemy.orm import Session

# ML models and utils imports
from models.anomaly_detection import AnomalyDetector
from models.prediction import FailurePredictor
from models.data_processor import DataProcessor

# Database imports
from database import get_db, Equipment, SensorReading, MaintenanceRecord, PredictionResult
import database as db_utils

# Connector imports
from connectors import create_connector

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Predictive Maintenance API",
              description="API for analyzing equipment sensor data to predict potential failures",
              version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
anomaly_detector = AnomalyDetector()
failure_predictor = FailurePredictor()
data_processor = DataProcessor()

# Serve static files (if needed)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# API Models
class SensorData(BaseModel):
    timestamp: str
    equipment_id: str
    readings: Dict[str, float]

class PredictionResultModel(BaseModel):
    equipment_id: str
    prediction: str
    probability: float
    anomaly_detected: bool
    maintenance_required: bool
    next_maintenance_date: Optional[str] = None
    estimated_time_to_failure: Optional[int] = None

class MaintenanceSchedule(BaseModel):
    equipment_id: str
    maintenance_date: str
    maintenance_type: str = "predictive"
    description: Optional[str] = None
    technician: Optional[str] = None
    cost: Optional[float] = None

class EquipmentModel(BaseModel):
    equipment_id: str
    name: str
    type: str
    description: Optional[str] = None
    location: Optional[str] = None
    installation_date: Optional[str] = None

class ConnectorConfig(BaseModel):
    connector_type: str
    equipment_id: str
    config: Dict[str, Any] = {}
    connection_params: Dict[str, Any] = {}

# Active connectors
active_connectors = {}

@app.get("/")
def read_root():
    return {"message": "Predictive Maintenance API is running"}

@app.get("/equipment", response_model=List[Dict[str, Any]])
def get_equipment_list(db: Session = Depends(get_db)):
    """Get list of all equipment"""
    equipment_list = db.query(Equipment).all()
    
    result = []
    for equipment in equipment_list:
        # Get latest sensor reading for each equipment
        latest_reading = db.query(SensorReading).filter(
            SensorReading.equipment_id == equipment.equipment_id
        ).order_by(SensorReading.timestamp.desc()).first()
        
        # Get latest maintenance record
        latest_maintenance = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.equipment_id == equipment.equipment_id
        ).order_by(MaintenanceRecord.maintenance_date.desc()).first()
        
        # Determine status based on latest reading
        status = "normal"
        if latest_reading and latest_reading.anomaly_detected:
            status = "critical"
        elif latest_reading and latest_reading.anomaly_score > 0.5:
            status = "warning"
        
        result.append({
            "equipment_id": equipment.equipment_id,
            "name": equipment.name,
            "type": equipment.type,
            "location": equipment.location,
            "status": status,
            "lastMaintenance": latest_maintenance.maintenance_date.strftime("%Y-%m-%d") if latest_maintenance else None
        })
    
    return result

@app.get("/equipment/{equipment_id}", response_model=Dict[str, Any])
def get_equipment_details(equipment_id: str, db: Session = Depends(get_db)):
    """Get details for a specific equipment"""
    equipment = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    
    if not equipment:
        raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found")
    
    # Get latest sensor reading
    latest_reading = db.query(SensorReading).filter(
        SensorReading.equipment_id == equipment_id
    ).order_by(SensorReading.timestamp.desc()).first()
    
    # Get latest maintenance record
    latest_maintenance = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.equipment_id == equipment_id
    ).order_by(MaintenanceRecord.maintenance_date.desc()).first()
    
    # Get latest prediction
    latest_prediction = db.query(PredictionResult).filter(
        PredictionResult.equipment_id == equipment_id
    ).order_by(PredictionResult.prediction_date.desc()).first()
    
    # Determine status based on latest reading
    status = "normal"
    if latest_reading and latest_reading.anomaly_detected:
        status = "critical"
    elif latest_reading and latest_reading.anomaly_score > 0.5:
        status = "warning"
    
    result = {
        "equipment_id": equipment.equipment_id,
        "name": equipment.name,
        "type": equipment.type,
        "description": equipment.description,
        "location": equipment.location,
        "installation_date": equipment.installation_date.strftime("%Y-%m-%d") if equipment.installation_date else None,
        "status": status,
        "last_maintenance": {
            "date": latest_maintenance.maintenance_date.strftime("%Y-%m-%d") if latest_maintenance else None,
            "type": latest_maintenance.maintenance_type if latest_maintenance else None,
            "description": latest_maintenance.description if latest_maintenance else None
        },
        "latest_reading": {
            "timestamp": latest_reading.timestamp.strftime("%Y-%m-%d %H:%M:%S") if latest_reading else None,
            "readings": {column: getattr(latest_reading, column) 
                        for column in ['temperature', 'vibration', 'pressure', 'rotation_speed', 
                                       'voltage', 'current', 'oil_level', 'humidity', 'noise_level'] 
                        if latest_reading and getattr(latest_reading, column) is not None}
        },
        "latest_prediction": {
            "date": latest_prediction.prediction_date.strftime("%Y-%m-%d %H:%M:%S") if latest_prediction else None,
            "prediction": latest_prediction.prediction if latest_prediction else None,
            "probability": latest_prediction.probability if latest_prediction else None,
            "maintenance_required": latest_prediction.maintenance_required if latest_prediction else None,
            "estimated_time_to_failure": latest_prediction.estimated_time_to_failure if latest_prediction else None
        }
    }
    
    return result

@app.get("/equipment/{equipment_id}/readings", response_model=List[Dict[str, Any]])
def get_equipment_readings(
    equipment_id: str, 
    limit: int = Query(100, gt=0, le=1000),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get sensor readings for a specific equipment"""
    # Convert date strings to datetime objects if provided
    start_datetime = None
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    end_datetime = None
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            # Set to end of day
            end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    # Check if equipment exists
    equipment = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found")
    
    # Query sensor readings
    query = db.query(SensorReading).filter(SensorReading.equipment_id == equipment_id)
    
    if start_datetime:
        query = query.filter(SensorReading.timestamp >= start_datetime)
    if end_datetime:
        query = query.filter(SensorReading.timestamp <= end_datetime)
    
    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    
    # Convert to list of dictionaries
    result = []
    for reading in readings:
        reading_dict = {
            "timestamp": reading.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "equipment_id": reading.equipment_id,
            "anomaly_detected": reading.anomaly_detected,
            "anomaly_score": reading.anomaly_score
        }
        
        # Add sensor values
        for column in ['temperature', 'vibration', 'pressure', 'rotation_speed', 
                      'voltage', 'current', 'oil_level', 'humidity', 'noise_level']:
            value = getattr(reading, column)
            if value is not None:
                reading_dict[column] = value
        
        result.append(reading_dict)
    
    return result

@app.get("/equipment/{equipment_id}/history", response_model=Dict[str, Any])
def get_equipment_history(equipment_id: str, db: Session = Depends(get_db)):
    """Get maintenance history for a specific equipment"""
    # Check if equipment exists
    equipment = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found")
    
    # Get maintenance records
    maintenance_records = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.equipment_id == equipment_id
    ).order_by(MaintenanceRecord.maintenance_date.desc()).all()
    
    # Convert to list of dictionaries
    history = []
    for record in maintenance_records:
        history.append({
            "date": record.maintenance_date.strftime("%Y-%m-%d"),
            "type": record.maintenance_type,
            "description": record.description,
            "technician": record.technician,
            "cost": record.cost
        })
    
    return {
        "equipment_id": equipment_id,
        "history": history
    }

@app.post("/predict", response_model=PredictionResultModel)
async def predict_failure(data: SensorData, db: Session = Depends(get_db)):
    """Predict failure based on sensor data"""
    try:
        # Check if equipment exists
        equipment = db.query(Equipment).filter(Equipment.equipment_id == data.equipment_id).first()
        if not equipment:
            raise HTTPException(status_code=404, detail=f"Equipment {data.equipment_id} not found")
        
        # Process the incoming data
        processed_data = data_processor.process(data.dict())
        
        # Save the reading to database
        timestamp = datetime.strptime(data.timestamp, "%Y-%m-%d %H:%M:%S")
        
        # Extract sensor readings
        sensor_data = {}
        for key, value in data.readings.items():
            sensor_data[key] = value
        
        # Detect anomalies
        anomaly_result = anomaly_detector.detect(processed_data)
        
        # Create sensor reading record
        reading = SensorReading(
            equipment_id=data.equipment_id,
            timestamp=timestamp,
            anomaly_detected=anomaly_result["anomaly_detected"],
            anomaly_score=anomaly_result["anomaly_score"],
            **sensor_data
        )
        
        db.add(reading)
        db.commit()
        
        # Predict failure
        prediction_result = failure_predictor.predict(processed_data)
        
        # Calculate next maintenance date if needed
        next_maintenance = None
        if prediction_result["maintenance_required"]:
            next_maintenance = datetime.now() + timedelta(days=7)  # Default to a week from now
            next_maintenance = next_maintenance.strftime("%Y-%m-%d")
        
        # Create response
        response = {
            "equipment_id": data.equipment_id,
            "prediction": prediction_result["prediction"],
            "probability": prediction_result["probability"],
            "anomaly_detected": anomaly_result["anomaly_detected"],
            "maintenance_required": prediction_result["maintenance_required"],
            "next_maintenance_date": next_maintenance,
            "estimated_time_to_failure": prediction_result.get("estimated_time_to_failure")
        }
        
        # Save prediction result to database
        prediction_record = PredictionResult(
            equipment_id=data.equipment_id,
            prediction_date=datetime.now(),
            prediction=prediction_result["prediction"],
            probability=prediction_result["probability"],
            anomaly_detected=anomaly_result["anomaly_detected"],
            maintenance_required=prediction_result["maintenance_required"],
            next_maintenance_date=datetime.strptime(next_maintenance, "%Y-%m-%d") if next_maintenance else None,
            estimated_time_to_failure=prediction_result.get("estimated_time_to_failure")
        )
        
        db.add(prediction_record)
        db.commit()
        
        return response
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/maintenance/schedule", response_model=Dict[str, Any])
async def schedule_maintenance(maintenance: MaintenanceSchedule, db: Session = Depends(get_db)):
    """Schedule maintenance for equipment"""
    try:
        # Check if equipment exists
        equipment = db.query(Equipment).filter(Equipment.equipment_id == maintenance.equipment_id).first()
        if not equipment:
            raise HTTPException(status_code=404, detail=f"Equipment {maintenance.equipment_id} not found")
        
        # Parse maintenance date
        try:
            maintenance_date = datetime.strptime(maintenance.maintenance_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid maintenance_date format. Use YYYY-MM-DD")
        
        # Create maintenance record
        maintenance_record = MaintenanceRecord(
            equipment_id=maintenance.equipment_id,
            maintenance_date=maintenance_date,
            maintenance_type=maintenance.maintenance_type,
            description=maintenance.description,
            technician=maintenance.technician,
            cost=maintenance.cost
        )
        
        db.add(maintenance_record)
        db.commit()
        
        return {
            "message": "Maintenance scheduled successfully",
            "equipment_id": maintenance.equipment_id,
            "maintenance_date": maintenance.maintenance_date
        }
    except Exception as e:
        logger.error(f"Error scheduling maintenance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-historical-data")
async def upload_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload historical data file (CSV or JSON)"""
    try:
        # Read and process file
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            data = pd.read_csv(pd.io.common.BytesIO(content))
        elif file.filename.endswith('.json'):
            data = pd.read_json(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="File must be CSV or JSON")
        
        # Check required columns
        required_columns = ['timestamp', 'equipment_id']
        for col in required_columns:
            if col not in data.columns:
                raise HTTPException(status_code=400, detail=f"Missing required column: {col}")
        
        # Process and save data to database
        count = 0
        for _, row in data.iterrows():
            # Try to convert timestamp
            try:
                timestamp = pd.to_datetime(row['timestamp'])
            except ValueError:
                logger.warning(f"Invalid timestamp format: {row['timestamp']}")
                continue
            
            # Extract sensor readings
            sensor_data = {}
            for column in ['temperature', 'vibration', 'pressure', 'rotation_speed', 
                          'voltage', 'current', 'oil_level', 'humidity', 'noise_level']:
                if column in row and not pd.isna(row[column]):
                    sensor_data[column] = float(row[column])
            
            # Detect anomalies if 'failure' is not in the data
            anomaly_detected = False
            anomaly_score = 0.0
            
            if 'failure' in row:
                anomaly_detected = bool(row['failure'])
            else:
                # Process for anomaly detection
                processed_row = data_processor.process(row.to_dict())
                anomaly_result = anomaly_detector.detect(processed_row)
                anomaly_detected = anomaly_result["anomaly_detected"]
                anomaly_score = anomaly_result["anomaly_score"]
            
            # Create sensor reading record
            reading = SensorReading(
                equipment_id=row['equipment_id'],
                timestamp=timestamp,
                anomaly_detected=anomaly_detected,
                anomaly_score=anomaly_score,
                **sensor_data
            )
            
            db.add(reading)
            count += 1
            
            # Commit in batches
            if count % 1000 == 0:
                db.commit()
                logger.info(f"Processed {count} readings...")
        
        # Final commit
        db.commit()
        
        # Process and train models with historical data
        anomaly_detector.train(data)
        failure_predictor.train(data)
        
        return {
            "message": "Data uploaded and models trained successfully",
            "readings_processed": count
        }
    except Exception as e:
        logger.error(f"Error uploading data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/connector/setup", response_model=Dict[str, Any])
async def setup_connector(config: ConnectorConfig):
    """Set up a new data connector"""
    try:
        # Check if connector with this ID already exists
        if config.equipment_id in active_connectors:
            # Stop the existing connector
            await stop_connector(config.equipment_id)
        
        # Create the connector
        connector = create_connector(
            config.equipment_id,
            config.connector_type,
            *config.connection_params.values(),
            config=config.config
        )
        
        # Set up callback function
        async def data_callback(reading):
            # Process the reading
            processed_data = data_processor.process(reading)
            
            # Detect anomalies
            anomaly_result = anomaly_detector.detect(processed_data)
            
            # Update the reading with anomaly information
            reading["anomaly_detected"] = anomaly_result["anomaly_detected"]
            reading["anomaly_score"] = anomaly_result["anomaly_score"]
            
            # Save to database (would normally use a background task)
            db = next(get_db())
            try:
                # Convert timestamp string to datetime
                timestamp = datetime.fromisoformat(reading["timestamp"])
                
                # Extract sensor readings
                sensor_data = {}
                for key, value in reading.items():
                    if key not in ['timestamp', 'equipment_id', 'anomaly_detected', 'anomaly_score']:
                        sensor_data[key] = value
                
                # Create sensor reading record
                db_reading = SensorReading(
                    equipment_id=reading["equipment_id"],
                    timestamp=timestamp,
                    anomaly_detected=reading["anomaly_detected"],
                    anomaly_score=reading["anomaly_score"],
                    **sensor_data
                )
                
                db.add(db_reading)
                db.commit()
            except Exception as e:
                logger.error(f"Error saving reading to database: {str(e)}")
                db.rollback()
            finally:
                db.close()
        
        # Set the callback
        connector.set_callback(data_callback)
        
        # Connect to the data source
        connector.connect()
        
        # Start reading data
        connector.read_data(loop=True)
        
        # Store the connector
        active_connectors[config.equipment_id] = connector
        
        return {
            "message": "Connector set up successfully",
            "equipment_id": config.equipment_id,
            "connector_type": config.connector_type,
            "status": "running"
        }
    except Exception as e:
        logger.error(f"Error setting up connector: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/connector/{equipment_id}", response_model=Dict[str, Any])
async def stop_connector(equipment_id: str):
    """Stop and remove a data connector"""
    if equipment_id not in active_connectors:
        raise HTTPException(status_code=404, detail=f"No active connector for equipment {equipment_id}")
    
    try:
        # Get the connector
        connector = active_connectors[equipment_id]
        
        # Disconnect
        connector.disconnect()
        
        # Remove from active connectors
        del active_connectors[equipment_id]
        
        return {
            "message": "Connector stopped successfully",
            "equipment_id": equipment_id
        }
    except Exception as e:
        logger.error(f"Error stopping connector: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/connector", response_model=List[Dict[str, Any]])
async def list_connectors():
    """List all active connectors"""
    return [
        {
            "equipment_id": equipment_id,
            "connector_type": connector.__class__.__name__,
            "status": "running" if connector.connected else "stopped"
        }
        for equipment_id, connector in active_connectors.items()
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 