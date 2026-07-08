'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image'
import confetti from 'canvas-confetti'
import CheckoutModal from '@/components/listings/CheckoutModal'
import {
  productListingSchema,
  serviceListingSchema,
  accommodationListingSchema,
  CATEGORIES_BY_TYPE,
  CONDITIONS,
  CONDITION_LABELS,
  type ProductListingInput,
  type ServiceListingInput,
  type AccommodationListingInput,
  type ListingType,
} from '@/lib/validation/listings'

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: ListingType; label: string; desc: string; icon: React.ReactNode }[] = [
  { 
    value: 'product', 
    label: 'Physical Item', 
    desc: 'Textbooks, electronics, clothing, accessories...', 
    icon: (
      <svg className="w-6 h-6 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    value: 'service', 
    label: 'Service / Skill', 
    desc: 'Tutoring, typing, design, tech help...', 
    icon: (
      <svg className="w-6 h-6 text-brand-mint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    value: 'accommodation', 
    label: 'Room / Housing', 
    desc: 'Self-contain, shared apartment, hostel...', 
    icon: (
      <svg className="w-6 h-6 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
]

// ─── Image Upload Component ───────────────────────────────────────────────────
function ImageUploader({
  images,
  onAdd,
  onRemove,
  uploading,
}: {
  images: string[]
  onAdd: (file: File) => void
  onRemove: (url: string) => void
  uploading: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAdd(file)
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        Photos ({images.length}/4)
      </label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`upload-${i}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-lg transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < 4 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-brand-indigo/60 flex flex-col items-center justify-center gap-1 text-muted hover:text-primary transition-all disabled:opacity-50"
          >
            {uploading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] font-medium">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-[10px] text-subtle mt-2">
        First photo is the cover. Images are compressed before upload.
      </p>
    </div>
  )
}

// ─── Shared form fields (textarea + select) ───────────────────────────────────
function TextareaField({
  label, placeholder, rows = 4, error, ...props
}: { label: string; placeholder: string; rows?: number; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-canvas border border-border/80 rounded-lg px-4 py-3 text-sm text-primary placeholder:text-subtle/60 transition-all resize-none input-glow"
        {...props}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}

function SelectField({
  label, options, error, ...props
}: { label: string; options: string[]; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        className="w-full h-11 bg-canvas border border-border/80 rounded-lg px-4 text-sm text-primary transition-all input-glow appearance-none"
        {...props}
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}

// ─── Course Code Suggestions Catalog ──────────────────────────────────────────
const EKSU_COURSES = [
  { code: 'GST 111', title: 'GST 111: Use of English' },
  { code: 'GST 112', title: 'GST 112: Logic, Philosophy & Human Existence' },
  { code: 'GST 113', title: 'GST 113: Nigerian Peoples & Culture' },
  { code: 'MTS 101', title: 'MTS 101: Introductory Mathematics I' },
  { code: 'MTS 102', title: 'MTS 102: Introductory Mathematics II' },
  { code: 'CHM 101', title: 'CHM 101: General Chemistry I' },
  { code: 'CHM 102', title: 'CHM 102: General Chemistry II' },
  { code: 'PHY 101', title: 'PHY 101: General Physics I' },
  { code: 'PHY 102', title: 'PHY 102: General Physics II' },
  { code: 'ACC 201', title: 'ACC 201: Principles of Accounting I' },
  { code: 'ACC 202', title: 'ACC 202: Principles of Accounting II' },
  { code: 'GST 121', title: 'GST 121: Use of Library, Study Skills & ICT' },
]

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ 
  profile, 
  onSuccess, 
  onOpenCheckout 
}: { 
  profile: any
  onSuccess: (id: string) => void
  onOpenCheckout: (params: { listingId: string; listingTitle: string; fee: number }) => void
}) {
  const supabase = createClient()
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductListingInput>({
    resolver: zodResolver(productListingSchema),
    defaultValues: { type: 'product' },
  })

  const watchedTitle = watch('title') || ''
  const watchedPrice = watch('price')
  const watchedCategory = watch('category')
  const watchCatalogItem = watch('is_catalog_item')
  const isPaidListing = profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) >= 3
  const calculatedFee = isPaidListing && watchedPrice ? Math.min(1000, Math.max(50, Math.floor(watchedPrice * 0.02))) : 0

  const suggestions = watchedTitle.trim().length >= 2
    ? EKSU_COURSES.filter(c => 
        c.code.toLowerCase().includes(watchedTitle.toLowerCase()) || 
        c.title.toLowerCase().includes(watchedTitle.toLowerCase())
      )
    : []

  const handleAddImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const compressed = await compressImage(file)
      const ext = 'jpg'
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      setImages((prev) => [...prev, data.publicUrl])
    } catch (e: any) {
      setError(`Image upload failed: ${e.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (data: ProductListingInput) => {
    if (data.category === 'Other (Type custom...)' && !customCategory.trim()) {
      setError('Please specify a custom category name')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let nextFreeCount = profile?.listings_used_free ?? 0
      if (profile?.account_type === 'student' && nextFreeCount < 3) {
        nextFreeCount += 1
      }

      const finalCategory = data.category === 'Other (Type custom...)' ? customCategory.trim() : data.category

      const isVendor = profile?.account_type === 'vendor'
      const isCatalog = isVendor ? !!data.is_catalog_item : false
      const finalQuantity = isCatalog ? 1 : (isVendor ? (data.quantity || 1) : 1)
      const finalVariants = isVendor && data.variants 
        ? data.variants.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          type: data.type,
          title: data.title,
          description: data.description,
          price: data.price,
          category: finalCategory,
          condition: data.condition,
          images,
          status: isPaidListing ? 'inactive' : 'active',
          is_boosted: false,
          listing_fee_paid: !isPaidListing,
          listing_fee_amount: isPaidListing ? calculatedFee : 0,
          quantity: finalQuantity,
          variants: finalVariants,
          is_catalog_item: isCatalog,
        })
        .select('id').single()

      if (insertError) throw insertError

      if (profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) < 3) {
        await supabase
          .from('profiles')
          .update({ listings_used_free: nextFreeCount })
          .eq('user_id', user.id)
      }

      if (isPaidListing) {
        onOpenCheckout({ listingId: inserted.id, listingTitle: data.title, fee: calculatedFee })
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        onSuccess(inserted.id)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to publish listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('type')} />
      {error && <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">{error}</div>}
      <ImageUploader images={images} onAdd={handleAddImage} onRemove={handleRemoveImage} uploading={uploadingImage} />
      <div className="relative">
        <Input 
          label="Listing Title" 
          placeholder="e.g. Calculus 101 Textbook" 
          error={errors.title?.message} 
          {...register('title')} 
        />
        {suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5 p-2 bg-surface-low border border-border/60 rounded-xl max-h-32 overflow-y-auto scrollbar-none z-10">
            <span className="text-[9px] font-mono font-bold text-subtle uppercase tracking-wider block w-full mb-0.5">
              Suggested Course Code (Autofills textbooks category):
            </span>
            {suggestions.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => {
                  setValue('title', `${course.code} Textbook: ${course.title.split(': ')[1]}`)
                  setValue('category', 'Textbooks')
                }}
                className="text-[10px] font-mono font-bold px-2 py-1 bg-surface-high border border-border/80 text-brand-indigo rounded-xl hover:border-brand-indigo/50 hover:bg-brand-indigo/10 transition-colors cursor-pointer"
              >
                {course.code} ({course.title.split(': ')[1]})
              </button>
            ))}
          </div>
        )}
      </div>
      <TextareaField label="Description" placeholder="Describe the item, condition, meeting locations near campus…" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Asking Price (₦)" type="number" placeholder="e.g. 1500" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        <SelectField label="Category" options={CATEGORIES_BY_TYPE.product} error={errors.category?.message} {...register('category')} />
      </div>

      {watchedCategory === 'Other (Type custom...)' && (
        <Input
          label="Specify Category Name"
          placeholder="e.g. Shoes, Clothes, Perfume, etc."
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        />
      )}

      {isPaidListing && watchedPrice > 0 && (
        <div className="p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/20 text-xs text-brand-amber flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1">
            <svg className="w-4 h-4 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Listing Fee Required
          </span>
          <span>
            Student listings require a 2% publication fee once the 3 free slots are exhausted.
          </span>
          <span className="text-sm font-extrabold text-white mt-1">
            Calculated Listing Fee: ₦{calculatedFee.toLocaleString()}
          </span>
        </div>
      )}

      {profile?.account_type === 'vendor' && (
        <div className="p-4 rounded-xl border border-border/80 bg-canvas/40 space-y-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Inventory & Variants</h4>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="accent-brand-indigo w-4 h-4 rounded border-border bg-canvas text-brand-indigo" 
              {...register('is_catalog_item')} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-primary">Always In Stock (Catalog Item)</span>
              <span className="text-[11px] text-subtle">For items you produce or restock constantly. Disables quantity tracking.</span>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Quantity in Stock" 
              type="number" 
              disabled={watchCatalogItem} 
              placeholder="e.g. 5" 
              error={errors.quantity?.message} 
              {...register('quantity', { valueAsNumber: true })} 
            />
            <Input 
              label="Product Variants" 
              placeholder="e.g. Red, Blue, Large (comma separated)" 
              error={errors.variants?.message} 
              {...register('variants')} 
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Condition</label>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" value={c} {...register('condition')} className="accent-brand-indigo w-4 h-4" />
              <span className="text-sm text-muted group-hover:text-primary transition-colors">{CONDITION_LABELS[c]}</span>
            </label>
          ))}
        </div>
        {errors.condition && <p className="text-xs text-error mt-1">{errors.condition.message}</p>}
      </div>

      <Button type="submit" loading={loading} className="w-full h-12">
        {isPaidListing ? 'Pay Listing Fee & Publish' : 'Publish Listing'}
      </Button>
    </form>
  )
}

