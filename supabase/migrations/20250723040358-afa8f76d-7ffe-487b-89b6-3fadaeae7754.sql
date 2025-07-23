
-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'checking',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE (accounts.id = transactions.from_account_id OR accounts.id = transactions.to_account_id)
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions from their accounts" ON public.transactions
  FOR INSERT WITH CHECK (
    (from_account_id IS NULL OR EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.id = transactions.from_account_id 
      AND accounts.user_id = auth.uid()
    )) AND
    (to_account_id IS NULL OR EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.id = transactions.to_account_id
    ))
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to generate unique account numbers
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 10-digit account number
    new_number := LPAD(floor(random() * 10000000000)::TEXT, 10, '0');
    
    -- Check if this number already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.accounts 
    WHERE account_number = new_number;
    
    -- If it doesn't exist, we can use it
    IF exists_check = 0 THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to process transactions with balance updates
CREATE OR REPLACE FUNCTION process_transaction(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  from_balance DECIMAL;
  transaction_id UUID;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('deposit', 'withdrawal', 'transfer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- For withdrawals and transfers, check if source account has sufficient balance
  IF p_transaction_type IN ('withdrawal', 'transfer') AND p_from_account_id IS NOT NULL THEN
    SELECT balance INTO from_balance
    FROM public.accounts
    WHERE id = p_from_account_id;

    IF from_balance < p_amount THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient funds');
    END IF;
  END IF;

  -- Create the transaction record
  INSERT INTO public.transactions (
    from_account_id,
    to_account_id,
    amount,
    transaction_type,
    description
  ) VALUES (
    p_from_account_id,
    p_to_account_id,
    p_amount,
    p_transaction_type,
    p_description
  ) RETURNING id INTO transaction_id;

  -- Update account balances
  IF p_transaction_type = 'deposit' AND p_to_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_to_account_id;
  
  ELSIF p_transaction_type = 'withdrawal' AND p_from_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_from_account_id;
  
  ELSIF p_transaction_type = 'transfer' THEN
    -- Deduct from source account
    IF p_from_account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance - p_amount,
          updated_at = now()
      WHERE id = p_from_account_id;
    END IF;
    
    -- Add to destination account
    IF p_to_account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance + p_amount,
          updated_at = now()
      WHERE id = p_to_account_id;
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'transaction_id', transaction_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
