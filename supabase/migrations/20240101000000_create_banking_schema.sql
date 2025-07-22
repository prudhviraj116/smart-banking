-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create accounts table
CREATE TABLE accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  account_type VARCHAR(20) NOT NULL DEFAULT 'checking',
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions for their accounts" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE (accounts.id = transactions.from_account_id OR accounts.id = transactions.to_account_id)
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for their accounts" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.from_account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Function to generate unique account numbers
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_number VARCHAR(20);
  exists_check INTEGER;
BEGIN
  LOOP
    new_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
    SELECT COUNT(*) INTO exists_check FROM accounts WHERE account_number = new_number;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance and create transaction
CREATE OR REPLACE FUNCTION process_transaction(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount DECIMAL(15,2),
  p_transaction_type VARCHAR(20),
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_from_balance DECIMAL(15,2);
  v_transaction_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if it's a transfer and validate balance
    IF p_transaction_type = 'transfer' AND p_from_account_id IS NOT NULL THEN
      SELECT balance INTO v_from_balance FROM accounts 
      WHERE id = p_from_account_id AND user_id = auth.uid();
      
      IF v_from_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Source account not found');
      END IF;
      
      IF v_from_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient funds');
      END IF;
      
      -- Check if target account exists
      IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_to_account_id) THEN
        RETURN json_build_object('success', false, 'error', 'Target account not found');
      END IF;
      
      -- Update balances
      UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
      UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_account_id;
      
    ELSIF p_transaction_type = 'deposit' THEN
      UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_account_id AND user_id = auth.uid();
      
    ELSIF p_transaction_type = 'withdrawal' THEN
      SELECT balance INTO v_from_balance FROM accounts 
      WHERE id = p_from_account_id AND user_id = auth.uid();
      
      IF v_from_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient funds');
      END IF;
      
      UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
    END IF;
    
    -- Create transaction record
    INSERT INTO transactions (from_account_id, to_account_id, transaction_type, amount, description)
    VALUES (p_from_account_id, p_to_account_id, p_transaction_type, p_amount, p_description)
    RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;