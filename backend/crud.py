from sqlalchemy.orm import Session
from . import database, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: int):
    return db.query(database.User).filter(database.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(database.User).filter(database.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(database.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = database.User(email=user.email, password_hash=hashed_password, firstName=user.firstName, lastName=user.lastName, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_equipment(db: Session, skip: int = 0, limit: int = 100):
    return db.query(database.Equipment).offset(skip).limit(limit).all()

def get_equipment_by_id(db: Session, equipment_id: str):
    return db.query(database.Equipment).filter(database.Equipment.equipment_id == equipment_id).first()

def create_equipment(db: Session, equipment: schemas.EquipmentCreate):
    db_equipment = database.Equipment(**equipment.dict())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

def get_maintenance_history(db: Session, equipment_id: str, skip: int = 0, limit: int = 100):
    return db.query(database.MaintenanceRecord).filter(database.MaintenanceRecord.equipment_id == equipment_id).offset(skip).limit(limit).all()

def create_maintenance_record(db: Session, maintenance: schemas.MaintenanceSchedule, equipment_id: str):
    db_maintenance = database.MaintenanceRecord(**maintenance.dict(), equipment_id=equipment_id)
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

def get_sensor_readings(db: Session, equipment_id: str, skip: int = 0, limit: int = 100):
    return db.query(database.SensorReading).filter(database.SensorReading.equipment_id == equipment_id).offset(skip).limit(limit).all()

def create_sensor_reading(db: Session, reading: schemas.SensorReadingCreate, equipment_id: str):
    db_reading = database.SensorReading(**reading.dict(), equipment_id=equipment_id)
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def create_prediction(db: Session, prediction: schemas.PredictionResultCreate):
    db_prediction = database.PredictionResult(**prediction.dict())
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction

def get_connectors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(database.Connector).offset(skip).limit(limit).all()

def create_connector(db: Session, connector: schemas.ConnectorConfig):
    db_connector = database.Connector(**connector.dict())
    db.add(db_connector)
    db.commit()
    db.refresh(db_connector)
    return db_connector
