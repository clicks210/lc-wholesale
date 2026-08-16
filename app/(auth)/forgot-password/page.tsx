'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSendResetLink() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Please enter your email address.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setSuccessMessage(
      'If an account exists with that email, a password reset link has been sent.'
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
      <div className="mx-auto max-w-xl border border-[#d6cec0] bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-[#244f3d]">
          Local Connect Foodservice
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#1f1a14]">
          Forgot your password?
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-[#6f675c]">
          Enter your email and we’ll send you a secure link to reset your
          password.
        </p>

        <div className="mt-6 grid gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          {errorMessage && (
            <div className="border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="border border-[#244f3d] bg-[#eef5f0] p-4 text-sm font-bold text-[#244f3d]">
              {successMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSendResetLink}
            disabled={submitting}
            className="bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>

          <Link
            href="/login"
            className="text-sm font-black text-[#244f3d] hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}