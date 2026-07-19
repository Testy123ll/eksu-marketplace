'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<((message: string, type?: 'success' | 'error' | 'info') => void) | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type?: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    let toastType: 'success' | 'error' | 'info' = type || 'info'
    
    if (!type) {
      const msg = message.toLowerCase()
      if (msg.includes('success') || msg.includes('approved') || msg.includes('verified') || msg.includes('completed') || msg.includes('boosted') || msg.includes('resolved') || msg.includes('created')) {
        toastType = 'success'
      } else if (msg.includes('fail') || msg.includes('error') || msg.includes('reject') || msg.includes('delete') || msg.includes('forbidden') || msg.includes('denied') || msg.includes('suspend')) {
        toastType = 'error'
      }
    }

    setToasts((prev) => [...prev, { id, message, type: toastType }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        addToast(message)
      }
    }
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`p-4 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto flex items-start gap-3 text-xs font-mono select-none ${
                toast.type === 'success'
                  ? 'bg-brand-mint/10 border-brand-mint/30 text-brand-mint'
                  : toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo'
              }`}
            >
              {toast.type === 'success' && (
                <svg className="w-4 h-4 shrink-0 text-brand-mint mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-4 h-4 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-4 h-4 shrink-0 text-brand-indigo mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1 leading-normal text-white">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
