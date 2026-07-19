// Monnify Payment Gateway Integration Service Layer

const BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com'
const API_KEY = process.env.MONNIFY_API_KEY || 'MK_TEST_XXXXXXXXXX'
const SECRET_KEY = process.env.MONNIFY_SECRET_KEY || 'XXXXXXXXXXXXXXXXXXXX'
const CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '0000000000'

interface ReservedAccountResponse {
  success: boolean
  bankName?: string
  accountNumber?: string
  accountName?: string
  accountReference?: string
  error?: string
}

interface DisburseResponse {
  success: boolean
  reference?: string
  status?: string
  error?: string
}

// 1. Fetch Bearer Access Token from Monnify
export async function getMonnifyAccessToken(): Promise<string | null> {
  try {
    const authHeader = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString('base64')
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to log in to Monnify API: ${errText}`)
    }

    const json = await res.json()
    return json.responseBody?.accessToken || null
  } catch (error) {
    return null
  }
}

// 2. Generate persistent virtual account number for a user
export async function generateReservedAccount(
  userId: string,
  email: string,
  fullName: string
): Promise<ReservedAccountResponse> {
  try {
    // If running in sandbox environment with dummy keys, mock successful generation to allow offline testing
    if (API_KEY === 'MK_TEST_XXXXXXXXXX') {
      const mockAccountNo = Math.floor(1000000000 + Math.random() * 9000000000).toString()
      return {
        success: true,
        bankName: 'Wema Bank (Sandbox)',
        accountNumber: mockAccountNo,
        accountName: `BataMarket - ${fullName}`,
        accountReference: userId,
      }
    }

    const token = await getMonnifyAccessToken()
    if (!token) throw new Error('Could not get Monnify access token')

    const res = await fetch(`${BASE_URL}/api/v1/bank-transfer/reserved-accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountReference: userId,
        accountName: `BataMarket - ${fullName}`,
        currencyCode: 'NGN',
        contractCode: CONTRACT_CODE,
        customerEmail: email,
        customerName: fullName,
        getAllAvailableBanks: true,
      }),
    })

    const json = await res.json()
    if (!json.requestSuccessful || !json.responseBody) {
      throw new Error(json.responseMessage || 'Reserved account request rejected by Monnify')
    }

    const account = json.responseBody.accounts?.[0]
    return {
      success: true,
      bankName: account?.bankName || 'Wema Bank',
      accountNumber: account?.accountNumber || '',
      accountName: json.responseBody.accountName,
      accountReference: json.responseBody.accountReference,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown reserved account error' }
  }
}

// 3. Payout earnings from the merchant wallet to the user's personal bank account
export async function disbursePayout(
  accountNumber: string,
  bankCode: string,
  amount: number,
  narration: string
): Promise<DisburseResponse> {
  try {
    const reference = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    // Mock response for testing/dummy environment
    if (API_KEY === 'MK_TEST_XXXXXXXXXX') {
      return {
        success: true,
        reference,
        status: 'SUCCESS',
      }
    }

    const token = await getMonnifyAccessToken()
    if (!token) throw new Error('Could not get Monnify access token')

    const res = await fetch(`${BASE_URL}/api/v1/disbursements/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        reference,
        narration,
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        currency: 'NGN',
        sourceAccountNumber: process.env.MONNIFY_MERCHANT_WALLET_NUMBER || '',
      }),
    })

    const json = await res.json()
    if (!json.requestSuccessful || !json.responseBody) {
      throw new Error(json.responseMessage || 'Disbursement request rejected by Monnify')
    }

    return {
      success: true,
      reference: json.responseBody.reference,
      status: json.responseBody.status,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Payout transfer failed' }
  }
}
