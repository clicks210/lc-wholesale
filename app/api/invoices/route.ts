import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(
  req: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId in route params' },
        { status: 400 }
      )
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, user_id, business_name, zoho_customer_id')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        {
          error: 'Customer not found',
          receivedCustomerId: customerId,
          supabaseError: customerError?.message,
          supabaseCode: customerError?.code,
        },
        { status: 404 }
      )
    }

    if (!customer.zoho_customer_id) {
      return NextResponse.json({
        customer,
        invoices: [],
        message: 'Customer exists but has no zoho_customer_id',
      })
    }

    const accessToken = await getZohoAccessToken()

    const orgId = process.env.ZOHO_ORGANIZATION_ID
    const zohoBaseUrl = process.env.ZOHO_BOOKS_API_URL

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing ZOHO_ORGANIZATION_ID' },
        { status: 500 }
      )
    }

    if (!zohoBaseUrl) {
      return NextResponse.json(
        { error: 'Missing ZOHO_BOOKS_API_URL' },
        { status: 500 }
      )
    }

    const zohoUrl = new URL(`${zohoBaseUrl}/invoices`)

    zohoUrl.searchParams.set('organization_id', orgId)
    zohoUrl.searchParams.set('customer_id', customer.zoho_customer_id)
    zohoUrl.searchParams.set('sort_column', 'date')
    zohoUrl.searchParams.set('sort_order', 'D')

    const zohoRes = await fetch(zohoUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      cache: 'no-store',
    })

    const zohoData = await zohoRes.json()

    if (!zohoRes.ok) {
      console.error('Zoho invoice fetch failed:', zohoData)

      return NextResponse.json(
        {
          error: 'Failed to fetch Zoho invoices',
          details: zohoData,
        },
        { status: zohoRes.status }
      )
    }

    return NextResponse.json({
      customer,
      invoices: zohoData.invoices || [],
    })
  } catch (error: any) {
    console.error('Admin customer invoices route error:', error)

    return NextResponse.json(
      {
        error: 'Server error fetching customer invoices',
        details: error.message,
      },
      { status: 500 }
    )
  }
}