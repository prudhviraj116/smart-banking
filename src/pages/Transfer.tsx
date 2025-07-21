import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowRight, CreditCard, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Mock accounts data
const mockAccounts = [
  {
    id: "1",
    accountNumber: "1234-5678-9012-1234",
    accountType: "Checking",
    balance: 15420.50,
  },
  {
    id: "2", 
    accountNumber: "1234-5678-9012-5678",
    accountType: "Savings",
    balance: 45280.75,
  },
  {
    id: "3",
    accountNumber: "1234-5678-9012-9012",
    accountType: "Investment",
    balance: 128450.25,
  },
];

const Transfer = () => {
  const [formData, setFormData] = useState({
    sourceAccount: "",
    targetAccount: "",
    amount: "",
    note: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedAccount = mockAccounts.find(acc => acc.id === formData.sourceAccount);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.sourceAccount) {
      newErrors.sourceAccount = "Please select a source account";
    }

    if (!formData.targetAccount) {
      newErrors.targetAccount = "Please enter a target account number";
    } else if (formData.targetAccount === selectedAccount?.accountNumber) {
      newErrors.targetAccount = "Cannot transfer to the same account";
    }

    if (!formData.amount) {
      newErrors.amount = "Please enter an amount";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Please enter a valid amount";
      } else if (selectedAccount && amount > selectedAccount.balance) {
        newErrors.amount = "Insufficient funds";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate transfer process
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Transfer Successful",
        description: `$${formData.amount} has been transferred successfully.`,
      });
      navigate("/dashboard");
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transfer Funds</h1>
          <p className="text-muted-foreground mt-1">Send money between accounts securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Transfer Details
                </CardTitle>
                <CardDescription>
                  Enter the transfer information below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Source Account */}
                  <div className="space-y-2">
                    <Label htmlFor="sourceAccount">From Account</Label>
                    <Select 
                      value={formData.sourceAccount} 
                      onValueChange={(value) => handleInputChange("sourceAccount", value)}
                    >
                      <SelectTrigger className={`h-12 ${errors.sourceAccount ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        {mockAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{account.accountType}</span>
                                <span className="text-muted-foreground ml-2">
                                  ****-{account.accountNumber.slice(-4)}
                                </span>
                              </div>
                              <span className="text-sm font-semibold ml-4">
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sourceAccount && (
                      <p className="text-sm text-destructive">{errors.sourceAccount}</p>
                    )}
                  </div>

                  {/* Target Account */}
                  <div className="space-y-2">
                    <Label htmlFor="targetAccount">To Account Number</Label>
                    <Input
                      id="targetAccount"
                      type="text"
                      placeholder="1234-5678-9012-3456"
                      value={formData.targetAccount}
                      onChange={(e) => handleInputChange("targetAccount", e.target.value)}
                      className={`h-12 ${errors.targetAccount ? 'border-destructive' : ''}`}
                    />
                    {errors.targetAccount && (
                      <p className="text-sm text-destructive">{errors.targetAccount}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className={`h-12 ${errors.amount ? 'border-destructive' : ''}`}
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount}</p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note for this transfer..."
                      value={formData.note}
                      onChange={(e) => handleInputChange("note", e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-banking-gradient hover:shadow-glow transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing Transfer..." : "Transfer Funds"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Summary */}
          <div className="space-y-6">
            {/* Account Balance */}
            {selectedAccount && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {formatCurrency(selectedAccount.balance)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedAccount.accountType} Account
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ****-{selectedAccount.accountNumber.slice(-4)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure Transfer</strong>
                <br />
                All transfers are encrypted and protected by bank-level security. 
                You will receive a confirmation once the transfer is completed.
              </AlertDescription>
            </Alert>

            {/* Transfer Limits */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfer Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <span className="font-medium">$10,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Limit:</span>
                  <span className="font-medium">$50,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Time:</span>
                  <span className="font-medium">Instant</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;