'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { studentDetailsSchema, vendorOnboardingSchema, type StudentDetailsInput, type VendorOnboardingInput } from '@/lib/validation/auth'
import { motion, AnimatePresence } from 'motion/react'
import confetti from 'canvas-confetti'

type OnboardingStep = 'fork' | 'student_details' | 'student_id' | 'student_selfie' | 'vendor_details'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Profile State
  const [profile, setProfile] = useState<any>(null)
  
  // Onboarding UI state
  const [step, setStep] = useState<OnboardingStep>('fork')
  const [studentForm, setStudentForm] = useState<Partial<StudentDetailsInput>>({})
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  // Vendor-specific states
  const [businessType, setBusinessType] = useState<'physical' | 'online'>('physical')
  const [cacFile, setCacFile] = useState<File | null>(null)
  const [cacPreview, setCacPreview] = useState<string | null>(null)
  const [shopfrontFile, setShopfrontFile] = useState<File | null>(null)
  const [shopfrontPreview, setShopfrontPreview] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [vendorError, setVendorError] = useState<string | null>(null)
  
  // Webcam references
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    checkUser()
    return () => {
      // Cleanup camera stream if unmounted
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const checkUser = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUserId(user.id)
    
    // Fetch profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      
    if (data) {
      setProfile(data)
      if (data.verification_status === 'approved') {
        confetti()
      }
    }
    setLoading(false)
  }

  // --- Student Forms Setup (step-1 details only) ---
  const studentFormMethods = useForm<StudentDetailsInput>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: studentForm,
  })

  // --- Vendor Forms Setup ---
  const vendorFormMethods = useForm<VendorOnboardingInput>({
    resolver: zodResolver(vendorOnboardingSchema),
  })

  // --- Camera Operations ---
  const startCamera = async () => {
    setCameraError(null)
    setCameraActive(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please allow camera permissions.')
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  const captureSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setSelfieBlob(blob)
              setSelfiePreview(canvas.toDataURL('image/jpeg'))
              stopCamera()
            }
          },
          'image/jpeg',
          0.9
        )
      }
    }
  }

  // --- File uploads ---
  const uploadToStorage = async (blob: Blob, path: string): Promise<string> => {
    const filename = `${userId}/${path}.jpg`
    const { error } = await supabase.storage
      .from('verifications')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) throw error

    const { data } = supabase.storage.from('verifications').getPublicUrl(filename)
    return data.publicUrl
  }

  // --- Onboarding Submissions ---
  const handleStudentDetailsSubmit = (data: any) => {
    setStudentForm(data)
    setStep('student_id')
  }

  const handleIdUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
      setIdPreview(URL.createObjectURL(file))
    }
  }

  const handleStudentFinalSubmit = async () => {
    if (!idFile || !selfieBlob || !userId) return
    setSubmitLoading(true)
    try {
      const compressedId = await compressImage(idFile)
      const compressedSelfie = await compressImage(new File([selfieBlob], 'selfie.jpg', { type: 'image/jpeg' }))

      const idUrl = await uploadToStorage(compressedId, 'student_id')
      const selfieUrl = await uploadToStorage(compressedSelfie, 'selfie')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          account_type: 'student',
          full_name: studentForm.fullName,
          department: studentForm.department,
          level: studentForm.level,
          phone_number: studentForm.phoneNumber,
          id_photo_url: idUrl,
          selfie_url: selfieUrl,
          verification_status: 'pending',
          trust_score: 50,
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      alert(err.message || 'Verification submission failed.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleVendorSubmit = async (data: VendorOnboardingInput) => {
    if (!userId) return
    if (!shopfrontFile) {
      setVendorError('Verification photo is required.')
      return
    }
    setSubmitLoading(true)
    setVendorError(null)
    try {
      let cacUrl = ''
      if (cacFile) {
        const compressedCac = await compressImage(cacFile)
        cacUrl = await uploadToStorage(compressedCac, 'cac_document')
      }

      const compressedShop = await compressImage(shopfrontFile)
      const shopfrontUrl = await uploadToStorage(compressedShop, 'shopfront_photo')

      const { data: profileData, error } = await supabase
        .from('profiles')
        .update({
          account_type: 'vendor',
          business_name: data.businessName,
          phone_number: data.phoneNumber,
          business_address: data.businessAddress,
          business_type: businessType,
          cac_photo_url: cacUrl || null,
          shopfront_photo_url: shopfrontUrl,
          referral_vendor_code: referralCode.trim() || null,
          verification_status: 'pending',
          trust_score: 50,
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      setProfile(profileData)
    } catch (err: any) {
      setVendorError(err.message || 'Onboarding submission failed.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = async () => {
    if (!userId) return
    setLoading(true)
    await supabase.from('profiles').delete().eq('user_id', userId)
    setProfile(null)
    setStep('fork')
    setStudentForm({})
    setIdFile(null)
    setIdPreview(null)
    setSelfieBlob(null)
    setSelfiePreview(null)
    setBusinessType('physical')
    setCacFile(null)
    setCacPreview(null)
    setShopfrontFile(null)
    setShopfrontPreview(null)
    setReferralCode('')
    setVendorError(null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
          <span className="text-xs font-mono tracking-wider text-muted uppercase">STATUS: CHECKING_ACCOUNT_STATE...</span>
        </div>
      </div>
    )
  }

  // --- Render Status screens ---
  if (profile) {
    if (profile.verification_status === 'pending') {
      return (
        <div className="flex-grow flex items-center justify-center bg-canvas px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            {/* Clinical registry log style for pending status */}
            <div className="border-2 border-border bg-surface-low p-6 font-mono text-xs text-primary rounded-sm relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-indigo to-brand-mint animate-pulse" />
              
              <div className="flex justify-between items-center border-b border-border/40 pb-4 mb-4">
                <span className="font-bold text-brand-indigo uppercase tracking-widest text-[10px]">REGISTRY: PENDING_REVIEW</span>
                <span className="text-[9px] uppercase font-bold text-subtle px-1.5 py-0.5 border border-border rounded-sm bg-surface">
                  ID: {profile.user_id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-surface border border-border/60 p-4 rounded-sm mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo shrink-0">
                  <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-primary">Onboarding Submitted</p>
                  <p className="text-[10px] text-subtle mt-0.5 uppercase tracking-wide">Queue Position: Awaiting Moderator Review</p>
                </div>
              </div>

              <p className="text-subtle leading-relaxed mb-4">
                Thank you for submitting your verification details. Isaac (campus moderator) is currently reviewing submissions manually. This ensures a safe, scam-free swap marketplace for the entire EKSU student community.
              </p>
              
              <div className="border border-border/60 bg-surface rounded-sm p-4 text-left space-y-3 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-indigo">Active Sandbox Permissions:</span>
                <ul className="text-[10px] text-muted space-y-2 list-none font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint">✓</span>
                    <span>BROWSE_AND_SEARCH_ACTIVE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint">✓</span>
                    <span>SECURE_ESCROW_TRADING_ENABLED</span>
                  </li>
                  <li className="flex items-start gap-2 text-error">
                    <span>✗</span>
                    <span>CREATE_LISTINGS_SUSPENDED (PENDING_APPROVAL)</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full rounded-sm font-mono text-[10px] uppercase tracking-wider h-11" onClick={() => router.push('/listings')}>
                  Explore Listings
                </Button>
                <Button variant="secondary" className="w-full rounded-sm font-mono text-[10px] uppercase tracking-wider h-11" onClick={handleReset}>
                  Resubmit Onboarding
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    if (profile.verification_status === 'approved') {
      return (
        <div className="flex-grow flex items-center justify-center bg-canvas px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            {/* Warm, premium glow card for Approved */}
            <Card className="p-8 space-y-6 border-brand-mint/30 bg-surface-lowest shadow-[0_0_50px_rgba(0,229,155,0.08)] text-center relative overflow-hidden rounded-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-indigo to-brand-mint" />
              
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-mint/10 flex items-center justify-center text-brand-mint shadow-[0_0_20px_rgba(0,229,155,0.2)]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-brand-mint tracking-tight">
                  Onboarding Verified!
                </h2>
                <p className="text-muted text-sm mt-2 leading-relaxed">
                  Congratulations! Your details have been approved. You now have full access to publish listings, request escrow, and trade safely.
                </p>
              </div>

              <Button variant="primary" className="w-full h-12 rounded-xl text-sm" onClick={() => router.push('/listings')}>
                Enter Marketplace
              </Button>
            </Card>
          </motion.div>
        </div>
      )
    }

    if (profile.verification_status === 'rejected') {
      return (
        <div className="flex-grow flex items-center justify-center bg-canvas px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            {/* Hard error clinical border for rejection */}
            <div className="border-2 border-red-500/40 bg-surface-low p-6 font-mono text-xs text-primary rounded-sm shadow-2xl relative">
              <div className="flex justify-between items-center border-red-500/20 pb-4 mb-4">
                <span className="font-bold text-red-500 uppercase tracking-widest text-[10px]">REGISTRY: VERIFICATION_REJECTED</span>
                <span className="text-[8px] font-bold text-red-500/80">ERROR_CODE: 403</span>
              </div>

              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 p-4 rounded-sm mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-red-500">Submission Rejected</p>
                  <p className="text-[9px] text-red-500/70 mt-0.5 uppercase tracking-wide">Action Required: Document Resubmit</p>
                </div>
              </div>

              <p className="text-subtle leading-relaxed mb-6">
                Your verification documents could not be approved. This typically occurs if the ID photo was blurry, details were illegible, or the live selfie match was inconclusive. Please ensure high light contrast and retry.
              </p>

              <Button variant="danger" className="w-full h-11 rounded-sm font-mono text-[10px] uppercase tracking-wider" onClick={handleReset}>
                Restart Verification Flow
              </Button>
            </div>
          </motion.div>
        </div>
      )
    }
  }

  // --- Render Onboarding Form Flows ---
  return (
    <div className="flex-grow flex items-center justify-center bg-canvas px-6 py-12">
      <div className="max-w-md w-full z-10">
        <AnimatePresence mode="wait">
          {step === 'fork' && (
            <motion.div
              key="fork"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-brand-indigo to-brand-mint tracking-tight">Account Type</h2>
                <p className="text-xs font-mono uppercase tracking-wider text-subtle">SELECT SYSTEM AUTH LEVEL</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Student: ID required. Structural visual style: monospace tag, clean borders */}
                <div
                  onClick={() => setStep('student_details')}
                  className="group cursor-pointer text-left border border-border/80 bg-surface-low hover:border-brand-indigo/60 p-6 flex flex-col gap-3 transition-all duration-300 rounded-sm relative shadow-md"
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-brand-indigo/15 text-brand-indigo border-l border-b border-border/60 font-mono text-[8px] uppercase font-bold tracking-wider rounded-bl-sm">
                    STUDENT_VERIFICATION
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-display font-bold group-hover:text-brand-indigo transition-colors">I am a Student</span>
                    <span className="text-[8px] font-mono font-bold bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      ID Required
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed font-sans">
                    Trade, buy textbooks, rent hostel accommodation, or secure swap deals with other verified EKSU peers.
                  </p>
                </div>

                {/* Vendor: No Student ID. Human visual style: rounded, glowing hover accents */}
                <div
                  onClick={() => setStep('vendor_details')}
                  className="group cursor-pointer text-left border border-border/80 bg-surface hover:border-brand-mint/60 p-6 flex flex-col gap-3 transition-all duration-300 rounded-xl relative shadow-md hover:shadow-[0_0_30px_rgba(0,229,155,0.08)]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-display font-bold group-hover:text-brand-mint transition-colors">I am a Seller / Vendor</span>
                    <span className="text-[8px] font-mono font-bold bg-brand-mint/10 border border-brand-mint/30 text-brand-mint px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Business Tier
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed font-sans">
                    Commercial provision stores, photocopy shops, food vendors, or off-campus housing landlords.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'student_details' && (
            <motion.div
              key="student_details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Human Bio: Warm rounded card */}
              <Card className="p-6 space-y-6 rounded-xl border border-brand-indigo/20 shadow-xl bg-surface">
                <div>
                  <span className="text-[8px] font-mono font-bold tracking-wider text-brand-indigo bg-brand-indigo/10 border border-brand-indigo/20 px-2 py-0.5 rounded-sm uppercase">Step 1 of 3</span>
                  <h2 className="text-2xl font-display font-bold mt-3">Student Profile</h2>
                  <p className="text-xs text-muted mt-1">Please enter your personal details. This information will help buyers trust you.</p>
                </div>

                <form onSubmit={studentFormMethods.handleSubmit(handleStudentDetailsSubmit)} className="space-y-4 font-sans">
                  <Input
                    label="Full Name"
                    placeholder="Matches your portal or register slip"
                    error={studentFormMethods.formState.errors.fullName?.message}
                    {...studentFormMethods.register('fullName')}
                  />
                  <Input
                    label="Department"
                    placeholder="e.g. Mechanical Engineering"
                    error={studentFormMethods.formState.errors.department?.message}
                    {...studentFormMethods.register('department')}
                  />
                  <Input
                    label="Level / Year"
                    type="number"
                    placeholder="e.g. 400"
                    error={studentFormMethods.formState.errors.level?.message}
                    {...studentFormMethods.register('level', { valueAsNumber: true })}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 08034567890"
                    error={studentFormMethods.formState.errors.phoneNumber?.message}
                    {...studentFormMethods.register('phoneNumber')}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" className="flex-1 rounded-xl text-xs h-11" onClick={() => setStep('fork')}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 rounded-xl text-xs h-11">
                      Next Step
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {step === 'student_id' && (
            <motion.div
              key="student_id"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Academic ID Upload: Hard-edged index card (Structural) */}
              <div className="border-2 border-border bg-surface-low p-6 rounded-sm font-mono text-xs text-primary shadow-2xl space-y-5">
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-brand-indigo uppercase border border-brand-indigo/30 bg-brand-indigo/10 px-2 py-0.5 rounded-sm">STEP 02 // DOCUMENTATION</span>
                  <h2 className="text-xl font-display font-black uppercase mt-3 tracking-tight">Student ID Upload</h2>
                  <p className="text-[10px] text-subtle leading-relaxed mt-1">
                    Upload an image of your physical EKSU student ID card or recent exam registration slip.
                  </p>
                </div>

                {/* Specs Box (Structural Monospace details) */}
                <div className="bg-canvas border border-border/80 p-3 rounded-sm text-[9px] text-muted space-y-1">
                  <div>ENTRY_SPEC  : [STUDENT_ID_OR_COURSE_SLIP]</div>
                  <div>MAX_FILESIZE: 5.0 MB</div>
                  <div>FORMATS     : .JPG, .JPEG, .PNG, .WEBP</div>
                  <div>STATUS      : {idPreview ? 'READY_FOR_UPLOAD' : 'AWAITING_INPUT'}</div>
                </div>

                <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-sm p-6 bg-canvas hover:border-brand-indigo/40 transition-colors relative min-h-[160px]">
                  {idPreview ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <img src={idPreview} alt="Student ID Preview" className="max-h-40 object-contain border border-border rounded-sm" />
                      <button className="text-[9px] text-error font-bold hover:underline uppercase tracking-wider" onClick={() => { setIdFile(null); setIdPreview(null); }}>
                        [ Remove Photo ]
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 cursor-pointer w-full text-center py-4 select-none">
                      <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Select ID Photo</span>
                      <span className="text-[9px] text-subtle">CLICK TO BROWSE LOCAL STORAGE</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleIdUploadChange} />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 rounded-sm font-mono text-[9px] uppercase tracking-wider h-10" onClick={() => setStep('student_details')}>
                    Back
                  </Button>
                  <Button type="button" className="flex-1 rounded-sm font-mono text-[9px] uppercase tracking-wider h-10" disabled={!idFile} onClick={() => setStep('student_selfie')}>
                    Next Step
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'student_selfie' && (
            <motion.div
              key="student_selfie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Selfie capture: Clinical/Biometric interface (Structural) */}
              <div className="border-2 border-border bg-surface-low p-6 rounded-sm font-mono text-xs text-primary shadow-2xl space-y-5">
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-brand-indigo uppercase border border-brand-indigo/30 bg-brand-indigo/10 px-2 py-0.5 rounded-sm">STEP 03 // SECURITY_VERIFICATION</span>
                  <h2 className="text-xl font-display font-black uppercase mt-3 tracking-tight">Biometric Selfie</h2>
                  <p className="text-[10px] text-subtle leading-relaxed mt-1">
                    Take a live web-camera selfie to verify image consistency against your uploaded student document ID.
                  </p>
                </div>

                {/* Specs Box */}
                <div className="bg-canvas border border-border/80 p-3 rounded-sm text-[9px] text-muted space-y-1">
                  <div>CAP_TYPE    : [SECURE_LIVE_SELFIE]</div>
                  <div>DEVICE      : {cameraActive ? 'STREAMING_ACTIVE' : 'STANDBY'}</div>
                  <div>RESOLUTION  : 640 x 480</div>
                  <div>GALLERY_LOAD: RESTRICTED</div>
                </div>

                <div className="flex flex-col items-center justify-center border border-border bg-canvas rounded-sm overflow-hidden relative min-h-[220px]">
                  {cameraActive ? (
                    <div className="w-full flex flex-col items-center relative">
                      <video ref={videoRef} autoPlay playsInline className="w-full max-h-56 object-cover scale-x-[-1]" />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                        <Button type="button" className="rounded-sm font-mono text-[9px] uppercase tracking-wider px-6 h-9" onClick={captureSelfie}>
                          Capture Selfie
                        </Button>
                      </div>
                    </div>
                  ) : selfiePreview ? (
                    <div className="w-full flex flex-col items-center p-4 gap-3">
                      <img src={selfiePreview} alt="Selfie Preview" className="max-h-40 object-contain rounded-sm scale-x-[-1] border border-border" />
                      <div className="flex gap-2">
                        <button className="text-[9px] text-subtle font-bold hover:underline uppercase tracking-wider" onClick={startCamera}>
                          [ Retake Selfie ]
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-6 gap-4 text-center select-none">
                      <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {cameraError ? (
                        <span className="text-[9px] text-error font-bold uppercase tracking-wider">{cameraError}</span>
                      ) : (
                        <span className="text-[9px] text-subtle uppercase">Awaiting camera activation permissions</span>
                      )}
                      <Button type="button" variant="primary" className="rounded-sm font-mono text-[9px] uppercase tracking-wider h-10 px-5" onClick={startCamera}>
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 rounded-sm font-mono text-[9px] uppercase tracking-wider h-10" onClick={() => { stopCamera(); setStep('student_id'); }}>
                    Back
                  </Button>
                  <Button type="button" className="flex-1 rounded-sm font-mono text-[9px] uppercase tracking-wider h-10" loading={submitLoading} disabled={!selfieBlob} onClick={handleStudentFinalSubmit}>
                    Submit Registry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'vendor_details' && (
            <motion.div
              key="vendor_details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Vendor Setup: Warm rounded card */}
              <Card className="p-6 space-y-6 rounded-xl border border-brand-mint/20 shadow-xl bg-surface">
                <div>
                  <span className="text-[8px] font-mono font-bold tracking-wider text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2 py-0.5 rounded-sm uppercase">Vendor Onboarding</span>
                  <h2 className="text-2xl font-display font-bold mt-3">Business Information</h2>
                  <p className="text-xs text-muted mt-1">Please enter details of your commercial listing store.</p>
                </div>

                {vendorError && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium">
                    {vendorError}
                  </div>
                )}

                <form onSubmit={vendorFormMethods.handleSubmit(handleVendorSubmit)} className="space-y-4 font-sans">
                  <Input
                    label="Business Name"
                    placeholder="e.g. Luch Provisions Store"
                    error={vendorFormMethods.formState.errors.businessName?.message}
                    {...vendorFormMethods.register('businessName')}
                  />
                  <Input
                    label="Business Email"
                    placeholder="e.g. stores@luchprovisions.com"
                    error={vendorFormMethods.formState.errors.businessEmail?.message}
                    {...vendorFormMethods.register('businessEmail')}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 08034567890"
                    error={vendorFormMethods.formState.errors.phoneNumber?.message}
                    {...vendorFormMethods.register('phoneNumber')}
                  />
                  <Input
                    label="Business Address / Location"
                    placeholder="e.g. Beside EKSU main gate, Ado-Ekiti"
                    error={vendorFormMethods.formState.errors.businessAddress?.message}
                    {...vendorFormMethods.register('businessAddress')}
                  />

                  {/* Business Type Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Business Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBusinessType('physical')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold border uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          businessType === 'physical'
                            ? 'bg-brand-mint border-brand-mint text-canvas shadow-[0_0_15px_rgba(0,229,155,0.3)]'
                            : 'bg-surface-low border-border/80 text-muted hover:border-brand-mint/40 hover:text-primary'
                        }`}
                      >
                        Physical Store / Stall
                      </button>
                      <button
                        type="button"
                        onClick={() => setBusinessType('online')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold border uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          businessType === 'online'
                            ? 'bg-brand-mint border-brand-mint text-canvas shadow-[0_0_15px_rgba(0,229,155,0.3)]'
                            : 'bg-surface-low border-border/80 text-muted hover:border-brand-mint/40 hover:text-primary'
                        }`}
                      >
                        Online / Room-based
                      </button>
                    </div>
                  </div>

                  {/* Verification Photo Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                      {businessType === 'physical' ? 'Shopfront or Stall Photo (Required)' : 'Inventory Stock / Catalog Screenshot (Required)'}
                    </label>
                    <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-lg p-4 bg-canvas hover:border-brand-mint/40 transition-colors relative min-h-[120px]">
                      {shopfrontPreview ? (
                        <div className="w-full flex flex-col items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shopfrontPreview} alt="Shopfront Preview" className="max-h-32 object-contain border border-border rounded-lg" />
                          <button type="button" className="text-[9px] text-error font-bold hover:underline uppercase tracking-wider cursor-pointer" onClick={() => { setShopfrontFile(null); setShopfrontPreview(null); }}>
                            [ Remove Photo ]
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-2 select-none">
                          <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Select Photo</span>
                          <span className="text-[8px] text-subtle">CLICK TO BROWSE</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setShopfrontFile(file)
                              setShopfrontPreview(URL.createObjectURL(file))
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* CAC Document Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                      CAC Registration Document (Optional)
                    </label>
                    <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-lg p-4 bg-canvas hover:border-brand-mint/40 transition-colors relative min-h-[120px]">
                      {cacPreview ? (
                        <div className="w-full flex flex-col items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cacPreview} alt="CAC Document Preview" className="max-h-32 object-contain border border-border rounded-lg" />
                          <button type="button" className="text-[9px] text-error font-bold hover:underline uppercase tracking-wider cursor-pointer" onClick={() => { setCacFile(null); setCacPreview(null); }}>
                            [ Remove Document ]
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-2 select-none">
                          <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-7-8h8a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9a1 1 0 011-1zm3-4h4V2H9v2z" />
                          </svg>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Select CAC Slip</span>
                          <span className="text-[8px] text-subtle">CLICK TO BROWSE</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setCacFile(file)
                              setCacPreview(URL.createObjectURL(file))
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Referral Code */}
                  <Input
                    label="Referral Vendor Code (Optional)"
                    placeholder="e.g. VEND-782"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" className="flex-1 rounded-xl text-xs h-11" onClick={() => setStep('fork')}>
                      Back
                    </Button>
                    <Button type="submit" loading={submitLoading} className="flex-1 rounded-xl text-xs h-11 bg-brand-mint text-canvas hover:bg-brand-mint/90 border-brand-mint">
                      Submit Details
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
