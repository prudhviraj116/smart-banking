/**
 * Ambient obsidian backdrop with cyan / emerald radial glow spots.
 * Rendered once, fixed behind the whole application.
 */
const AmbientBackground = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
    {/* Cyan glow — top left */}
    <div className="absolute -left-40 -top-52 h-[38rem] w-[38rem] rounded-full bg-primary/20 blur-[140px] animate-pulse-glow" />
    {/* Emerald glow — bottom right */}
    <div className="absolute -bottom-56 -right-32 h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-[140px] animate-pulse-glow [animation-delay:2s]" />
    {/* Soft central lift */}
    <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[160px]" />
    {/* Fine grid texture */}
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "58px 58px",
        maskImage: "radial-gradient(ellipse at 50% 20%, black 10%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 20%, black 10%, transparent 75%)",
      }}
    />
  </div>
);

export default AmbientBackground;
