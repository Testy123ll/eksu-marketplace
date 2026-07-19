import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { disbursePayout } from '@/lib/monnify'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { transactionId } = await request.json()
    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Missing transactionId' }, { status: 400 })
    }

    // 1. Fetch the transaction details using service client to ensure full read access
    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !tx) {
      return NextResponse.json({ success: false, error: 'Escrow transaction not found' }, { status: 404 })
    }

    // Verify that the status is indeed 'released' (payout only allowed for completed swaps)
    if (tx.status !== 'released') {
      return NextResponse.json({ success: false, error: 'Escrow transaction is not in released status' }, { status: 400 })
    }

    // 2. Prevent duplicate disbursements by checking transaction logs
    const payoutReference = `disburse_${tx.id.slice(0, 8)}`
    const { data: existingPayout, error: payoutCheckError } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('reference', payoutReference)
      .single()

    if (existingPayout) {
      return NextResponse.json({ success: true, message: 'Disbursement payout already executed for this transaction' })
    }

    // 3. Fetch the seller's payout bank details
    const { data: sellerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('payout_bank_code, payout_account_number, payout_account_name')
      .eq('user_id', tx.seller_id)
      .single()

    if (profileError || !sellerProfile) {
      return NextResponse.json({ success: false, error: 'Seller profile or payout details not found' }, { status: 404 })
    }

    if (!sellerProfile.payout_account_number || !sellerProfile.payout_bank_code) {
      return NextResponse.json({ success: false, error: 'Seller has not registered payout bank details yet' }, { status: 400 })
    }

    // 4. Trigger Monnify Disbursement payout
    const payoutAmount = Number(tx.amount)
    const disburse = await disbursePayout(
      sellerProfile.payout_account_number,
      sellerProfile.payout_bank_code,
      payoutAmount,
      `BataMarket Escrow Payout - Ref: ${tx.id.slice(0, 8)}`
    )

    if (!disburse.success) {
      throw new Error(disburse.error || 'Failed to complete payout disbursement through Monnify')
    }

    // 5. Log the payout in wallet transaction ledger
    const { error: logError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: tx.seller_id,
        amount: -payoutAmount,
        type: 'escrow_payout',
        reference: payoutReference
      })

    if (logError) throw logError

    return NextResponse.json({ success: true, reference: disburse.reference })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error processing escrow disbursement' }, { status: 500 })
  }
}
