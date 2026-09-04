import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  maxAlpha: number;
  growthRate: number;
}

export const CursorWaveEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let isLoopRunning = false;
    const ripples: Ripple[] = [];
    let lastX = -100;
    let lastY = -100;
    let lastTime = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const startLoopIfNeeded = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const addRipple = (x: number, y: number, isClick = false) => {
      ripples.push({
        x,
        y,
        radius: isClick ? 4 : 2,
        maxRadius: isClick ? 65 : 42,
        alpha: isClick ? 0.35 : 0.18,
        maxAlpha: isClick ? 0.35 : 0.18,
        growthRate: isClick ? 1.4 : 0.95
      });
      // Cap max concurrent ripples for maximum performance
      if (ripples.length > 20) {
        ripples.shift();
      }
      startLoopIfNeeded();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);

      // Trigger wave if moved sufficiently and throttled to prevent spamming
      if (dist > 24 && now - lastTime > 40) {
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
        addRipple(e.clientX, e.clientY, false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      addRipple(e.clientX, e.clientY, true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // Parse hex to rgb
    const hexToRgb = (hex: string) => {
      const cleaned = hex.replace('#', '');
      const num = parseInt(cleaned, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    };

    const render = () => {
      if (ripples.length === 0) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        isLoopRunning = false;
        animationFrameId = null;
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const color = hexToRgb(themeRef.current.accentHex || '#6366f1');

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.growthRate;
        const progress = r.radius / r.maxRadius;
        r.alpha = r.maxAlpha * (1 - progress);

        if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);

        // Soft gradient border for water-ripple aesthetics
        ctx.lineWidth = Math.max(0.7, 1.8 * (1 - progress));
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${r.alpha})`;
        ctx.stroke();

        // Very faint ambient inner glow for the wave
        if (progress < 0.7) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.8, 0, Math.PI * 2);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${r.alpha * 0.4})`;
          ctx.stroke();
        }

        ctx.restore();
      }

      if (ripples.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        isLoopRunning = false;
        animationFrameId = null;
      }
    };

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="cursor-wave-canvas"
      className="pointer-events-none fixed inset-0 z-30 select-none"
      aria-hidden="true"
    />
  );
};
