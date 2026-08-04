import { NextResponse } from 'next/server'
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

    const accessToken = await getZohoAccessToken()

    const orgId = process.env.ZOHO_ORGANIZATION_ID
    const zohoBaseUrl = process.env.ZOHO_BOOKS_API_URL

    if (!orgId || !zohoBaseUrl) {
      return NextResponse.json(
        { error: 'Missing Zoho environment variables' },
        { status: 500 }
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
      console.error('Zoho admin invoice PDF error:', text)

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
        'Content-Disposition': `inline; filename="invoice-${invoiceId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Admin invoice PDF route error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to load invoice PDF' },
      { status: 500 }
    )
  }
}