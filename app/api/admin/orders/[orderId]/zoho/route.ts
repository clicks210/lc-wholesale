import { NextResponse } from 'next/server'
import { createZohoInvoiceForOrder } from '@/lib/createZohoInvoiceForOrder'

export async function POST(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
      throw new Error('Missing orderId in route')
    }

    const invoice = await createZohoInvoiceForOrder(orderId)

    // ✅ FIX: spread first, then success
    return NextResponse.json({
      ...invoice,
      success: true,
    })
  } catch (error: any) {
    console.error('Create Zoho invoice error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to create Zoho invoice',
      },
      { status: 500 }
    )
  }
}