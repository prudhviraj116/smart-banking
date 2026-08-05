import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import VaultSphere from "@/components/VaultSphere";
import Credit3DCard from "@/components/Credit3DCard";
import { MotionGrid, MotionWidget } from "@/components/MotionWidget";
import { BalanceTrendChart, ExpenseBreakdownChart } from "@/components/FinanceCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  Send,
  Landmark,
  Receipt,
  Sparkles,
  Activity,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const accountsData = await apiClient.getAccounts();
      setAccounts(accountsData);

      if (accountsData.length > 0) {
        try {
          const transactions = await apiClient.getTransactions(accountsData[0].id);
          setAllTransactions(transactions);
          setRecentTransactions(transactions.slice(0, 6));
        } catch (error) {
          setAllTransactions([]);
          setRecentTransactions([]);
        }
      }
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      await apiClient.createAccount("checking");
      toast({
        title: "Account created",
        description: "Your new account has been created successfully",
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0);

  const formatCurrency = (amount: number) => {
    if (!showBalances) return "••••••";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /** Trend + category series derived from the real transaction feed. */
  const { trendData, categoryData, inflow, outflow } = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString("en-US", { month: "short" }),
        inflow: 0,
        outflow: 0,
      };
    });

    let totalIn = 0;
    let totalOut = 0;
    const byType: Record<string, number> = {};

    recentTransactions.forEach((transaction) => {
      const created = new Date(transaction.created_at);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const bucket = months.find((month) => month.key === key);
      const amount = Number(transaction.amount ?? 0);
      const isCredit =
        transaction.transaction_type === "deposit" ||
        (transaction.transaction_type === "transfer" && transaction.to_account_id);

      if (isCredit) {
        totalIn += amount;
        if (bucket) bucket.inflow += amount;
      } else {
        totalOut += amount;
        if (bucket) bucket.outflow += amount;
        const label = String(transaction.transaction_type ?? "other");
        byType[label] = (byType[label] ?? 0) + amount;
      }
    });

    const categories = Object.entries(byType).map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
    }));

    return {
      trendData: months.map(({ label, inflow: i, outflow: o }) => ({
        label,
        inflow: i,
        outflow: o,
      })),
      categoryData: categories.length
        ? categories
        : [
            { label: "Transfers", value: 0 },
            { label: "Withdrawals", value: 0 },
            { label: "Bills", value: 0 },
          ],
      inflow: totalIn,
      outflow: totalOut,
    };
  }, [recentTransactions]);

  const quickActions = [
    { label: "Transfer", icon: Send, to: "/transfer" },
    { label: "Deposit", icon: Landmark, to: "/transfer" },
    { label: "Send", icon: ArrowUpRight, to: "/transfer" },
    { label: "Pay Bills", icon: Receipt, to: "/transfer" },
  ];

  const summary = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      hint: `Across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`,
      icon: Wallet,
      tone: "accent" as const,
    },
    {
      title: "Money In",
      value: formatCurrency(inflow),
      hint: "Recent inflow",
      icon: TrendingUp,
      tone: "accent" as const,
    },
    {
      title: "Money Out",
      value: formatCurrency(outflow),
      hint: "Recent outflow",
      icon: Activity,
      tone: "primary" as const,
    },
    {
      title: "Active Accounts",
      value: String(accounts.length),
      hint: "Linked to your profile",
      icon: CreditCard,
      tone: "primary" as const,
    },
  ];

  const selectedAccount = accounts[activeCard];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ---------- 1. Header + 3D balance overview ---------- */}
        <MotionGrid className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <MotionWidget className="lg:col-span-2">
            <Card className="glass-panel-hover h-full overflow-hidden">
              <CardContent className="relative p-7">
                <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
                <div className="relative">
                  <Badge variant="emerald" className="mb-4 gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Smart Banking Suite
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Welcome back to your{" "}
                    <span className="text-gradient-primary">command center</span>
                  </h1>
                  <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                    Real-time balances, expense intelligence and instant transfers — all in one
                    obsidian-glass workspace.
                  </p>

                  <div className="mt-7 flex flex-wrap items-end gap-8">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                        Total Balance
                      </p>
                      <motion.p
                        key={`${totalBalance}-${showBalances}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-4xl font-bold text-accent drop-shadow-[0_0_22px_hsl(var(--accent)/0.45)]"
                      >
                        {formatCurrency(totalBalance)}
                      </motion.p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" variant="outline" onClick={() => setShowBalances((v) => !v)}>
                        {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showBalances ? "Hide" : "Show"} Balances
                      </Button>
                      <Button size="sm" asChild>
                        <Link to="/transfer">
                          <Plus className="h-4 w-4" />
                          Transfer Funds
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionWidget>

          {/* Interactive floating 3D vault */}
          <MotionWidget>
            <Card className="glass-panel-hover h-full overflow-hidden">
              <CardContent className="p-0">
                <VaultSphere className="h-[268px] w-full animate-float-slow" />
              </CardContent>
            </Card>
          </MotionWidget>
        </MotionGrid>

        {/* ---------- Summary metrics ---------- */}
        <MotionGrid className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <MotionWidget key={item.title}>
              <Card className="glass-panel-hover h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {item.title}
                  </CardTitle>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 ${
                      item.tone === "accent" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{item.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </CardContent>
              </Card>
            </MotionWidget>
          ))}
        </MotionGrid>

        {/* ---------- 2. 3D card display + quick transfer ---------- */}
        <MotionGrid className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <MotionWidget className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Your Cards</CardTitle>
                  <CardDescription>Click the card to reveal CVV and quick actions</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={createAccount}>
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <div className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
                ) : !selectedAccount ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-muted-foreground">
                    No accounts yet. Create your first account to generate a card.
                  </div>
                ) : (
                  <>
                    <Credit3DCard
                      holder={selectedAccount.account_type?.toUpperCase() ?? "SMARTBANK"}
                      accountNumber={selectedAccount.account_number}
                      accountType={selectedAccount.account_type}
                      balance={formatCurrency(Number(selectedAccount.balance ?? 0))}
                      onTransfer={() => navigate("/transfer")}
                      onFreeze={() =>
                        toast({
                          title: "Card frozen",
                          description: "Card locked for new payments until you unfreeze it.",
                        })
                      }
                    />

                    {accounts.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {accounts.map((account, index) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => setActiveCard(index)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                              index === activeCard
                                ? "border-primary/50 bg-primary/15 text-primary-glow"
                                : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            •••• {String(account.account_number).slice(-4)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </MotionWidget>

          <MotionWidget className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>One tap to move your money</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <Button key={action.label} asChild className="h-20 flex-col gap-2">
                      <Link to={action.to}>
                        <action.icon className="h-5 w-5" />
                        <span className="text-xs">{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Accounts
                  </p>
                  {accounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No linked accounts yet.</p>
                  ) : (
                    accounts.slice(0, 3).map((account) => (
                      <div key={account.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <CreditCard className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium capitalize text-foreground">
                              {account.account_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              •••• {String(account.account_number).slice(-4)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-accent">
                          {formatCurrency(Number(account.balance ?? 0))}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionWidget>
        </MotionGrid>

        {/* ---------- 3. Analytics + transactions feed ---------- */}
        <MotionGrid className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <MotionWidget className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Cash Flow Analytics</CardTitle>
                    <CardDescription>Inflow vs outflow across the last 6 months</CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent shadow-glow-emerald" /> Inflow
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-glow" /> Outflow
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <BalanceTrendChart data={trendData} />
                <div>
                  <p className="mb-2 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Expense Breakdown
                  </p>
                  <ExpenseBreakdownChart data={categoryData} />
                </div>
              </CardContent>
            </Card>
          </MotionWidget>

          <MotionWidget className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Your latest movements</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/transactions">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                      />
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No recent transactions found.
                  </p>
                ) : (
                  recentTransactions.map((transaction, index) => {
                    const isCredit =
                      transaction.transaction_type === "deposit" ||
                      (transaction.transaction_type === "transfer" && transaction.to_account_id);

                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.4 }}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 ${
                              isCredit ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium capitalize text-foreground">
                              {transaction.description ||
                                `${transaction.transaction_type} transaction`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            isCredit ? "text-accent" : "text-destructive"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount ?? 0))}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </MotionWidget>
        </MotionGrid>
      </main>
    </div>
  );
};

export default Dashboard;
