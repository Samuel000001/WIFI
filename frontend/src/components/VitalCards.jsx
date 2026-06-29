import React from 'react';

const VitalCards = ({ telemetry }) => {
  const { breathing_rate, heart_rate, is_moving, presence_confidence } = telemetry;
  const breathingDuration = breathing_rate > 0 ? (60 / breathing_rate) : 4;

  return (
    <div className="glass-panel">
      <div className="card-title">Vitals & Presence</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Presence */}
        <div style={{ textAlign: 'center' }}>
          <div className={`presence-ring ${is_moving ? 'motion' : ''}`}>
            <div>
              <div className="metric-value" style={{ fontSize: '24px' }}>
                {Math.round(presence_confidence)}<span className="metric-unit">%</span>
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginTop: '6px',
            color: is_moving ? 'var(--crimson-pulse)' : 'var(--neon-teal)'
          }}>
            {is_moving ? 'MOTION' : 'SECURE'}
          </div>
        </div>

        {/* Breathing */}
        <div style={{ textAlign: 'center' }}>
          <div className="metric-value" style={{ fontSize: '28px' }}>
            {Math.round(breathing_rate)}
            <span className="metric-unit">BPM</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8892b0', marginBottom: '4px' }}>Breathing</div>
          <div className="breathing-bubble"
            style={{ animationDuration: `${breathingDuration}s`, width: '60px', height: '60px' }}
          ></div>
        </div>

        {/* Heart Rate */}
        <div style={{ textAlign: 'center' }}>
          <div className="metric-value" style={{ fontSize: '28px' }}>
            {Math.round(heart_rate)}
            <span className="metric-unit">BPM</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8892b0', marginBottom: '4px' }}>Heart Rate</div>
          <svg width="80" height="35" viewBox="0 0 100 40" style={{
            marginTop: '8px', stroke: 'var(--crimson-pulse)', fill: 'none', strokeWidth: 2
          }}>
            <path d="M 0 20 L 20 20 L 25 10 L 30 35 L 35 5 L 45 30 L 50 20 L 100 20">
              <animate
                attributeName="stroke-dashoffset"
                from="200" to="0"
                dur={`${Math.max(60 / Math.max(heart_rate, 30), 0.4)}s`}
                repeatCount="indefinite"
              />
            </path>
            <path d="M 0 20 L 20 20 L 25 10 L 30 35 L 35 5 L 45 30 L 50 20 L 100 20"
              strokeDasharray="200"
              strokeDashoffset="0">
              <animate
                attributeName="stroke-dashoffset"
                from="200" to="0"
                dur={`${Math.max(60 / Math.max(heart_rate, 30), 0.4)}s`}
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VitalCards;
