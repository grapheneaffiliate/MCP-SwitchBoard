import uvicorn
import sys
import os

# Add the current directory to the path so Python can find the backend modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("Starting MCP Switchboard Backend...")
    # Run the main.py file directly from the backend directory
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
