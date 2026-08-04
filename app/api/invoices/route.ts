import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        {
          error: 'Missing customerId query parameter',
        },
        {
          status: 400,
        }
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
          supabaseError: customerError?.message || null,
          supabaseCode: customerError?.code || null,
        },
        {
          status: 404,
        }
      )
    }

    if (!customer.zoho_customer_id) {
      return NextResponse.json({
        customer,
        invoices: [],
        message: 'Customer has no Zoho customer ID',
      })
    }

    const orgId = process.env.ZOHO_ORGANIZATION_ID
    const zohoBaseUrl = process.env.ZOHO_BOOKS_API_URL

    if (!orgId) {
      return NextResponse.json(
        {
          error: 'Missing ZOHO_ORGANIZATION_ID',
        },
        {
          status: 500,
        }
      )
    }

    if (!zohoBaseUrl) {
      return NextResponse.json(
        {
          error: 'Missing ZOHO_BOOKS_API_URL',
        },
        {
          status: 500,
        }
      )
    }

    const accessToken = await getZohoAccessToken()

    const zohoUrl = new URL(
      `${zohoBaseUrl.replace(/\/$/, '')}/invoices`
    )

    zohoUrl.searchParams.set('organization_id', orgId)
    zohoUrl.searchParams.set(
      'customer_id',
      customer.zoho_customer_id
    )
    zohoUrl.searchParams.set('sort_column', 'date')
    zohoUrl.searchParams.set('sort_order', 'D')

    const zohoRes = await fetch(zohoUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    const contentType = zohoRes.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
      const responseText = await zohoRes.text()

      console.error('Zoho returned a non-JSON response:', {
        status: zohoRes.status,
        response: responseText.slice(0, 500),
      })

      return NextResponse.json(
        {
          error: 'Zoho returned an invalid response',
        },
        {
          status: 502,
        }
      )
    }

    const zohoData = await zohoRes.json()

    if (!zohoRes.ok || zohoData?.code !== 0) {
      console.error('Zoho invoice fetch failed:', {
        status: zohoRes.status,
        code: zohoData?.code,
        message: zohoData?.message,
        details: zohoData,
      })

      return NextResponse.json(
        {
          error:
            zohoData?.message ||
            'Failed to fetch Zoho invoices',
          details: zohoData,
        },
        {
          status: zohoRes.ok ? 502 : zohoRes.status,
        }
      )
    }

    return NextResponse.json({
      customer,
      invoices: zohoData.invoices || [],
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error'

    console.error('Admin customer invoices route error:', error)

    return NextResponse.json(
      {
        error: 'Server error fetching customer invoices',
        details: message,
      },
      {
        status: 500,
      }
    )
  }
}