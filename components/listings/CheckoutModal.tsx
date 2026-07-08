'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  listingId?: string
  listingTitle?: string
  price: number
  paymentType: 'boost' | 'listing_fee' | 'vendor_subscription' | 'escrow'
  sellerId?: string
}

export default function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  listingId,
  listingTitle,
  price,
  paymentType,
  sellerId,
}: CheckoutModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'success'>('details')
  const [error, setError] = useState<string | null>(null)

  // Card details form
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber || !expiry || !cvv || !cardName) {
      setError('Please fill in all card details.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to complete a payment.')

      // Generate a mock Paystack reference
      const refPrefix = 
        paymentType === 'boost' 
          ? 'bm_boost_' 
          : paymentType === 'listing_fee' 
          ? 'bm_fee_' 
          : paymentType === 'vendor_subscription' 
          ? 'bm_sub_' 
          : 'bm_escrow_'
      const paymentRef = `${refPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // 1. Log transaction
      const isEscrow = paymentType === 'escrow'
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listingId || null,
          buyer_id: user.id,
          seller_id: isEscrow ? (sellerId || null) : user.id,
          amount: price,
          payment_ref: paymentRef,
          type: paymentType === 'boost' ? 'featured_listing' : 'listing_payment',
          status: 'completed',
        })

      if (txError) throw txError

      // 2. Update statuses
      if (paymentType === 'boost') {
        const boostExpiresAt = new Date()
        boostExpiresAt.setHours(boostExpiresAt.getHours() + 48) // 48 hours boost

        const { error: listingError } = await supabase
          .from('listings')
          .update({
            is_boosted: true,
            boost_expires_at: boostExpiresAt.toISOString(),
          })
          .eq('id', listingId)

        if (listingError) throw listingError
      } else if (paymentType === 'listing_fee') {
        const { error: listingError } = await supabase
          .from('listings')
          .update({
            listing_fee_paid: true,
            listing_fee_amount: price,
            paystack_ref: paymentRef,
            status: 'active',
          })
          .eq('id', listingId)

        if (listingError) throw listingError

        // Increment listings_used_free on profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('listings_used_free')
          .eq('user_id', user.id)
          .single()
        
        const currentCount = profile?.listings_used_free ?? 0
        const newCount = Math.min(3, currentCount + 1)

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ listings_used_free: newCount })
          .eq('user_id', user.id)

        if (profileError) throw profileError
      } else if (paymentType === 'vendor_subscription') {
        const nextBill = new Date()
        nextBill.setDate(nextBill.getDate() + 30) // 30 days billing cycle

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString(),
            next_billing_date: nextBill.toISOString()
          })
          .eq('user_id', user.id)

        if (profileError) throw profileError
      } else if (paymentType === 'escrow') {
        if (!sellerId) throw new Error('Seller ID is required for escrow.')
        const verifyCode = Math.floor(1000 + Math.random() * 9000).toString() // Generate '1000' - '9999'

        const { error: escrowError } = await supabase
          .from('escrow_transactions')
          .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: sellerId,
            amount: price,
            escrow_fee: Number((price * 0.01).toFixed(2)), // 1% escrow fee
            status: 'locked',
            payment_ref: paymentRef,
            verification_code: verifyCode,
          })

        if (escrowError) throw escrowError

        // Insert system message in chat
        await supabase.from('messages').insert({
          sender_id: user.id,
          recipient_id: sellerId,
          listing_id: listingId,
          body: `System: Escrow Payment Secured. ₦${price.toLocaleString()} is locked in BataEscrow. Buyer: please obtain the verification code from the seller after inspection.`,
        })
      }

      // Celebrate success!
      confetti({ particleCount: 150, spread: 80 })
      setStep('success')
      
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Payment processing failed.')
    } finally {
      setLoading(false)
    }
  }

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const formatted = value.replace(/(.{4})/g, '$1 ').trim()
    setCardNumber(formatted.slice(0, 19))
  }

  // Format expiry with slash
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2) {
      setExpiry(value)
    } else {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`)
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setCvv(value.slice(0, 3))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl relative"
          >
            {/* Paystack header block */}
            <div className="bg-[#1fc396] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Paystack Checkout</h3>
                  <p className="text-[10px] opacity-90">Secured transaction simulation</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:opacity-80 font-bold">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {step === 'details' ? (
                <form onSubmit={handlePay} className="space-y-4">
                  <div className="text-center bg-surface-low border border-border p-3.5 rounded-xl">
                    <p className="text-xs text-muted">
                      {paymentType === 'boost' && 'Feature Boost for:'}
                      {paymentType === 'listing_fee' && 'Listing Fee for:'}
                      {paymentType === 'vendor_subscription' && 'Vendor Subscription:'}
                      {paymentType === 'escrow' && 'Escrow Lock Deposit:'}
                    </p>
                    {listingTitle && (
                      <p className="text-sm font-bold truncate text-primary mt-0.5">{listingTitle}</p>
                    )}
                    {paymentType === 'vendor_subscription' && (
                      <p className="text-sm font-bold text-primary mt-0.5">30-Day Monthly Plan</p>
                    )}
                    <p className="text-xl font-display font-extrabold text-brand-mint mt-2">₦{price.toLocaleString()}</p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">{error}</div>
                  )}

                  <Input
                    label="Cardholder Name"
                    placeholder="e.g. Isaac Testimony"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />

                  <Input
                    label="Card Number"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={handleCvvChange}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-[10px] text-muted">
                    <svg className="w-3.5 h-3.5 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Your real payment details are never processed. This is a secure developer mock.
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12 bg-[#1fc396] hover:bg-[#1bb087] border-[#1fc396] text-white"
                    loading={loading}
                  >
                    Pay ₦{price.toLocaleString()}
                  </Button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1fc396]/10 text-[#1fc396] flex items-center justify-center text-3xl mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Payment Successful</h3>
                    <p className="text-xs text-muted mt-1">
                      {paymentType === 'boost' && `Your listing "${listingTitle}" has been featured for 48 hours!`}
                      {paymentType === 'listing_fee' && `Your listing "${listingTitle}" has been published successfully!`}
                      {paymentType === 'vendor_subscription' && "Your vendor subscription has been successfully activated!"}
                      {paymentType === 'escrow' && `Your payment of ₦${price.toLocaleString()} is now locked in BataEscrow. Return to chat to complete the swap.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
