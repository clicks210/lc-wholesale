import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, zoho_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.zoho_customer_id) {
      return NextResponse.json({
        invoices: [],
      })
    }

    const accessToken = await getZohoAccessToken()

    const orgId = process.env.ZOHO_ORGANIZATION_ID
    const zohoBaseUrl = process.env.ZOHO_BOOKS_API_URL

    if (!orgId || !zohoBaseUrl) {
      return NextResponse.json(
        { error: 'Missing Zoho config' },
        { status: 500 }
      )
    }

    const url = new URL(`${zohoBaseUrl}/invoices`)
    url.searchParams.set('organization_id', orgId)
    url.searchParams.set('customer_id', customer.zoho_customer_id)

    const zohoRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      cache: 'no-store',
    })

    const zohoData = await zohoRes.json()

    if (!zohoRes.ok) {
      return NextResponse.json(
        { error: 'Zoho fetch failed', details: zohoData },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invoices: zohoData.invoices || [],
    })
  } catch (err: any) {
    console.error('Account invoices route error:', err)

    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}