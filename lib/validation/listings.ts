import { z } from 'zod'

// ─── Base listing fields (shared across all types) ────────────────────────────
const baseListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z
    .string()
    .min(20, 'Please write at least 20 characters to describe your listing'),
  price: z
    .number({ message: 'Price is required' })
    .positive('Price must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
})

// ─── Product listing ──────────────────────────────────────────────────────────
export const productListingSchema = baseListingSchema.extend({
  type: z.literal('product'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'used'], {
    message: 'Please select a condition',
  }),
  quantity: z.number().optional(),
  variants: z.string().optional(),
  is_catalog_item: z.boolean().optional(),
})

// ─── Service listing ──────────────────────────────────────────────────────────
export const serviceListingSchema = baseListingSchema.extend({
  type: z.literal('service'),
})

// ─── Accommodation listing ────────────────────────────────────────────────────
export const accommodationListingSchema = baseListingSchema.extend({
  type: z.literal('accommodation'),
  room_type: z.string().min(2, 'Please describe the room type'),
  location: z.string().min(5, 'Please describe the location near campus'),
  available_from: z.string().min(1, 'Please set an availability date'),
})

// ─── Union type for full listing insert ───────────────────────────────────────
export const listingSchema = z.discriminatedUnion('type', [
  productListingSchema,
  serviceListingSchema,
  accommodationListingSchema,
])

// ─── Inferred types ───────────────────────────────────────────────────────────
export type ProductListingInput = z.infer<typeof productListingSchema>
export type ServiceListingInput = z.infer<typeof serviceListingSchema>
export type AccommodationListingInput = z.infer<typeof accommodationListingSchema>
export type ListingInput = z.infer<typeof listingSchema>

// ─── Listing type enum ────────────────────────────────────────────────────────
export const LISTING_TYPES = ['product', 'service', 'accommodation'] as const
export type ListingType = (typeof LISTING_TYPES)[number]

export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'used'] as const
export type Condition = (typeof CONDITIONS)[number]

export const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  used: 'Used',
}

export const CATEGORIES_BY_TYPE: Record<ListingType, string[]> = {
  product: [
    'Textbooks',
    'Electronics',
    'Shoes',
    'Clothes',
    'Perfumes & Cosmetics',
    'Furniture',
    'Bags & Accessories',
    'Other (Type custom...)',
  ],
  service: [
    'Academic Services',
    'Creative Services',
    'Tech & IT',
    'Photography & Video',
    'Transportation',
    'Other (Type custom...)',
  ],
  accommodation: ['Accommodation'],
}
