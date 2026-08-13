'use client'

import Link from 'next/link'
import Script from 'next/script'
import {
  useEffect,
  useRef,
  useState,
} from 'react'

type AccountType = 'restaurant' | 'producer'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          appearance?: 'always' | 'execute' | 'interaction-only'
        }
      ) => string

      reset: (widgetId?: string) => void
      remove?: (widgetId: string) => void
    }
  }
}

const inputClass =
  'w-full rounded-xl border border-[#d8d2c7] bg-white px-4 py-3.5 text-[15px] text-[#1f2923] outline-none transition placeholder:text-[#a39d93] focus:border-[#244f3d] focus:ring-4 focus:ring-[#244f3d]/10 disabled:cursor-not-allowed disabled:bg-[#f3f1ec]'

const labelClass =
  'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#675f55]'

export default function SignupPage() {
  const [accountType, setAccountType] =
    useState<AccountType>('restaurant')

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const [deliveryAddress, setDeliveryAddress] =
    useState('')
  const [deliveryCity, setDeliveryCity] =
    useState('')
  const [
    deliveryPostalCode,
    setDeliveryPostalCode,
  ] = useState('')
  const [deliveryNotes, setDeliveryNotes] =
    useState('')

  // Anti-bot
  const [turnstileToken, setTurnstileToken] =
    useState('')
  const [turnstileLoaded, setTurnstileLoaded] =
    useState(false)

  // Honeypot
  const [website, setWebsite] = useState('')

  const [formStartedAt, setFormStartedAt] =
    useState<number | null>(null)

  const [signupNonce, setSignupNonce] =
    useState('')

  const turnstileContainerRef =
    useRef<HTMLDivElement | null>(null)

  const turnstileWidgetId =
    useRef<string | null>(null)

  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const role =
    accountType === 'producer'
      ? 'producer'
      : 'buyer'

  const businessLabel =
    accountType === 'producer'
      ? 'Farm / Producer Name'
      : 'Restaurant / Business Name'

  const addressLabel =
    accountType === 'producer'
      ? 'Pickup Address'
      : 'Delivery Address'

  const cityLabel =
    accountType === 'producer'
      ? 'Pickup City'
      : 'Delivery City'

  const notesLabel =
    accountType === 'producer'
      ? 'Pickup Instructions'
      : 'Delivery Instructions'

  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  /*
   * Create anti-bot values after the page mounts.
   */
  useEffect(() => {
    setFormStartedAt(Date.now())
    setSignupNonce(crypto.randomUUID())
  }, [])

  /*
   * Render Turnstile after Cloudflare's script loads.
   */
  useEffect(() => {
    if (
      !turnstileLoaded ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      !turnstileSiteKey
    ) {
      return
    }

    if (turnstileWidgetId.current) {
      return
    }

    turnstileWidgetId.current =
      window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: turnstileSiteKey,

          theme: 'light',

          appearance: 'always',

          callback: (token: string) => {
            setTurnstileToken(token)
          },

          'expired-callback': () => {
            setTurnstileToken('')
          },

          'error-callback': () => {
            setTurnstileToken('')
          },
        }
      )

    return () => {
      if (
        turnstileWidgetId.current &&
        window.turnstile?.remove
      ) {
        window.turnstile.remove(
          turnstileWidgetId.current
        )

        turnstileWidgetId.current = null
      }
    }
  }, [
    turnstileLoaded,
    turnstileSiteKey,
  ])

  function resetTurnstile() {
    setTurnstileToken('')

    if (
      window.turnstile &&
      turnstileWidgetId.current
    ) {
      window.turnstile.reset(
        turnstileWidgetId.current
      )
    }
  }

  function resetForm() {
    setBusinessName('')
    setContactName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setAccessCode('')
    setDeliveryAddress('')
    setDeliveryCity('')
    setDeliveryPostalCode('')
    setDeliveryNotes('')
    setWebsite('')

    setFormStartedAt(Date.now())
    setSignupNonce(crypto.randomUUID())

    resetTurnstile()
  }

  async function handleSignup(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!turnstileToken) {
      setSuccess(false)
      setMessage(
        'Please complete the security verification before creating your account.'
      )
      return
    }

    if (!formStartedAt || !signupNonce) {
      setSuccess(false)
      setMessage(
        'Security verification is still initializing. Please refresh the page and try again.'
      )
      return
    }

    setLoading(true)
    setMessage('')
    setSuccess(false)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          role,
          businessName,
          contactName,
          email,
          phone,
          password,
          accessCode,
          deliveryAddress,
          deliveryCity,
          deliveryPostalCode,
          deliveryNotes,

          // Anti-bot
          turnstileToken,
          website,
          formStartedAt,
          signupNonce,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessage(
          result.error ||
            'Signup failed. Please try again.'
        )

        resetTurnstile()
        return
      }

      setSuccess(true)

      setMessage(
        result.message ||
          'Account created. Please check your email to verify your account.'
      )

      resetForm()
    } catch {
      setMessage(
        'Signup failed. Please try again.'
      )

      resetTurnstile()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
      />

      <main className="min-h-screen bg-[#ede9e0] text-[#1e2822]">
        {/* Honeypot */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10000px] top-[-10000px] h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor="company_website">
            Company Website
          </label>

          <input
            id="company_website"
            name="company_website"
            type="text"
            value={website}
            onChange={(e) =>
              setWebsite(e.target.value)
            }
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[0.82fr_1.18fr]">
          {/* ===================================================
              LEFT PANEL
          =================================================== */}

          <aside className="relative hidden overflow-hidden bg-[#214b38] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
            {/* Decorative shapes */}
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

                  {accountType === 'producer'
                    ? 'Producer Network'
                    : 'Wholesale Purchasing'}
                </div>

                <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-6xl">
                  {accountType === 'producer'
                    ? 'Put your products in front of local buyers.'
                    : 'A better way to source for your kitchen.'}
                </h1>

                <p className="mt-7 max-w-md text-[17px] leading-8 text-white/70">
                  {accountType === 'producer'
                    ? 'Join Local Connect to manage your products, availability, pickups, and restaurant orders from one place.'
                    : 'Create your Local Connect purchasing account to access wholesale products from trusted local and regional suppliers.'}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-16">
              <div className="border-t border-white/15 pt-8">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-2xl font-semibold">
                      Local
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/55">
                      Producers & suppliers
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold">
                      Simple
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/55">
                      Wholesale ordering
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold">
                      Secure
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/55">
                      Verified accounts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ===================================================
              RIGHT SIDE
          =================================================== */}

          <section className="px-5 py-6 sm:px-8 md:px-12 lg:px-14 lg:py-12 xl:px-20">
            <div className="mx-auto max-w-3xl">
              {/* Mobile logo */}

              <div className="mb-8 flex items-center justify-between lg:hidden">
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
                  href="/login"
                  className="text-sm font-semibold text-[#214b38]"
                >
                  Sign in
                </Link>
              </div>

              {/* Header */}

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#426a54]">
                  New Account
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                  Join Local Connect
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#766f65]">
                  Tell us a little about your business.
                  Accounts without an access code may be
                  reviewed before purchasing is enabled.
                </p>
              </div>

              {/* Account type */}

              <div className="mb-9 rounded-2xl bg-[#dfdbd1] p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('restaurant')
                      setSuccess(false)
                      setMessage('')
                    }}
                    className={`rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                      accountType === 'restaurant'
                        ? 'bg-white text-[#214b38] shadow-sm'
                        : 'text-[#6e685f] hover:text-[#214b38]'
                    }`}
                  >
                    <span className="block">
                      Restaurant / Buyer
                    </span>

                    <span
                      className={`mt-0.5 hidden text-[11px] font-normal sm:block ${
                        accountType ===
                        'restaurant'
                          ? 'text-[#80796f]'
                          : 'text-[#8e877d]'
                      }`}
                    >
                      Purchase wholesale products
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('producer')
                      setSuccess(false)
                      setMessage('')
                    }}
                    className={`rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                      accountType === 'producer'
                        ? 'bg-white text-[#214b38] shadow-sm'
                        : 'text-[#6e685f] hover:text-[#214b38]'
                    }`}
                  >
                    <span className="block">
                      Producer / Supplier
                    </span>

                    <span
                      className={`mt-0.5 hidden text-[11px] font-normal sm:block ${
                        accountType === 'producer'
                          ? 'text-[#80796f]'
                          : 'text-[#8e877d]'
                      }`}
                    >
                      Sell through Local Connect
                    </span>
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleSignup}
                className="space-y-7"
              >
                <fieldset
                  disabled={success}
                  className="space-y-7 disabled:opacity-70"
                >
                  {/* =======================================
                      CONTACT
                  ======================================= */}

                  <FormSection
                    number="01"
                    title="Business information"
                    description={
                      accountType === 'producer'
                        ? 'Tell us who produces or supplies the products.'
                        : 'Tell us about the business placing orders.'
                    }
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          {businessLabel}
                        </label>

                        <input
                          required
                          maxLength={150}
                          autoComplete="organization"
                          value={businessName}
                          onChange={(e) =>
                            setBusinessName(
                              e.target.value
                            )
                          }
                          placeholder={
                            accountType ===
                            'producer'
                              ? 'Example: Stoney Flats Harvest'
                              : 'Example: The Noble Pig'
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Primary Contact
                        </label>

                        <input
                          required
                          maxLength={150}
                          autoComplete="name"
                          value={contactName}
                          onChange={(e) =>
                            setContactName(
                              e.target.value
                            )
                          }
                          placeholder="Full name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Phone
                        </label>

                        <input
                          type="tel"
                          maxLength={50}
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value)
                          }
                          placeholder="(250) 555-0123"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          Email
                        </label>

                        <input
                          type="email"
                          required
                          maxLength={254}
                          autoComplete="email"
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          placeholder="you@business.ca"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* =======================================
                      LOCATION
                  ======================================= */}

                  <FormSection
                    number="02"
                    title={
                      accountType === 'producer'
                        ? 'Pickup location'
                        : 'Delivery location'
                    }
                    description={
                      accountType === 'producer'
                        ? 'Where should Local Connect collect your products?'
                        : 'Where should we deliver your orders?'
                    }
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          {addressLabel}
                        </label>

                        <input
                          required
                          maxLength={250}
                          autoComplete="street-address"
                          value={deliveryAddress}
                          onChange={(e) =>
                            setDeliveryAddress(
                              e.target.value
                            )
                          }
                          placeholder="Street address"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {cityLabel}
                        </label>

                        <input
                          required
                          maxLength={100}
                          autoComplete="address-level2"
                          value={deliveryCity}
                          onChange={(e) =>
                            setDeliveryCity(
                              e.target.value
                            )
                          }
                          placeholder="Kamloops"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Postal Code
                        </label>

                        <input
                          required
                          maxLength={7}
                          autoComplete="postal-code"
                          value={deliveryPostalCode}
                          onChange={(e) =>
                            setDeliveryPostalCode(
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="V2C 1A1"
                          className={`${inputClass} uppercase`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          {notesLabel}
                          <span className="ml-2 font-medium normal-case tracking-normal text-[#9a9389]">
                            Optional
                          </span>
                        </label>

                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={deliveryNotes}
                          onChange={(e) =>
                            setDeliveryNotes(
                              e.target.value
                            )
                          }
                          placeholder={
                            accountType ===
                            'producer'
                              ? 'Pickup hours, farm gate instructions, cooler location...'
                              : 'Receiving hours, entrance, buzzer, drop-off instructions...'
                          }
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* =======================================
                      ACCOUNT
                  ======================================= */}

                  <FormSection
                    number="03"
                    title="Account security"
                    description="Create your login and complete the verification below."
                  >
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className={labelClass}>
                            Password
                          </label>

                          <span className="mb-2 text-xs text-[#938c82]">
                            Minimum 10 characters
                          </span>
                        </div>

                        <input
                          type="password"
                          required
                          minLength={10}
                          maxLength={128}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="Create a secure password"
                          className={inputClass}
                        />

                        {password && (
                          <div className="mt-3">
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map(
                                (level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full ${
                                      level <=
                                      getPasswordStrength(
                                        password
                                      )
                                        ? 'bg-[#376c4d]'
                                        : 'bg-[#ddd8cf]'
                                    }`}
                                  />
                                )
                              )}
                            </div>

                            <p className="mt-2 text-xs text-[#817a70]">
                              {getPasswordLabel(
                                password
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>
                          Local Connect Access Code
                          <span className="ml-2 font-medium normal-case tracking-normal text-[#9a9389]">
                            Optional
                          </span>
                        </label>

                        <input
                          value={accessCode}
                          onChange={(e) =>
                            setAccessCode(
                              e.target.value
                            )
                          }
                          autoComplete="off"
                          placeholder="Enter code if provided"
                          className={inputClass}
                        />

                        <div className="mt-3 flex gap-2.5 rounded-xl bg-[#f1eee7] px-4 py-3">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="mt-0.5 h-4 w-4 flex-none text-[#426a54]"
                          >
                            <path
                              d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>

                          <p className="text-xs leading-5 text-[#766f65]">
                            An access code can
                            automatically approve your
                            account after email
                            verification. No code? You can
                            still apply normally.
                          </p>
                        </div>
                      </div>

                      {/* Turnstile */}

                      <div className="overflow-hidden rounded-2xl border border-[#d8d2c7] bg-[#f7f5f0] p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#28362e]">
                              Security verification
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#817a70]">
                              Helps us prevent automated
                              account creation.
                            </p>
                          </div>

                          {turnstileToken && (
                            <div className="flex items-center gap-1.5 rounded-full bg-[#dfece2] px-2.5 py-1 text-[11px] font-bold text-[#315d42]">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-3.5 w-3.5"
                              >
                                <path
                                  d="m5 12 4 4L19 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              Verified
                            </div>
                          )}
                        </div>

                        {!turnstileSiteKey ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            Turnstile site key is not
                            configured.
                          </div>
                        ) : (
                          <div
                            ref={
                              turnstileContainerRef
                            }
                            className="min-h-[65px]"
                          />
                        )}
                      </div>
                    </div>
                  </FormSection>

                  {/* =======================================
                      SUBMIT
                  ======================================= */}

                  <div>
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !turnstileToken ||
                        !formStartedAt ||
                        !signupNonce
                      }
                      className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#214b38] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#193d2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#9eaa9f] disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          Creating account...
                        </>
                      ) : (
                        <>
                          {accountType ===
                          'producer'
                            ? 'Create Producer Account'
                            : 'Create Buyer Account'}

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

                    <p className="mt-3 text-center text-[11px] leading-5 text-[#918a80]">
                      By creating an account, you confirm
                      that the information submitted is
                      accurate and relates to a legitimate
                      business.
                    </p>
                  </div>
                </fieldset>
              </form>

              {/* =========================================
                  FEEDBACK
              ========================================= */}

              {message && (
                <div
                  className={`mt-6 rounded-2xl border p-4 ${
                    success
                      ? 'border-[#bed8c5] bg-[#edf6ef] text-[#315d42]'
                      : 'border-[#e7c5c2] bg-[#fff3f1] text-[#8b4039]'
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                        success
                          ? 'bg-[#d8eadc]'
                          : 'bg-[#f7dedb]'
                      }`}
                    >
                      {success ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-black">
                          !
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        {success
                          ? 'Check your email'
                          : 'We couldn’t create the account'}
                      </p>

                      <p className="mt-1 text-sm leading-6 opacity-80">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing account */}

              <div className="mt-8 border-t border-[#d7d2c8] pt-7 text-center">
                <p className="text-sm text-[#766f65]">
                  Already have a Local Connect
                  account?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-[#214b38] underline decoration-[#214b38]/30 underline-offset-4 transition hover:decoration-[#214b38]"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="mt-5 text-xs leading-6 text-[#938c82]">
                  Need help? Contact your Local Connect
                  representative or{' '}
                  <a
                    href="mailto:liam@localconnectfood.ca"
                    className="font-semibold text-[#5c7464] hover:text-[#214b38]"
                  >
                    liam@localconnectfood.ca
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#d8d2c7] bg-[#f9f7f2] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-6">
      <div className="mb-6 flex gap-4">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#e1e9e3] text-[11px] font-black text-[#315d42]">
          {number}
        </div>

        <div>
          <h3 className="text-base font-semibold tracking-tight text-[#28362e]">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#817a70]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  )
}

function getPasswordStrength(password: string) {
  let strength = 0

  if (password.length >= 10) {
    strength++
  }

  if (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password)
  ) {
    strength++
  }

  if (/\d/.test(password)) {
    strength++
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    strength++
  }

  return Math.max(1, strength)
}

function getPasswordLabel(password: string) {
  const strength =
    getPasswordStrength(password)

  if (strength <= 1) {
    return 'Weak — add length, numbers, and symbols.'
  }

  if (strength === 2) {
    return 'Fair — a little more complexity would help.'
  }

  if (strength === 3) {
    return 'Good password.'
  }

  return 'Strong password.'
}