import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  label: string;
  inflow: number;
  outflow: number;
}

export interface CategoryPoint {
  label: string;
  value: number;
}

const tooltipStyle = {
  background: "hsl(var(--popover) / 0.92)",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
  color: "hsl(var(--foreground))",
  fontSize: "0.75rem",
  boxShadow: "0 18px 40px -20px hsl(220 60% 2% / 0.9)",
} as const;

/** Glowing gradient trend area chart. */
export const BalanceTrendChart = ({ data }: { data: TrendPoint[] }) => (
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
      <defs>
        <linearGradient id="inflowGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.55} />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="outflowGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="hsl(var(--border) / 0.5)" strokeDasharray="4 8" vertical={false} />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        width={54}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--primary) / 0.4)" }} />
      <Area
        type="monotone"
        dataKey="inflow"
        stroke="hsl(var(--accent))"
        strokeWidth={2.5}
        fill="url(#inflowGlow)"
        animationDuration={1100}
        dot={false}
        activeDot={{ r: 4, stroke: "hsl(var(--accent))", fill: "hsl(var(--background))" }}
      />
      <Area
        type="monotone"
        dataKey="outflow"
        stroke="hsl(var(--primary))"
        strokeWidth={2.5}
        fill="url(#outflowGlow)"
        animationDuration={1300}
        dot={false}
        activeDot={{ r: 4, stroke: "hsl(var(--primary))", fill: "hsl(var(--background))" }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

/** Animated expense category bars. */
export const ExpenseBreakdownChart = ({ data }: { data: CategoryPoint[] }) => (
  <ResponsiveContainer width="100%" height={210}>
    <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
      <defs>
        <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="hsl(var(--border) / 0.5)" strokeDasharray="4 8" vertical={false} />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        width={54}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
      <Bar dataKey="value" radius={[8, 8, 4, 4]} animationDuration={1200}>
        {data.map((entry) => (
          <Cell key={entry.label} fill="url(#barGlow)" />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
