import React from 'react';

const SpatialMap = ({ location }) => {
  if (!location) return null;
  const { x, y } = location;

  // Assuming room is 5x5 meters.
  // x, y range around 1.0 to 4.0 based on our mock data.
  // We'll map 0-5 to 0-100%
  const leftPercent = Math.min(Math.max((x / 5.0) * 100, 0), 100);
  const topPercent = Math.min(Math.max((y / 5.0) * 100, 0), 100);

  return (
    <div className="glass-panel">
      <div className="card-title">Spatial Tracking</div>
      <div style={{
        position: 'relative', 
        width: '100%', 
        aspectRatio: '1', 
        border: '2px solid rgba(0, 242, 254, 0.3)', 
        borderRadius: '8px', 
        background: 'rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Grid lines */}
        <div style={{position: 'absolute', width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)'}}>
          {Array(25).fill(0).map((_, i) => (
             <div key={i} style={{border: '1px solid rgba(255, 255, 255, 0.05)'}}></div>
          ))}
        </div>
        
        {/* The person dot */}
        <div style={{
          position: 'absolute',
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: '20px',
          height: '20px',
          backgroundColor: 'var(--neon-teal)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 15px 5px rgba(0, 242, 254, 0.6)',
          transition: 'all 0.3s ease-out'
        }}></div>
      </div>
    </div>
  );
};

export default SpatialMap;
