import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(
  req: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      )
    }

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
      .select('id, user_id, zoho_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.zoho_customer_id) {
      return NextResponse.json(
        { error: 'Zoho customer not connected' },
        { status: 404 }
      )
    }

    const accessToken = await getZohoAccessToken()

    const orgId = process.env.ZOHO_ORGANIZATION_ID
    const zohoBaseUrl = process.env.ZOHO_BOOKS_API_URL

    if (!orgId || !zohoBaseUrl) {
      return NextResponse.json(
        { error: 'Missing Zoho environment variables' },
        { status: 500 }
      )
    }

    /**
     * Safety check:
     * Fetch invoice first and confirm it belongs to this logged-in customer.
     */
    const invoiceRes = await fetch(
      `${zohoBaseUrl}/invoices/${invoiceId}?organization_id=${orgId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        cache: 'no-store',
      }
    )

    const invoiceData = await invoiceRes.json()

    if (!invoiceRes.ok || !invoiceData.invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoice = invoiceData.invoice

    if (invoice.customer_id !== customer.zoho_customer_id) {
      return NextResponse.json(
        { error: 'Not authorized to view this invoice' },
        { status: 403 }
      )
    }

    const pdfRes = await fetch(
      `${zohoBaseUrl}/invoices/pdf?organization_id=${orgId}&invoice_ids=${invoiceId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        cache: 'no-store',
      }
    )

    if (!pdfRes.ok) {
      const text = await pdfRes.text()
      console.error('Zoho customer invoice PDF error:', text)

      return NextResponse.json(
        { error: 'Failed to download invoice PDF' },
        { status: 500 }
      )
    }

    const pdfBuffer = await pdfRes.arrayBuffer()
    const invoiceNumber = invoice.invoice_number || invoiceId

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoiceNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Customer invoice PDF route error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to load invoice PDF' },
      { status: 500 }
    )
  }
}