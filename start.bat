@echo off
echo Starting Predictive Maintenance System...

REM Create separate command windows
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python sample_data.py && cd app && uvicorn main:app --reload --port 8000"

REM Wait for backend to initialize
timeout /t 5

REM Start frontend
start cmd /k "npm install && npm run start"

echo Both services started. The application will open in your browser shortly.
echo Backend API docs available at: http://localhost:8000/docs
echo Frontend application available at: http://localhost:3000

REM Keep this window open
pause 