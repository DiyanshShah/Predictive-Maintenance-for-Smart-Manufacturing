from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

# Create database engine
# Use SQLite for development, can be replaced with PostgreSQL, MySQL, etc. for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./predictive_maintenance.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} # Needed for SQLite
)

# Create declarative base
Base = declarative_base()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize the database (create tables)"""
    Base.metadata.create_all(bind=engine)

# Define models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    firstName = Column(String)
    lastName = Column(String)
    role = Column(String)

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, unique=True, index=True)
    name = Column(String)
    status = Column(String)
    installation_date = Column(DateTime, nullable=True)
    last_maintenance_date = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)
    model = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    
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
    oil_level = Column(Float, nullable=True)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="sensor_readings")
    
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"))
    date = Column(DateTime)
    type = Column(String)  # scheduled, predictive, emergency
    description = Column(Text, nullable=True)
    parts_replaced = Column(String, nullable=True) # Storing as comma-separated string
    technician = Column(String, nullable=True)
    duration_hours = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    status = Column(String) # scheduled, in-progress, completed
    
    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_records")
    
class PredictionResult(Base):
    __tablename__ = "prediction_results"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, index=True)
    prediction_date = Column(DateTime, default=datetime.utcnow)
    failure_probability = Column(Float)
    remaining_useful_life_days = Column(Integer)
    recommended_action = Column(String)
    confidence = Column(Float)

class Connector(Base):
    __tablename__ = "connectors"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"))
    name = Column(String)
    type = Column(String)
    status = Column(String)
    last_data_received = Column(DateTime, nullable=True)
    config = Column(Text) # Storing config as JSON string