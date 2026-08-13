'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type ProfileRole = 'admin' | 'buyer' | 'producer'

const inputClass =
  'w-full rounded-xl border border-[#d8d2c7] bg-white px-4 py-3.5 text-[15px] text-[#1f2923] outline-none transition placeholder:text-[#a39d93] focus:border-[#244f3d] focus:ring-4 focus:ring-[#244f3d]/10 disabled:cursor-not-allowed disabled:bg-[#f3f1ec]'

const labelClass =
  'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#675f55]'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

    if (error || !data.user) {
      setLoading(false)
      setMessage(
        error?.message ||
          'We could not sign you in with those credentials.'
      )
      return
    }

    const userId = data.user.id

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()

      setLoading(false)
      setMessage(
        'Your login was accepted, but we could not load your account profile.'
      )

      return
    }

    const role =
      profile.role as ProfileRole

    if (role === 'admin') {
      window.location.assign('/admin/dashboard')
      return
    }

    const {
      data: memberships,
      error: membershipError,
    } = await supabase
      .from('customer_members')
      .select('customer_id, role')
      .eq('user_id', userId)

    if (
      membershipError ||
      !memberships ||
      memberships.length === 0
    ) {
      await supabase.auth.signOut()

      setLoading(false)

      setMessage(
        role === 'producer'
          ? 'We could not find the producer account connected to this login.'
          : 'We could not find the buyer account connected to this login.'
      )

      return
    }

    const customerIds =
      memberships.map(
        (membership) =>
          membership.customer_id
      )

    const {
      data: customers,
      error: customerError,
    } = await supabase
      .from('customers')
      .select('id, approved')
      .in('id', customerIds)

    if (
      customerError ||
      !customers ||
      customers.length === 0
    ) {
      await supabase.auth.signOut()

      setLoading(false)

      setMessage(
        role === 'producer'
          ? 'We could not find the producer account connected to this login.'
          : 'We could not find the buyer account connected to this login.'
      )

      return
    }

    const approvedCustomer =
      customers.find(
        (customer) => customer.approved
      )

    if (!approvedCustomer) {
      await supabase.auth.signOut()

      setLoading(false)

      setMessage(
        role === 'producer'
          ? 'Your producer account is still pending approval. We’ll notify you once it has been approved.'
          : 'Your buyer account is still pending approval. We’ll notify you once it has been approved.'
      )

      return
    }

    if (role === 'producer') {
      window.location.assign(
        '/producer/products'
      )

      return
    }

    window.location.assign('/products')
  }

  return (
    <main className="min-h-screen bg-[#ede9e0] text-[#1e2822]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[0.88fr_1.12fr]">

        {/* ===================================================
            LEFT BRAND PANEL
        =================================================== */}

        <aside className="relative hidden overflow-hidden bg-[#214b38] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">

          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute bottom-[-120px] left-[-100px] h-80 w-80 rounded-full bg-white/[0.025]" />

          <div className="relative z-10">

            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-[#214b38]">
                LC
              </div>

              <div>
                <p className="font-semibold tracking-tight">
                  Local Connect
                </p>

                <p className="text-xs text-white/60">
                  Foodservice
                </p>
              </div>
            </Link>

            <div className="mt-24 max-w-lg">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80">

                <span className="h-1.5 w-1.5 rounded-full bg-[#c8e1bc]" />

                Wholesale Portal
              </div>

              <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-6xl">
                Your Local Connect account, all in one place.
              </h1>

              <p className="mt-7 max-w-md text-[17px] leading-8 text-white/70">
                Order products, manage your account,
                review deliveries, and stay connected
                with your Local Connect supply network.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-16">

            <div className="border-t border-white/15 pt-8">

              <div className="grid grid-cols-3 gap-6">

                <div>
                  <p className="text-2xl font-semibold">
                    Order
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Wholesale products
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold">
                    Manage
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Your account
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold">
                    Connect
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Local suppliers
                  </p>
                </div>

              </div>
            </div>
          </div>
        </aside>

        {/* ===================================================
            LOGIN SIDE
        =================================================== */}

        <section className="flex min-h-screen items-center px-5 py-8 sm:px-8 md:px-12 lg:px-16 xl:px-24">

          <div className="mx-auto w-full max-w-lg">

            {/* Mobile header */}

            <div className="mb-12 flex items-center justify-between lg:hidden">

              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#214b38] text-sm font-black text-white">
                  LC
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Local Connect
                  </p>

                  <p className="text-[11px] text-[#817a70]">
                    Foodservice
                  </p>
                </div>
              </Link>

              <Link
                href="/signup"
                className="text-sm font-semibold text-[#214b38]"
              >
                Create account
              </Link>

            </div>

            {/* Heading */}

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#426a54]">
                Welcome Back
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Sign in to Local Connect
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-[#766f65]">
                Access your wholesale account to place
                orders, manage products, and review your
                account activity.
              </p>
            </div>

            {/* Login card */}

            <div className="mt-9 rounded-2xl border border-[#d8d2c7] bg-[#f9f7f2] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-7">

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                <div>
                  <label className={labelClass}>
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@business.ca"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>

                  <div className="flex items-center justify-between">

                    <label className={labelClass}>
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="mb-2 text-xs font-semibold text-[#426a54] transition hover:text-[#214b38] hover:underline"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#214b38] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#193d2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#9eaa9f] disabled:shadow-none"
                >

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      >
                        <path
                          d="m9 18 6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}

                </button>

              </form>

              {/* Error / status */}

              {message && (
                <div className="mt-5 rounded-xl border border-[#e2cdc7] bg-[#fff5f2] p-4">

                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#f3ded8] text-sm font-black text-[#8b4039]">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#7d3c35]">
                        Sign in issue
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#8b5a54]">
                        {message}
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* New account */}

            <div className="mt-6 rounded-2xl border border-[#d8d2c7] bg-white p-5 text-center sm:p-6">

              <p className="text-sm font-semibold text-[#28362e]">
                New to Local Connect?
              </p>

              <p className="mt-1 text-xs leading-5 text-[#817a70]">
                Create a buyer or producer account to
                access the wholesale platform.
              </p>

              <Link
                href="/signup"
                className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#214b38] px-5 py-3.5 text-sm font-bold text-[#214b38] transition hover:bg-[#eef2ed]"
              >
                Create Account
              </Link>

            </div>

            {/* Footer */}

            <p className="mt-7 text-center text-xs leading-6 text-[#938c82]">
              Need help accessing your account? Contact
              your Local Connect representative or{' '}
              <a
                href="mailto:liam@localconnectfood.ca"
                className="font-semibold text-[#5c7464] hover:text-[#214b38]"
              >
                liam@localconnectfood.ca
              </a>
            </p>

          </div>
        </section>
      </div>
    </main>
  )
}