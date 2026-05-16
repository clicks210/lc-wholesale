import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      businessName,
      contactName,
      phone,
      accessCode,
    } = await req.json()

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Email, password, and business name are required.' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const normalizedEmail = String(email).trim().toLowerCase()
    const cleanBusinessName = String(businessName).trim()
    const cleanContactName = contactName ? String(contactName).trim() : null
    const cleanPhone = phone ? String(phone).trim() : null

    const accessApproved =
      Boolean(accessCode) &&
      Boolean(process.env.BUYER_ACCESS_CODE) &&
      String(accessCode).trim() === process.env.BUYER_ACCESS_CODE

    const { data: signUpData, error: signUpError } =
      await supabaseAnon.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/login`,
          data: {
            businessName: cleanBusinessName,
            contactName: cleanContactName,
            phone: cleanPhone,
            accessApproved,
            full_name: cleanContactName,
          },
        },
      })

    if (signUpError || !signUpData.user) {
      return NextResponse.json(
        { error: signUpError?.message || 'Could not create user.' },
        { status: 400 }
      )
    }

    const user = signUpData.user

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'buyer',
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: user.id,
        business_name: cleanBusinessName,
        contact_name: cleanContactName,
        phone: cleanPhone,
        email: normalizedEmail,
        approved: accessApproved,
      })
      .select('*')
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: customerError?.message || 'Could not create customer.' },
        { status: 500 }
      )
    }

    const { error: memberError } = await supabaseAdmin
      .from('customer_members')
      .insert({
        customer_id: customer.id,
        user_id: user.id,
        role: 'owner',
        email: normalizedEmail,
        full_name: cleanContactName || normalizedEmail,
      })

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: accessApproved
        ? 'Check your email to confirm your account. After verification your buyer account will be automatically approved.'
        : 'Check your email to confirm your account. After verification your buyer account will be reviewed.',
      userId: user.id,
      customerId: customer.id,
      accessApproved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed.' },
      { status: 500 }
    )
  }
}