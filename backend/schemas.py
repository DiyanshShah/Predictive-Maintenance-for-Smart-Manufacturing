from pydantic import BaseModel
from typing import List, Optional, Dict, Union
from datetime import datetime

class UserBase(BaseModel):
    email: str
    firstName: str
    lastName: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class EquipmentBase(BaseModel):
    equipment_id: str
    name: str
    status: str
    location: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    installation_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int

    class Config:
        orm_mode = True

class MaintenanceSchedule(BaseModel):
    equipment_id: str
    scheduled_date: str
    maintenance_type: str
    description: str

class MaintenanceRecordBase(BaseModel):
    date: datetime
    type: str
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    technician: Optional[str] = None
    duration_hours: Optional[float] = None
    cost: Optional[float] = None
    status: str

class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass

class MaintenanceRecord(MaintenanceRecordBase):
    id: int
    equipment_id: str

    class Config:
        orm_mode = True

class SensorReadingBase(BaseModel):
    timestamp: datetime
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    pressure: Optional[float] = None
    oil_level: Optional[float] = None

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReading(SensorReadingBase):
    id: int
    equipment_id: str

    class Config:
        orm_mode = True

class PredictionRequest(BaseModel):
    equipment_id: str
    readings: Dict[str, float]

class PredictionResultBase(BaseModel):
    equipment_id: str
    failure_probability: float
    remaining_useful_life_days: int
    recommended_action: str
    confidence: float

class PredictionResultCreate(PredictionResultBase):
    pass

class PredictionResult(PredictionResultBase):
    id: int
    prediction_date: datetime

    class Config:
        orm_mode = True

class ConnectorConfig(BaseModel):
    equipment_id: str
    name: str
    type: str
    config: Dict[str, Union[str, int, bool]]

class ConnectorBase(BaseModel):
    equipment_id: str
    name: str
    type: str
    status: str
    config: str # JSON string

class ConnectorCreate(ConnectorBase):
    pass

class Connector(ConnectorBase):
    id: int
    last_data_received: Optional[datetime] = None

    class Config:
        orm_mode = True
