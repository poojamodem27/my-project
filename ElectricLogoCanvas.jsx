import { useState, useEffect, useRef } from 'react';

export default function ElectricLogoCanvas({ 
  size = 46, 
  color = '#00f076', 
  glowColor = '#ffaa00',
  interactive = true 
}) {
  const canvasRef = useRef(null);
  const isHovered = useRef(false);
  const arcsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId;
    let t = 0;

    const handlePointerEnter = () => { isHovered.current = true; };
    const handlePointerLeave = () => { isHovered.current = false; };
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      for (let i = 0; i < 6; i++) {
        arcsRef.current.push({
          x: cx + (Math.random() - 0.5) * 16,
          y: cy + (Math.random() - 0.5) * 16,
          angle: Math.random() * Math.PI * 2,
          length: 12 + Math.random() * 24,
          life: 1.0,
          speed: 0.04 + Math.random() * 0.04
        });
      }
    };

    canvas.addEventListener('pointerenter', handlePointerEnter);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('click', handleClick);

    const drawLightningLine = (x1, y1, x2, y2, displace, iterations) => {
      if (iterations <= 0) {
        ctx.lineTo(x2, y2);
        return;
      }
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;
      drawLightningLine(x1, y1, midX, midY, displace / 1.8, iterations - 1);
      drawLightningLine(midX, midY, x2, y2, displace / 1.8, iterations - 1);
    };

    const render = () => {
      t += 0.06;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.36;

      const pts = [
        { x: cx, y: cy - r },
        { x: cx + r, y: cy },
        { x: cx, y: cy + r },
        { x: cx - r, y: cy },
      ];

      // Draw Electric Aura
      ctx.save();
      ctx.shadowColor = isHovered.current ? glowColor : color;
      ctx.shadowBlur = isHovered.current ? 16 : 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < 4; i++) {
        const next = pts[(i + 1) % 4];
        drawLightningLine(pts[i].x, pts[i].y, next.x, next.y, 4, 3);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner acoustic waves
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy);
      ctx.lineTo(cx - r * 0.15, cy - 5 * Math.sin(t * 3));
      ctx.lineTo(cx + r * 0.15, cy + 5 * Math.cos(t * 3));
      ctx.lineTo(cx + r * 0.45, cy);
      ctx.stroke();

      // Particle electric sparks
      if (Math.random() > 0.4) {
        arcsRef.current.push({
          x: cx + (Math.random() - 0.5) * r,
          y: cy + (Math.random() - 0.5) * r,
          angle: Math.random() * Math.PI * 2,
          length: 6 + Math.random() * 12,
          life: 1.0,
          speed: 0.05
        });
      }

      for (let i = arcsRef.current.length - 1; i >= 0; i--) {
        const arc = arcsRef.current[i];
        arc.life -= arc.speed;
        if (arc.life <= 0) {
          arcsRef.current.splice(i, 1);
          continue;
        }
        const ex = arc.x + Math.cos(arc.angle) * arc.length;
        const ey = arc.y + Math.sin(arc.angle) * arc.length;
        ctx.strokeStyle = arc.life > 0.5 ? color : glowColor;
        ctx.globalAlpha = arc.life;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(arc.x, arc.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [size, color, glowColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className="electric-canvas cursor-pointer"
    />
  );
}

