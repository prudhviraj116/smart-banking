-- Add KYC fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_mobile_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

-- Create mobile verification table for OTP tracking
CREATE TABLE IF NOT EXISTS public.mobile_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on mobile_verifications
ALTER TABLE public.mobile_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for mobile_verifications
CREATE POLICY "Users can view their own mobile verifications"
ON public.mobile_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mobile verifications"
ON public.mobile_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mobile verifications"
ON public.mobile_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Add constraint to ensure accounts can only be created for verified users
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS can_create_account BOOLEAN DEFAULT FALSE;

-- Update the handle_new_user function to set default verification status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_email_verified, kyc_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    'pending'
  );
  RETURN NEW;
END;
$$;