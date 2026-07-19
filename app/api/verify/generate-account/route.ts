import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateReservedAccount } from '@/lib/monnify'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    const fullName = profile.full_name || profile.business_name || 'BataMarket User'

    // Call Monnify Reserved Account Generation
    const reserved = await generateReservedAccount(user.id, user.email || '', fullName)

    if (!reserved.success) {
      throw new Error(reserved.error || 'Failed to generate reserved account')
    }

    // Save virtual account details to database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        virtual_account_number: reserved.accountNumber,
        virtual_bank_name: reserved.bankName,
        virtual_account_name: reserved.accountName,
        virtual_account_reference: reserved.accountReference,
      })
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      bankName: reserved.bankName,
      accountNumber: reserved.accountNumber,
      accountName: reserved.accountName,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error generating virtual account' }, { status: 500 })
  }
}
