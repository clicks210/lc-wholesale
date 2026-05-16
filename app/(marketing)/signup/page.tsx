'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          businessName,
          contactName,
          email,
          phone,
          password,
          accessCode,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessage(result.error || 'Signup failed.')
        return
      }

      setSuccess(true)

      setMessage(
        'Account created. Please check your email to verify your account before signing in.'
      )

      setBusinessName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setAccessCode('')
    } catch (error) {
      setMessage('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1e1e1e]">
      <section className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center bg-[#244f3d] px-8 py-14 text-white md:px-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
              Buyer Registration
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Open a purchasing account with Local Connect.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/80">
              Create a buyer account for your restaurant, cafe, grocer, or food
              service business.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center border border-[#d6cec0] bg-white px-6 py-14 md:px-12">
          <div className="w-full max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
              Create Account
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Buyer signup
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6f675c]">
              Fill out your business details to create a wholesale buyer
              account.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <fieldset
                disabled={success}
                className="space-y-5 disabled:opacity-60"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                    Business Name
                  </label>

                  <input
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                    Contact Name
                  </label>

                  <input
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                      Email
                    </label>

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                      Phone
                    </label>

                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                    Access Code
                  </label>

                  <input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                  />

                  <p className="mt-2 text-xs leading-5 text-[#6f675c]">
                    Have a Local Connect access code? Enter it to auto-approve
                    your buyer account after email verification.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                    Password
                  </label>

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f5d46] disabled:opacity-60"
                >
                  {loading
                    ? 'Creating account...'
                    : 'Create Buyer Account'}
                </button>
              </fieldset>
            </form>

            <Link
              href="/login"
              className="mt-4 block w-full border border-[#244f3d] px-5 py-3 text-center text-sm font-bold text-[#244f3d] transition hover:bg-[#f4f1ea]"
            >
              Already have an account? Sign in
            </Link>

            <p className="mt-5 text-center text-xs leading-6 text-[#6f675c]">
              For questions, please contact your Local Connect rep or{' '}
              <a
                href="mailto:liam@localconnectfood.ca"
                className="underline hover:text-[#244f3d]"
              >
                liam@localconnectfood.ca
              </a>
            </p>

            {message && (
              <div
                className={
                  success
                    ? 'mt-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800'
                    : 'mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800'
                }
              >
                <p className="font-bold">
                  {success ? 'Check your email' : 'Signup issue'}
                </p>

                <p className="mt-1">{message}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}