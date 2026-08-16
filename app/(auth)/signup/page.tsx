'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  'h-[52px] w-full rounded-none border border-[#d9ddd8] bg-white px-4 text-[16px] text-[#1d2721] outline-none transition placeholder:text-[#9b978f] focus:border-[#1f5a43] focus:ring-2 focus:ring-[#1f5a43]/10 disabled:cursor-not-allowed disabled:bg-[#f3f5f2] sm:h-12 sm:text-[15px]'

const labelClass =
  'mb-2 block text-[12px] font-semibold text-[#464c47]'

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

  // Progressive signup flow. Optional fields do not block the next step.
  const businessInfoComplete =
    businessName.trim().length > 1 &&
    contactName.trim().length > 1 &&
    email.trim().includes('@')

  const locationComplete =
    businessInfoComplete &&
    deliveryAddress.trim().length > 3 &&
    deliveryCity.trim().length > 1 &&
    deliveryPostalCode.trim().length >= 5

  const accountStepUnlocked =
    businessInfoComplete && locationComplete

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
      !accountStepUnlocked ||
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
    accountStepUnlocked,
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

      <main className="min-h-screen bg-[#f4f5f2] text-[#1d2721]">
        {/* Honeypot */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10000px] top-[-10000px] h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor="company_website">Company Website</label>
          <input
            id="company_website"
            name="company_website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid min-h-screen lg:grid-cols-[40%_60%]">
          {/* HERO */}
          <aside className="relative hidden min-h-screen overflow-hidden lg:block">
            <Image
              src="/images/signup-hero.png"
              alt="Local Connect refrigerated foodservice delivery"
              fill
              priority
              className="object-cover object-[58%_center]"
              sizes="40vw"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#0d2d22]/35 via-[#0d2d22]/30 to-[#0a241b]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d2d22]/24 to-transparent" />

            <div className="relative z-10 flex min-h-screen flex-col px-10 py-9 text-white xl:px-14 xl:py-11">
              <Link href="/" className="inline-flex w-fit">
                <Image
                  src="/images/logo.png"
                  alt="Local Connect Foodservice"
                  width={150}
                  height={56}
                  priority
                  className="h-auto w-[145px] brightness-0 invert"
                />
              </Link>

              <div className="mt-auto max-w-[440px] pb-8">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {accountType === 'producer'
                    ? 'Supplier Network'
                    : 'Foodservice Purchasing'}
                </p>

                <h1 className="text-[42px] font-semibold leading-[1.03] tracking-[-0.045em] xl:text-[52px]">
                  Heard, Chef.
                </h1>

                <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-white/78">
                  {accountType === 'producer'
                    ? 'Bring the products you are proud of. We bring the customers, ordering infrastructure and last mile to help you grow.'
                    : 'The products you want to serve, backed by a foodservice partner that listens, solves problems and helps keep your kitchen moving.'}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/20 pt-5 text-[12px] font-medium text-white/64">
                  {accountType === 'producer' ? (
                    <>
                      <span>Your products</span>
                      <span className="h-1 w-1 bg-white/40" />
                      <span>Our customers</span>
                      <span className="h-1 w-1 bg-white/40" />
                      <span>Shared growth</span>
                    </>
                  ) : (
                    <>
                      <span>Products you want</span>
                      <span className="h-1 w-1 bg-white/40" />
                      <span>Service that listens</span>
                      <span className="h-1 w-1 bg-white/40" />
                      <span>A partner in your business</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* FORM */}
          <section className="relative bg-[#f8f9f7] px-4 pb-10 pt-4 sm:px-8 sm:py-10 lg:px-14 xl:px-20">
            <div className="absolute right-7 top-7 hidden items-center gap-2 text-[12px] text-[#686e69] sm:flex">
              <span>Already have an account?</span>
              <Link
                href="/login"
                className="font-semibold text-[#1f5a43] hover:underline"
              >
                Sign in
              </Link>
            </div>

            <div className="mx-auto w-full max-w-[720px]">
              {/* Mobile header */}
              <div className="-mx-4 mb-7 flex h-[58px] items-center justify-between border-b border-[#d9ddd8] bg-white/90 px-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
                <Link href="/" className="inline-flex">
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
                  href="/login"
                  className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1f5a43]"
                >
                  Sign in
                </Link>
              </div>

              {/* Header */}
              <div className="mb-6 pt-0 sm:mb-8 lg:pt-12">
                <Image
                  src="/images/logo.png"
                  alt="Local Connect Foodservice"
                  width={176}
                  height={66}
                  priority
                  className="mb-8 hidden h-auto w-[168px] lg:block"
                />

                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#54705f]">
                  New Account
                </p>

                <h2 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#18221c] sm:mt-3 sm:text-[40px]">
                  Join Local Connect
                </h2>

                <p className="mt-2 max-w-xl text-[14px] leading-5 text-[#747a75] sm:mt-3 sm:text-[15px] sm:leading-6">
                  {accountType === 'producer'
                    ? 'Tell us about your business and the products you want to bring into the Local Connect network.'
                    : 'Set up your purchasing account and tell us where your kitchen needs us to show up.'}
                </p>
              </div>

              {/* Account type selector */}
              <div className="mb-7 grid grid-cols-2 border border-[#d9ddd8] bg-white sm:mb-10">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('restaurant')
                    setSuccess(false)
                    setMessage('')
                  }}
                  className={`border-r border-[#d9ddd8] px-3 py-3.5 text-left transition-colors sm:px-5 sm:py-4 ${
                    accountType === 'restaurant'
                      ? 'bg-[#1f5a43] text-white'
                      : 'bg-white text-[#535a55] hover:bg-[#f3f6f4]'
                  }`}
                >
                  <span className="block text-[12px] font-bold sm:text-sm">
                    Restaurant / Buyer
                  </span>
                  <span
                    className={`mt-1 hidden text-[11px] sm:block ${
                      accountType === 'restaurant'
                        ? 'text-white/70'
                        : 'text-[#8b908c]'
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
                  className={`px-3 py-3.5 text-left transition-colors sm:px-5 sm:py-4 ${
                    accountType === 'producer'
                      ? 'bg-[#1f5a43] text-white'
                      : 'bg-white text-[#535a55] hover:bg-[#f3f6f4]'
                  }`}
                >
                  <span className="block text-[12px] font-bold sm:text-sm">
                    Producer / Supplier
                  </span>
                  <span
                    className={`mt-1 hidden text-[11px] sm:block ${
                      accountType === 'producer'
                        ? 'text-white/70'
                        : 'text-[#8b908c]'
                    }`}
                  >
                    Sell through Local Connect
                  </span>
                </button>
              </div>

              <div className="mb-7 grid grid-cols-3 gap-1 sm:hidden">
                <div className={`h-1 ${businessInfoComplete ? 'bg-[#1f5a43]' : 'bg-[#d9ddd8]'}`} />
                <div className={`h-1 ${locationComplete ? 'bg-[#1f5a43]' : 'bg-[#d9ddd8]'}`} />
                <div className={`h-1 ${accountStepUnlocked ? 'bg-[#1f5a43]' : 'bg-[#d9ddd8]'}`} />
              </div>

              <form onSubmit={handleSignup} className="space-y-8 sm:space-y-10">
                <fieldset
                  disabled={success}
                  className="space-y-8 disabled:opacity-70 sm:space-y-10"
                >
                  <FormSection
                    number="01"
                    title="Business information"
                    description={
                      accountType === 'producer'
                        ? 'Who should we know and work with?'
                        : 'Tell us about the business placing orders.'
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{businessLabel}</label>
                        <input
                          required
                          maxLength={150}
                          autoComplete="organization"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder={
                            accountType === 'producer'
                              ? 'Example: Stoney Flats Harvest'
                              : 'Example: The Noble Pig'
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Primary Contact</label>
                        <input
                          required
                          maxLength={150}
                          autoComplete="name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Full name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="tel"
                          maxLength={50}
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(250) 555-0123"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass}>Email</label>
                        <input
                          type="email"
                          required
                          maxLength={254}
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@business.ca"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <ProgressiveStep
                    unlocked={businessInfoComplete}
                    lockedNumber="02"
                    lockedTitle={
                      accountType === 'producer'
                        ? 'Pickup location'
                        : 'Delivery location'
                    }
                    lockedMessage="Complete your business information to continue."
                  >
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
                        : 'Where should Local Connect deliver your orders?'
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{addressLabel}</label>
                        <input
                          required
                          maxLength={250}
                          autoComplete="street-address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Street address"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>{cityLabel}</label>
                        <input
                          required
                          maxLength={100}
                          autoComplete="address-level2"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="Kamloops"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Postal Code</label>
                        <input
                          required
                          maxLength={7}
                          autoComplete="postal-code"
                          value={deliveryPostalCode}
                          onChange={(e) =>
                            setDeliveryPostalCode(e.target.value.toUpperCase())
                          }
                          placeholder="V2C 1A1"
                          className={`${inputClass} uppercase`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          {notesLabel}
                          <span className="ml-2 font-normal text-[#9a9d99]">
                            Optional
                          </span>
                        </label>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder={
                            accountType === 'producer'
                              ? 'Pickup hours, farm gate instructions, cooler location...'
                              : 'Receiving hours, entrance, buzzer, drop-off instructions...'
                          }
                          className={`${inputClass} h-auto min-h-[108px] resize-none py-3`}
                        />
                      </div>
                    </div>
                  </FormSection>
                  </ProgressiveStep>

                  <ProgressiveStep
                    unlocked={accountStepUnlocked}
                    lockedNumber="03"
                    lockedTitle="Account security"
                    lockedMessage={
                      accountType === 'producer'
                        ? 'Add your pickup location to unlock account security.'
                        : 'Add your delivery location to unlock account security.'
                    }
                  >
                  <FormSection
                    number="03"
                    title="Account security"
                    description="Create your login and complete the security check."
                  >
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-[12px] font-semibold text-[#464c47]">
                            Password
                          </label>
                          <span className="text-[11px] text-[#929792]">
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
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a secure password"
                          className={inputClass}
                        />

                        {password && (
                          <div className="mt-3">
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 ${
                                    level <= getPasswordStrength(password)
                                      ? 'bg-[#376c4d]'
                                      : 'bg-[#dfe3df]'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-[#747a75]">
                              {getPasswordLabel(password)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>
                          Local Connect Access Code
                          <span className="ml-2 font-normal text-[#9a9d99]">
                            Optional
                          </span>
                        </label>

                        <input
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          autoComplete="off"
                          placeholder="Enter code if provided"
                          className={inputClass}
                        />

                        <div className="mt-3 border-l-2 border-[#8ea596] bg-[#f3f6f4] px-3.5 py-3 sm:px-4">
                          <p className="text-xs leading-5 text-[#6f766f]">
                            An access code can automatically approve your
                            account after email verification. No code? You can
                            still apply normally.
                          </p>
                        </div>
                      </div>

                      <div className="border border-[#d9ddd8] bg-white p-3.5 sm:p-5">
                        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#28362e]">
                              Security verification
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#747a75]">
                              Helps us prevent automated account creation.
                            </p>
                          </div>

                          {turnstileToken && (
                            <div className="border border-[#bed8c5] bg-[#edf6ef] px-2.5 py-1 text-[11px] font-bold text-[#315d42]">
                              Verified
                            </div>
                          )}
                        </div>

                        {!turnstileSiteKey ? (
                          <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            Turnstile site key is not configured.
                          </div>
                        ) : (
                          <div
                            ref={turnstileContainerRef}
                            className="min-h-[65px] max-w-full overflow-hidden"
                          />
                        )}
                      </div>
                    </div>
                  </FormSection>
                  </ProgressiveStep>

                  <div>
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !accountStepUnlocked ||
                        !turnstileToken ||
                        !formStartedAt ||
                        !signupNonce
                      }
                      className="flex h-[52px] w-full items-center justify-center bg-[#1f5a43] px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#174735] focus:outline-none focus:ring-2 focus:ring-[#1f5a43]/15 disabled:cursor-not-allowed disabled:bg-[#9aa69f] sm:h-12 sm:text-[14px] sm:normal-case sm:tracking-normal"
                    >
                      {loading
                        ? 'Creating account...'
                        : accountType === 'producer'
                          ? 'Create producer account'
                          : 'Create purchasing account'}
                    </button>

                    <p className="mt-3 text-center text-[11px] leading-5 text-[#929792]">
                      By creating an account, you confirm that the information
                      submitted is accurate and relates to a legitimate business.
                    </p>
                  </div>
                </fieldset>
              </form>

              {message && (
                <div
                  role="alert"
                  className={`mt-6 border p-4 ${
                    success
                      ? 'border-[#bed8c5] bg-[#edf6ef] text-[#315d42]'
                      : 'border-[#e4cbc5] bg-[#fff7f5] text-[#8b4039]'
                  }`}
                >
                  <p className="text-[13px] font-bold">
                    {success ? 'Check your email' : 'We couldn’t create the account'}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 opacity-80">
                    {message}
                  </p>
                </div>
              )}

              <div className="mt-8 border-t border-[#e0e0da] pt-6 text-center sm:mt-10 sm:pt-7">
                <p className="text-sm text-[#747a75]">
                  Already have a Local Connect account?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-[#1f5a43] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="mt-5 text-xs leading-6 text-[#949994]">
                  Need help?{' '}
                  <a
                    href="mailto:liam@localconnectfood.ca"
                    className="font-semibold text-[#66736a] hover:text-[#1f5a43]"
                  >
                    Contact Local Connect
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


function ProgressiveStep({
  unlocked,
  lockedNumber,
  lockedTitle,
  lockedMessage,
  children,
}: {
  unlocked: boolean
  lockedNumber: string
  lockedTitle: string
  lockedMessage: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        aria-hidden={unlocked}
        className={`overflow-hidden transition-all duration-500 ease-out ${
          unlocked
            ? 'max-h-0 -translate-y-1 border-transparent opacity-0'
            : 'max-h-32 translate-y-0 border-t border-[#d8dad7] opacity-100'
        }`}
      >
        <div className="grid grid-cols-[34px_1fr] gap-2 py-4 sm:grid-cols-[52px_1fr] sm:gap-4 sm:py-6">
          <div className="text-[11px] font-bold tracking-[0.14em] text-[#a3a8a4]">
            {lockedNumber}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#9a9f9b] sm:text-[17px]">
                {lockedTitle}
              </h3>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5 text-[#a3a8a4]"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 10V7.5a4 4 0 0 1 8 0V10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="mt-1 text-xs leading-5 text-[#a3a8a4]">
              {lockedMessage}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${
          unlocked
            ? 'grid-rows-[1fr] translate-y-0 opacity-100'
            : 'pointer-events-none grid-rows-[0fr] translate-y-2 opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
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
    <section className="border-t border-[#d8dad7] pt-5 sm:pt-6">
      <div className="mb-4 grid grid-cols-[34px_1fr] gap-2 sm:mb-6 sm:grid-cols-[52px_1fr] sm:gap-4">
        <div className="text-[11px] font-bold tracking-[0.14em] text-[#6f8175]">
          {number}
        </div>

        <div>
          <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#28362e] sm:text-[17px]">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#747a75]">
            {description}
          </p>
        </div>
      </div>

      <div className="sm:pl-[68px]">{children}</div>
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