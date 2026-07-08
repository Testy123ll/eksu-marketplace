'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validation/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { motion } from 'motion/react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setGeneralError(null)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (authError) throw new Error(authError.message)

      if (authData.user) {
        // If identities is empty, the user already exists in Supabase
        const isExistingUser = authData.user.identities && authData.user.identities.length === 0
        if (isExistingUser) {
          throw new Error('This email is already registered. Please sign in instead.')
        }

        // Auto-login since trigger auto-confirms user
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        
        if (loginError) {
          if (loginError.message.toLowerCase().includes('confirm') || loginError.message.toLowerCase().includes('verify')) {
            setGeneralError('SUCCESS_CONFIRMATION_REQUIRED')
            return
          }
          throw new Error(loginError.message)
        }
        
        router.push('/verify')
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative overflow-hidden bg-canvas text-primary">
      {/* Background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-brand-indigo/15 blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-brand-mint/8 blur-[160px]" />
      </div>

      {/* Left panel: Premium branding & features highlight */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 z-10 relative border-r border-border/20 bg-surface-lowest/40">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="font-display font-extrabold text-2xl gradient-brand-text">
            BataMarket
          </span>
          <span className="h-2 w-2 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(0,229,155,0.8)] animate-pulse" />
        </Link>

        <div className="space-y-6 max-w-lg">
          <h2 className="text-4xl font-display font-black leading-tight tracking-tight">
            Redefining Student Trading at EKSU.
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            Gain full access to the campus marketplace. Buy textbooks, book local designers and writers, secure off-campus rooms, and exchange items safely with verified students.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/30">
                <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">100% Student Verified Registry</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/30">
                <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Escrow Locked Security Pool</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/30">
                <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Zero Transaction Commission Fees</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-subtle font-mono uppercase tracking-widest">
          BATAMARKET SYSTEM // SECURITY CORE V2
        </div>
      </div>

      {/* Right panel: Register form in glowing obsidian card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="text-center lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="font-display font-extrabold text-2xl gradient-brand-text">
                BataMarket
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(0,229,155,0.8)] animate-pulse" />
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8 space-y-2">
            <h1 className="text-3xl font-display font-bold tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-muted">
              Get started with EKSU&apos;s verified peer marketplace
            </p>
          </div>

          {/* Obsidian Card */}
          <div className="glass rounded-xl p-8 border border-border/80 shadow-[0_15px_50px_rgba(0,0,0,0.55)] bg-surface-lowest/70 backdrop-blur-xl relative overflow-hidden">
            {generalError === 'SUCCESS_CONFIRMATION_REQUIRED' ? (
              <div className="mb-6 p-4 bg-brand-mint/10 border border-brand-mint/30 text-brand-mint text-xs rounded-lg font-medium flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-mint" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                </svg>
                <div className="space-y-1">
                  <p className="font-bold text-[13px] text-white">Account Created Successfully!</p>
                  <p className="text-subtle leading-relaxed">
                    A confirmation link has been sent to your email address. Please check your inbox and click the verification link to log in.
                  </p>
                </div>
              </div>
            ) : generalError && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-xs rounded-lg font-medium flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="use your student or personal email"
                error={errors.email?.message}
                className="bg-canvas border-border/60 hover:border-brand-indigo/40 focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo/30 transition-all rounded-lg"
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="minimum 6 characters"
                error={errors.password?.message}
                className="bg-canvas border-border/60 hover:border-brand-indigo/40 focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo/30 transition-all rounded-lg"
                {...register('password')}
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 text-sm font-bold mt-2 shadow-[0_0_30px_rgba(91,77,255,0.25)] hover:brightness-110"
              >
                Sign Up
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-subtle font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-mint font-semibold hover:underline underline-offset-2">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