// ─── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({ 
  profile, 
  onSuccess, 
  onOpenCheckout 
}: { 
  profile: any
  onSuccess: (id: string) => void
  onOpenCheckout: (params: { listingId: string; listingTitle: string; fee: number }) => void
}) {
  const supabase = createClient()
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ServiceListingInput>({
    resolver: zodResolver(serviceListingSchema),
    defaultValues: { type: 'service' },
  })

  const watchedPrice = watch('price')
  const watchedCategory = watch('category')
  const isPaidListing = profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) >= 3
  const calculatedFee = isPaidListing && watchedPrice ? Math.min(1000, Math.max(50, Math.floor(watchedPrice * 0.02))) : 0

  const handleAddImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const compressed = await compressImage(file)
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      setImages((prev) => [...prev, data.publicUrl])
    } catch (e: any) { setError(`Image upload failed: ${e.message}`) }
    finally { setUploadingImage(false) }
  }

  const onSubmit = async (data: ServiceListingInput) => {
    if (data.category === 'Other (Type custom...)' && !customCategory.trim()) {
      setError('Please specify a custom category name')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let nextFreeCount = profile?.listings_used_free ?? 0
      if (profile?.account_type === 'student' && nextFreeCount < 3) {
        nextFreeCount += 1
      }

      const finalCategory = data.category === 'Other (Type custom...)' ? customCategory.trim() : data.category

      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert({ 
          seller_id: user.id, 
          type: data.type, 
          title: data.title, 
          description: data.description, 
          price: data.price, 
          category: finalCategory, 
          images, 
          status: isPaidListing ? 'inactive' : 'active', 
          is_boosted: false,
          listing_fee_paid: !isPaidListing,
          listing_fee_amount: isPaidListing ? calculatedFee : 0,
        })
        .select('id').single()

      if (insertError) throw insertError

      if (profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) < 3) {
        await supabase
          .from('profiles')
          .update({ listings_used_free: nextFreeCount })
          .eq('user_id', user.id)
      }

      if (isPaidListing) {
        onOpenCheckout({ listingId: inserted.id, listingTitle: data.title, fee: calculatedFee })
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        onSuccess(inserted.id)
      }
    } catch (e: any) { setError(e.message || 'Failed to publish listing') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('type')} />
      {error && <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">{error}</div>}
      <ImageUploader images={images} onAdd={handleAddImage} onRemove={(url) => setImages((p) => p.filter((u) => u !== url))} uploading={uploadingImage} />
      <Input label="Service Title" placeholder="e.g. Thesis Typing & Formatting (APA/MLA)" error={errors.title?.message} {...register('title')} />
      <TextareaField label="Description" placeholder="Describe your service, turnaround time, what clients get…" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Rate (₦ / hr)" type="number" placeholder="e.g. 1000" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        <SelectField label="Category" options={CATEGORIES_BY_TYPE.service} error={errors.category?.message} {...register('category')} />
      </div>

      {watchedCategory === 'Other (Type custom...)' && (
        <Input
          label="Specify Category Name"
          placeholder="e.g. Graphic Design, Coding, etc."
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
        />
      )}

      {isPaidListing && watchedPrice > 0 && (
        <div className="p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/20 text-xs text-brand-amber flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1">
            <svg className="w-4 h-4 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Listing Fee Required
          </span>
          <span>
            Student listings require a 2% publication fee once the 3 free slots are exhausted.
          </span>
          <span className="text-sm font-extrabold text-white mt-1">
            Calculated Listing Fee: ₦{calculatedFee.toLocaleString()}
          </span>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full h-12">
        {isPaidListing ? 'Pay Listing Fee & Publish' : 'Publish Service'}
      </Button>
    </form>
  )
}

// ─── Accommodation Form ────────────────────────────────────────────────────────
function AccommodationForm({ 
  profile, 
  onSuccess, 
  onOpenCheckout 
}: { 
  profile: any
  onSuccess: (id: string) => void
  onOpenCheckout: (params: { listingId: string; listingTitle: string; fee: number }) => void
}) {
  const supabase = createClient()
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AccommodationListingInput>({
    resolver: zodResolver(accommodationListingSchema),
    defaultValues: { type: 'accommodation', category: 'Accommodation' },
  })

  const watchedPrice = watch('price')
  const isPaidListing = profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) >= 3
  const calculatedFee = isPaidListing && watchedPrice ? Math.min(1000, Math.max(50, Math.floor(watchedPrice * 0.02))) : 0

  const handleAddImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const compressed = await compressImage(file)
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      setImages((prev) => [...prev, data.publicUrl])
    } catch (e: any) { setError(`Image upload failed: ${e.message}`) }
    finally { setUploadingImage(false) }
  }

  const onSubmit = async (data: AccommodationListingInput) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let nextFreeCount = profile?.listings_used_free ?? 0
      if (profile?.account_type === 'student' && nextFreeCount < 3) {
        nextFreeCount += 1
      }

      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert({ 
          seller_id: user.id, 
          type: data.type, 
          title: data.title, 
          description: data.description, 
          price: data.price, 
          category: data.category, 
          images, 
          status: isPaidListing ? 'inactive' : 'active', 
          is_boosted: false, 
          room_type: data.room_type, 
          location: data.location, 
          available_from: data.available_from,
          listing_fee_paid: !isPaidListing,
          listing_fee_amount: isPaidListing ? calculatedFee : 0,
        })
        .select('id').single()

      if (insertError) throw insertError

      if (profile?.account_type === 'student' && (profile?.listings_used_free ?? 0) < 3) {
        await supabase
          .from('profiles')
          .update({ listings_used_free: nextFreeCount })
          .eq('user_id', user.id)
      }

      if (isPaidListing) {
        onOpenCheckout({ listingId: inserted.id, listingTitle: data.title, fee: calculatedFee })
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        onSuccess(inserted.id)
      }
    } catch (e: any) { setError(e.message || 'Failed to publish listing') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('type')} />
      <input type="hidden" {...register('category')} />
      {error && <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">{error}</div>}
      <ImageUploader images={images} onAdd={handleAddImage} onRemove={(url) => setImages((p) => p.filter((u) => u !== url))} uploading={uploadingImage} />
      <Input label="Listing Title" placeholder="e.g. Self-contain Room — 5 min from Gate B" error={errors.title?.message} {...register('title')} />
      <TextareaField label="Full Description" placeholder="Describe amenities, rules, utilities, proximity to campus facilities…" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Monthly Rent (₦)" type="number" placeholder="e.g. 85000" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        <Input label="Room Type" placeholder="e.g. Self-contain, Shared" error={errors.room_type?.message} {...register('room_type')} />
      </div>
      <Input label="Location / Nearest Landmark" placeholder="e.g. Behind Science Lab, off Gate B road" error={errors.location?.message} {...register('location')} />
      <Input label="Available From" type="date" error={errors.available_from?.message} {...register('available_from')} />

      {isPaidListing && watchedPrice > 0 && (
        <div className="p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/20 text-xs text-brand-amber flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1">
            <svg className="w-4 h-4 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Listing Fee Required
          </span>
          <span>
            Student listings require a 2% publication fee once the 3 free slots are exhausted.
          </span>
          <span className="text-sm font-extrabold text-white mt-1">
            Calculated Listing Fee: ₦{calculatedFee.toLocaleString()}
          </span>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full h-12">
        {isPaidListing ? 'Pay Listing Fee & Publish' : 'Publish Room Listing'}
      </Button>
    </form>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ 
  type, 
  listingId, 
  onReset,
  isDraft = false
}: { 
  type: ListingType
  listingId: string
  onReset: () => void
  isDraft?: boolean
}) {
  const router = useRouter()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-5 py-8"
    >
      <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-mint flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(0,229,155,0.4)] animate-glow-emerald">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-display font-bold">
          {isDraft ? 'Draft Saved!' : 'Listing Published!'}
        </h2>
        <p className="text-sm text-muted mt-1">
          {isDraft 
            ? 'Your listing has been saved as an unpublished draft. Pay the fee from your profile to publish it.' 
            : `Your ${type} listing is now live on BataMarket.`
          }
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary" className="flex-1" onClick={() => router.push(isDraft ? '/profile' : `/listings/${listingId}`)}>
          {isDraft ? 'Go to Profile' : 'View My Listing'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => router.push('/listings')}>
          Browse All
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onReset}>
          Post Another
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [selectedType, setSelectedType] = useState<ListingType | null>(null)
  const [doneId, setDoneId] = useState<string | null>(null)
  const [isDraftResult, setIsDraftResult] = useState(false)

  const [checkoutParams, setCheckoutParams] = useState<{ listingId: string; listingTitle: string; fee: number } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('account_type, listings_used_free, subscription_status')
        .eq('user_id', user.id)
        .single()
      
      setProfile(data)
      setLoadingProfile(false)
    }
    loadProfile()
  }, [router, supabase])

  const handleReset = () => {
    setSelectedType(null)
    setDoneId(null)
    setIsDraftResult(false)
  }

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-16 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin" />
      </div>
    )
  }

  // If vendor has paused subscription, block them
  if (profile?.account_type === 'vendor' && profile?.subscription_status === 'paused') {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Create a Listing</h1>
          <p className="text-sm text-muted mt-1">Manage your storefront</p>
        </div>
        <Card className="p-6 border-red-500/20 bg-red-500/5 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-red-400">Subscription Paused</h2>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            Your vendor subscription is currently paused due to a missed payment. All your listings have been hidden. Please subscribe or pay your monthly fee to unlock unlimited posting and reactivate your catalog.
          </p>
          <Link href="/profile" className="inline-block mt-2">
            <Button variant="primary">Go to Billing Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      {!doneId && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Create a Listing</h1>
            <p className="text-sm text-muted mt-1">
              Sell items, offer services, or advertise rooms to EKSU students
            </p>
          </div>

          {/* Student Free Counter Badge */}
          {profile?.account_type === 'student' && (
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl border shrink-0 ${
              profile.listings_used_free < 3 
                ? 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo' 
                : 'bg-brand-amber/10 border-brand-amber/25 text-brand-amber'
            }`}>
              {profile.listings_used_free < 3 
                ? `${3 - profile.listings_used_free} Free Slots Left`
                : 'Publication Fee Required'
              }
            </div>
          )}
        </div>
      )}

      <Card glass className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {doneId ? (
            <SuccessScreen key="success" type={selectedType!} listingId={doneId} onReset={handleReset} isDraft={isDraftResult} />
          ) : !selectedType ? (
            <motion.div
              key="type-select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-display font-bold">What are you listing?</h2>
                <p className="text-sm text-muted mt-1">Choose the type that best fits what you&apos;re offering</p>
              </div>
              <div className="space-y-3">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedType(opt.value)}
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:border-brand-indigo/60 hover:bg-surface-high hover:shadow-[0_0_20px_rgba(91,77,255,0.1)] transition-all group"
                  >
                    <span className="text-2xl mt-0.5">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold group-hover:text-brand-indigo transition-colors">{opt.label}</p>
                      <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-muted mt-1 group-hover:text-brand-indigo transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedType}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-1.5 rounded-lg border border-border text-muted hover:text-primary hover:border-brand-indigo/40 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-lg font-display font-bold">
                    {TYPE_OPTIONS.find((t) => t.value === selectedType)?.label}
                  </h2>
                  <p className="text-xs text-muted">Fill in the details below</p>
                </div>
              </div>

              {selectedType === 'product' && (
                <ProductForm 
                  profile={profile} 
                  onSuccess={setDoneId} 
                  onOpenCheckout={setCheckoutParams} 
                />
              )}
              {selectedType === 'service' && (
                <ServiceForm 
                  profile={profile} 
                  onSuccess={setDoneId} 
                  onOpenCheckout={setCheckoutParams} 
                />
              )}
              {selectedType === 'accommodation' && (
                <AccommodationForm 
                  profile={profile} 
                  onSuccess={setDoneId} 
                  onOpenCheckout={setCheckoutParams} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {checkoutParams && (
        <CheckoutModal
          isOpen={!!checkoutParams}
          onClose={() => {
            setIsDraftResult(true)
            setDoneId(checkoutParams.listingId)
            setCheckoutParams(null)
          }}
          onSuccess={() => {
            setIsDraftResult(false)
            setDoneId(checkoutParams.listingId)
            setCheckoutParams(null)
          }}
          listingId={checkoutParams.listingId}
          listingTitle={checkoutParams.listingTitle}
          price={checkoutParams.fee}
          paymentType="listing_fee"
        />
      )}
    </div>
  )
}
