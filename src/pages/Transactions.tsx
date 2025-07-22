import { useState, useEffect } from "react";
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
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState(searchParams.get("account") || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount && selectedAccount !== "all") {
      loadTransactions(selectedAccount);
    } else if (selectedAccount === "all" && accounts.length > 0) {
      loadAllTransactions();
    }
  }, [selectedAccount, accounts]);

  const loadAccounts = async () => {
    try {
      const accountsData = await apiClient.getAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0].id);
      }
    } catch (error) {
      toast({
        title: "Error loading accounts",
        description: error instanceof Error ? error.message : "Failed to load accounts",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async (accountId: string) => {
    try {
      setLoading(true);
      const transactionsData = await apiClient.getTransactions(accountId);
      setTransactions(transactionsData);
    } catch (error) {
      toast({
        title: "Error loading transactions",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTransactions = async () => {
    try {
      setLoading(true);
      const allTransactions = [];
      for (const account of accounts) {
        try {
          const transactionsData = await apiClient.getTransactions(account.id);
          allTransactions.push(...transactionsData);
        } catch (error) {
          // Continue if one account fails
        }
      }
      // Sort by date desc
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTransactions);
    } catch (error) {
      toast({
        title: "Error loading transactions",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = (transaction.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || 
      (filterType === "credit" && (transaction.transaction_type === "deposit" || 
        (transaction.transaction_type === "transfer" && selectedAccount === transaction.to_account_id))) ||
      (filterType === "debit" && (transaction.transaction_type === "withdrawal" || 
        (transaction.transaction_type === "transfer" && selectedAccount === transaction.from_account_id)));
    return matchesSearch && matchesType;
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

  const getTransactionIcon = (transaction: any) => {
    const isCredit = transaction.transaction_type === "deposit" || 
      (transaction.transaction_type === "transfer" && selectedAccount === transaction.to_account_id);
    return isCredit ? (
      <ArrowUpRight className="w-4 h-4" />
    ) : (
      <ArrowDownLeft className="w-4 h-4" />
    );
  };

  const getTransactionColor = (transaction: any) => {
    const isCredit = transaction.transaction_type === "deposit" || 
      (transaction.transaction_type === "transfer" && selectedAccount === transaction.to_account_id);
    return isCredit ? "text-accent" : "text-destructive";
  };

  const getTransactionBg = (transaction: any) => {
    const isCredit = transaction.transaction_type === "deposit" || 
      (transaction.transaction_type === "transfer" && selectedAccount === transaction.to_account_id);
    return isCredit ? "bg-accent/10" : "bg-destructive/10";
  };

  const selectedAccountData = accounts.find(acc => acc.id === selectedAccount);

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
        {selectedAccountData && selectedAccount !== "all" && (
          <Card className="shadow-card mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{selectedAccountData.account_type} Account</h3>
                    <p className="text-muted-foreground">****{selectedAccountData.account_number.slice(-4)}</p>
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
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_type} (****{account.account_number.slice(-4)})
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
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions found matching your criteria.</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isCredit = transaction.transaction_type === "deposit" || 
                    (transaction.transaction_type === "transfer" && selectedAccount === transaction.to_account_id);
                  
                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getTransactionBg(transaction)} ${getTransactionColor(transaction)}`}>
                          {getTransactionIcon(transaction)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {transaction.description || `${transaction.transaction_type} transaction`}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {transaction.transaction_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                            {transaction.transaction_type === "transfer" && (
                              <p className="text-xs text-muted-foreground">
                                {selectedAccount === transaction.from_account_id 
                                  ? `To: ****${transaction.to_account?.account_number?.slice(-4) || 'Unknown'}`
                                  : `From: ****${transaction.from_account?.account_number?.slice(-4) || 'Unknown'}`
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getTransactionColor(transaction)}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {transaction.status || "Completed"}
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