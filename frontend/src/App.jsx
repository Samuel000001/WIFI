import React, { useState, useEffect } from 'react';
import VitalCards from './components/VitalCards';
import SignalChart from './components/SignalChart';
import CalibrationPanel from './components/CalibrationPanel';
import RadarMap from './components/RadarMap';
import HardwareStatus from './components/HardwareStatus';
import './index.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    breathing_rate: 0,
    heart_rate: 0,
    presence_confidence: 0,
    is_moving: false,
    packet_rate: 0,
    raw_amplitudes: [],
    location: { x: 2.5, y: 2.5 },
    hardware: { connected: false, ip: '---', port: '---', node_id: 'Searching...' }
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/stream');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error("Failed to parse telemetry:", err);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">WiFi CSI Sensing</div>
        <div className="header-status">
          <span className={`status-badge ${connected ? 'status-connected' : 'status-disconnected'}`}>
            {connected ? 'WS CONNECTED' : 'WS DISCONNECTED'}
          </span>
        </div>
      </header>
      
      <main className="dashboard-layout">
        {/* Left column: Radar */}
        <div className="left-col">
          <RadarMap 
            location={telemetry.location} 
            isMoving={telemetry.is_moving} 
            presenceConfidence={telemetry.presence_confidence} 
          />
        </div>

        {/* Right column: Status cards stacked */}
        <div className="right-col">
          <VitalCards telemetry={telemetry} />
          <HardwareStatus hardware={telemetry.hardware} />
          <CalibrationPanel packetRate={telemetry.packet_rate} />
        </div>

        {/* Full-width bottom: Signal chart */}
        <div className="bottom-row">
          <SignalChart rawAmplitudes={telemetry.raw_amplitudes} />
        </div>
      </main>
    </div>
  );
}

export default App;
