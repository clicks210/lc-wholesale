import { NextResponse } from 'next/server'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET(
  req: Request,
  context: { params: Promise<{ purchaseOrderId: string }> }
) {
  try {
    const { purchaseOrderId } = await context.params

    if (!purchaseOrderId) {
      throw new Error('Missing purchaseOrderId')
    }

    const accessToken = await getZohoAccessToken()

    const res = await fetch(
      `${process.env.ZOHO_BOOKS_API_URL}/purchaseorders/${purchaseOrderId}?organization_id=${process.env.ZOHO_ORGANIZATION_ID}&accept=pdf`,
      {
        method: 'GET',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('Zoho PO PDF fetch failed:', text)

      return NextResponse.json(
        {
          success: false,
          error: 'Could not fetch purchase order PDF',
          details: text,
        },
        { status: res.status }
      )
    }

    const pdfBuffer = await res.arrayBuffer()

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="purchase-order-${purchaseOrderId}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to open purchase order',
      },
      { status: 500 }
    )
  }
}