import React, { useEffect, useRef } from 'react';

interface FloatingTriangle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  speedY: number;
  speedX: number;
  opacity: number;
  filled: boolean;
}

interface LightningShard {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export const WaterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Drifting Triangles
    const triangles: FloatingTriangle[] = [];
    for (let i = 0; i < 28; i++) {
      triangles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 24 + 10,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        speedY: (Math.random() * 0.4 + 0.1) * -1,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.28 + 0.12,
        filled: Math.random() > 0.4,
      });
    }

    // 2. Floating Lightning Bolts
    const lightningShards: LightningShard[] = [];
    for (let i = 0; i < 14; i++) {
      lightningShards.push({
        x: Math.random() * width,
        y: Math.random() * height,
        scale: Math.random() * 0.6 + 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() * 0.5 + 0.15) * -1,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.3 + 0.15,
        color: Math.random() > 0.3 ? '#FFFFFF' : '#FF0055',
      });
    }

    // 3. Crisp Bubbles
    const particles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.0,
        speedY: Math.random() * 0.4 + 0.2,
        swaySpeed: Math.random() * 0.02 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.3 + 0.15,
      });
    }

    const ripples: Ripple[] = [];
    const addRipple = (x: number, y: number, maxRadius = 140) => {
      ripples.push({
        x,
        y,
        radius: 4,
        maxRadius,
        opacity: 0.4,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() < 0.05) {
        addRipple(e.clientX, e.clientY, 60);
      }
    };

    const handleClick = (e: MouseEvent) => {
      addRipple(e.clientX, e.clientY, 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let time = 0;

    // Helper to draw a crisp Persona-style lightning bolt path
    const drawLightning = (cx: number, cy: number, scale: number, rotation: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      ctx.beginPath();
      // Lightning coordinates
      ctx.moveTo(-4, -20);
      ctx.lineTo(8, -20);
      ctx.lineTo(0, -2);
      ctx.lineTo(10, -2);
      ctx.lineTo(-8, 22);
      ctx.lineTo(-2, 3);
      ctx.lineTo(-10, 3);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    };

    // Helper to draw an acute triangle
    const drawTriangle = (cx: number, cy: number, size: number, rotation: number, filled: boolean, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, size * 0.7);
      ctx.lineTo(-size * 0.8, size * 0.7);
      ctx.closePath();

      ctx.globalAlpha = alpha;
      if (filled) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Deep, Vibrant Persona Blue Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#002673');
      bgGrad.addColorStop(0.4, '#0038A8');
      bgGrad.addColorStop(1, '#004DE6');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle diagonal lines texture
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = -height; x < width + height; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      ctx.restore();

      // Render Floating Triangles
      triangles.forEach((t) => {
        t.y += t.speedY;
        t.x += t.speedX;
        t.rotation += t.rotSpeed;

        if (t.y < -40) {
          t.y = height + 30;
          t.x = Math.random() * width;
        }
        if (t.x < -30) t.x = width + 20;
        if (t.x > width + 30) t.x = -20;

        drawTriangle(t.x, t.y, t.size, t.rotation, t.filled, t.opacity);
      });

      // Render Floating Lightning Bolts
      lightningShards.forEach((l) => {
        l.y += l.speedY;
        l.x += l.speedX;
        l.rotation += l.rotSpeed;

        if (l.y < -50) {
          l.y = height + 40;
          l.x = Math.random() * width;
        }
        if (l.x < -40) l.x = width + 30;
        if (l.x > width + 40) l.x = -30;

        drawLightning(l.x, l.y, l.scale, l.rotation, l.color, l.opacity);
      });

      // Floating Bubbles
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.swayOffset += p.swaySpeed;
        const currentX = p.x + Math.sin(p.swayOffset) * 10;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
        ctx.restore();
      });

      // Water Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2.0;
        r.opacity *= 0.96;

        if (r.opacity < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ display: 'block' }}
    />
  );
};
