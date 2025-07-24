import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { User, Phone, MapPin, Calendar, Mail, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const KYC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    date_of_birth: "",
    gender: "",
    address: "",
    mobile_number: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          email: profile.email || user.email || "",
          date_of_birth: profile.date_of_birth || "",
          gender: profile.gender || "",
          address: profile.address || "",
          mobile_number: profile.mobile_number || "",
        });

        // Check verification status and set appropriate step
        if (profile.is_mobile_verified && profile.is_email_verified) {
          navigate('/dashboard');
        } else if (profile.mobile_number && !profile.is_mobile_verified) {
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update profile with KYC data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
          mobile_number: formData.mobile_number,
          kyc_status: 'submitted',
          kyc_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "KYC Information Saved",
        description: "Your information has been saved. Now let's verify your mobile number.",
      });

      setCurrentStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save KYC information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!formData.mobile_number) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          mobile_number: formData.mobile_number,
          user_id: user.id
        }
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your mobile for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          mobile_number: formData.mobile_number,
          otp_code: otpCode,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Mobile Verified",
        description: "Your mobile number has been verified successfully!",
      });

      // Check if email is also verified to determine next step
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_email_verified')
        .eq('id', user.id)
        .single();

      if (profile?.is_email_verified) {
        navigate('/dashboard');
      } else {
        setCurrentStep(3);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Complete Your KYC Information
        </CardTitle>
        <CardDescription>
          Please provide your personal details to verify your identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleKYCSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                type="tel"
                placeholder="+1234567890"
                value={formData.mobile_number}
                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter your complete address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-banking-gradient hover:shadow-glow"
          >
            {isLoading ? "Saving..." : "Save KYC Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Verify Mobile Number
        </CardTitle>
        <CardDescription>
          We'll send a verification code to {formData.mobile_number}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!otpSent ? (
          <Button
            onClick={sendOTP}
            disabled={isLoading}
            className="w-full bg-banking-gradient hover:shadow-glow"
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enter Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP value={otpCode} onChange={setOtpCode} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            
            <Button
              onClick={verifyOTP}
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-banking-gradient hover:shadow-glow"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setOtpSent(false)}
              className="w-full"
            >
              Resend Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Verification Required
        </CardTitle>
        <CardDescription>
          Please check your email and click the verification link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="space-y-2">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-sm text-muted-foreground">
            A verification email has been sent to {formData.email}
          </p>
        </div>
        
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-banking-gradient hover:shadow-glow"
        >
          I've Verified My Email
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full">
        {/* Progress indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>KYC Info</span>
            <span>Mobile Verify</span>
            <span>Email Verify</span>
          </div>
        </div>

        {/* Step content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default KYC;