from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

# Create database engine
# Use SQLite for development, can be replaced with PostgreSQL, MySQL, etc. for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./predictive_maintenance.db")
engine = create_engine(DATABASE_URL)

# Create declarative base
Base = declarative_base()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define models
class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    installation_date = Column(DateTime, nullable=True)
    
    # Relationships
    sensor_readings = relationship("SensorReading", back_populates="equipment")
    maintenance_records = relationship("MaintenanceRecord", back_populates="equipment")
    
class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Sensor values
    temperature = Column(Float, nullable=True)
    vibration = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    rotation_speed = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    oil_level = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    noise_level = Column(Float, nullable=True)
    
    # Additional fields
    anomaly_detected = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="sensor_readings")
    
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"))
    maintenance_date = Column(DateTime)
    maintenance_type = Column(String)  # scheduled, predictive, emergency
    description = Column(Text, nullable=True)
    technician = Column(String, nullable=True)
    cost = Column(Float, nullable=True)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_records")
    
class PredictionResult(Base):
    __tablename__ = "prediction_results"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, index=True)
    prediction_date = Column(DateTime, default=datetime.utcnow)
    prediction = Column(String)
    probability = Column(Float)
    anomaly_detected = Column(Boolean)
    maintenance_required = Column(Boolean)
    next_maintenance_date = Column(DateTime, nullable=True)
    estimated_time_to_failure = Column(Integer, nullable=True)  # in days

# Database utility functions
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize the database (create tables)"""
    Base.metadata.create_all(bind=engine)

def get_equipment(db, equipment_id=None):
    """Get equipment list or specific equipment"""
    if equipment_id:
        return db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    return db.query(Equipment).all()

def get_sensor_readings(db, equipment_id, limit=100, start_date=None, end_date=None):
    """Get sensor readings for equipment"""
    query = db.query(SensorReading).filter(SensorReading.equipment_id == equipment_id)
    
    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)
    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)
    
    return query.order_by(SensorReading.timestamp.desc()).limit(limit).all()

def save_sensor_reading(db, reading_data):
    """Save sensor reading to database"""
    db_reading = SensorReading(**reading_data)
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def save_prediction_result(db, prediction_data):
    """Save prediction result to database"""
    db_prediction = PredictionResult(**prediction_data)
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction 