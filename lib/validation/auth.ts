import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const studentOnboardingSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  department: z.string().min(2, 'Please enter a valid department'),
  level: z.coerce.number().min(100, 'Level must be at least 100').max(700, 'Level cannot exceed 700'),
  phoneNumber: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number (e.g. 08034567890)'),
  idPhotoUrl: z.string().min(1, 'Please upload a photo of your NIN slip or card'),
  selfieUrl: z.string().min(1, 'Please take a live selfie'),
  payoutBankCode: z.string().min(1, 'Please select your bank'),
  payoutAccountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
})

// Step-1 only schema (no photo fields) — uses z.number() so input/output types align with react-hook-form's valueAsNumber
export const studentDetailsSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  department: z.string().min(2, 'Please enter a valid department'),
  level: z.number({ message: 'Please enter a valid level' }).min(100, 'Level must be at least 100').max(700, 'Level cannot exceed 700'),
  phoneNumber: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number (e.g. 08034567890)'),
  payoutBankCode: z.string().min(1, 'Please select your bank'),
  payoutAccountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
})

export const vendorOnboardingSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  businessEmail: z.string().email('Please enter a valid business email'),
  businessAddress: z.string().min(5, 'Please enter a valid business address'),
  phoneNumber: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid phone number (e.g. 08034567890)'),
  payoutBankCode: z.string().min(1, 'Please select your bank'),
  payoutAccountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>
export type StudentDetailsInput = z.infer<typeof studentDetailsSchema>
export type VendorOnboardingInput = z.infer<typeof vendorOnboardingSchema>
