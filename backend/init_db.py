import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from database import init_db, SessionLocal, Equipment, SensorReading, MaintenanceRecord
from generate_sample_data import generate_sample_data

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize the database and create tables"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully.")

def populate_sample_equipment(db: Session):
    """Populate database with sample equipment"""
    logger.info("Adding sample equipment...")
    
    equipment_list = [
        {
            "equipment_id": "MACHINE_001",
            "name": "Crusher",
            "type": "Processing Equipment",
            "description": "Primary mineral crusher",
            "location": "Building A, Floor 1",
            "installation_date": datetime(2020, 1, 15)
        },
        {
            "equipment_id": "MACHINE_002",
            "name": "Conveyor",
            "type": "Material Handling",
            "description": "Main conveyor belt",
            "location": "Building A, Floor 1-2",
            "installation_date": datetime(2020, 2, 20)
        },
        {
            "equipment_id": "MACHINE_003",
            "name": "Pump",
            "type": "Fluid Handling",
            "description": "Primary water pump",
            "location": "Building B, Floor 1",
            "installation_date": datetime(2020, 3, 10)
        },
        {
            "equipment_id": "MACHINE_004",
            "name": "Compressor",
            "type": "Air System",
            "description": "Main air compressor",
            "location": "Building B, Floor 2",
            "installation_date": datetime(2020, 4, 5)
        },
        {
            "equipment_id": "MACHINE_005",
            "name": "Motor",
            "type": "Power Equipment",
            "description": "Electric motor for main line",
            "location": "Building C, Floor 1",
            "installation_date": datetime(2020, 5, 12)
        }
    ]
    
    for equip_data in equipment_list:
        # Check if equipment already exists
        existing = db.query(Equipment).filter(Equipment.equipment_id == equip_data["equipment_id"]).first()
        if not existing:
            db_equipment = Equipment(**equip_data)
            db.add(db_equipment)
    
    db.commit()
    logger.info(f"Added {len(equipment_list)} equipment records.")

def populate_sample_maintenance(db: Session):
    """Populate database with sample maintenance records"""
    logger.info("Adding sample maintenance records...")
    
    # Get all equipment
    equipment_list = db.query(Equipment).all()
    
    if not equipment_list:
        logger.warning("No equipment found in database. Skipping maintenance records.")
        return
    
    # Add maintenance records for the past year
    maintenance_types = ["scheduled", "predictive", "emergency"]
    maintenance_descriptions = [
        "Regular maintenance and inspection",
        "Bearing replacement",
        "Oil change",
        "Belt replacement",
        "Filter cleaning",
        "Motor overhaul",
        "Calibration",
        "Lubrication",
        "Wiring repair",
        "Unexpected failure repair"
    ]
    technicians = ["John Smith", "Maria Rodriguez", "Ahmed Khan", "Lisa Chen", "David Brown"]
    
    # Generate 2-5 maintenance records for each equipment
    for equipment in equipment_list:
        num_records = np.random.randint(2, 6)
        
        for i in range(num_records):
            # Random date in the past year
            days_ago = np.random.randint(1, 365)
            maintenance_date = datetime.now() - timedelta(days=days_ago)
            
            # More likely to be scheduled than emergency
            maintenance_type = np.random.choice(
                maintenance_types, 
                p=[0.6, 0.3, 0.1]
            )
            
            # Cost depends on maintenance type
            if maintenance_type == "scheduled":
                cost = np.random.uniform(100, 500)
            elif maintenance_type == "predictive":
                cost = np.random.uniform(300, 1000)
            else:  # emergency
                cost = np.random.uniform(800, 3000)
            
            maintenance_record = MaintenanceRecord(
                equipment_id=equipment.equipment_id,
                maintenance_date=maintenance_date,
                maintenance_type=maintenance_type,
                description=np.random.choice(maintenance_descriptions),
                technician=np.random.choice(technicians),
                cost=cost
            )
            
            db.add(maintenance_record)
    
    db.commit()
    logger.info("Sample maintenance records added successfully.")

def populate_sample_readings(db: Session, num_samples=5000):
    """Populate database with sample sensor readings"""
    logger.info("Generating sample sensor readings...")
    
    # Generate sample data
    df = generate_sample_data(num_samples=num_samples)
    
    # Get list of equipment IDs from the database
    equipment_ids = [eq.equipment_id for eq in db.query(Equipment).all()]
    
    if not equipment_ids:
        logger.warning("No equipment found in database. Using default equipment IDs.")
        equipment_ids = [f"MACHINE_{i:03d}" for i in range(1, 6)]
    
    # Add sensor readings to database
    count = 0
    for _, row in df.iterrows():
        # Filter out non-sensor columns
        sensor_columns = ['temperature', 'vibration', 'pressure', 'rotation_speed', 
                          'voltage', 'current', 'oil_level', 'humidity', 'noise_level']
        
        sensor_data = {col: row[col] for col in sensor_columns if col in row}
        
        # Add sensor reading
        reading = SensorReading(
            equipment_id=row['equipment_id'],
            timestamp=datetime.strptime(row['timestamp'], '%Y-%m-%d %H:%M:%S'),
            anomaly_detected=bool(row.get('failure', 0)),
            anomaly_score=float(np.random.uniform(0, 1) if row.get('failure', 0) else np.random.uniform(0, 0.3)),
            **sensor_data
        )
        
        db.add(reading)
        count += 1
        
        # Commit in batches to avoid memory issues
        if count % 1000 == 0:
            db.commit()
            logger.info(f"Added {count} sensor readings...")
    
    # Final commit
    db.commit()
    logger.info(f"Added {count} sensor readings successfully.")

def main():
    """Initialize and populate the database with sample data"""
    try:
        # Initialize the database
        initialize_database()
        
        # Create a database session
        db = SessionLocal()
        
        try:
            # Populate sample data
            populate_sample_equipment(db)
            populate_sample_maintenance(db)
            populate_sample_readings(db)
            
            logger.info("Database populated successfully!")
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    main() 