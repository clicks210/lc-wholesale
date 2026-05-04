'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
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
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessage(result.error || 'Signup failed.')
        return
      }

      setMessage('Account created. Your buyer account is pending approval.')

      setBusinessName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setPassword('')
    } catch (error) {
      setMessage('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1e1e1e]">
      <header className="border-b border-[#d6cec0] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-[#244f3d]">
            Local Connect
          </Link>

          <Link
            href="/login"
            className="text-sm font-semibold text-[#6f675c] hover:text-[#244f3d]"
          >
            Sign In
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
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
              Fill out your business details to create a wholesale buyer account.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
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
                {loading ? 'Creating account...' : 'Create Buyer Account'}
              </button>
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
              <div className="mt-6 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm text-[#6f675c]">
                {message}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}