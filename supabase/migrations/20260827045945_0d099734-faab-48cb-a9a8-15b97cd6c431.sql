CREATE POLICY "Account deletion is disabled"
ON public.accounts
FOR DELETE
TO authenticated
USING (false);

CREATE POLICY "Direct transaction inserts are disabled"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Direct transaction updates are disabled"
ON public.transactions
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Direct transaction deletes are disabled"
ON public.transactions
FOR DELETE
TO authenticated
USING (false);