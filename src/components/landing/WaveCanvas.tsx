"use client";
import { useEffect, useRef } from "react";

const WAVES = [
  {
    color: [120, 40, 220], alpha: 0.55, width: 340,
    cp: { x0f: 0.0, y0f: 0.72, cx1f: 0.25, cy1f: 0.55, cx2f: 0.55, cy2f: 0.78, x1f: 0.55, y1f: 0.62 },
    speed: 0.00045,
    amp: { cx1: 0.06, cy1: 0.08, cx2: 0.05, cy2: 0.06 },
  },
  {
    color: [50, 90, 240], alpha: 0.50, width: 280,
    cp: { x0f: 0.55, y0f: 0.60, cx1f: 0.68, cy1f: 0.50, cx2f: 0.82, cy2f: 0.70, x1f: 1.05, y1f: 0.58 },
    speed: 0.00038,
    amp: { cx1: 0.04, cy1: 0.07, cx2: 0.06, cy2: 0.05 },
  },
  {
    color: [160, 60, 255], alpha: 0.28, width: 200,
    cp: { x0f: 0.1, y0f: 0.45, cx1f: 0.3, cy1f: 0.38, cx2f: 0.65, cy2f: 0.52, x1f: 0.85, y1f: 0.42 },
    speed: 0.00055,
    amp: { cx1: 0.05, cy1: 0.06, cx2: 0.04, cy2: 0.07 },
  },
  {
    color: [0, 180, 255], alpha: 0.18, width: 160,
    cp: { x0f: 0.2, y0f: 0.85, cx1f: 0.45, cy1f: 0.80, cx2f: 0.70, cy2f: 0.90, x1f: 1.0, y1f: 0.82 },
    speed: 0.00032,
    amp: { cx1: 0.07, cy1: 0.04, cx2: 0.05, cy2: 0.06 },
  },
];

export default function WaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W: number, H: number, t = 0;
    let animId: number;

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawWave(wave: (typeof WAVES)[0]) {
      const { cp, speed, amp, color, alpha, width } = wave;
      const s = t * speed;
      const cx1 = (cp.cx1f + Math.sin(s * 1.3 + 0.5) * amp.cx1) * W;
      const cy1 = (cp.cy1f + Math.cos(s * 1.1 + 1.2) * amp.cy1) * H;
      const cx2 = (cp.cx2f + Math.sin(s * 0.9 + 2.4) * amp.cx2) * W;
      const cy2 = (cp.cy2f + Math.cos(s * 1.4 + 0.8) * amp.cy2) * H;
      const x0 = cp.x0f * W;
      const y0 = (cp.y0f + Math.sin(s * 0.7) * 0.03) * H;
      const x1 = cp.x1f * W;
      const y1 = (cp.y1f + Math.cos(s * 0.6 + 1.0) * 0.03) * H;

      const grad = ctx!.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, `rgba(${color},0)`);
      grad.addColorStop(0.2, `rgba(${color},${alpha})`);
      grad.addColorStop(0.8, `rgba(${color},${alpha})`);
      grad.addColorStop(1, `rgba(${color},0)`);

      ctx!.save();
      ctx!.filter = `blur(${Math.round(width * 0.38)}px)`;
      ctx!.beginPath();
      ctx!.moveTo(x0, y0);
      ctx!.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = width;
      ctx!.lineCap = "round";
      ctx!.stroke();
      ctx!.restore();
    }

    function loop() {
      if (t === 0) {
        ctx!.fillStyle = "#0B0F19";
        ctx!.fillRect(0, 0, W, H);
      }
      ctx!.fillStyle = "rgba(11, 15, 25, 0.22)";
      ctx!.fillRect(0, 0, W, H);
      for (const w of WAVES) drawWave(w);
      t++;
      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
