import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Missing orderId' },
      { status: 400 }
    )
  }

  try {
    let invoiceData: any = null

    try {
      const invoiceRes = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/orders/${orderId}/zoho`,
        {
          method: 'POST',
        }
      )

      invoiceData = await invoiceRes.json()

      if (!invoiceData.success) {
        console.error('Zoho invoice creation failed:', invoiceData.error)
      }
    } catch (error) {
      console.error('Zoho invoice request failed:', error)
    }

    try {
      const emailRes = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/${orderId}/confirmation-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceUrl:
              invoiceData?.invoice_url ||
              invoiceData?.invoice?.invoice_url ||
              invoiceData?.invoice?.invoice_url_public ||
              null,
          }),
        }
      )

      const emailData = await emailRes.json()

      if (!emailData.success) {
        console.error('Order confirmation email failed:', emailData.error)
      }
    } catch (error) {
      console.error('Order confirmation email request failed:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Order post-process failed:', error)

    return NextResponse.json(
      { success: false, error: error.message || 'Post-process failed' },
      { status: 500 }
    )
  }
}