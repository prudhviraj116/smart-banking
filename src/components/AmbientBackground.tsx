/**
 * Soft cream backdrop with very light sage washes.
 * Flat and calm — no glow effects.
 */
const AmbientBackground = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
    <div className="absolute -left-40 -top-52 h-[38rem] w-[38rem] rounded-full bg-secondary/50 blur-[120px]" />
    <div className="absolute -bottom-56 -right-32 h-[34rem] w-[34rem] rounded-full bg-accent/25 blur-[120px]" />
    <div
      className="absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse at 50% 0%, black 5%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 5%, transparent 70%)",
      }}
    />
  </div>
);

export default AmbientBackground;
