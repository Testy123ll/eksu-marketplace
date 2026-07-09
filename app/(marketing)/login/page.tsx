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

export default function LoginPage() {
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) throw new Error(authError.message)

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('verification_status, is_admin')
          .eq('user_id', authData.user.id)
          .single()

        if (profileError || !profile) {
          router.push('/verify')
        } else if (profile.is_admin) {
          router.push('/admin')
        } else if (profile.verification_status === 'approved') {
          router.push('/listings')
        } else {
          router.push('/verify')
        }
      }
    } catch (err: any) {
      const errorMsg = typeof err.message === 'object' ? JSON.stringify(err.message) : (err.message || 'Failed to sign in. Please check your credentials.')
      setGeneralError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative overflow-hidden bg-canvas text-primary">
      {/* Background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-brand-indigo/15 blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-brand-mint/8 blur-[160px]" />
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
            Welcome back to the Student Registry.
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            Log in to manage your listings, request safe swaps using the escrow system, and continue trading with verified EKSU students.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/30">
                <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Secured Safe-Swap Meetups</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/10 flex items-center justify-center border border-brand-indigo/30">
                <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Escrow System Protected</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-subtle font-mono uppercase tracking-widest">
          BATAMARKET SYSTEM // SECURITY CORE V2
        </div>
      </div>

      {/* Right panel: Login form in glowing obsidian card */}
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
              Welcome Back
            </h1>
            <p className="text-sm text-muted">
              Sign in to browse or trade on BataMarket
            </p>
          </div>

          {/* Obsidian Card */}
          <div className="glass rounded-xl p-8 border border-border/80 shadow-[0_15px_50px_rgba(0,0,0,0.55)] bg-surface-lowest/70 backdrop-blur-xl relative overflow-hidden">
            {generalError && (
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
                placeholder="e.g. name@student.eksu.edu.ng"
                error={errors.email?.message}
                className="bg-canvas border-border/60 hover:border-brand-indigo/40 focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo/30 transition-all rounded-lg"
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                className="bg-canvas border-border/60 hover:border-brand-indigo/40 focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo/30 transition-all rounded-lg"
                {...register('password')}
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 text-sm font-bold mt-2 shadow-[0_0_30px_rgba(91,77,255,0.25)] hover:brightness-110"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-subtle font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-mint font-semibold hover:underline underline-offset-2">
                Create one now
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
