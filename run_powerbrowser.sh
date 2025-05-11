#!/bin/bash

# PowerBrowser Startup Script
# This script installs required dependencies and starts the PowerBrowser application

echo "
    ____                        ____                                  
   / __ \____  _      _____   / __ )_________ _      __________  _____
  / /_/ / __ \| | /| / / _ \ / __  / ___/ __ \ | /| / / ___/ _ \/ ___/
 / ____/ /_/ /| |/ |/ /  __// /_/ / /  / /_/ / |/ |/ (__  )  __/ /    
/_/    \____/ |__/|__/\___//_____/_/   \____/|__/|__/____/\___/_/     
                                                                      
    Secure, Fast and Dynamic Browser - Version 1.0.2
"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found. Please install Python 3."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 not found. Please install pip3."
    exit 1
fi

# Install dependencies if not already installed
echo "Checking required dependencies..."
pip3 install -r requirements.txt

# Check if port 5000 is in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Warning: Port 5000 is already in use. Backend may not start properly."
fi

# Start the backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR/backend"
python3 server.py &
BACKEND_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 2

# Open the browser
echo "Opening PowerBrowser in your web browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:5000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start http://localhost:5000
else
    echo "Browser could not be opened automatically. Please visit http://localhost:5000."
fi

echo ""
echo "PowerBrowser is running!"
echo "Press Ctrl+C to stop the application."

# Handle Ctrl+C to stop the server
trap "kill $BACKEND_PID; echo 'PowerBrowser stopped. Goodbye!'; exit" INT

# Keep the script running
wait $BACKEND_PID
