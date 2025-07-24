import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface VerificationPromptProps {
  email: string;
  onBack: () => void;
}

export const VerificationPrompt = ({ email, onBack }: VerificationPromptProps) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await apiClient.resendVerification(email);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to Resend",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold">Check Your Email</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification link to<br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Click the link in the email to verify your account.</p>
          <p>After verification, you can log in to your account.</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            variant="outline"
            className="w-full h-12"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full h-12"
          >
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};