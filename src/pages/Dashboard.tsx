import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  TrendingUp,
  Eye,
  EyeOff,
  Plus
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accountsData] = await Promise.all([
        apiClient.getAccounts(),
      ]);
      setAccounts(accountsData);
      
      // Load recent transactions from first account if available
      if (accountsData.length > 0) {
        try {
          const transactions = await apiClient.getTransactions(accountsData[0].id);
          setRecentTransactions(transactions.slice(0, 4)); // Show only recent 4
        } catch (error) {
          // Transactions might not exist yet
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
      await apiClient.createAccount('checking');
      toast({
        title: "Account created",
        description: "Your new account has been created successfully",
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    }
  };
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const formatCurrency = (amount: number) => {
    if (!showBalances) return "••••••";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to SecureBank</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center gap-2"
            >
              {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBalances ? "Hide" : "Show"} Balances
            </Button>
            
            <Button asChild className="bg-banking-gradient hover:shadow-glow">
              <Link to="/transfer" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Transfer Funds
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Across {accounts.length} accounts
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground">
                Banking accounts
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Accounts */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Accounts</CardTitle>
                  <CardDescription>
                    Manage your bank accounts and balances
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                  onClick={createAccount}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No accounts found. Create your first account to get started.
                </div>
              ) : (
                accounts.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{account.account_type}</p>
                          {account.balance > 0 && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">****{account.account_number.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(account.balance)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        <Link to={`/transactions?account=${account.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your latest account activity
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/transactions">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent transactions found.
                </div>
              ) : (
                recentTransactions.map((transaction) => {
                  const isCredit = transaction.transaction_type === "deposit" || 
                    (transaction.transaction_type === "transfer" && transaction.to_account_id);
                  
                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          isCredit
                            ? 'bg-accent/10 text-accent' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {isCredit ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description || `${transaction.transaction_type} transaction`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        isCredit ? 'text-accent' : 'text-destructive'
                      }`}>
                        {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;