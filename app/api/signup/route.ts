import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const accessApproved =
      Boolean(accessCode) &&
      Boolean(process.env.BUYER_ACCESS_CODE) &&
      accessCode.trim() === process.env.BUYER_ACCESS_CODE

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
        data: {
          businessName,
          contactName,
          phone,
          accessApproved,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: accessApproved
        ? 'Check your email to confirm your account. After verification, sign in and your buyer account will be auto-approved.'
        : 'Check your email to confirm your account. After verification, sign in and your buyer account will be reviewed.',
      userId: data.user?.id,
      accessApproved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed.' },
      { status: 500 }
    )
  }
}