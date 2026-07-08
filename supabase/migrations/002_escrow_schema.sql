-- ============================================================
--  BataMarket — Escrow Schema Migration
-- ============================================================

CREATE TABLE if not exists public.escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    escrow_fee NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status in ('pending_payment', 'locked', 'released', 'disputed', 'refunded')),
    payment_ref TEXT,
    verification_code TEXT, -- 4-digit code for physical meetup verification
    dispute_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX if not exists escrow_transactions_listing_id_idx on public.escrow_transactions(listing_id);
CREATE INDEX if not exists escrow_transactions_buyer_id_idx on public.escrow_transactions(buyer_id);
CREATE INDEX if not exists escrow_transactions_seller_id_idx on public.escrow_transactions(seller_id);
CREATE INDEX if not exists escrow_transactions_status_idx on public.escrow_transactions(status);

-- Enable RLS
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Allow select/read policies
DROP POLICY IF EXISTS "Users can read escrow transactions they participate in" ON public.escrow_transactions;
CREATE POLICY "Users can read escrow transactions they participate in"
  ON public.escrow_transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Allow insert policies
DROP POLICY IF EXISTS "Authenticated users can create escrow transactions" ON public.escrow_transactions;
CREATE POLICY "Authenticated users can create escrow transactions"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Allow update policies
DROP POLICY IF EXISTS "Participants or admins can update escrow transactions" ON public.escrow_transactions;
CREATE POLICY "Participants or admins can update escrow transactions"
  ON public.escrow_transactions FOR UPDATE
  USING (
    auth.uid() = buyer_id 
    OR auth.uid() = seller_id 
    OR (SELECT COALESCE(is_admin, FALSE) FROM public.profiles WHERE user_id = auth.uid())
  );

-- Enable Realtime for escrow_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
