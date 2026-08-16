'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleResetPassword() {
    setErrorMessage('')
    setSuccessMessage('')

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setSuccessMessage('Password updated successfully. Redirecting...')

    setTimeout(() => {
      router.push('/login')
    }, 1200)
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
      <div className="mx-auto max-w-xl border border-[#d6cec0] bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-[#244f3d]">
          Local Connect Foodservice
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#1f1a14]">
          Reset your password
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-[#6f675c]">
          Create a new password for your Local Connect account. Once updated,
          you’ll be able to sign in using your new password.
        </p>

        <div className="mt-6 border border-[#d6cec0] bg-[#f4f1ea] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            Password Requirements
          </p>

          <p className="mt-1 text-sm font-black text-[#1f1a14]">
            Minimum 8 characters
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create new password"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
            onClick={handleResetPassword}
            disabled={submitting}
            className="bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </div>
    </main>
  )
}