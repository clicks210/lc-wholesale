'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Invite = {
  id: string
  email: string
  role: string
  customerId: string
  businessName: string
}

export default function AcceptInviteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token')

  const [invite, setInvite] = useState<Invite | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setErrorMessage('Missing invite token.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/team/invite?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setErrorMessage(
            data.error ||
              'This invite is invalid, expired, or has already been accepted.'
          )
          setLoading(false)
          return
        }

        setInvite(data)
      } catch (error) {
        setErrorMessage('Could not load invite.')
      } finally {
        setLoading(false)
      }
    }

    loadInvite()
  }, [token])

  async function handleAcceptInvite() {
    if (!invite || !token) return

    setErrorMessage('')

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

    if (signUpError || !signUpData.user) {
      setSubmitting(false)
      setErrorMessage(signUpError?.message || 'Could not create account.')
      return
    }

    const response = await fetch('/api/team/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId: signUpData.user.id,
        fullName: fullName.trim(),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setSubmitting(false)
      setErrorMessage(result.error || 'Could not accept invite.')
      return
    }

    router.push('/products')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
        <div className="mx-auto max-w-xl border border-[#d6cec0] bg-white p-8">
          <p className="text-sm font-black text-[#244f3d]">
            Loading invite...
          </p>
        </div>
      </main>
    )
  }

  if (errorMessage && !invite) {
    return (
      <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
        <div className="mx-auto max-w-xl border border-red-300 bg-white p-8">
          <h1 className="text-2xl font-black text-[#244f3d]">
            Invite unavailable
          </h1>

          <p className="mt-4 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
      <div className="mx-auto max-w-xl border border-[#d6cec0] bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-[#244f3d]">
          Local Connect Foodservice
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#1f1a14]">
          Join {invite?.businessName || 'your team'}
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-[#6f675c]">
          You’ve been invited to join an existing business account. Create your
          password below and you’ll be added to the team.
        </p>

        <div className="mt-6 border border-[#d6cec0] bg-[#f4f1ea] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            Invited Email
          </p>

          <p className="mt-1 text-sm font-black text-[#1f1a14]">
            {invite?.email}
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          {errorMessage && (
            <div className="border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleAcceptInvite}
            disabled={submitting}
            className="bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? 'Creating Account...' : 'Accept Invite'}
          </button>
        </div>
      </div>
    </main>
  )
}