ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.transactions FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;

CREATE POLICY "Users manage own transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- After creating your Supabase Auth user, replace the email and run this once
-- to assign existing rows to that account:
-- UPDATE public.transactions AS t
-- SET user_id = u.id
-- FROM auth.users AS u
-- WHERE u.email = 'your-email@example.com'
--   AND t.user_id IS NULL;