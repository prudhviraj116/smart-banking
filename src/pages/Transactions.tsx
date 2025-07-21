import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  Download,
  Calendar,
  CreditCard
} from "lucide-react";

// Mock accounts data
const mockAccounts = [
  {
    id: "1",
    accountNumber: "****-1234",
    accountType: "Checking",
    balance: 15420.50,
  },
  {
    id: "2", 
    accountNumber: "****-5678",
    accountType: "Savings",
    balance: 45280.75,
  },
  {
    id: "3",
    accountNumber: "****-9012",
    accountType: "Investment",
    balance: 128450.25,
  },
];

// Mock transactions data
const mockTransactions = [
  {
    id: "1",
    accountId: "1",
    type: "credit",
    amount: 2500.00,
    description: "Salary Deposit",
    note: "Monthly salary from ABC Corp",
    timestamp: "2024-01-15T09:00:00Z",
    category: "Income",
    status: "completed"
  },
  {
    id: "2",
    accountId: "1", 
    type: "debit",
    amount: 85.50,
    description: "Grocery Store",
    note: "Weekly groceries at SuperMart",
    timestamp: "2024-01-14T16:30:00Z",
    category: "Shopping",
    status: "completed"
  },
  {
    id: "3",
    accountId: "1",
    type: "debit", 
    amount: 1200.00,
    description: "Rent Payment",
    note: "Monthly rent for apartment",
    timestamp: "2024-01-13T10:00:00Z",
    category: "Bills",
    status: "completed"
  },
  {
    id: "4",
    accountId: "2",
    type: "credit",
    amount: 150.00,
    description: "Refund",
    note: "Refund for returned item",
    timestamp: "2024-01-12T14:20:00Z",
    category: "Refund",
    status: "completed"
  },
  {
    id: "5",
    accountId: "2",
    type: "debit",
    amount: 500.00,
    description: "Transfer to Checking",
    note: "Internal transfer",
    timestamp: "2024-01-11T11:15:00Z",
    category: "Transfer",
    status: "completed"
  },
  {
    id: "6",
    accountId: "3",
    type: "credit",
    amount: 1000.00,
    description: "Investment Dividend",
    note: "Quarterly dividend payment",
    timestamp: "2024-01-10T08:00:00Z",
    category: "Investment",
    status: "completed"
  },
  {
    id: "7",
    accountId: "1",
    type: "debit",
    amount: 75.25,
    description: "Gas Station",
    note: "Fuel purchase",
    timestamp: "2024-01-09T18:45:00Z",
    category: "Transportation",
    status: "completed"
  },
  {
    id: "8",
    accountId: "1",
    type: "debit",
    amount: 45.00,
    description: "Restaurant",
    note: "Dinner at Italian Bistro",
    timestamp: "2024-01-08T19:30:00Z",
    category: "Dining",
    status: "completed"
  },
];

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const [selectedAccount, setSelectedAccount] = useState(searchParams.get("account") || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesAccount = selectedAccount === "all" || transaction.accountId === selectedAccount;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.note.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    
    return matchesAccount && matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === "credit" ? (
      <ArrowUpRight className="w-4 h-4" />
    ) : (
      <ArrowDownLeft className="w-4 h-4" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === "credit" ? "text-accent" : "text-destructive";
  };

  const getTransactionBg = (type: string) => {
    return type === "credit" ? "bg-accent/10" : "bg-destructive/10";
  };

  const selectedAccountData = mockAccounts.find(acc => acc.id === selectedAccount);

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground mt-1">View and manage your account transactions</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button asChild className="bg-banking-gradient hover:shadow-glow">
              <Link to="/transfer" className="flex items-center gap-2">
                Transfer Funds
              </Link>
            </Button>
          </div>
        </div>

        {/* Account Summary */}
        {selectedAccountData && (
          <Card className="shadow-card mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAccountData.accountType} Account</h3>
                    <p className="text-muted-foreground">{selectedAccountData.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedAccountData.balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Account Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-background border border-border shadow-sm z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="all">All Accounts</SelectItem>
                    {mockAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountType} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background border border-border shadow-sm z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range - Placeholder */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last 30 days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  Showing {filteredTransactions.length} transactions
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found matching your criteria.</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const account = mockAccounts.find(acc => acc.id === transaction.accountId);
                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getTransactionBg(transaction.type)} ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{transaction.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{transaction.note}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.timestamp)}
                            </p>
                            {account && (
                              <p className="text-xs text-muted-foreground">
                                {account.accountType} ({account.accountNumber})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;