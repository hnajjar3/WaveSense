import asyncio
from fastapi import FastAPI, Response, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json
import numpy as np
import logging
import websockets
from periodogram import estimate_psd
from collections import deque
from pydantic import BaseModel
import time  # Import to use time-based checks
import requests

# Define a Pydantic model for the request body
class Channel(BaseModel):
    channel: int

# Define the Pydantic model for the settings
class FuncGenSettings(BaseModel):
    frequency: int  # Update to match client side
    samplingRate: int
    noise: float
    bias: float

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Path to the build directory
build_path = Path(__file__).resolve().parent.parent.parent / "build"
config_path = build_path / "config.json"  # Path to the config.json file

# Global variables for config
config = {}
data_queue = deque()  # Queue to store WebSocket messages

# Load configuration from config.json
def load_config():
    global config
    try:
        with open(config_path, 'r') as file:
            config = json.load(file)
            logger.info(f"Config loaded successfully: {config}")
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        config = {
            "server": {
                "host": "localhost",
                "port": 8080
            },
            "samplingRate": 1000,
            "subsampling": 1,
            "channel": 0,
            "noise": 0.1,
            "bias": 0.0,
            "maxPoints": 100,
            "yZoomLevel": 1,
            "yRange": 1.5
        }

# Initialize FastAPI app
app = FastAPI()

# Load configuration on startup
@app.on_event("startup")
async def startup_event():
    load_config()
    asyncio.create_task(websocket_consumer())  # Run the WebSocket consumer in the background

# Test API
@app.get("/test")
async def test_route():
    return {"message": "Test route works!"}

# Update function generator settings
@app.post("/func-gen-ctl")
async def update_func_gen_settings(settings: FuncGenSettings):
    try:
        # Send request to Node.js to update the function generator settings
        node_server_url = "http://localhost/update-func-gen"
        payload = {
            "frequency": settings.frequency,
            "samplingRate": settings.samplingRate,
            "noise": settings.noise,
            "bias": settings.bias
        }
        node_response = requests.post(node_server_url, json=payload)
        node_response.raise_for_status()  # Raise an error for bad status codes
        logger.info(f"Node.js response: {node_response.json()}")
        return {"status": "success", "settings": settings}
    except Exception as e:
        logger.error(f"Failed to update Func Gen settings on Node.js: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update Func Gen settings on Node.js: {e}")

# RESTful API for setting a channel
@app.post("/channels/")
async def set_channel(channel_data: Channel):
    # Validate channel value
    if channel_data.channel < 0 or channel_data.channel > 3:
        raise HTTPException(status_code=400, detail="Invalid channel")

    # Send request to Node.js to update the channel
    try:
        node_server_url = "http://localhost/set-channel"
        payload = {"channel": channel_data.channel}
        node_response = requests.post(node_server_url, json=payload)
        node_response.raise_for_status()  # Raise an error for bad status codes
        logger.info(f"Node.js response: {node_response.json()}")
        return {"status": "success", "channel": channel_data.channel}
    except Exception as e:
        logger.error(f"Failed to switch channel on Node.js: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to switch channel on Node.js: {e}")

# Serve Spectrum plot with an optional sampling rate
@app.get("/periodogram")
async def plot_periodogram(samplingRate: int = None):
    try:
        logger.info("/periodogram endpoint called.")

        # Extract data from the queue for processing
        time_data = []
        signal_data = []
        while len(data_queue) > 0:
            data_point = data_queue.popleft()
            time_data.append(data_point["n"])
            signal_data.append(data_point["signal"])

        if len(signal_data) == 0:
            return {"error": "No data available"}

        # If sampling rate is provided in the request, override the config
        final_sampling_rate = samplingRate if samplingRate else config["samplingRate"]

        # Estimate PSD and get the plot as a PNG
        logger.info(f'Computing Periodogram using sample size {len(signal_data)} and sampling rate {final_sampling_rate}')
        buf = estimate_psd(np.array(time_data), np.array(signal_data), final_sampling_rate)

        logger.info("Periodogram successfully generated")
        return Response(content=buf.getvalue(), media_type="image/png")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return {"error": str(e)}  # Log the error

# Serve the entire static directory (including images, CSS, JS)
app.mount("/static", StaticFiles(directory=build_path / "static"), name="static")

# Serve React static files automatically (index.html, config.json, etc.)
app.mount("/", StaticFiles(directory=build_path, html=True), name="react_app")

# Serve React's index.html for any route not found by FastAPI (catch-all)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(build_path / "index.html")

# WebSocket connection handling function
MINIMUM_POINTS = 5000  # Number of points to accumulate
MAX_QUEUE_SIZE = 50000  # Limit the size of the queue to prevent excessive memory use

async def websocket_consumer():
    try:
        uri = f"ws://{config['server']['host']}:{config['server']['port']}"
        async with websockets.connect(uri) as websocket:
            logger.info(f"Connected to WebSocket at {uri}")

            while True:
                message = await websocket.recv()
                data = json.loads(message)
                data_queue.append(data)

                # Maintain the maximum queue size
                if len(data_queue) > MAX_QUEUE_SIZE:
                    data_queue.popleft()  # Remove old data to make room for new data

    except Exception as e:
        logger.error(f"Error in WebSocket consumer: {e}")
