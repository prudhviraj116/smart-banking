import { useState } from "react";
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

// Mock data - in real app this would come from your API
const mockAccounts = [
  {
    id: "1",
    accountNumber: "****-1234",
    fullAccountNumber: "1234-5678-9012-1234",
    accountType: "Checking",
    balance: 15420.50,
    isDefault: true,
  },
  {
    id: "2", 
    accountNumber: "****-5678",
    fullAccountNumber: "1234-5678-9012-5678",
    accountType: "Savings",
    balance: 45280.75,
    isDefault: false,
  },
  {
    id: "3",
    accountNumber: "****-9012", 
    fullAccountNumber: "1234-5678-9012-9012",
    accountType: "Investment",
    balance: 128450.25,
    isDefault: false,
  },
];

const recentTransactions = [
  { id: "1", type: "credit", amount: 2500, description: "Salary Deposit", date: "2024-01-15" },
  { id: "2", type: "debit", amount: 85.50, description: "Grocery Store", date: "2024-01-14" },
  { id: "3", type: "debit", amount: 1200, description: "Rent Payment", date: "2024-01-13" },
  { id: "4", type: "credit", amount: 150, description: "Refund", date: "2024-01-12" },
];

const Dashboard = () => {
  const [showBalances, setShowBalances] = useState(true);
  
  const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);

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
            <p className="text-muted-foreground mt-1">Welcome back, John Doe</p>
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
                Across {mockAccounts.length} accounts
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(2500)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(1285.50)}</div>
              <p className="text-xs text-muted-foreground">
                -5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Accounts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>
                Manage your bank accounts and balances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAccounts.map((account) => (
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
                        <p className="font-medium">{account.accountType}</p>
                        {account.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
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
              ))}
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
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'credit' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-accent' : 'text-destructive'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;