import pandas as pd
import numpy as np
import random
import os
import csv
from datetime import datetime, timedelta

# Make sure datasets directory exists
if not os.path.exists('datasets'):
    os.makedirs('datasets')

# Load machine inventory to get equipment IDs and types
machine_inventory = pd.read_csv('datasets/machine_inventory.csv')
equipment_ids = machine_inventory['equipment_id'].tolist()
equipment_types = set(machine_inventory['equipment_type'].tolist())

# Create a mapping of equipment_id to equipment_type
equipment_type_map = dict(zip(machine_inventory['equipment_id'], machine_inventory['equipment_type']))

# Define data periods
period_current = "2022-07-01 to 2022-12-31"
period_previous = "2022-01-01 to 2022-06-30"
period_year_ago = "2021-07-01 to 2021-12-31"

# Helper function to generate realistic comparative data
def generate_comparative_data(base_value, trend='improvement', variance=0.15):
    """
    Generate comparative data with a trend
    trend can be 'improvement', 'decline', or 'stable'
    """
    if trend == 'improvement':
        previous = base_value * (1 + random.uniform(0.05, variance))
        year_ago = base_value * (1 + random.uniform(0.1, variance * 2))
    elif trend == 'decline':
        previous = base_value * (1 - random.uniform(0.05, variance))
        year_ago = base_value * (1 - random.uniform(0.1, variance * 2))
    else:  # stable
        previous = base_value * (1 + random.uniform(-variance/2, variance/2))
        year_ago = base_value * (1 + random.uniform(-variance, variance))
    
    return base_value, previous, year_ago

# Helper function to calculate percent change
def percent_change(current, previous):
    if previous == 0:
        return 0
    return ((current - previous) / previous) * 100

