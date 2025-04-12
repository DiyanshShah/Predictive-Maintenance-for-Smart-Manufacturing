#!/usr/bin/env python
"""
Startup script for the Predictive Maintenance application.
This will start both the frontend and backend servers.
"""

import os
import sys
import subprocess
import time
import webbrowser
import platform

def is_venv():
    """Check if running in a virtual environment"""
    return (hasattr(sys, 'real_prefix') or
            (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix))

def start_backend():
    """Start the FastAPI backend server"""
    print("Starting backend server...")
    
    # Check if we're in a virtual environment
    if not is_venv():
        print("Warning: Not running in a virtual environment. It's recommended to use a virtual environment.")
    
    # Navigate to backend directory
    os.chdir('backend')
    
    # Check if requirements are installed
    try:
        import fastapi
        import uvicorn
    except ImportError:
        print("Installing backend dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Start the backend server
    # Use subprocess.Popen to run in the background
    if platform.system() == 'Windows':
        backend_process = subprocess.Popen(["start", "cmd", "/c", "uvicorn", "main:app", "--reload"], shell=True)
    else:
        backend_process = subprocess.Popen(["uvicorn", "main:app", "--reload"])
    
    # Return to the root directory
    os.chdir('..')
    
    return backend_process

def start_frontend():
    """Start the React frontend development server"""
    print("Starting frontend server...")
    
    # Check if node_modules exists
    if not os.path.exists('node_modules'):
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"])
    
    # Start the frontend server
    # Use subprocess.Popen to run in the background
    if platform.system() == 'Windows':
        frontend_process = subprocess.Popen(["start", "cmd", "/c", "npm", "run", "dev"], shell=True)
    else:
        frontend_process = subprocess.Popen(["npm", "run", "dev"])
    
    return frontend_process

def open_browser():
    """Open the browser to the application URL"""
    print("Opening application in web browser...")
    time.sleep(3)  # Wait for servers to start
    webbrowser.open('http://localhost:5173')

def main():
    """Main function to start the application"""
    print("Starting Predictive Maintenance Application...")
    
    try:
        # Start the backend
        backend_process = start_backend()
        
        # Start the frontend
        frontend_process = start_frontend()
        
        # Open browser
        open_browser()
        
        print("\nServers are running!")
        print("Frontend: http://localhost:5173")
        print("Backend: http://localhost:8000")
        print("\nPress Ctrl+C to stop the servers...")
        
        # Keep the script running
        while True:
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\nStopping servers...")
        # The processes will be terminated when the script exits
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 