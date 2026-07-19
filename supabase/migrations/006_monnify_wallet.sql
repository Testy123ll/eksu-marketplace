-- Extension of profiles table and creation of wallet transaction logging
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS virtual_account_number TEXT,
ADD COLUMN IF NOT EXISTS virtual_bank_name TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_name TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_reference TEXT,
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payout_bank_code TEXT,
ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
ADD COLUMN IF NOT EXISTS payout_account_name TEXT;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'escrow_lock', 'escrow_payout', 'escrow_refund')),
    reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);
