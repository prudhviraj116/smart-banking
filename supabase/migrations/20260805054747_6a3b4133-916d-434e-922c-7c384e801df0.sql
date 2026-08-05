-- 1. Stop exposing the account-number generator to clients
REVOKE ALL ON FUNCTION public.generate_account_number() FROM anon, authenticated, PUBLIC;

-- 2. Auto-generate account numbers + force zero starting balance on insert
CREATE OR REPLACE FUNCTION public.accounts_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_number IS NULL OR btrim(NEW.account_number) = '' THEN
    NEW.account_number := public.generate_account_number();
  END IF;
  -- Clients must never seed their own balance
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.account_number := public.generate_account_number();
    NEW.balance := 0;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.accounts_before_insert() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS accounts_before_insert ON public.accounts;
CREATE TRIGGER accounts_before_insert
BEFORE INSERT ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.accounts_before_insert();

-- 3. Block direct balance / ownership tampering by clients
CREATE OR REPLACE FUNCTION public.accounts_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.balance IS DISTINCT FROM OLD.balance THEN
      RAISE EXCEPTION 'Balance cannot be modified directly';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Account ownership cannot be changed';
    END IF;
    IF NEW.account_number IS DISTINCT FROM OLD.account_number THEN
      RAISE EXCEPTION 'Account number cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.accounts_before_update() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS accounts_before_update ON public.accounts;
CREATE TRIGGER accounts_before_update
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.accounts_before_update();

-- 4. process_transaction: require an authenticated caller
CREATE OR REPLACE FUNCTION public.process_transaction(p_from_account_id uuid, p_to_account_id uuid, p_amount numeric, p_transaction_type text, p_description text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_tx_id UUID; v_balance NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;
  IF p_transaction_type NOT IN ('deposit','withdrawal','transfer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  IF p_transaction_type = 'deposit' AND p_to_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination account required');
  END IF;
  IF p_transaction_type IN ('withdrawal','transfer') AND p_from_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source account required');
  END IF;

  -- Deposits must land in an account the caller owns
  IF p_transaction_type = 'deposit' AND NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE id = p_to_account_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination account not found');
  END IF;

  IF p_from_account_id IS NOT NULL THEN
    SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = auth.uid() FOR UPDATE;
    IF v_balance IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Source account not found');
    END IF;
    IF v_balance < p_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
    END IF;
    UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
  END IF;

  IF p_to_account_id IS NOT NULL THEN
    UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Destination account not found');
    END IF;
  END IF;

  INSERT INTO public.transactions (from_account_id, to_account_id, amount, transaction_type, description, status)
  VALUES (p_from_account_id, p_to_account_id, p_amount, p_transaction_type, p_description, 'completed')
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id);
END; $function$;

REVOKE ALL ON FUNCTION public.process_transaction(uuid, uuid, numeric, text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_transaction(uuid, uuid, numeric, text, text) TO authenticated;
