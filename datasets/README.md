# Predictive Maintenance Datasets

This folder contains sample datasets for the predictive maintenance application.

## Directory Structure

- `equipment_readings/`: Contains time-series sensor data for different equipment
- `maintenance_history/`: Records of past and scheduled maintenance activities
- `failure_events/`: Historical failure events with details on type, cause, and impact
- `equipment_metadata/`: Equipment specifications and threshold values

## Dataset Descriptions

### Equipment Readings
These files contain time-series sensor data collected from various pieces of equipment. Each file corresponds to a specific equipment identified by its ID.

**Format:** CSV with columns:
- `timestamp`: Date and time of the reading
- `equipment_id`: Unique identifier for the equipment
- `temperature`: Temperature reading in Celsius
- `vibration`: Vibration reading in mm/s
- `pressure`: Pressure reading in PSI
- `oil_level`: Oil level as percentage
- `anomaly_detected`: Boolean flag indicating if an anomaly was detected
- `anomaly_score`: Numeric score representing the anomaly severity (0-1)

### Maintenance History
This dataset contains records of maintenance activities, both completed and scheduled.

**Format:** CSV with columns:
- `id`: Unique identifier for the maintenance record
- `equipment_id`: Equipment that was serviced
- `maintenance_date`: Date when maintenance was performed or scheduled
- `completion_date`: Date when maintenance was completed (empty for scheduled)
- `maintenance_type`: Type of maintenance (preventive, corrective, predictive)
- `description`: Description of the maintenance activity
- `technician`: Person who performed the maintenance
- `status`: Status of the maintenance (completed, scheduled)
- `cost`: Cost of the maintenance in dollars
- `findings`: Notes about what was found during maintenance
- `priority`: Importance level (low, medium, high)

### Failure Events
This dataset contains historical failure events for analysis.

**Format:** CSV with columns:
- `failure_id`: Unique identifier for the failure event
- `equipment_id`: Equipment that failed
- `failure_date`: Date when the failure occurred
- `failure_type`: Category of failure (mechanical, electrical, etc.)
- `component`: Specific component that failed
- `downtime_hours`: Hours of operation lost due to failure
- `repair_cost`: Cost to repair in dollars
- `root_cause`: Identified root cause of the failure
- `detection_method`: How the failure was detected
- `severity`: Impact severity (low, medium, high, critical)

### Equipment Metadata
This dataset contains specifications for all equipment.

**Format:** CSV with columns:
- `equipment_id`: Unique identifier for the equipment
- `name`: Descriptive name of the equipment
- `type`: Category of equipment
- `model`: Model number
- `manufacturer`: Company that built the equipment
- `installation_date`: Date when equipment was installed
- `location`: Physical location of the equipment
- `operational_hours`: Total hours of operation
- `power`: Power rating
- `weight`: Weight of the equipment
- `dimensions`: Physical dimensions
- `temperature_threshold`: Maximum safe temperature
- `vibration_threshold`: Maximum safe vibration level
- `pressure_threshold`: Maximum safe pressure
- `oil_level_threshold`: Minimum safe oil level

## How to Use

These datasets can be used for:

1. Training machine learning models for failure prediction
2. Testing anomaly detection algorithms
3. Developing maintenance scheduling optimization
4. Visualizing equipment performance over time
5. Analyzing the relationship between sensor readings and failures

To load a dataset in Python:

```python
import pandas as pd

# Load equipment readings
readings = pd.read_csv('equipment_readings/PUMP001_readings.csv')

# Load maintenance history
maintenance = pd.read_csv('maintenance_history/maintenance_records.csv')

# Load equipment specifications
equipment = pd.read_csv('equipment_metadata/equipment_specifications.csv')
``` 