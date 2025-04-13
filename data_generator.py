import pandas as pd
import numpy as np
import os
import datetime
import random
from datetime import timedelta

# Create datasets directory if it doesn't exist
if not os.path.exists('datasets'):
    os.makedirs('datasets')

# Define equipment IDs for various equipment types
equipment_ids = [
    # HVAC units
    'HVAC001', 'HVAC002', 'HVAC010', 'HVAC018',
    # Pumps
    'PUMP003', 'PUMP011', 'PUMP019',
    # Turbines
    'TURBINE004', 'TURBINE012', 'TURBINE020',
    # Motors
    'MOTOR005', 'MOTOR013',
    # Heat Exchangers
    'EXCHANGER006', 'EXCHANGER014',
    # Compressors
    'COMPRESSOR007', 'COMPRESSOR015',
    # Generators
    'GENERATOR008', 'GENERATOR016',
    # Boilers
    'BOILER009', 'BOILER017'
]

# Define parameter ranges for different equipment types
parameter_ranges = {
    'HVAC': {
        'temperature': (15, 35),
        'pressure': (80, 120),
        'vibration': (0.1, 4.0),
        'current': (8, 22),
        'voltage': (220, 240),
        'humidity': (35, 65)
    },
    'PUMP': {
        'temperature': (20, 75),
        'pressure': (200, 600),
        'vibration': (0.2, 6.0),
        'flow': (10, 40),
        'current': (10, 40),
        'voltage': (400, 420)
    },
    'TURBINE': {
        'temperature': (150, 500),
        'pressure': (1000, 3000),
        'vibration': (0.5, 10.0),
        'flow': (200, 450),
        'speed': (3000, 3100),
        'oil_pressure': (200, 450),
        'oil_temperature': (50, 75)
    },
    'MOTOR': {
        'temperature': (40, 100),
        'vibration': (0.2, 5.0),
        'current': (20, 80),
        'voltage': (400, 420),
        'speed': (1450, 1470),
        'power_factor': (0.85, 0.95)
    },
    'EXCHANGER': {
        'temperature_hot_in': (100, 220),
        'temperature_hot_out': (50, 130),
        'temperature_cold_in': (10, 20),
        'temperature_cold_out': (30, 70),
        'pressure_hot': (300, 500),
        'pressure_cold': (200, 400),
        'flow_hot': (30, 80),
        'flow_cold': (30, 80)
    },
    'COMPRESSOR': {
        'temperature': (50, 130),
        'pressure_inlet': (95, 105),
        'pressure_outlet': (700, 900),
        'vibration': (0.3, 8.0),
        'flow': (30, 80),
        'current': (40, 120),
        'voltage': (400, 420),
        'oil_pressure': (200, 450),
        'oil_temperature': (50, 75)
    },
    'GENERATOR': {
        'temperature': (50, 100),
        'voltage': (400, 420),
        'current': (100, 400),
        'frequency': (49.8, 50.2),
        'power_factor': (0.85, 0.95),
        'vibration': (0.2, 5.0),
        'bearing_temperature': (50, 75)
    },
    'BOILER': {
        'temperature': (150, 220),
        'pressure': (500, 1400),
        'water_level': (50, 70),
        'flue_gas_temperature': (140, 200),
        'feed_water_temperature': (70, 95),
        'steam_flow': (10, 40),
        'oxygen_content': (3, 6)
    }
}

# Generate timestamps for daily readings starting from Jan 1, 2021
start_date = datetime.datetime(2021, 1, 1)
num_days = 1000  # Generate 1000 days worth of data
timestamps = [start_date + timedelta(days=i) for i in range(num_days)]

