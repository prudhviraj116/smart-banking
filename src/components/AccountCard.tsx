import { Nfc, Send, ShieldCheck, Snowflake, Wifi } from "lucide-react";

interface AccountCardProps {
  holder: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  onTransfer?: () => void;
  onFreeze?: () => void;
}

/**
 * Flat sage account card. No tilt, flip or glow — just a calm, readable surface.
 */
const AccountCard = ({
  holder,
  accountNumber,
  accountType,
  balance,
  onTransfer,
  onFreeze,
}: AccountCardProps) => {
  const digits = accountNumber.replace(/\D/g, "").padStart(12, "0").slice(-12);
  const groups = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)];
  const expiry = `${String((Number(digits.slice(-3)) % 12) + 1).padStart(2, "0")}/29`;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="rounded-t-2xl bg-banking-gradient p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] opacity-80">
              Smart Banking
            </p>
            <p className="mt-1 font-display text-lg font-semibold capitalize">
              {accountType} Card
            </p>
          </div>
          <div className="flex items-center gap-3 opacity-80">
            <Wifi className="h-5 w-5 rotate-90" />
            <Nfc className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="chip-plate h-9 w-12 rounded-md" />
          <p className="font-mono text-lg tracking-[0.2em] sm:text-xl">{groups.join(" ")}</p>
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] opacity-75">
              Card Holder
            </p>
            <p className="text-sm font-medium">{holder}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] opacity-75">
              Expires
            </p>
            <p className="font-mono text-sm">{expiry}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex items-end justify-between">
          <p className="stat-label">Available balance</p>
          <p className="font-display text-2xl font-semibold text-primary-glow">{balance}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onTransfer}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            <Send className="h-3.5 w-3.5" />
            Send Money
          </button>
          <button
            type="button"
            onClick={onFreeze}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
          >
            <Snowflake className="h-3.5 w-3.5" />
            Freeze Card
          </button>
        </div>

        <p className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Protected by 3-D Secure.
        </p>
      </div>
    </div>
  );
};

export default AccountCard;
