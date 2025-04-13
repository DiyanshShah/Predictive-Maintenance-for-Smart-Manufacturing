import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Create data directory if it doesn't exist
os.makedirs("./data", exist_ok=True)

# Settings
num_machines = 5
days_of_data = 180  # 6 months
readings_per_day = 24  # hourly readings
total_rows = num_machines * days_of_data * readings_per_day

# Initialize dataframe
data = []

# Generate data
start_date = datetime.now() - timedelta(days=days_of_data)

for machine_id in range(1, num_machines + 1):
    # Define normal operating parameters for this machine
    normal_temp = random.uniform(65, 75)
    normal_vibration = random.uniform(2.0, 3.5)
    normal_pressure = random.uniform(95, 105)
    normal_oil_level = random.uniform(90, 100)
    
    # Simulate degradation patterns
    # Every machine will have 2-3 failure events
    failure_points = sorted(random.sample(range(10, days_of_data - 10), random.randint(2, 3)))
    
    current_date = start_date
    for day in range(days_of_data):
        # Check if we're approaching a failure
        days_to_nearest_failure = min([abs(day - fp) for fp in failure_points])
        
        # Calculate degradation factor - increases as we approach failure
        degradation = 0
        is_failure = False
        
        if days_to_nearest_failure < 10:
            # We're within 10 days of a failure point
            for fp in failure_points:
                if day == fp:
                    # This is a failure day
                    degradation = random.uniform(0.7, 1.0)
                    is_failure = True
                    break
                elif abs(day - fp) < 10:
                    # Getting close to failure
                    degradation = max(degradation, (10 - abs(day - fp)) / 10 * random.uniform(0.4, 0.8))
        
        # Generate readings for each hour of the day
        for hour in range(readings_per_day):
            current_datetime = current_date + timedelta(hours=hour)
            
            # Add random noise to readings
            noise_factor = random.uniform(0.9, 1.1)
            
            # Generate sensor readings with degradation and noise
            temperature = normal_temp * (1 + degradation * 0.5) * noise_factor
            vibration = normal_vibration * (1 + degradation * 1.5) * noise_factor
            pressure = normal_pressure * (1 + degradation * 0.3) * noise_factor if random.random() > 0.5 else normal_pressure * (1 - degradation * 0.3) * noise_factor
            oil_level = normal_oil_level * (1 - degradation * 0.4) * noise_factor
            
            # Record the data
            data.append({
                "timestamp": current_datetime.isoformat(),
                "equipment_id": f"EQ{machine_id:03d}",
                "temperature": round(temperature, 2),
                "vibration": round(vibration, 2),
                "pressure": round(pressure, 2),
                "oil_level": round(oil_level, 2),
                "is_failure": 1 if is_failure else 0
            })
        
        current_date += timedelta(days=1)

# Convert to DataFrame
df = pd.DataFrame(data)

# Save as CSV
df.to_csv("./data/predictive_maintenance_dataset.csv", index=False)

print(f"Generated {len(df)} rows of predictive maintenance data")
print(f"Failure events: {df['is_failure'].sum()}")
print(f"Data saved to ./data/predictive_maintenance_dataset.csv")

# Get some stats
print("\nDataset Statistics:")
print(df.describe())

# Create a smaller sample for quick testing
sample = df.sample(n=min(5000, len(df)))
sample.to_csv("./data/sample_dataset.csv", index=False)
print(f"\nSample dataset with {len(sample)} rows saved to ./data/sample_dataset.csv") 