# Define failure points for different equipment to simulate anomalies
# Format: {equipment_id: [(start_day, end_day, parameter_affected, severity), ...]}
failure_points = {
    'HVAC001': [(150, 180, 'temperature', 1.2), (500, 530, 'current', 1.3)],
    'HVAC002': [(300, 330, 'vibration', 1.5), (800, 830, 'pressure', 0.8)],
    'HVAC010': [(400, 430, 'current', 1.3), (700, 730, 'temperature', 1.2)],
    'HVAC018': [(200, 230, 'temperature', 1.3), (600, 630, 'vibration', 1.4)],
    
    'PUMP003': [(180, 210, 'vibration', 1.6), (520, 550, 'pressure', 1.3)],
    'PUMP011': [(250, 280, 'temperature', 1.4), (750, 780, 'flow', 0.7)],
    'PUMP019': [(350, 380, 'current', 1.3), (650, 680, 'vibration', 1.5)],
    
    'TURBINE004': [(120, 150, 'vibration', 1.7), (480, 510, 'temperature', 1.3)],
    'TURBINE012': [(280, 310, 'oil_pressure', 0.7), (680, 710, 'speed', 1.1)],
    'TURBINE020': [(380, 410, 'temperature', 1.2), (780, 810, 'vibration', 1.6)],
    
    'MOTOR005': [(220, 250, 'temperature', 1.5), (580, 610, 'current', 1.4)],
    'MOTOR013': [(320, 350, 'vibration', 1.6), (720, 750, 'temperature', 1.3)],
    
    'EXCHANGER006': [(160, 190, 'temperature_hot_out', 0.8), (540, 570, 'flow_hot', 0.7)],
    'EXCHANGER014': [(260, 290, 'pressure_hot', 1.3), (640, 670, 'temperature_cold_out', 1.2)],
    
    'COMPRESSOR007': [(130, 160, 'pressure_outlet', 0.8), (490, 520, 'vibration', 1.6)],
    'COMPRESSOR015': [(230, 260, 'temperature', 1.3), (590, 620, 'oil_pressure', 0.8)],
    
    'GENERATOR008': [(190, 220, 'vibration', 1.5), (550, 580, 'frequency', 1.05)],
    'GENERATOR016': [(290, 320, 'current', 1.3), (690, 720, 'bearing_temperature', 1.4)],
    
    'BOILER009': [(170, 200, 'pressure', 1.3), (560, 590, 'temperature', 1.2)],
    'BOILER017': [(270, 300, 'water_level', 0.8), (670, 700, 'flue_gas_temperature', 1.3)]
}

# Function to generate equipment readings with patterns
def generate_equipment_readings(equipment_id, timestamps, equipment_failure_points):
    equipment_type = equipment_id[:equipment_id.find('0')]
    parameters = parameter_ranges[equipment_type]
    
    # Initialize DataFrame with timestamps
    df = pd.DataFrame({'timestamp': timestamps})
    
    for param_name, (min_value, max_value) in parameters.items():
        # Base pattern with some randomness
        base_values = np.random.normal(
            (min_value + max_value) / 2,  # mean
            (max_value - min_value) / 6,   # std dev
            len(timestamps)
        )
        
        # Add seasonal pattern for temperature-related parameters
        if 'temperature' in param_name:
            seasonal_amplitude = (max_value - min_value) * 0.15
            day_of_year = np.array([ts.timetuple().tm_yday for ts in timestamps])
            seasonal_component = seasonal_amplitude * np.sin(2 * np.pi * day_of_year / 365)
            base_values += seasonal_component
        
        # Add slight upward trend over time (aging effect)
        trend_factor = np.linspace(0, (max_value - min_value) * 0.05, len(timestamps))
        base_values += trend_factor
        
        # Apply failure points effects
        for start_day, end_day, affected_param, severity in equipment_failure_points:
            if param_name == affected_param:
                for i in range(start_day, min(end_day, len(base_values))):
                    # Gradually increase/decrease parameter during failure period
                    progress = (i - start_day) / (end_day - start_day)
                    effect = (severity - 1) * np.sin(np.pi * progress)
                    
                    # Apply effect based on severity (>1 means increase, <1 means decrease)
                    if severity > 1:
                        base_values[i] *= (1 + effect)
                    else:
                        base_values[i] *= (1 - (1 - severity) * effect)
        
        # Add daily variation
        daily_variation = np.random.normal(0, (max_value - min_value) * 0.03, len(timestamps))
        base_values += daily_variation
        
        # Ensure values are within specified range
        base_values = np.clip(base_values, min_value, max_value)
        
        # Add to DataFrame
        df[param_name] = base_values
    
    return df

# Generate and save readings for each equipment
for equipment_id in equipment_ids:
    print(f"Generating readings for {equipment_id}...")
    equipment_failure_points = failure_points.get(equipment_id, [])
    readings = generate_equipment_readings(equipment_id, timestamps, equipment_failure_points)
    
    # Format timestamps as strings for CSV
    readings['timestamp'] = readings['timestamp'].dt.strftime('%Y-%m-%d')
    
    # Save to CSV
    output_file = f"datasets/{equipment_id.lower()}_readings.csv"
    readings.to_csv(output_file, index=False)
    print(f"  Saved to {output_file}")

print("\nAll equipment reading datasets generated!") 