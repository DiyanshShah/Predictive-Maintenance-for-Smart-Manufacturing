# Predictive Maintenance for Smart Manufacturing

A machine learning application designed to analyze equipment sensor data in real-time to predict potential failures before they occur. It uses anomaly detection and predictive forecasting to minimize downtime and improve factory efficiency.

## Features

- **Anomaly detection in sensor data**: Identify unusual patterns that may indicate equipment issues
- **Predictive failure algorithms**: Forecast potential failures before they happen
- **Real-time monitoring dashboard**: Visualize equipment status and sensor data
- **Maintenance scheduling integration**: Plan maintenance based on predictions
- **Data visualization and trend analysis**: Understand patterns and make informed decisions

## Tech Stack

- **Frontend**: React, Material-UI, Recharts for data visualization
- **Backend**: Python 3.11, FastAPI
- **Machine Learning**: scikit-learn, TensorFlow/Keras, pandas, numpy
- **Data Visualization**: matplotlib, seaborn, plotly

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.11
- npm or yarn

### Installation

#### Frontend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd predictive-maintenance
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   uvicorn main:app --reload
   ```

5. Generate sample data (optional):
   ```
   python generate_sample_data.py
   ```

## API Endpoints

- `GET /`: API status
- `POST /predict`: Run prediction on sensor data
- `POST /upload-historical-data`: Upload historical data for training
- `GET /equipment/{equipment_id}/history`: Get equipment history

## Usage

1. Open the application in your browser at `http://localhost:5173/`
2. Select a machine to monitor
3. Use the controls to run predictions or schedule maintenance
4. View sensor data and anomaly detection in real-time

## Project Structure

```
predictive-maintenance/
├── backend/               # Python backend
│   ├── models/            # ML models
│   │   ├── anomaly_detection.py
│   │   ├── prediction.py
│   │   └── data_processor.py
│   ├── data/              # Sample data
│   ├── main.py            # FastAPI application
│   └── requirements.txt   # Python dependencies
└── src/                   # React frontend
    ├── assets/            # Static assets
    ├── components/        # React components
    ├── services/          # API services
    ├── App.jsx            # Main application component
    └── main.jsx           # Entry point
```

## License

[MIT License](LICENSE)

## Acknowledgments

- This project is for educational purposes
- Sample data is artificially generated and doesn't represent real-world equipment
