"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas-rendered radar sweep that sits behind the logo area.
 * Uses rgba colors for maximum browser compatibility.
 * Respects prefers-reduced-motion by rendering a single static frame.
 */
export function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationId: number;
    let angle = 0;

    // Military green in rgba: approx oklch(0.65 0.14 145) = rgb(76, 175, 80)
    const green = { r: 76, g: 175, b: 80 };

    const size = 480;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.44;

    const blips = [
      { a: 0.8, r: 0.6, s: 3 },
      { a: 2.1, r: 0.35, s: 2.5 },
      { a: 3.7, r: 0.8, s: 2 },
      { a: 5.0, r: 0.5, s: 3.5 },
      { a: 1.4, r: 0.72, s: 2 },
    ];

    function rgba(a: number) {
      return `rgba(${green.r}, ${green.g}, ${green.b}, ${a})`;
    }

    function draw() {
      ctx!.clearRect(0, 0, size, size);

      // Concentric rings
      for (let i = 1; i <= 4; i++) {
        const r = (maxR / 4) * i;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = rgba(0.12 - i * 0.015);
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Crosshair
      ctx!.strokeStyle = rgba(0.06);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - maxR, cy);
      ctx!.lineTo(cx + maxR, cy);
      ctx!.moveTo(cx, cy - maxR);
      ctx!.lineTo(cx, cy + maxR);
      ctx!.stroke();

      // Sweep cone — draw as filled arc with gradient
      const sweepSpan = Math.PI * 0.3;
      const steps = 20;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const startA = angle + sweepSpan * t;
        const endA = angle + sweepSpan * (t + 1 / steps);
        const alpha = 0.18 * (1 - t);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, maxR, startA, endA);
        ctx!.closePath();
        ctx!.fillStyle = rgba(alpha);
        ctx!.fill();
      }

      // Leading edge line
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(
        cx + Math.cos(angle) * maxR,
        cy + Math.sin(angle) * maxR
      );
      ctx!.strokeStyle = rgba(0.3);
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Blips
      for (const b of blips) {
        const diff = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const intensity = diff < 1.2 ? Math.max(0, 1 - diff / 1.2) : 0;
        if (intensity > 0.01) {
          const bx = cx + Math.cos(b.a) * maxR * b.r;
          const by = cy + Math.sin(b.a) * maxR * b.r;

          // Dot
          ctx!.beginPath();
          ctx!.arc(bx, by, b.s, 0, Math.PI * 2);
          ctx!.fillStyle = rgba(intensity * 0.7);
          ctx!.fill();

          // Glow
          ctx!.beginPath();
          ctx!.arc(bx, by, b.s * 3.5, 0, Math.PI * 2);
          ctx!.fillStyle = rgba(intensity * 0.12);
          ctx!.fill();
        }
      }

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = rgba(0.4);
      ctx!.fill();

      if (!prefersReducedMotion) {
        angle += 0.007;
        animationId = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
