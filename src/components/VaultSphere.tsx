import { useEffect, useRef } from "react";

/**
 * Interactive floating 3D currency vault sphere.
 *
 * Rendered on a live canvas (no external scene dependency) so it stays fast and
 * self-contained. Acts as the hero 3D slot: swapping this component for a
 * `@splinetool/react-spline` <Spline scene="..." /> requires no layout change.
 */
const VaultSphere = ({ className = "" }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.current.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    // Fibonacci-distributed points on a unit sphere.
    const POINTS = 260;
    const nodes = Array.from({ length: POINTS }, (_, i) => {
      const y = 1 - (i / (POINTS - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963;
      return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
    });

    const draw = () => {
      frame += 1;
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.05;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.34;
      const spin = frame * 0.0042 + pointer.current.x * 0.9;
      const tilt = -0.35 + pointer.current.y * 0.6;
      const bob = Math.sin(frame * 0.014) * radius * 0.05;

      // Core glow
      const core = ctx.createRadialGradient(cx, cy + bob, radius * 0.1, cx, cy + bob, radius * 1.5);
      core.addColorStop(0, "rgba(6, 182, 212, 0.32)");
      core.addColorStop(0.45, "rgba(16, 185, 129, 0.14)");
      core.addColorStop(1, "rgba(9, 13, 22, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      const projected = nodes.map((node) => {
        // Y spin
        const sx = node.x * Math.cos(spin) - node.z * Math.sin(spin);
        const sz = node.x * Math.sin(spin) + node.z * Math.cos(spin);
        // X tilt
        const ty = node.y * Math.cos(tilt) - sz * Math.sin(tilt);
        const tz = node.y * Math.sin(tilt) + sz * Math.cos(tilt);
        const depth = (tz + 1) / 2;
        return {
          x: cx + sx * radius,
          y: cy + bob + ty * radius,
          depth,
        };
      });

      // Latitude/longitude style wire links
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i];
        const b = projected[(i + 11) % projected.length];
        const depth = (a.depth + b.depth) / 2;
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.05 + depth * 0.22})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes
      projected.forEach((point, index) => {
        const emerald = index % 5 === 0;
        const size = 0.6 + point.depth * 2.1;
        ctx.fillStyle = emerald
          ? `rgba(16, 185, 129, ${0.22 + point.depth * 0.7})`
          : `rgba(125, 235, 255, ${0.16 + point.depth * 0.7})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Orbiting currency ring
      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.rotate(tilt * 0.5);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.28, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      const orbit = frame * 0.02;
      const ox = Math.cos(orbit) * radius * 1.28;
      const oy = Math.sin(orbit) * radius * 0.38;
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 16);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.95)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ox, oy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground/70">
          Secure Vault
        </span>
      </div>
    </div>
  );
};

export default VaultSphere;
