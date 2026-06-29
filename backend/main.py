import asyncio
import json
import logging
import os
import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from csi_processor import CSIProcessor
import numpy as np
import time
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_MODE = "--demo" in sys.argv or os.environ.get("DEMO", "0") == "1"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = CSIProcessor()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

class CSIDataState:
    def __init__(self):
        self.last_packet_time = 0.0
        self.client_ip = "---"
        self.client_port = "---"
        self.packet_count = 0
        self.last_packet_count = 0
        self.current_packet_rate = 0
        self.last_result = None
        self.last_raw = np.zeros(10).tolist()
        self.sim_t = 0.0

state = CSIDataState()

class UDPServerProtocol(asyncio.DatagramProtocol):
    def connection_made(self, transport):
        self.transport = transport
        logger.info("UDP Server listening on 0.0.0.0:8765")

    def datagram_received(self, data, addr):
        state.last_packet_time = time.time()
        state.client_ip = addr[0]
        state.client_port = addr[1]
        state.packet_count += 1

        try:
            raw_array = np.frombuffer(data, dtype=np.int8)
            if len(raw_array) >= 64:
                parsed_data = raw_array[:64].astype(np.float64)
                state.last_raw = parsed_data[:10].tolist()
                result = processor.process(parsed_data)
                if result:
                    state.last_result = result
        except Exception:
            pass

@app.on_event("startup")
async def startup_event():
    if DEMO_MODE:
        logger.info("*** DEMO MODE ACTIVE — generating synthetic CSI data ***")
        asyncio.create_task(demo_simulator())
    else:
        loop = asyncio.get_running_loop()
        await loop.create_datagram_endpoint(
            lambda: UDPServerProtocol(),
            local_addr=('0.0.0.0', 8765)
        )
        logger.info("Live mode: waiting for ESP32 UDP packets on port 8765")
    asyncio.create_task(telemetry_loop())

async def demo_simulator():
    """Generates synthetic CSI packets locally to demo the full UI."""
    t = 0.0
    while True:
        base_noise = np.random.normal(0, 0.5, 64)
        breathing = np.sin(2 * np.pi * 0.25 * t) * 5
        heartbeat = np.sin(2 * np.pi * 1.2 * t) * 0.5
        mock_data = base_noise + breathing + heartbeat

        # Simulate bursts of motion every 20s for 5s
        if int(t) % 20 < 5:
            mock_data += np.random.normal(0, 5.0, 64)

        state.last_packet_time = time.time()
        state.client_ip = "127.0.0.1"
        state.client_port = 9999
        state.packet_count += 1
        state.last_raw = mock_data[:10].tolist()
        result = processor.process(mock_data)
        if result:
            state.last_result = result

        t += 1.0 / 30.0
        await asyncio.sleep(1.0 / 30.0)

async def telemetry_loop():
    logger.info("Telemetry loop started")
    while True:
        current_time = time.time()
        connected = (current_time - state.last_packet_time) < 2.0

        state.current_packet_rate = (state.packet_count - state.last_packet_count) * 10
        state.last_packet_count = state.packet_count
        state.sim_t += 0.1

        if connected and state.last_result:
            # Simulate person walking a smooth path in the room
            x_pos = 2.5 + math.sin(state.sim_t * 0.08) * 1.8 + np.random.normal(0, 0.03)
            y_pos = 2.5 + math.cos(state.sim_t * 0.12) * 1.8 + np.random.normal(0, 0.03)

            payload = {
                "raw_amplitudes": state.last_raw,
                "breathing_wave": state.last_result["breathing_wave"],
                "breathing_rate": state.last_result["breathing_rate"],
                "heart_rate": state.last_result["heart_rate"],
                "presence_confidence": state.last_result["presence_confidence"],
                "is_moving": state.last_result["is_moving"],
                "packet_rate": state.current_packet_rate,
                "location": {"x": float(x_pos), "y": float(y_pos)},
                "hardware": {
                    "connected": True,
                    "ip": state.client_ip,
                    "port": int(state.client_port) if isinstance(state.client_port, (int, float)) else state.client_port,
                    "node_id": "ESP32-S3-CSI-01" if not DEMO_MODE else "DEMO-SIM-NODE"
                }
            }
        else:
            payload = {
                "raw_amplitudes": np.zeros(10).tolist(),
                "breathing_wave": 0,
                "breathing_rate": 0,
                "heart_rate": 0,
                "presence_confidence": 0,
                "is_moving": False,
                "packet_rate": 0,
                "location": {"x": 2.5, "y": 2.5},
                "hardware": {
                    "connected": False,
                    "ip": "---",
                    "port": "---",
                    "node_id": "Searching..."
                }
            }

        await manager.broadcast(json.dumps(payload))
        await asyncio.sleep(0.1)

@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
