#!/usr/bin/env python3
"""
PowerBrowser Startup Script
This script starts both the backend server and opens the browser.
"""

import os
import sys
import subprocess
import webbrowser
import time
import platform

def print_banner():
    banner = """
    ____                        ____                                  
   / __ \____  _      _____   / __ )_________ _      __________  _____
  / /_/ / __ \| | /| / / _ \ / __  / ___/ __ \ | /| / / ___/ _ \/ ___/
 / ____/ /_/ /| |/ |/ /  __// /_/ / /  / /_/ / |/ |/ (__  )  __/ /    
/_/    \____/ |__/|__/\___//_____/_/   \____/|__/|__/____/\___/_/     
                                                                      
    Güvenli, Hızlı ve Dinamik Tarayıcı
    """
    print(banner)
    print("Starting PowerBrowser...\n")

def is_port_in_use(port):
    """Check if a port is in use."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def start_backend():
    """Start the backend Flask server."""
    print("Starting backend server...")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(script_dir, 'backend')
    
    # Check if port 5000 is already in use
    if is_port_in_use(5000):
        print("Warning: Port 5000 is already in use. Backend may not start correctly.")
    
    # Start the backend server
    if platform.system() == 'Windows':
        backend_process = subprocess.Popen(
            ['python', 'server.py'],
            cwd=backend_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        backend_process = subprocess.Popen(
            ['python3', 'server.py'],
            cwd=backend_dir
        )
    
    # Wait for the server to start
    print("Waiting for backend server to start...")
    attempts = 0
    while not is_port_in_use(5000) and attempts < 10:
        time.sleep(1)
        attempts += 1
    
    if not is_port_in_use(5000):
        print("Error: Backend server did not start correctly.")
        sys.exit(1)
    
    print("Backend server started successfully!")
    return backend_process

def open_browser():
    """Open the browser to the PowerBrowser application."""
    print("Opening PowerBrowser in your web browser...")
    webbrowser.open('http://localhost:5000')

def main():
    print_banner()
    
    # Start the backend server
    backend_process = start_backend()
    
    # Wait a moment to ensure the server is fully started
    time.sleep(2)
    
    # Open the browser
    open_browser()
    
    print("\nPowerBrowser is now running!")
    print("Press Ctrl+C to stop the application.")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping PowerBrowser...")
        backend_process.terminate()
        print("PowerBrowser stopped. Goodbye!")

if __name__ == "__main__":
    main()