# Create efficiency data
def generate_efficiency_data():
    efficiency_data = []
    
    # Equipment specific trends
    equipment_trends = {}
    for eq_id in equipment_ids:
        # Assign trends randomly but with some logic based on equipment types
        if "TURBINE" in eq_id:
            # Turbines tend to have stable or slight improvement in efficiency
            equipment_trends[eq_id] = random.choice(['improvement', 'stable', 'stable'])
        elif "HVAC" in eq_id:
            # HVAC might show seasonal variations or decline
            equipment_trends[eq_id] = random.choice(['decline', 'stable', 'improvement'])
        elif "PUMP" in eq_id:
            # Pumps might decline slowly
            equipment_trends[eq_id] = random.choice(['decline', 'decline', 'stable'])
        else:
            equipment_trends[eq_id] = random.choice(['improvement', 'decline', 'stable'])
    
    for eq_id in equipment_ids:
        # Base efficiency varies by equipment type (0-100%)
        if "TURBINE" in eq_id:
            base_efficiency = random.uniform(75, 88)
        elif "BOILER" in eq_id:
            base_efficiency = random.uniform(70, 85)
        elif "COMPRESSOR" in eq_id:
            base_efficiency = random.uniform(65, 80)
        elif "PUMP" in eq_id:
            base_efficiency = random.uniform(60, 85)
        else:
            base_efficiency = random.uniform(55, 80)
        
        # Generate current, previous, and year ago values
        current, previous, year_ago = generate_comparative_data(
            base_efficiency, 
            trend=equipment_trends[eq_id],
            variance=0.1
        )
        
        # Calculate percent changes
        change_vs_previous = percent_change(current, previous)
        change_vs_year_ago = percent_change(current, year_ago)
        
        efficiency_data.append({
            'equipment_id': eq_id,
            'equipment_type': equipment_type_map[eq_id],
            'metric': 'Efficiency',
            'unit': '%',
            'current_value': round(current, 2),
            'previous_value': round(previous, 2),
            'year_ago_value': round(year_ago, 2),
            'change_vs_previous': round(change_vs_previous, 2),
            'change_vs_year_ago': round(change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
    
    return efficiency_data

# Create energy consumption data
def generate_energy_data():
    energy_data = []
    
    # Equipment specific trends
    equipment_trends = {}
    for eq_id in equipment_ids:
        if "TURBINE" in eq_id or "GENERATOR" in eq_id:
            # Power generating equipment often has stable or improving energy metrics
            equipment_trends[eq_id] = random.choice(['improvement', 'stable'])
        elif "HVAC" in eq_id:
            # HVAC might have increasing energy consumption with age
            equipment_trends[eq_id] = random.choice(['decline', 'decline', 'stable'])
        else:
            equipment_trends[eq_id] = random.choice(['improvement', 'decline', 'stable'])
    
    for eq_id in equipment_ids:
        # Base energy consumption varies by equipment type (kWh)
        if "HVAC" in eq_id:
            base_energy = random.uniform(1000, 5000)
        elif "PUMP" in eq_id:
            base_energy = random.uniform(500, 2000)
        elif "TURBINE" in eq_id:
            # For turbines, this could represent auxiliary power
            base_energy = random.uniform(10000, 50000)
        elif "COMPRESSOR" in eq_id:
            base_energy = random.uniform(2000, 8000)
        elif "BOILER" in eq_id:
            base_energy = random.uniform(5000, 15000)
        else:
            base_energy = random.uniform(1000, 10000)
        
        # For energy, improvement means lower consumption, so we reverse the trend
        trend = 'improvement' if equipment_trends[eq_id] == 'decline' else (
            'decline' if equipment_trends[eq_id] == 'improvement' else 'stable')
            
        # Generate current, previous, and year ago values
        current, previous, year_ago = generate_comparative_data(
            base_energy, 
            trend=trend,
            variance=0.2
        )
        
        # Calculate percent changes - note that for energy, lower is better
        change_vs_previous = percent_change(previous, current)  # reversed
        change_vs_year_ago = percent_change(year_ago, current)  # reversed
        
        energy_data.append({
            'equipment_id': eq_id,
            'equipment_type': equipment_type_map[eq_id],
            'metric': 'Energy Consumption',
            'unit': 'kWh',
            'current_value': round(current, 2),
            'previous_value': round(previous, 2),
            'year_ago_value': round(year_ago, 2),
            'change_vs_previous': round(change_vs_previous, 2),
            'change_vs_year_ago': round(change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
    
    return energy_data

# Create maintenance cost data
def generate_maintenance_cost_data():
    maintenance_data = []
    
    # Load failure history to correlate maintenance costs with failures
    try:
        failure_history = pd.read_csv('datasets/failure_history.csv')
        # Ensure correct date format
        failure_history['failure_date'] = pd.to_datetime(failure_history['failure_date'], format='%Y-%m-%d')
        has_failures = True
    except Exception as e:
        print(f"Warning: Could not load failure history: {str(e)}")
        has_failures = False
    
    # Equipment specific trends
    equipment_trends = {}
    failure_equipment = set()
    
    if has_failures:
        # Identify equipment with recent failures - they'll have higher costs
        recent_failures = failure_history[
            pd.to_datetime(failure_history['failure_date']) > 
            pd.to_datetime('2022-01-01')
        ]
        failure_equipment = set(recent_failures['equipment_id'].tolist())
    
    for eq_id in equipment_ids:
        if eq_id in failure_equipment:
            # Equipment with failures will have increasing maintenance costs
            equipment_trends[eq_id] = 'decline'
        else:
            # Others have more random patterns
            age_factor = 2023 - int(machine_inventory[machine_inventory['equipment_id'] == eq_id]['installation_date'].values[0][:4])
            if age_factor > 3:
                # Older equipment tends to need more maintenance
                equipment_trends[eq_id] = random.choice(['decline', 'decline', 'stable'])
            else:
                equipment_trends[eq_id] = random.choice(['improvement', 'stable', 'stable'])
    
    for eq_id in equipment_ids:
        # Base maintenance cost varies by equipment type and criticality
        criticality = machine_inventory[machine_inventory['equipment_id'] == eq_id]['criticality'].values[0]
        
        if "TURBINE" in eq_id:
            base_cost = random.uniform(8000, 25000)
        elif "BOILER" in eq_id:
            base_cost = random.uniform(5000, 15000)
        elif "COMPRESSOR" in eq_id or "GENERATOR" in eq_id:
            base_cost = random.uniform(3000, 10000)
        elif criticality == "Critical":
            base_cost = random.uniform(4000, 12000)
        elif criticality == "High":
            base_cost = random.uniform(2000, 8000)
        else:
            base_cost = random.uniform(1000, 5000)
        
        # For maintenance cost, improvement means lower cost
        trend = 'improvement' if equipment_trends[eq_id] == 'improvement' else (
            'decline' if equipment_trends[eq_id] == 'decline' else 'stable')
            
        # Generate current, previous, and year ago values
        current, previous, year_ago = generate_comparative_data(
            base_cost, 
            trend=trend,
            variance=0.25  # Maintenance costs can vary significantly
        )
        
        # Calculate percent changes - for costs, lower is better
        change_vs_previous = -percent_change(current, previous)
        change_vs_year_ago = -percent_change(current, year_ago)
        
        maintenance_data.append({
            'equipment_id': eq_id,
            'equipment_type': equipment_type_map[eq_id],
            'metric': 'Maintenance Cost',
            'unit': 'USD',
            'current_value': round(current, 2),
            'previous_value': round(previous, 2),
            'year_ago_value': round(year_ago, 2),
            'change_vs_previous': round(change_vs_previous, 2),
            'change_vs_year_ago': round(change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
    
    return maintenance_data

# Create downtime data
def generate_downtime_data():
    downtime_data = []
    
    # Load failure history to correlate downtime with failures
    try:
        failure_history = pd.read_csv('datasets/failure_history.csv')
        # Ensure correct date format
        failure_history['failure_date'] = pd.to_datetime(failure_history['failure_date'], format='%Y-%m-%d')
        has_failures = True
    except Exception as e:
        print(f"Warning: Could not load failure history: {str(e)}")
        has_failures = False
    
    # Equipment specific trends
    equipment_trends = {}
    failure_equipment = set()
    
    if has_failures:
        # Identify equipment with recent failures - they'll have higher downtime
        recent_failures = failure_history[
            pd.to_datetime(failure_history['failure_date']) > 
            pd.to_datetime('2022-01-01')
        ]
        failure_equipment = set(recent_failures['equipment_id'].tolist())
    
    for eq_id in equipment_ids:
        if eq_id in failure_equipment:
            # Equipment with failures will have increased downtime
            equipment_trends[eq_id] = 'decline'
        else:
            criticality = machine_inventory[machine_inventory['equipment_id'] == eq_id]['criticality'].values[0]
            if criticality == "Critical":
                # Critical equipment usually gets more attention, so better downtime stats
                equipment_trends[eq_id] = random.choice(['improvement', 'improvement', 'stable'])
            else:
                equipment_trends[eq_id] = random.choice(['improvement', 'stable', 'decline'])
    
    for eq_id in equipment_ids:
        # Base downtime hours varies by equipment type and criticality
        criticality = machine_inventory[machine_inventory['equipment_id'] == eq_id]['criticality'].values[0]
        
        if criticality == "Critical":
            base_downtime = random.uniform(5, 20)
        elif criticality == "High":
            base_downtime = random.uniform(10, 40)
        elif "TURBINE" in eq_id or "GENERATOR" in eq_id:
            base_downtime = random.uniform(15, 60)
        else:
            base_downtime = random.uniform(8, 30)
        
        # For downtime, improvement means less downtime
        trend = 'improvement' if equipment_trends[eq_id] == 'improvement' else (
            'decline' if equipment_trends[eq_id] == 'decline' else 'stable')
            
        # Generate current, previous, and year ago values
        current, previous, year_ago = generate_comparative_data(
            base_downtime, 
            trend=trend,
            variance=0.3  # Downtime can vary significantly
        )
        
        # Calculate percent changes - for downtime, lower is better
        change_vs_previous = -percent_change(current, previous)
        change_vs_year_ago = -percent_change(current, year_ago)
        
        downtime_data.append({
            'equipment_id': eq_id,
            'equipment_type': equipment_type_map[eq_id],
            'metric': 'Downtime',
            'unit': 'Hours',
            'current_value': round(current, 2),
            'previous_value': round(previous, 2),
            'year_ago_value': round(year_ago, 2),
            'change_vs_previous': round(change_vs_previous, 2),
            'change_vs_year_ago': round(change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
    
    return downtime_data

# Generate ROI data for predictive maintenance vs. reactive maintenance
def generate_roi_data():
    roi_data = []
    
    for eq_id in equipment_ids:
        # Get equipment details
        eq_details = machine_inventory[machine_inventory['equipment_id'] == eq_id].iloc[0]
        eq_type = eq_details['equipment_type']
        criticality = eq_details['criticality']
        purchase_cost = eq_details['purchase_cost']
        
        # Base values for calculations
        # Reactive maintenance assumptions
        if criticality == "Critical":
            reactive_downtime = random.uniform(80, 150)
            reactive_parts = purchase_cost * random.uniform(0.05, 0.12)
            reactive_labor = reactive_downtime * random.uniform(80, 120)
        elif criticality == "High":
            reactive_downtime = random.uniform(40, 100)
            reactive_parts = purchase_cost * random.uniform(0.03, 0.08)
            reactive_labor = reactive_downtime * random.uniform(70, 100)
        else:
            reactive_downtime = random.uniform(20, 60)
            reactive_parts = purchase_cost * random.uniform(0.02, 0.05)
            reactive_labor = reactive_downtime * random.uniform(60, 90)
            
        # Lost production due to reactive maintenance
        if eq_type in ["Steam Turbine", "Gas Turbine", "Wind Turbine", "Diesel Generator", "Natural Gas Generator"]:
            # Power generation equipment has high production value
            production_value_per_hour = random.uniform(500, 2000)
        elif criticality == "Critical":
            production_value_per_hour = random.uniform(300, 800)
        elif criticality == "High":
            production_value_per_hour = random.uniform(150, 400)
        else:
            production_value_per_hour = random.uniform(50, 200)
            
        lost_production_reactive = reactive_downtime * production_value_per_hour
            
        # Predictive maintenance assumptions - generally better than reactive
        predictive_monitoring_cost = purchase_cost * random.uniform(0.005, 0.02)
        predictive_downtime = reactive_downtime * random.uniform(0.2, 0.5)  # 20-50% of reactive
        predictive_parts = reactive_parts * random.uniform(0.5, 0.8)  # 50-80% of reactive
        predictive_labor = predictive_downtime * random.uniform(80, 120)  # Similar rates but less time
        lost_production_predictive = predictive_downtime * production_value_per_hour
        
        # Calculate costs
        total_reactive_cost = reactive_parts + reactive_labor + lost_production_reactive
        total_predictive_cost = predictive_monitoring_cost + predictive_parts + predictive_labor + lost_production_predictive
        
        # Calculate savings and ROI
        savings = total_reactive_cost - total_predictive_cost
        roi_percent = (savings / predictive_monitoring_cost) * 100
        payback_months = (predictive_monitoring_cost / savings) * 12
        
        # Small random variation for current/previous periods
        current_roi = roi_percent
        previous_roi = roi_percent * random.uniform(0.85, 1.05)
        year_ago_roi = roi_percent * random.uniform(0.7, 0.95)  # Generally improving over time
        
        # Calculate changes
        change_vs_previous = percent_change(current_roi, previous_roi)
        change_vs_year_ago = percent_change(current_roi, year_ago_roi)
        
        roi_data.append({
            'equipment_id': eq_id,
            'equipment_type': eq_type,
            'metric': 'Predictive Maintenance ROI',
            'unit': '%',
            'current_value': round(current_roi, 2),
            'previous_value': round(previous_roi, 2),
            'year_ago_value': round(year_ago_roi, 2),
            'change_vs_previous': round(change_vs_previous, 2),
            'change_vs_year_ago': round(change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago,
            'annual_savings': round(savings, 2),
            'payback_months': round(payback_months, 2) 
        })
    
    return roi_data

# Generate reliability metrics
def generate_reliability_data():
    reliability_data = []
    
    for eq_id in equipment_ids:
        # Get equipment details
        eq_details = machine_inventory[machine_inventory['equipment_id'] == eq_id].iloc[0]
        eq_type = eq_details['equipment_type']
        criticality = eq_details['criticality']
        installation_year = int(eq_details['installation_date'][:4])
        age_years = 2023 - installation_year
        
        # Base MTBF (Mean Time Between Failures) in hours
        # Newer and less critical equipment generally has higher MTBF
        if age_years < 2:
            base_mtbf_factor = random.uniform(0.9, 1.2)
        elif age_years < 5:
            base_mtbf_factor = random.uniform(0.7, 1.0)
        else:
            base_mtbf_factor = random.uniform(0.5, 0.8)
            
        if criticality == "Critical":
            base_mtbf = 8760 * base_mtbf_factor  # 1 year * factor
        elif criticality == "High":
            base_mtbf = 6570 * base_mtbf_factor  # 9 months * factor
        else:
            base_mtbf = 4380 * base_mtbf_factor  # 6 months * factor
            
        # MTTR (Mean Time To Repair) in hours
        if criticality == "Critical":
            base_mttr = random.uniform(4, 12)
        elif criticality == "High":
            base_mttr = random.uniform(6, 24)
        else:
            base_mttr = random.uniform(12, 48)
            
        # Calculate availability: MTBF / (MTBF + MTTR)
        availability = (base_mtbf / (base_mtbf + base_mttr)) * 100
        
        # Small variations for time periods
        improvement_factor = random.uniform(0.98, 1.02)
        
        current_mtbf = base_mtbf
        previous_mtbf = base_mtbf / improvement_factor
        year_ago_mtbf = previous_mtbf / improvement_factor
        
        current_mttr = base_mttr
        previous_mttr = base_mttr * improvement_factor
        year_ago_mttr = previous_mttr * improvement_factor
        
        current_availability = (current_mtbf / (current_mtbf + current_mttr)) * 100
        previous_availability = (previous_mtbf / (previous_mtbf + previous_mttr)) * 100
        year_ago_availability = (year_ago_mtbf / (year_ago_mtbf + year_ago_mttr)) * 100
        
        # MTBF data
        mtbf_change_vs_previous = percent_change(current_mtbf, previous_mtbf)
        mtbf_change_vs_year_ago = percent_change(current_mtbf, year_ago_mtbf)
        
        reliability_data.append({
            'equipment_id': eq_id,
            'equipment_type': eq_type,
            'metric': 'MTBF',
            'unit': 'Hours',
            'current_value': round(current_mtbf, 2),
            'previous_value': round(previous_mtbf, 2),
            'year_ago_value': round(year_ago_mtbf, 2),
            'change_vs_previous': round(mtbf_change_vs_previous, 2),
            'change_vs_year_ago': round(mtbf_change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
        
        # MTTR data
        mttr_change_vs_previous = -percent_change(current_mttr, previous_mttr)  # Lower is better
        mttr_change_vs_year_ago = -percent_change(current_mttr, year_ago_mttr)
        
        reliability_data.append({
            'equipment_id': eq_id,
            'equipment_type': eq_type,
            'metric': 'MTTR',
            'unit': 'Hours',
            'current_value': round(current_mttr, 2),
            'previous_value': round(previous_mttr, 2),
            'year_ago_value': round(year_ago_mttr, 2),
            'change_vs_previous': round(mttr_change_vs_previous, 2),
            'change_vs_year_ago': round(mttr_change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
        
        # Availability data
        availability_change_vs_previous = percent_change(current_availability, previous_availability)
        availability_change_vs_year_ago = percent_change(current_availability, year_ago_availability)
        
        reliability_data.append({
            'equipment_id': eq_id,
            'equipment_type': eq_type,
            'metric': 'Availability',
            'unit': '%',
            'current_value': round(current_availability, 2),
            'previous_value': round(previous_availability, 2),
            'year_ago_value': round(year_ago_availability, 2),
            'change_vs_previous': round(availability_change_vs_previous, 2),
            'change_vs_year_ago': round(availability_change_vs_year_ago, 2),
            'current_period': period_current,
            'previous_period': period_previous,
            'year_ago_period': period_year_ago
        })
    
    return reliability_data

# Generate all data and write to CSV files
def generate_all_data():
    # Combine all data
    print("Generating efficiency data...")
    efficiency_data = generate_efficiency_data()
    
    print("Generating energy consumption data...")
    energy_data = generate_energy_data()
    
    print("Generating maintenance cost data...")
    maintenance_data = generate_maintenance_cost_data()
    
    print("Generating downtime data...")
    downtime_data = generate_downtime_data()
    
    print("Generating ROI data...")
    roi_data = generate_roi_data()
    
    print("Generating reliability metrics...")
    reliability_data = generate_reliability_data()
    
    # Combine all comparative analytics data
    all_comparative_data = efficiency_data + energy_data + maintenance_data + downtime_data + reliability_data
    
    # Save to CSV
    with open('datasets/comparative_analytics.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=efficiency_data[0].keys())
        writer.writeheader()
        writer.writerows(all_comparative_data)
    
    # Save ROI data separately as it has additional fields
    with open('datasets/predictive_maintenance_roi.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=roi_data[0].keys())
        writer.writeheader()
        writer.writerows(roi_data)
    
    print(f"Generated {len(all_comparative_data)} rows of comparative analytics data")
    print(f"Generated {len(roi_data)} rows of ROI data")

if __name__ == "__main__":
    generate_all_data()
    print("All analytics data generated successfully!") 