import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Nfc, ShieldCheck, Snowflake, Send, Wifi } from "lucide-react";

interface Credit3DCardProps {
  holder: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  onTransfer?: () => void;
  onFreeze?: () => void;
}

/**
 * Glossy glass credit card with tilt-on-hover and click-to-flip (CVV side).
 */
const Credit3DCard = ({
  holder,
  accountNumber,
  accountType,
  balance,
  onTransfer,
  onFreeze,
}: Credit3DCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const shellRef = useRef<HTMLDivElement>(null);

  const digits = accountNumber.replace(/\D/g, "").padStart(12, "0").slice(-12);
  const groups = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)];
  const cvv = digits.slice(-3);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 14, y: px * 18 });
  };

  return (
    <div
      className="perspective-1200 select-none"
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <motion.div
        ref={shellRef}
        role="button"
        tabIndex={0}
        aria-label="Toggle card details"
        onClick={() => setFlipped((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setFlipped((value) => !value);
          }
        }}
        className="preserve-3d relative aspect-[1.62/1] w-full cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y + (flipped ? 180 : 0),
        }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
      >
        {/* ---------------- FRONT ---------------- */}
        <div className="backface-hidden absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-card/60 p-6 backdrop-blur-xl shadow-2xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-accent/25" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
          {/* Gloss sweep */}
          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground">
                  Smart Banking
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                  {accountType} Card
                </p>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Wifi className="h-5 w-5 rotate-90" />
                <Nfc className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Holographic metallic chip */}
              <div className="metal-chip relative h-9 w-12 rounded-md">
                <div className="absolute inset-[3px] rounded-[3px] border border-black/20" />
                <div className="absolute left-1/2 top-1/2 h-[1px] w-8 -translate-x-1/2 -translate-y-1/2 bg-black/25" />
                <div className="absolute left-1/2 top-1/2 h-6 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-black/25" />
              </div>
              <div className="font-mono text-lg tracking-[0.22em] embossed-digits sm:text-xl">
                {groups.join(" ")}
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Card Holder
                </p>
                <p className="text-sm font-medium text-foreground">{holder}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Available
                </p>
                <p className="text-xl font-semibold text-accent">{balance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- BACK ---------------- */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-card/70 backdrop-blur-xl shadow-2xl shadow-accent/10">
          <div className="absolute inset-0 bg-gradient-to-tl from-primary/20 via-transparent to-accent/20" />
          <div className="relative flex h-full flex-col">
            <div className="mt-5 h-10 w-full bg-black/70" />
            <div className="flex-1 space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-md border border-white/10 bg-white/80 px-3 py-2 text-right font-mono text-sm text-slate-900">
                  {cvv}
                </div>
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Expires
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {String((Number(cvv) % 12) + 1).padStart(2, "0")}/29
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTransfer?.();
                  }}
                  className="btn-3d inline-flex items-center gap-2 rounded-xl bg-banking-gradient px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Money
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onFreeze?.();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <Snowflake className="h-3.5 w-3.5" />
                  Freeze Card
                </button>
              </div>

              <p className="flex items-center gap-2 text-[0.68rem] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Protected by 3-D Secure. Click the card to flip back.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Credit3DCard;
