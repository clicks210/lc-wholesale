import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(request: Request) {
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
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedCustomerId = searchParams.get('customerId')

    let customerId: string

    /*
      Admins can request another customer's invoices by passing:
      ?customerId=...
    */
    if (requestedCustomerId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to view this customer' },
          { status: 403 }
        )
      }

      customerId = requestedCustomerId
    } else {
      /*
        Normal customer request: determine their customer account through
        customer_members.
      */
      const { data: membership, error: membershipError } =
        await supabaseAdmin
          .from('customer_members')
          .select('customer_id')
          .eq('user_id', user.id)
          .single()

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'Customer membership not found' },
          { status: 404 }
        )
      }

      customerId = membership.customer_id
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, zoho_customer_id')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
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

    const zohoData = await zohoRes.json().catch(() => null)

    if (!zohoRes.ok || zohoData?.code !== 0) {
      console.error('Zoho invoice fetch failed:', zohoData)

      return NextResponse.json(
        {
          error: zohoData?.message || 'Zoho fetch failed',
          details: zohoData,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invoices: zohoData.invoices || [],
    })
  } catch (err: any) {
    console.error('Account invoices route error:', err)

    return NextResponse.json(
      {
        error: err.message || 'Server error',
      },
      { status: 500 }
    )
  }
}