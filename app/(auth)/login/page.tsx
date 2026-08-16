'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type ProfileRole = 'admin' | 'buyer' | 'producer'

const inputClass =
  'h-[52px] w-full rounded-none border border-[#d9ddd8] bg-white px-4 text-[16px] text-[#1d2721] outline-none transition placeholder:text-[#9b978f] focus:border-[#1f5a43] focus:ring-2 focus:ring-[#1f5a43]/10 disabled:cursor-not-allowed disabled:bg-[#f3f5f2] sm:h-12 sm:text-[15px]'

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
      setMessage(
        error?.message ||
          'We could not sign you in with those credentials.'
      )
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
      setMessage(
        'Your login was accepted, but we could not load your account profile.'
      )
      return
    }

    const role = profile.role as ProfileRole

    if (role === 'admin') {
      window.location.assign('/admin/dashboard')
      return
    }

    const { data: memberships, error: membershipError } = await supabase
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

    const customerIds = memberships.map(
      (membership) => membership.customer_id
    )

    const { data: customers, error: customerError } = await supabase
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

    const approvedCustomer = customers.find(
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
      window.location.assign('/producer/products')
      return
    }

    window.location.assign('/products')
  }

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#1d2721]">
      <div className="grid min-h-screen lg:grid-cols-[40%_60%]">
        {/* Hero */}
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <Image
            src="/images/lc-login-hero.png"
            alt="Local Connect refrigerated foodservice delivery truck"
            fill
            priority
            className="object-cover object-[58%_center]"
            sizes="40vw"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#0d2d22]/35 via-[#0d2d22]/30 to-[#0a241b]/88" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2d22]/22 to-transparent" />

          <div className="relative z-10 flex min-h-screen flex-col px-10 py-9 text-white xl:px-14 xl:py-11">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Local Connect Foodservice"
                width={150}
                height={56}
                priority
                className="h-auto w-[145px] brightness-0 invert"
              />
            </Link>

            <div className="mt-auto max-w-[430px] pb-8">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                FoodService Purchasing
              </p>

              <h1 className="text-[42px] font-semibold leading-[1.03] tracking-[-0.045em] xl:text-[52px]">
                Heard, Chef.
              </h1>

              <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-white/78">
                The products you want to serve, backed by a foodservice partner
                that listens, solves problems and helps keep your kitchen moving.
              </p>

              <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-5 text-[12px] font-medium text-white/64">
                <span>Products you want</span>
                <span className="h-1 w-1 bg-white/40" />
                <span>Service that listens</span>
                <span className="h-1 w-1 bg-white/40" />
                <span>A partner in your business</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Login */}
        <section className="relative bg-[#f8f9f7] px-4 pb-10 pt-4 sm:px-8 sm:py-10 lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:px-16">
          <div className="absolute right-7 top-7 hidden items-center gap-2 text-[12px] text-[#686e69] sm:flex">
            <span>Need an account?</span>
            <Link
              href="/signup"
              className="font-semibold text-[#1f5a43] hover:underline"
            >
              Join Local Connect
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[720px] pb-8 sm:pb-0 lg:max-w-[490px]">
            {/* Mobile brand */}
            <div className="-mx-4 mb-7 flex h-[58px] items-center justify-between border-b border-[#d9ddd8] bg-white/90 px-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="Local Connect Foodservice"
                  width={128}
                  height={48}
                  priority
                  className="h-auto w-[118px]"
                />
              </Link>

              <Link
                href="/signup"
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1f5a43]"
              >
                Create account
              </Link>
            </div>

            <div className="mb-6 pt-0 sm:mb-8 lg:pt-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#54705f]">
                Account Access
              </p>

              <h2 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#18221c] sm:mt-3 sm:text-[40px]">
                Welcome back
              </h2>

              <p className="mt-2 max-w-xl text-[14px] leading-5 text-[#747a75] sm:mt-3 sm:text-[15px] sm:leading-6">
                Your ordering desk for the products you want to serve, with a
                foodservice team that works like a partner in your business.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[12px] font-semibold text-[#464c47]"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@business.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[12px] font-semibold text-[#464c47]"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="py-1 text-[12px] font-semibold text-[#1f5a43] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {message && (
                <div
                  role="alert"
                  className="mt-4 border-l-2 border-[#c46a5f] bg-[#fff7f5] px-4 py-3"
                >
                  <p className="text-[13px] font-semibold text-[#8b4039]">
                    We couldn’t sign you in
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-[#875c55]">
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-[52px] w-full items-center justify-center rounded-none bg-[#1f5a43] px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#174735] focus:outline-none focus:ring-2 focus:ring-[#1f5a43]/15 disabled:cursor-not-allowed disabled:bg-[#9aa69f] sm:mt-7 sm:h-12 sm:text-[14px] sm:normal-case sm:tracking-normal"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-none border-2 border-white/35 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4 sm:my-8">
              <div className="h-px flex-1 bg-[#e5e5e0]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9a9d99]">
                or
              </span>
              <div className="h-px flex-1 bg-[#e5e5e0]" />
            </div>

            <Link
              href="/signup"
              className="flex h-[52px] w-full items-center justify-center rounded-none border border-[#1f5a43] bg-white px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1f5a43] transition-colors hover:bg-[#f2f7f4] sm:h-12 sm:text-[14px] sm:normal-case sm:tracking-normal"
            >
              Create a purchasing account
            </Link>

            <p className="mt-8 text-center text-[11px] leading-5 text-[#9a9d99] sm:mt-12">
              Need help accessing your account?{' '}
              <a
                href="mailto:liam@localconnectfood.ca"
                className="font-semibold text-[#66736a] hover:text-[#1f5a43]"
              >
                Contact Local Connect
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}