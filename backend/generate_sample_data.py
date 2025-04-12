import pandas as pd
import numpy as np
import datetime
import os
import json
import random

def generate_sample_data(num_samples=5000, num_machines=10, failure_rate=0.05):
    """
    Generate sample data for predictive maintenance
    
    Args:
        num_samples: Number of data samples to generate
        num_machines: Number of different machines
        failure_rate: Rate of failures in the dataset
        
    Returns:
        DataFrame with sample data
    """
    # Set seed for reproducibility
    np.random.seed(42)
    
    # Create a list to store data
    data = []
    
    # Start date
    start_date = datetime.datetime(2023, 1, 1)
    
    # Machine IDs
    machine_ids = [f"MACHINE_{i:03d}" for i in range(1, num_machines + 1)]
    
    # Define normal operating ranges for different sensors
    sensor_ranges = {
        "temperature": (60, 80),  # Normal operating temperature range
        "vibration": (0.1, 0.8),  # Normal vibration range
        "pressure": (95, 105),    # Normal pressure range
        "rotation_speed": (1000, 1200),  # Normal rotation speed
        "voltage": (220, 240),    # Normal voltage
        "current": (5, 10),       # Normal current
        "oil_level": (80, 100),   # Normal oil level percentage
        "humidity": (30, 50),     # Normal humidity percentage
        "noise_level": (60, 70)   # Normal noise level in dB
    }
    
    # Define failure patterns
    # For each sensor, define how it behaves before failures
    failure_patterns = {
        "temperature": lambda days_to_failure: min(120, 80 + 40 * (1 - days_to_failure/30)) if days_to_failure < 30 else np.random.uniform(60, 80),
        "vibration": lambda days_to_failure: min(2.0, 0.8 + 1.2 * (1 - days_to_failure/20)) if days_to_failure < 20 else np.random.uniform(0.1, 0.8),
        "pressure": lambda days_to_failure: max(85, 95 - 10 * (1 - days_to_failure/15)) if days_to_failure < 15 else np.random.uniform(95, 105),
        "rotation_speed": lambda days_to_failure: max(800, 1000 - 200 * (1 - days_to_failure/25)) if days_to_failure < 25 else np.random.uniform(1000, 1200),
        "voltage": lambda days_to_failure: max(180, 220 - 40 * (1 - days_to_failure/10)) if days_to_failure < 10 else np.random.uniform(220, 240),
        "current": lambda days_to_failure: min(15, 10 + 5 * (1 - days_to_failure/20)) if days_to_failure < 20 else np.random.uniform(5, 10),
        "oil_level": lambda days_to_failure: max(50, 80 - 30 * (1 - days_to_failure/30)) if days_to_failure < 30 else np.random.uniform(80, 100),
        "humidity": lambda days_to_failure: min(70, 50 + 20 * (1 - days_to_failure/15)) if days_to_failure < 15 else np.random.uniform(30, 50),
        "noise_level": lambda days_to_failure: min(90, 70 + 20 * (1 - days_to_failure/25)) if days_to_failure < 25 else np.random.uniform(60, 70)
    }
    
    # Track when each machine will fail
    machine_failure_days = {machine_id: None for machine_id in machine_ids}
    
    # Generate data for each day
    for day in range(365):
        current_date = start_date + datetime.timedelta(days=day)
        
        # For each machine, generate data
        for machine_id in machine_ids:
            # Decide if this machine will have a failure
            if machine_failure_days[machine_id] is None and np.random.random() < failure_rate / 30:  # Chance per day
                # Set a future failure date (7-30 days in the future)
                days_to_failure = np.random.randint(7, 31)
                machine_failure_days[machine_id] = day + days_to_failure
            
            # Calculate days until failure
            days_to_failure = machine_failure_days[machine_id] - day if machine_failure_days[machine_id] is not None else None
            
            # Generate readings based on whether the machine is approaching failure
            readings = {}
            for sensor, (min_val, max_val) in sensor_ranges.items():
                if days_to_failure is not None and days_to_failure >= 0:
                    # Machine is approaching failure, use failure pattern
                    base_value = failure_patterns[sensor](days_to_failure)
                    # Add some noise
                    readings[sensor] = base_value * (1 + np.random.uniform(-0.05, 0.05))
                else:
                    # Normal operation with some random noise
                    readings[sensor] = np.random.uniform(min_val, max_val)
            
            # Determine if this is a failure day
            is_failure = days_to_failure == 0
            
            # Reset failure tracking if the machine failed today
            if is_failure:
                machine_failure_days[machine_id] = None
            
            # Add maintenance info
            maintenance_needed = days_to_failure is not None and days_to_failure <= 5
            
            # Create entry
            entry = {
                "timestamp": current_date.strftime("%Y-%m-%d %H:%M:%S"),
                "equipment_id": machine_id,
                "failure": 1 if is_failure else 0,
                "maintenance_needed": 1 if maintenance_needed else 0,
                **readings
            }
            
            data.append(entry)
            
            # Add more readings for the same day (every 4 hours)
            for hour in [4, 8, 12, 16, 20]:
                # Only add if we haven't reached num_samples yet
                if len(data) < num_samples:
                    timestamp = current_date + datetime.timedelta(hours=hour)
                    
                    # Add some variation to the readings
                    varied_readings = {
                        sensor: value * (1 + np.random.uniform(-0.03, 0.03))
                        for sensor, value in readings.items()
                    }
                    
                    entry = {
                        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "equipment_id": machine_id,
                        "failure": 1 if is_failure else 0,
                        "maintenance_needed": 1 if maintenance_needed else 0,
                        **varied_readings
                    }
                    
                    data.append(entry)
                
            # Stop if we've reached the required number of samples
            if len(data) >= num_samples:
                break
        
        # Stop if we've reached the required number of samples
        if len(data) >= num_samples:
            break
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    return df

def save_sample_data(df, csv_path="data/sample_data.csv", json_path="data/sample_data.json"):
    """Save sample data to CSV and JSON files"""
    # Create directories if they don't exist
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    # Save as CSV
    df.to_csv(csv_path, index=False)
    
    # Save as JSON
    with open(json_path, 'w') as f:
        # Convert to list of records
        records = df.to_dict(orient="records")
        json.dump(records, f, indent=2)

def generate_sample_api_data(machine_id="MACHINE_001"):
    """Generate a sample API request data"""
    # Current timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Generate random readings
    readings = {
        "temperature": random.uniform(60, 90),
        "vibration": random.uniform(0.1, 1.0),
        "pressure": random.uniform(90, 105),
        "rotation_speed": random.uniform(950, 1200),
        "voltage": random.uniform(210, 240),
        "current": random.uniform(5, 12),
        "oil_level": random.uniform(70, 100),
        "humidity": random.uniform(30, 60),
        "noise_level": random.uniform(60, 80)
    }
    
    # Create data dictionary
    data = {
        "timestamp": timestamp,
        "equipment_id": machine_id,
        "readings": readings
    }
    
    return data

if __name__ == "__main__":
    # Generate sample data
    print("Generating sample data...")
    df = generate_sample_data()
    
    # Create a data directory
    os.makedirs("data", exist_ok=True)
    
    # Save the data
    save_sample_data(df)
    
    print(f"Generated {len(df)} samples of data")
    print("Sample data saved to data/sample_data.csv and data/sample_data.json")
    
    # Print a sample API request
    sample_api_data = generate_sample_api_data()
    print("\nSample API request data:")
    print(json.dumps(sample_api_data, indent=2)) 