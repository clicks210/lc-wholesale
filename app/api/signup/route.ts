import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

/**
 * Common disposable / temporary email providers.
 * This is not meant to be exhaustive.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'mailinator.com',
  'maildrop.cc',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'getnada.com',
  'trashmail.com',
])

const MAX_BODY_BYTES = 20_000

const MIN_FORM_FILL_MS = 3_000
const MAX_FORM_AGE_MS = 60 * 60 * 1000

const MAX_IP_ATTEMPTS_PER_HOUR = 5
const MAX_IP_ATTEMPTS_PER_DAY = 15
const MAX_EMAIL_ATTEMPTS_PER_DAY = 3

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function cleanString(
  value: unknown,
  maxLength: number,
  required = false
): string | null {
  const cleaned = String(value ?? '').trim()

  if (!cleaned) {
    return required ? '' : null
  }

  return cleaned.slice(0, maxLength)
}

function getClientIp(req: Request) {
  const cfIp = req.headers.get('cf-connecting-ip')

  if (cfIp) {
    return cfIp.trim()
  }

  const forwarded = req.headers.get('x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return 'unknown'
}

function hashValue(value: string) {
  const pepper = process.env.SIGNUP_RATE_LIMIT_SECRET

  if (!pepper) {
    throw new Error('SIGNUP_RATE_LIMIT_SECRET is not configured.')
  }

  return createHash('sha256')
    .update(`${pepper}:${value}`)
    .digest('hex')
}

function isValidEmail(email: string) {
  if (email.length > 254) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidCanadianPostalCode(postalCode: string | null) {
  if (!postalCode) {
    return true
  }

  return /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(postalCode)
}

function isDisposableEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()

  if (!domain) {
    return true
  }

  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

async function verifyTurnstile({
  token,
  ip,
}: {
  token: string
  ip: string
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not configured.')
    return false
  }

  const body = new URLSearchParams()

  body.set('secret', secret)
  body.set('response', token)

  if (ip !== 'unknown') {
    body.set('remoteip', ip)
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return false
    }

    const result = await response.json()

    if (!result.success) {
      console.warn('Turnstile rejected signup:', result['error-codes'])
      return false
    }

    /**
     * Optional hostname validation.
     *
     * Prevents someone from taking your public Turnstile site key
     * and solving challenges on another domain.
     */
    if (process.env.NODE_ENV === 'production') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

      if (siteUrl) {
        const expectedHostname = new URL(siteUrl).hostname

        if (
          result.hostname &&
          result.hostname !== expectedHostname
        ) {
          console.warn(
            'Turnstile hostname mismatch:',
            result.hostname,
            expectedHostname
          )

          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Turnstile verification failed:', error)
    return false
  }
}

async function countAttempts({
  column,
  value,
  since,
}: {
  column: 'ip_hash' | 'email_hash'
  value: string
  since: Date
}) {
  const { count, error } = await supabaseAdmin
    .from('signup_attempts')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq(column, value)
    .gte('created_at', since.toISOString())

  if (error) {
    console.error('Could not check signup rate limit:', error)

    /**
     * Fail closed.
     *
     * If our anti-abuse database breaks, don't allow unlimited
     * signup traffic through.
     */
    throw new Error('Signup protection unavailable.')
  }

  return count ?? 0
}

async function recordAttempt({
  ipHash,
  emailHash,
  nonce,
  accepted,
  reason,
}: {
  ipHash: string
  emailHash: string
  nonce: string | null
  accepted: boolean
  reason: string
}) {
  const { error } = await supabaseAdmin
    .from('signup_attempts')
    .insert({
      ip_hash: ipHash,
      email_hash: emailHash,
      nonce,
      accepted,
      reason: reason.slice(0, 100),
    })

  if (error) {
    console.error('Failed recording signup attempt:', error)
  }
}

function genericRejectedResponse() {
  return NextResponse.json(
    {
      error:
        'We could not process this signup request. Please refresh the page and try again.',
    },
    {
      status: 400,
    }
  )
}

