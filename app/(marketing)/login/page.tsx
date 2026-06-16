'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type ProfileRole = 'admin' | 'buyer' | 'producer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error || !data.user) {
      setLoading(false)
      setMessage(error?.message || 'Login failed')
      return
    }

    const userId = data.user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage('Login worked, but role lookup failed.')
      return
    }

    const role = profile.role as ProfileRole

    if (role === 'admin') {
      setLoading(false)
      window.location.assign('/admin/dashboard')
      return
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('customer_members')
      .select('customer_id, role')
      .eq('user_id', userId)

    if (membershipError || !memberships || memberships.length === 0) {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage(
        role === 'producer'
          ? 'Producer account could not be found.'
          : 'Buyer account could not be found.'
      )
      return
    }

    const customerIds = memberships.map(
      (membership) => membership.customer_id
    )

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, approved')
      .in('id', customerIds)

    if (customerError || !customers || customers.length === 0) {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage(
        role === 'producer'
          ? 'Producer account could not be found.'
          : 'Buyer account could not be found.'
      )
      return
    }

    const approvedCustomer = customers.find(
      (customer) => customer.approved
    )

    if (!approvedCustomer) {
      await supabase.auth.signOut()
      setLoading(false)

      setMessage(
        role === 'producer'
          ? 'Your producer account is pending approval. We’ll notify you once your account has been approved.'
          : 'Your buyer account is pending approval. We’ll notify you once your account has been approved.'
      )

      return
    }

    setLoading(false)

    if (role === 'producer') {
      window.location.assign('/producer/products')
      return
    }

    window.location.assign('/products')
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1e1e1e]">
      <section className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-center bg-[#244f3d] px-8 py-14 text-white md:px-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
              Welcome back!
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Log into your Local Connect wholesale account.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/80">
              Place orders, manage products, view previous deliveries, and keep
              your account moving.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center border border-[#d6cec0] bg-white px-6 py-14 md:px-12">
          <div className="w-full max-w-md">
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Sign in
            </h2>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  placeholder="chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none transition focus:border-[#244f3d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Password
                </label>

                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none transition focus:border-[#244f3d]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f5d46] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <Link
              href="/reset-password-request"
              className="mt-4 block text-center text-sm font-bold text-[#244f3d] hover:underline"
            >
              Forgot password?
            </Link>

            <Link
              href="/signup"
              className="mt-4 block w-full border border-[#244f3d] px-5 py-3 text-center text-sm font-bold text-[#244f3d] transition hover:bg-[#f4f1ea]"
            >
              Create Account
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