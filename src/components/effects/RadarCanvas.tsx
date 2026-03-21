"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas-rendered radar sweep that sits behind the logo area.
 * Positioned absolute in the hero, anchored to the right side.
 * Subtle enough to not compete with text — purely atmospheric.
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

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = 480; // fixed logical size
      canvas!.style.width = `${size}px`;
      canvas!.style.height = `${size}px`;
      canvas!.width = size * dpr;
      canvas!.height = size * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    const size = 480;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.44;

    function draw() {
      ctx!.clearRect(0, 0, size, size);

      // Concentric rings — very faint
      for (let i = 1; i <= 4; i++) {
        const r = (maxR / 4) * i;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `oklch(0.65 0.14 145 / ${0.07 - i * 0.01})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Crosshair — very subtle
      ctx!.strokeStyle = "oklch(0.65 0.14 145 / 0.035)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(cx - maxR, cy);
      ctx!.lineTo(cx + maxR, cy);
      ctx!.moveTo(cx, cy - maxR);
      ctx!.lineTo(cx, cy + maxR);
      ctx!.stroke();

      // Sweep cone
      const gradient = ctx!.createConicGradient(angle, cx, cy);
      gradient.addColorStop(0, "oklch(0.65 0.14 145 / 0.1)");
      gradient.addColorStop(0.06, "oklch(0.65 0.14 145 / 0.04)");
      gradient.addColorStop(0.12, "oklch(0.65 0.14 145 / 0)");
      gradient.addColorStop(1, "oklch(0.65 0.14 145 / 0)");

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.arc(cx, cy, maxR, angle, angle + Math.PI * 0.3);
      ctx!.closePath();
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // Leading edge
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(
        cx + Math.cos(angle) * maxR,
        cy + Math.sin(angle) * maxR
      );
      ctx!.strokeStyle = "oklch(0.65 0.14 145 / 0.15)";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Blips
      const blips = [
        { a: 0.8, r: 0.6, s: 2.5 },
        { a: 2.1, r: 0.35, s: 2 },
        { a: 3.7, r: 0.8, s: 2 },
        { a: 5.0, r: 0.5, s: 3 },
        { a: 1.4, r: 0.72, s: 2 },
      ];

      for (const b of blips) {
        const diff = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const intensity = diff < 1.2 ? Math.max(0, 1 - diff / 1.2) : 0;
        if (intensity > 0.01) {
          const bx = cx + Math.cos(b.a) * maxR * b.r;
          const by = cy + Math.sin(b.a) * maxR * b.r;

          ctx!.beginPath();
          ctx!.arc(bx, by, b.s, 0, Math.PI * 2);
          ctx!.fillStyle = `oklch(0.65 0.14 145 / ${intensity * 0.5})`;
          ctx!.fill();

          // Glow ring
          ctx!.beginPath();
          ctx!.arc(bx, by, b.s * 3, 0, Math.PI * 2);
          ctx!.fillStyle = `oklch(0.65 0.14 145 / ${intensity * 0.08})`;
          ctx!.fill();
        }
      }

      // Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = "oklch(0.65 0.14 145 / 0.25)";
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
