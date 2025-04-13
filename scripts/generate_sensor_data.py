import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

# Ensure directories exist
os.makedirs('datasets', exist_ok=True)

# Function to generate synthetic sensor data with trends and anomalies
def generate_sensor_data(equipment_id, start_date, num_days=1000, 
                        temp_base=None, vibration_base=None, pressure_base=None, oil_base=None):
    
    # Set base values based on equipment type
    if temp_base is None:
        if 'HVAC' in equipment_id:
            temp_base = 25.0
        elif 'PUMP' in equipment_id:
            temp_base = 35.0
        elif 'TURBINE' in equipment_id:
            temp_base = 280.0
        elif 'MOTOR' in equipment_id:
            temp_base = 40.0
        elif 'EXCHANGER' in equipment_id:
            temp_base = 60.0
        elif 'COMPRESSOR' in equipment_id:
            temp_base = 55.0
        elif 'GENERATOR' in equipment_id:
            temp_base = 80.0
        elif 'BOILER' in equipment_id:
            temp_base = 170.0
        else:
            temp_base = 30.0
    
    if vibration_base is None:
        if 'TURBINE' in equipment_id:
            vibration_base = 2.0
        elif 'COMPRESSOR' in equipment_id:
            vibration_base = 1.8
        elif 'MOTOR' in equipment_id:
            vibration_base = 1.5
        else:
            vibration_base = 1.0
    
    if pressure_base is None:
        if 'TURBINE' in equipment_id:
            pressure_base = 1500.0
        elif 'BOILER' in equipment_id:
            pressure_base = 1200.0
        elif 'COMPRESSOR' in equipment_id:
            pressure_base = 800.0
        elif 'PUMP' in equipment_id:
            pressure_base = 400.0
        elif 'EXCHANGER' in equipment_id:
            pressure_base = 200.0
        else:
            pressure_base = 100.0
    
    if oil_base is None:
        if 'TURBINE' in equipment_id:
            oil_base = 45.0
        elif 'GENERATOR' in equipment_id:
            oil_base = 40.0
        elif 'COMPRESSOR' in equipment_id:
            oil_base = 8.0
        elif 'PUMP' in equipment_id or 'HVAC' in equipment_id:
            oil_base = 5.0
        elif 'MOTOR' in equipment_id:
            oil_base = 3.0
        else:
            oil_base = 0.0  # N/A for some equipment
    
    # Create date range
    dates = [start_date + timedelta(days=i) for i in range(num_days)]
    
    # Initialize data lists
    temperature = []
    vibration = []
    pressure = []
    oil_level = []
    
    # Add some trends and patterns
    seasonal_component = np.sin(np.linspace(0, 4*np.pi, num_days))  # 2 full seasonal cycles
    trend_component = np.linspace(0, 1, num_days)  # Slight upward trend
    
    # Random failure points (2-3 major anomalies)
    num_failures = random.randint(2, 3)
    failure_points = sorted(random.sample(range(100, num_days-50), num_failures))
    
    # Generate data
    for i in range(num_days):
        # Normal random fluctuation
        temp_noise = np.random.normal(0, 0.5)
        vibration_noise = np.random.normal(0, 0.05)
        pressure_noise = np.random.normal(0, pressure_base * 0.01)  # 1% of base
        oil_noise = np.random.normal(0, 0.1)
        
        # Seasonal effect (e.g., temperature variations)
        seasonal_effect = seasonal_component[i]
        
        # Aging effect (gradual deterioration)
        aging_effect = trend_component[i]
        
        # Check if near failure point to simulate pre-failure symptoms
        near_failure = False
        for fp in failure_points:
            if abs(i - fp) < 14 and i <= fp:  # Two weeks leading to failure
                near_failure = True
                failure_proximity = 1 - (abs(i - fp) / 14)  # 0 to 1 scale of how close to failure
                break
        
        # Calculate values
        if near_failure:
            # Increasing values as approaching failure
            temp = temp_base + temp_noise + seasonal_effect + (aging_effect * 2) + (failure_proximity * 10)
            vibration = vibration_base + vibration_noise + (aging_effect * 0.5) + (failure_proximity * 2)
            pressure = pressure_base + pressure_noise + (failure_proximity * pressure_base * 0.2)
            oil = max(0, oil_base + oil_noise - (failure_proximity * 2))  # Oil might decrease
        else:
            # Normal operation with seasonal variation and aging
            temp = temp_base + temp_noise + seasonal_effect + (aging_effect * 2)
            vibration = vibration_base + vibration_noise + (aging_effect * 0.5)
            pressure = pressure_base + pressure_noise + (aging_effect * pressure_base * 0.05)
            oil = max(0, oil_base + oil_noise - (aging_effect * 0.5))  # Gradual oil consumption
        
        # Append to lists
        temperature.append(round(temp, 2))
        vibration.append(round(vibration, 2))
        pressure.append(round(pressure, 2))
        oil_level.append(round(oil, 2))
    
    # Create DataFrame
    df = pd.DataFrame({
        'date': dates,
        'equipment_id': equipment_id,
        'temperature': temperature,
        'vibration': vibration,
        'pressure': pressure,
        'oil_level': oil_level
    })
    
    return df

# Define equipment IDs and start date
equipment_ids = [
    'HVAC001', 'HVAC002', 'PUMP003', 'TURBINE004', 'MOTOR005', 
    'EXCHANGER006', 'COMPRESSOR007', 'GENERATOR008', 'BOILER009', 'HVAC010',
    'PUMP011', 'TURBINE012', 'MOTOR013', 'EXCHANGER014', 'COMPRESSOR015',
    'GENERATOR016', 'BOILER017', 'HVAC018', 'PUMP019', 'TURBINE020'
]

start_date = datetime(2021, 1, 1)

# Generate and save data for each equipment
for equipment_id in equipment_ids:
    print(f"Generating data for {equipment_id}...")
    df = generate_sensor_data(equipment_id, start_date)
    
    # Format date as string for CSV
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')
    
    # Save to CSV
    file_path = f'datasets/{equipment_id}_readings.csv'
    df.to_csv(file_path, index=False)
    print(f"Data saved to {file_path}")

print("Data generation complete!") 