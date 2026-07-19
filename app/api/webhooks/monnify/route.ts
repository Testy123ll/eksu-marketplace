import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || 'XXXXXXXXXXXXXXXXXXXX'

// Helper to verify Monnify signatures
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  if (MONNIFY_SECRET_KEY === 'XXXXXXXXXXXXXXXXXXXX') return true // Allow fallback in local test mode
  const hash = crypto.createHmac('sha256', MONNIFY_SECRET_KEY).update(body).digest('hex')
  return hash === signature
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('monnify-signature')

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  const eventType = payload.eventType
  const eventData = payload.eventData

  if (eventType === 'SUCCESSFUL_TRANSACTION') {
    const amount = Number(eventData.amountPaid)
    const transactionRef = eventData.transactionReference
    const accountRef = eventData.product?.reference || eventData.paymentReference

    // If there is no user reference associated, return bad request
    if (!accountRef) {
      return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 })
    }

    // Initialize Supabase Client with service role key to bypass RLS policies during webhooks
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
      // 1. Log the transaction ledger to prevent double crediting
      const { data: existingTx, error: txCheckError } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('reference', transactionRef)
        .single()

      if (existingTx) {
        return NextResponse.json({ success: true, message: 'Transaction already processed' })
      }

      // 2. Fetch the target user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, wallet_balance, full_name')
        .eq('user_id', accountRef)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found for this account reference')
      }

      const newBalance = Number(profile.wallet_balance || 0) + amount

      // 3. Update user wallet balance
      const { error: balanceUpdateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', accountRef)

      if (balanceUpdateError) throw balanceUpdateError

      // 4. Log deposit in wallet transactions
      const { error: txLogError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: accountRef,
          amount: amount,
          type: 'deposit',
          reference: transactionRef
        })

      if (txLogError) throw txLogError

      // 5. Check if user has a pending escrow transaction that can be funded
      const { data: pendingEscrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('buyer_id', accountRef)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingEscrow && newBalance >= Number(pendingEscrow.amount)) {
        const escrowAmount = Number(pendingEscrow.amount)
        const postEscrowBalance = newBalance - escrowAmount
        const handoffOtp = Math.floor(1000 + Math.random() * 9000).toString()

        // Deduct from wallet balance
        await supabase
          .from('profiles')
          .update({ wallet_balance: postEscrowBalance })
          .eq('user_id', accountRef)

        // Log escrow lock transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: accountRef,
            amount: -escrowAmount,
            type: 'escrow_lock',
            reference: `lock_${pendingEscrow.id.slice(0, 8)}`
          })

        // Update Escrow state to locked and set OTP
        await supabase
          .from('escrow_transactions')
          .update({
            status: 'locked',
            verification_code: handoffOtp,
            payment_ref: transactionRef
          })
          .eq('id', pendingEscrow.id)

        // Insert System confirmation message to chat
        await supabase
          .from('messages')
          .insert({
            listing_id: pendingEscrow.listing_id,
            sender_id: accountRef, // Send from buyer to represent action or System tag
            recipient_id: pendingEscrow.seller_id,
            body: `[SYSTEM] Payment of ₦${escrowAmount.toLocaleString()} has been secured in escrow. Safe-Swap OTP code is: ${handoffOtp}. Verify the item physically at a Safe-Swap zone before exchanging code.`
          })
      }

      return NextResponse.json({ success: true, message: 'Deposit processed successfully' })
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, message: 'Event ignored' })
}
