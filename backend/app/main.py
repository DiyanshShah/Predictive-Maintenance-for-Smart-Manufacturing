from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlalchemy.orm import Session
import pandas as pd
import joblib
import json
import os
import shutil
from datetime import datetime, timedelta
import uuid
import jwt
from passlib.context import CryptContext

from . import crud, schemas
from .database import SessionLocal, engine, get_db

# Create directories for data and models
os.makedirs("./data", exist_ok=True)
os.makedirs("./models", exist_ok=True)

app = FastAPI(title="Predictive Maintenance API")

# CORS middleware
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    # Add your deployed frontend URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Settings
SECRET_KEY = os.environ.get("SECRET_KEY", "a_very_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper functions for authentication
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Endpoints
@app.get("/")
def read_root():
    return {"message": "Predictive Maintenance API is running"}

# Authentication endpoints
@app.post("/api/auth/login", response_model=schemas.User)
def login(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=user_data.email)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"token": access_token, "user": user}


@app.post("/api/auth/register", response_model=schemas.User)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user_data)

# Equipment endpoints
@app.get("/api/equipment", response_model=List[schemas.Equipment])
def get_equipment_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_equipment(db, skip=skip, limit=limit)

@app.get("/api/equipment/{equipment_id}", response_model=schemas.Equipment)
def get_equipment_details(equipment_id: str, db: Session = Depends(get_db)):
    db_equipment = crud.get_equipment_by_id(db, equipment_id=equipment_id)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return db_equipment

@app.get("/api/equipment/{equipment_id}/readings", response_model=List[schemas.SensorReading])
def get_equipment_readings(equipment_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_sensor_readings(db, equipment_id=equipment_id, skip=skip, limit=limit)

@app.post("/api/prediction", response_model=schemas.PredictionResult)
def run_prediction(request: schemas.PredictionRequest, db: Session = Depends(get_db)):
    equipment = crud.get_equipment_by_id(db, equipment_id=request.equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    model_path = "./models/failure_predictor.joblib"
    if not os.path.exists(model_path):
        raise HTTPException(status_code=500, detail="Prediction model not found")
    
    try:
        model = joblib.load(model_path)
        features = [
            request.readings.get("temperature", 70),
            request.readings.get("vibration", 3),
            request.readings.get("pressure", 100),
            request.readings.get("oil_level", 90)
        ]
        
        failure_probability = float(model.predict_proba([features])[0][1])
        remaining_days = int(30 * (1 - failure_probability))
        
        prediction_data = schemas.PredictionResultCreate(
            equipment_id=request.equipment_id,
            failure_probability=failure_probability,
            remaining_useful_life_days=remaining_days,
            recommended_action="maintenance" if failure_probability > 0.6 else "monitor",
            confidence=0.85 # This could be improved
        )
        return crud.create_prediction(db=db, prediction=prediction_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/maintenance/create", response_model=schemas.MaintenanceRecord)
def schedule_maintenance(maintenance: schemas.MaintenanceSchedule, db: Session = Depends(get_db)):
    return crud.create_maintenance_record(db=db, maintenance=maintenance, equipment_id=maintenance.equipment_id)

@app.post("/api/upload-historical-data")
async def upload_historical_data(file: UploadFile = File(...)):
    try:
        file_location = f"./data/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_location)
        elif file.filename.endswith('.json'):
            df = pd.read_json(file_location)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

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
    data_path = "./data/latest_upload.csv"
    if not os.path.exists(data_path):
        raise HTTPException(status_code=400, detail="No training data available")

    # This is a simplified training process. In a real app, this would be a background task.
    # The train_models.py script is more complete and should be used for serious training.
    try:
        df = pd.read_csv(data_path)
        required_columns = ["temperature", "vibration", "pressure", "oil_level", "is_failure"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns: {required_columns}")

        X = df[required_columns[:-1]]
        y = df["is_failure"]
        
        from sklearn.ensemble import RandomForestClassifier
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        joblib.dump(model, "./models/failure_predictor.joblib")
        
        return {"success": True, "message": "Model trained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

# The following endpoints are placeholders and should be implemented properly
@app.post("/api/connector/setup", response_model=schemas.Connector)
def setup_connector(connector: schemas.ConnectorCreate, db: Session = Depends(get_db)):
    return crud.create_connector(db=db, connector=connector)

@app.get("/api/connector", response_model=List[schemas.Connector])
def list_connectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_connectors(db, skip=skip, limit=limit)

@app.get("/api/settings/alerts")
def get_alert_config():
    return {"message": "Not implemented"}

@app.post("/api/settings/alerts")
def save_alert_config(config: dict):
    return {"message": "Not implemented"}

@app.get("/api/analytics/comparative")
def get_comparative_analytics(metric: str, equipmentIds: Optional[str] = None):
    return {"message": "Not implemented"}

@app.get("/api/analytics/roi")
def get_maintenance_roi(period: str = "12months"):
    return {"message": "Not implemented"}

@app.get("/api/analytics/reliability")
def get_reliability_scores():
    return {"message": "Not implemented"}

@app.get("/api/analytics/feature-importance")
def get_feature_importance():
    return {"message": "Not implemented"}