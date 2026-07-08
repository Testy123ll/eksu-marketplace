-- ============================================================
--  BataMarket — Listings Stock, Variants, and Handoff RPC Migration
-- ============================================================

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS variants TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_catalog_item BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.complete_handoff_code(
  transaction_uuid UUID,
  input_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trans_rec RECORD;
  listing_rec RECORD;
BEGIN
  -- 1. Fetch transaction record
  SELECT * INTO trans_rec 
  FROM public.escrow_transactions 
  WHERE id = transaction_uuid AND status = 'locked';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction not found or already completed');
  END IF;
  
  -- 2. Verify code
  IF trans_rec.verification_code <> input_code THEN
    RETURN jsonb_build_object('success', false, 'message', 'Incorrect handoff code');
  END IF;
  
  -- 3. Update transaction status
  UPDATE public.escrow_transactions
  SET status = 'released', updated_at = now()
  WHERE id = transaction_uuid;
  
  -- 4. Process listing stock/status
  SELECT * INTO listing_rec FROM public.listings WHERE id = trans_rec.listing_id;
  IF FOUND THEN
    IF listing_rec.is_catalog_item THEN
      -- Catalog items remain active
      NULL;
    ELSIF listing_rec.quantity > 1 THEN
      -- Decrement quantity
      UPDATE public.listings 
      SET quantity = quantity - 1, 
          status = CASE WHEN quantity - 1 <= 0 THEN 'sold' ELSE 'active' END,
          updated_at = now()
      WHERE id = trans_rec.listing_id;
    ELSE
      -- Standard listing is marked sold
      UPDATE public.listings 
      SET status = 'sold', updated_at = now()
      WHERE id = trans_rec.listing_id;
    END IF;
  END IF;
  
  -- 5. Insert trust events for reputation boost (+5 each)
  INSERT INTO public.trust_events (user_id, event_type, weight)
  VALUES 
    (trans_rec.buyer_id, 'successful_swap_buyer', 5),
    (trans_rec.seller_id, 'successful_swap_seller', 5);
    
  RETURN jsonb_build_object('success', true, 'message', 'Handoff verified successfully');
END;
$$;