export async function POST(req: Request) {
  let createdUserId: string | null = null

  try {
    /*
     * ============================================================
     * 1. BASIC HTTP / REQUEST PROTECTION
     * ============================================================
     */

    const contentType = req.headers.get('content-type') || ''

    if (!contentType.toLowerCase().includes('application/json')) {
      return genericRejectedResponse()
    }

    const contentLength = Number(req.headers.get('content-length') || 0)

    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request too large.' },
        { status: 413 }
      )
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const origin = req.headers.get('origin')

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigin = new URL(siteUrl).origin

      if (!origin || origin !== allowedOrigin) {
        console.warn('Rejected signup origin:', origin)
        return genericRejectedResponse()
      }
    }

    const secFetchSite = req.headers.get('sec-fetch-site')

    if (
      secFetchSite &&
      secFetchSite !== 'same-origin' &&
      secFetchSite !== 'same-site'
    ) {
      console.warn('Rejected signup sec-fetch-site:', secFetchSite)
      return genericRejectedResponse()
    }

    const userAgent = req.headers.get('user-agent')

    if (!userAgent || userAgent.length < 10) {
      console.warn('Rejected signup with missing user agent')
      return genericRejectedResponse()
    }

    /*
     * ============================================================
     * 2. READ BODY
     * ============================================================
     */

    const body = await req.json()

    const {
      email,
      password,
      businessName,
      contactName,
      phone,
      accessCode,
      role,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      deliveryNotes,

      // Anti-bot fields
      turnstileToken,
      website,
      formStartedAt,
      signupNonce,
    } = body

    /*
     * ============================================================
     * 3. NORMALIZE INPUTS
     * ============================================================
     */

    const normalizedEmail = normalizeEmail(email)

    const cleanBusinessName = cleanString(
      businessName,
      150,
      true
    )

    const cleanContactName = cleanString(
      contactName,
      150
    )

    const cleanPhone = cleanString(
      phone,
      50
    )

    const cleanDeliveryAddress = cleanString(
      deliveryAddress,
      250
    )

    const cleanDeliveryCity = cleanString(
      deliveryCity,
      100
    )

    const cleanDeliveryPostalCode = cleanString(
      deliveryPostalCode,
      20
    )?.toUpperCase() ?? null

    const cleanDeliveryNotes = cleanString(
      deliveryNotes,
      1000
    )

    const normalizedRole =
      role === 'producer'
        ? 'producer'
        : role === 'buyer'
          ? 'buyer'
          : null

    const clientIp = getClientIp(req)

    const ipHash = hashValue(clientIp)

    const emailHash = hashValue(normalizedEmail)

    const nonce =
      typeof signupNonce === 'string'
        ? signupNonce.slice(0, 100)
        : null

    /*
     * ============================================================
     * 4. HONEYPOT
     * ============================================================
     *
     * Humans never see this field.
     * Many form bots automatically populate it.
     */

    if (
      typeof website === 'string' &&
      website.trim().length > 0
    ) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'honeypot',
      })

      return genericRejectedResponse()
    }

    /*
     * ============================================================
     * 5. FORM TIMING
     * ============================================================
     */

    const startedAt = Number(formStartedAt)
    const now = Date.now()

    if (
      !Number.isFinite(startedAt) ||
      startedAt <= 0 ||
      now - startedAt < MIN_FORM_FILL_MS ||
      now - startedAt > MAX_FORM_AGE_MS
    ) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'invalid_form_timing',
      })

      return genericRejectedResponse()
    }

    /*
     * ============================================================
     * 6. VALIDATE INPUT
     * ============================================================
     */

    if (
      !normalizedEmail ||
      !password ||
      !cleanBusinessName ||
      !normalizedRole
    ) {
      return NextResponse.json(
        {
          error:
            'Email, password, business name, and account type are required.',
        },
        { status: 400 }
      )
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    if (
      typeof password !== 'string' ||
      password.length < 10 ||
      password.length > 128
    ) {
      return NextResponse.json(
        {
          error:
            'Password must be between 10 and 128 characters.',
        },
        { status: 400 }
      )
    }

    if (
      cleanBusinessName.length < 2 ||
      cleanBusinessName.length > 150
    ) {
      return NextResponse.json(
        { error: 'Please enter a valid business name.' },
        { status: 400 }
      )
    }

    if (
      !isValidCanadianPostalCode(
        cleanDeliveryPostalCode
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Please enter a valid Canadian postal code.',
        },
        { status: 400 }
      )
    }

    /*
     * ============================================================
     * 7. DISPOSABLE EMAIL BLOCKING
     * ============================================================
     */

    if (isDisposableEmail(normalizedEmail)) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'disposable_email',
      })

      return NextResponse.json(
        {
          error:
            'Please use your business or permanent email address.',
        },
        { status: 400 }
      )
    }

    /*
     * ============================================================
     * 8. NONCE REUSE
     * ============================================================
     */

    if (!nonce || nonce.length < 20) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'missing_nonce',
      })

      return genericRejectedResponse()
    }

    const { data: existingNonce } =
      await supabaseAdmin
        .from('signup_attempts')
        .select('id')
        .eq('nonce', nonce)
        .limit(1)
        .maybeSingle()

    if (existingNonce) {
      return genericRejectedResponse()
    }

    /*
     * ============================================================
     * 9. RATE LIMIT
     * ============================================================
     */

    const oneHourAgo = new Date(
      Date.now() - 60 * 60 * 1000
    )

    const oneDayAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    )

    const [
      ipHourlyAttempts,
      ipDailyAttempts,
      emailDailyAttempts,
    ] = await Promise.all([
      countAttempts({
        column: 'ip_hash',
        value: ipHash,
        since: oneHourAgo,
      }),

      countAttempts({
        column: 'ip_hash',
        value: ipHash,
        since: oneDayAgo,
      }),

      countAttempts({
        column: 'email_hash',
        value: emailHash,
        since: oneDayAgo,
      }),
    ])

    if (
      ipHourlyAttempts >= MAX_IP_ATTEMPTS_PER_HOUR ||
      ipDailyAttempts >= MAX_IP_ATTEMPTS_PER_DAY ||
      emailDailyAttempts >= MAX_EMAIL_ATTEMPTS_PER_DAY
    ) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'rate_limited',
      })

      return NextResponse.json(
        {
          error:
            'Too many signup attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
          },
        }
      )
    }

    /*
     * ============================================================
     * 10. CLOUDFLARE TURNSTILE
     * ============================================================
     */

    if (
      typeof turnstileToken !== 'string' ||
      !turnstileToken
    ) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'missing_turnstile',
      })

      return genericRejectedResponse()
    }

    const humanVerified = await verifyTurnstile({
      token: turnstileToken,
      ip: clientIp,
    })

    if (!humanVerified) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'turnstile_failed',
      })

      return genericRejectedResponse()
    }

    /*
     * ============================================================
     * 11. CHECK FOR EXISTING CUSTOMER
     * ============================================================
     *
     * Do this before creating another Supabase Auth user.
     */

    const { data: existingCustomer } =
      await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', normalizedEmail)
        .limit(1)
        .maybeSingle()

    if (existingCustomer) {
      await recordAttempt({
        ipHash,
        emailHash,
        nonce,
        accepted: false,
        reason: 'existing_customer',
      })

      /**
       * Deliberately generic.
       *
       * Don't tell automated attackers exactly which
       * addresses already exist.
       */
      return NextResponse.json(
        {
          error:
            'An account may already exist for this email. Try signing in or resetting your password.',
        },
        { status: 400 }
      )
    }

    /*
     * ============================================================
     * 12. ACCESS CODE
     * ============================================================
     */

    const submittedAccessCode =
      typeof accessCode === 'string'
        ? accessCode.trim()
        : ''

    const expectedAccessCode =
      process.env.BUYER_ACCESS_CODE || ''

    const accessApproved =
      submittedAccessCode.length > 0 &&
      expectedAccessCode.length > 0 &&
      safeCompare(
        submittedAccessCode,
        expectedAccessCode
      )

    const approved = accessApproved

    /*
     * ============================================================
     * 13. RECORD VALIDATED ATTEMPT BEFORE AUTH
     * ============================================================
     */

    await recordAttempt({
      ipHash,
      emailHash,
      nonce,
      accepted: true,
      reason: 'validated',
    })

    /*
     * ============================================================
     * 14. CREATE SUPABASE AUTH USER
     * ============================================================
     */

    const { data: signUpData, error: signUpError } =
      await supabaseAnon.auth.signUp({
        email: normalizedEmail,
        password,

        options: {
          emailRedirectTo: `${siteUrl}/login`,

          /**
           * If Supabase CAPTCHA protection is enabled,
           * pass the Turnstile token here too.
           */
          captchaToken: turnstileToken,

          data: {
            role: normalizedRole,
            businessName: cleanBusinessName,
            contactName: cleanContactName,
            phone: cleanPhone,
            accessApproved,
            full_name: cleanContactName,
          },
        },
      })

    if (
      signUpError ||
      !signUpData.user
    ) {
      console.error(
        'Supabase signup error:',
        signUpError
      )

      return NextResponse.json(
        {
          error:
            'Unable to create the account. It may already exist.',
        },
        { status: 400 }
      )
    }

    const user = signUpData.user

    createdUserId = user.id

    /*
     * ============================================================
     * 15. PROFILE
     * ============================================================
     */

    const { error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: user.id,
          role: normalizedRole,
        })

    if (profileError) {
      throw new Error(
        `Profile creation failed: ${profileError.message}`
      )
    }

    /*
     * ============================================================
     * 16. CUSTOMER
     * ============================================================
     */

    const {
      data: customer,
      error: customerError,
    } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: user.id,
        business_name: cleanBusinessName,
        contact_name: cleanContactName,
        phone: cleanPhone,
        email: normalizedEmail,
        approved,
        delivery_address: cleanDeliveryAddress,
        delivery_city: cleanDeliveryCity,
        delivery_postal_code:
          cleanDeliveryPostalCode,
        delivery_notes: cleanDeliveryNotes,
      })
      .select('*')
      .single()

    if (
      customerError ||
      !customer
    ) {
      throw new Error(
        customerError?.message ||
          'Could not create customer.'
      )
    }

    /*
     * ============================================================
     * 17. CUSTOMER OWNER MEMBERSHIP
     * ============================================================
     */

    const { error: memberError } =
      await supabaseAdmin
        .from('customer_members')
        .insert({
          customer_id: customer.id,
          user_id: user.id,
          role: 'owner',
          email: normalizedEmail,
          full_name:
            cleanContactName ||
            normalizedEmail,
        })

    if (memberError) {
      throw new Error(
        `Customer membership creation failed: ${memberError.message}`
      )
    }

    /*
     * ============================================================
     * SUCCESS
     * ============================================================
     */

    return NextResponse.json({
      success: true,

      message: approved
        ? `Check your email to confirm your account. After verification your ${normalizedRole} account will be automatically approved.`
        : `Check your email to confirm your account. After verification your ${normalizedRole} account will be reviewed.`,

      userId: user.id,
      customerId: customer.id,
      role: normalizedRole,
      approved,
    })
  } catch (error: any) {
    console.error('Signup error:', error)

    /*
     * Clean up an Auth user if something failed AFTER
     * Supabase Auth successfully created them.
     *
     * Prevents orphaned Auth accounts.
     */
    if (createdUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(
          createdUserId
        )
      } catch (cleanupError) {
        console.error(
          'Failed cleaning up signup user:',
          cleanupError
        )
      }
    }

    return NextResponse.json(
      {
        error:
          'Signup failed. Please try again.',
      },
      { status: 500 }
    )
  }
}