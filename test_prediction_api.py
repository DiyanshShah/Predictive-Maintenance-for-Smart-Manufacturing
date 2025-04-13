import requests
import json
import random
from datetime import datetime

# API endpoint
API_URL = "http://localhost:8000/api/predict"

def test_prediction_api():
    """Test the prediction API with sample data"""
    print("Testing prediction API...")
    
    # Create sample data for different equipment IDs
    equipment_ids = ["PUMP001", "HVAC002", "MOTOR003", "TURBINE004", "COMPRESSOR005"]
    
    for equipment_id in equipment_ids:
        # Generate random sensor readings with some variance
        if equipment_id == "MOTOR003":  # Make one clearly in failure state
            temperature = random.uniform(85, 95)  # High temperature
            vibration = random.uniform(10, 15)    # High vibration
            pressure = random.uniform(70, 80)     # Low pressure
            oil_level = random.uniform(10, 20)    # Low oil
        else:
            temperature = random.uniform(35, 65)
            vibration = random.uniform(0.1, 5)
            pressure = random.uniform(90, 110)
            oil_level = random.uniform(75, 95)
        
        # Create the payload
        payload = {
            "timestamp": datetime.now().isoformat(),
            "equipment_id": equipment_id,
            "readings": {
                "temperature": temperature,
                "vibration": vibration,
                "pressure": pressure,
                "oil_level": oil_level
            }
        }
        
        print(f"\nSending prediction request for {equipment_id}:")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            # Send POST request to prediction API
            response = requests.post(API_URL, json=payload)
            
            # Check if request was successful
            if response.status_code == 200:
                result = response.json()
                print(f"Prediction result: {json.dumps(result, indent=2)}")
                
                # Check prediction details
                if result.get("maintenance_required", False):
                    print(f"⚠️ WARNING: Maintenance required for {equipment_id}!")
                    if "estimated_time_to_failure" in result:
                        print(f"Estimated time to failure: {result['estimated_time_to_failure']} days")
                else:
                    print(f"✅ {equipment_id} is operating normally")
            else:
                print(f"Error: Received status code {response.status_code}")
                print(f"Response: {response.text}")
        
        except Exception as e:
            print(f"Error: {str(e)}")
    
    print("\nPrediction API testing completed")

if __name__ == "__main__":
    test_prediction_api() 