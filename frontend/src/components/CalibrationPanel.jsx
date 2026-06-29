import React, { useState } from 'react';

const CalibrationPanel = ({ packetRate }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startCalibration = () => {
    setCalibrating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setCalibrating(false);
          return 100;
        }
        return p + (100 / (15 * 10)); // 15 seconds, 10 ticks per second
      });
    }, 100);
  };

  return (
    <div className="glass-panel">
      <div className="card-title">System Tuning</div>
      
      <div style={{marginBottom: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
          <span style={{fontSize: '14px', color: '#8892b0'}}>Incoming Packet Rate</span>
          <span style={{fontSize: '14px', color: 'var(--text-bright)', fontWeight: 'bold'}}>{packetRate} Hz</span>
        </div>
        <div style={{width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px'}}>
          <div style={{width: `${Math.min(packetRate / 50 * 100, 100)}%`, height: '100%', background: 'var(--neon-teal)', borderRadius: '3px'}}></div>
        </div>
      </div>
      
      <button 
        className="calibration-btn" 
        onClick={startCalibration}
        disabled={calibrating}
        style={{opacity: calibrating ? 0.5 : 1, cursor: calibrating ? 'not-allowed' : 'pointer'}}
      >
        {calibrating ? `Calibrating... ${Math.round(progress)}%` : 'Calibrate Room Baseline'}
      </button>
      
      <p style={{fontSize: '12px', color: '#8892b0', marginTop: '15px', lineHeight: '1.4'}}>
        Ensures accurate presence detection and vitals monitoring. Please ensure the room is completely empty before calibrating.
      </p>
    </div>
  );
};

export default CalibrationPanel;
