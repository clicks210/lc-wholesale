import { NextResponse } from 'next/server'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params

    //
    // Get the customer's Zoho ID from Supabase
    //

    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('zoho_customer_id')
      .eq('id', customerId)
      .single()

    if (error || !customer) {
      return NextResponse.json(
        {
          error: 'Customer not found',
        },
        {
          status: 404,
        }
      )
    }

    if (!customer.zoho_customer_id) {
      return NextResponse.json({
        invoices: [],
      })
    }

    //
    // Fetch invoices from Zoho
    //

    const accessToken = await getZohoAccessToken()

    const response = await fetch(
      `https://www.zohoapis.com/books/v3/invoices?customer_id=${customer.zoho_customer_id}&organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    const zoho = await response.json()

    if (!response.ok) {
      console.error(zoho)

      return NextResponse.json(
        {
          error: zoho.message || 'Zoho request failed',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      invoices: zoho.invoices || [],
    })
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to load invoices',
      },
      {
        status: 500,
      }
    )
  }
}