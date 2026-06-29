import React, { useRef, useEffect } from 'react';

const SignalChart = ({ rawAmplitudes }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(25, 27, 36, 1)';
    ctx.fillRect(0, 0, width, height);

    if (!rawAmplitudes || rawAmplitudes.length === 0) return;

    // Draw lines for subcarriers
    ctx.lineWidth = 2;
    const padding = 20;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;
    
    // Auto-scale somewhat
    const maxVal = Math.max(...rawAmplitudes, 10);
    
    ctx.beginPath();
    ctx.strokeStyle = '#00f2fe';
    for (let i = 0; i < rawAmplitudes.length; i++) {
      const x = padding + (i / (rawAmplitudes.length - 1)) * drawWidth;
      const val = rawAmplitudes[i];
      const normalized = Math.min(Math.max(val / (maxVal * 1.5), -1), 1);
      const y = padding + (drawHeight / 2) - (normalized * (drawHeight / 2));
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [rawAmplitudes]);

  return (
    <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
      <div className="card-title">Live Subcarrier Stream (10 Tones)</div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={250} 
        style={{width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)'}}
      />
    </div>
  );
};

export default SignalChart;
