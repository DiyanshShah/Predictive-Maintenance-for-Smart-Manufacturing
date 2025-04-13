@echo off
echo ========================================================
echo     Predictive Maintenance System - Deployment Script
echo ========================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js first.
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python first.
    exit /b 1
)

echo [INFO] Starting deployment process...
echo.

echo [STEP 1] Building frontend application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed.
    exit /b 1
)
echo [SUCCESS] Frontend build completed successfully!
echo.

echo [STEP 2] Checking for Python virtual environment...
if not exist backend\venv (
    echo [INFO] Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

echo [STEP 3] Installing backend dependencies...
call backend\venv\Scripts\activate.bat
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies.
    exit /b 1
)
cd ..
echo [SUCCESS] Backend dependencies installed successfully!
echo.

echo [STEP 4] Preparing the database...
cd backend
python init_db.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database initialization failed.
    exit /b 1
)
cd ..
echo [SUCCESS] Database prepared successfully!
echo.

echo [STEP 5] Setting up production configuration...
echo Creating .env file for production settings...
echo FLASK_ENV=production > backend\.env
echo DATABASE_URI=sqlite:///predictive_maintenance.db >> backend\.env
echo MODEL_PATH=models/ >> backend\.env
echo LOG_LEVEL=INFO >> backend\.env
echo [SUCCESS] Production configuration created!
echo.

echo [STEP 6] Starting the servers...
echo.
echo Starting backend server...
start cmd /k "cd backend && call venv\Scripts\activate.bat && python main.py --port 8000"

echo Starting frontend server...
start cmd /k "npx serve -s build -l 3000"

echo.
echo ========================================================
echo Predictive Maintenance System is now running!
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
echo Press Ctrl+C in the server windows to stop the servers.
echo ========================================================

exit /b 0 