import React from 'react';

const HardwareStatus = ({ hardware }) => {
  if (!hardware) return null;
  const { connected, ip, port, node_id } = hardware;

  return (
    <div className="glass-panel">
      <div className="card-title">Hardware Node Status</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8892b0' }}>ESP Node ID:</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 'bold' }}>{node_id}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8892b0' }}>Connection State:</span>
          <span style={{ 
            color: connected ? 'var(--neon-teal)' : 'var(--crimson-pulse)', 
            fontWeight: 'bold' 
          }}>
            {connected ? 'ACTIVE' : 'DISCONNECTED'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8892b0' }}>IP Address:</span>
          <span style={{ color: 'var(--text-bright)' }}>{ip}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8892b0' }}>UDP Port:</span>
          <span style={{ color: 'var(--text-bright)' }}>{port}</span>
        </div>
      </div>
    </div>
  );
};

export default HardwareStatus;
