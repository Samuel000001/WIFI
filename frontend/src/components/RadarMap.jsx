import React, { useRef, useEffect } from 'react';

const RadarMap = ({ location, isMoving, presenceConfidence }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const posHistoryRef = useRef([]);
  const locationRef = useRef(location);
  const isMovingRef = useRef(isMoving);
  const confidenceRef = useRef(presenceConfidence);

  // Update refs on prop change (avoid re-mounting the animation loop)
  useEffect(() => {
    locationRef.current = location;
    isMovingRef.current = isMoving;
    confidenceRef.current = presenceConfidence;

    if (location) {
      posHistoryRef.current.push({ ...location, t: Date.now() });
      if (posHistoryRef.current.length > 80) posHistoryRef.current.shift();
    }
  }, [location, isMoving, presenceConfidence]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const size = 380;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 24;

    function toCanvas(roomX, roomY) {
      // Room is 5m x 5m, map to radar circle
      const nx = (roomX / 5.0 - 0.5) * 2; // -1 to 1
      const ny = (roomY / 5.0 - 0.5) * 2;
      return {
        x: cx + nx * maxR,
        y: cy + ny * maxR
      };
    }

    function drawFrame() {
      ctx.clearRect(0, 0, size, size);

      // ── Background ──
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 24);
      bgGrad.addColorStop(0, '#020d0a');
      bgGrad.addColorStop(0.7, '#010a07');
      bgGrad.addColorStop(1, '#000704');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR + 22, 0, Math.PI * 2);
      ctx.fill();

      // ── Concentric rings ──
      const rings = 5;
      for (let i = 1; i <= rings; i++) {
        const r = (maxR / rings) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === rings
          ? 'rgba(0, 242, 254, 0.2)'
          : `rgba(0, 242, 254, ${0.04 + i * 0.015})`;
        ctx.lineWidth = i === rings ? 1.5 : 0.8;
        ctx.stroke();
      }

      // ── Cross lines ──
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
      ctx.lineWidth = 0.8;
      // Vertical + horizontal
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      // Diagonals
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.03)';
      for (const a of [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.stroke();
      }

      // ── Range labels ──
      ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'left';
      for (let i = 1; i <= rings; i++) {
        const r = (maxR / rings) * i;
        ctx.fillText(`${(i * (5 / rings)).toFixed(0)}m`, cx + 5, cy - r + 12);
      }

      // ── Sweep ──
      sweepAngleRef.current += 0.018;
      const angle = sweepAngleRef.current;
      const trailLen = 0.8; // radians

      // Draw sweep glow as layered arcs (most compatible)
      const steps = 30;
      for (let s = 0; s < steps; s++) {
        const frac = s / steps; // 0 = tail, 1 = head
        const startA = angle - trailLen * (1 - frac);
        const endA = angle - trailLen * (1 - (s + 1) / steps);
        const alpha = frac * frac * 0.15; // quadratic ease

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, startA, endA);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 242, 254, ${alpha})`;
        ctx.fill();
      }

      // Leading edge line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Position trail ──
      const now = Date.now();
      const hist = posHistoryRef.current;
      for (let i = 0; i < hist.length - 1; i++) {
        const p = hist[i];
        const age = (now - p.t) / 8000; // fade over 8s
        if (age > 1) continue;
        const a = (1 - age) * 0.2;
        const pos = toCanvas(p.x, p.y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.5 - age, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 254, ${a})`;
        ctx.fill();
      }

      // ── Person blip ──
      const loc = locationRef.current;
      const conf = confidenceRef.current;
      const moving = isMovingRef.current;

      if (loc && conf > 3) {
        const pos = toCanvas(loc.x, loc.y);
        const dotColor = moving ? '#ff003c' : '#00f2fe';
        const glowRGBA = moving
          ? 'rgba(255, 0, 60, 0.5)'
          : 'rgba(0, 242, 254, 0.5)';

        // Outer pulse ring
        const pulseScale = 1 + Math.sin(now / 400) * 0.3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14 * pulseScale, 0, Math.PI * 2);
        ctx.strokeStyle = `${glowRGBA.replace('0.5', '0.15')}`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glow
        const gGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
        gGrad.addColorStop(0, glowRGBA);
        gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = gGrad;
        ctx.fill();

        // Solid blip
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.shadowColor = dotColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = moving ? 'rgba(255, 100, 120, 0.85)' : 'rgba(0, 242, 254, 0.85)';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(moving ? '● MOVING' : '● STATIC', pos.x, pos.y - 26);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText(`(${loc.x.toFixed(1)}, ${loc.y.toFixed(1)})`, pos.x, pos.y - 16);
      }

      // ── Center dot ──
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.fill();

      // ── Cardinal labels ──
      ctx.fillStyle = 'rgba(0, 242, 254, 0.28)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, cy - maxR - 11);
      ctx.fillText('S', cx, cy + maxR + 11);
      ctx.fillText('W', cx - maxR - 11, cy);
      ctx.fillText('E', cx + maxR + 11, cy);

      animFrameRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []); // Run once — uses refs for live data

  const loc = location || { x: 0, y: 0 };
  const hasTarget = presenceConfidence > 3;

  return (
    <div className="glass-panel radar-panel">
      <div className="card-title">
        <span style={{ marginRight: '8px', color: 'var(--neon-teal)' }}>◉</span>
        Radar Tracking
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: '50%',
            border: '2px solid rgba(0, 242, 254, 0.12)',
            boxShadow: '0 0 40px rgba(0, 242, 254, 0.06)'
          }}
        />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '14px',
        fontSize: '11px', color: '#8892b0', letterSpacing: '0.5px'
      }}>
        <span>5m × 5m coverage</span>
        <span style={{ color: hasTarget ? 'var(--neon-teal)' : '#555' }}>
          {hasTarget
            ? `Target @ (${loc.x.toFixed(1)}m, ${loc.y.toFixed(1)}m)`
            : 'No Target Detected'}
        </span>
      </div>
    </div>
  );
};

export default RadarMap;
