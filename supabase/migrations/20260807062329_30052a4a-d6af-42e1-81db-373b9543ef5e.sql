CREATE OR REPLACE FUNCTION public.process_transaction(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_description text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_tx_id UUID; v_balance NUMERIC; v_uid UUID;
BEGIN
  -- Client roles are bound to their own JWT identity; trusted server callers
  -- (service_role) may state the acting user explicitly.
  IF current_user IN ('anon', 'authenticated') THEN
    v_uid := auth.uid();
  ELSE
    v_uid := COALESCE(p_user_id, auth.uid());
  END IF;

  IF v_uid IS NULL THEN
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

  IF p_transaction_type = 'deposit' AND NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE id = p_to_account_id AND user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination account not found');
  END IF;

  IF p_from_account_id IS NOT NULL THEN
    SELECT balance INTO v_balance FROM public.accounts
      WHERE id = p_from_account_id AND user_id = v_uid FOR UPDATE;
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

REVOKE ALL ON FUNCTION public.process_transaction(uuid, uuid, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_transaction(uuid, uuid, numeric, text, text, uuid) TO service_role;