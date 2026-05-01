import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params

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

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, zoho_invoice_id')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (!order.zoho_invoice_id) {
      return NextResponse.json(
        { error: 'Invoice not available yet' },
        { status: 404 }
      )
    }

    const accessToken = await getZohoAccessToken()

    const pdfRes = await fetch(
      `${process.env.ZOHO_BOOKS_API_URL}/invoices/pdf?organization_id=${process.env.ZOHO_ORGANIZATION_ID}&invoice_ids=${order.zoho_invoice_id}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (!pdfRes.ok) {
      const text = await pdfRes.text()
      console.error('Zoho PDF error:', text)

      return NextResponse.json(
        { error: 'Failed to download invoice PDF' },
        { status: 500 }
      )
    }

    const pdfBuffer = await pdfRes.arrayBuffer()

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="LC-${order.id.slice(0, 8).toUpperCase()}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Invoice PDF route error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to load invoice' },
      { status: 500 }
    )
  }
}