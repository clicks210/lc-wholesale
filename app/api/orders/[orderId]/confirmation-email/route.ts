import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params
    const body = await req.json().catch(() => ({}))
    const invoiceUrl = body?.invoiceUrl || null

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          business_name,
          contact_name,
          phone,
          delivery_address,
          delivery_city,
          delivery_postal_code
        ),
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Order lookup failed:', error)

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(order.user_id)

    if (authError || !authUser?.user?.email) {
      console.error('Customer auth email lookup failed:', authError)

      return NextResponse.json(
        { success: false, error: 'Customer auth email not found' },
        { status: 400 }
      )
    }

    const customer = order.customers
    const customerEmail = authUser.user.email

    const itemsHtml = (order.order_items ?? [])
      .map(
        (item: any) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">
              ${item.product_name}
              ${
                item.sku
                  ? `<br><span style="font-size:12px;color:#777;">SKU: ${item.sku}</span>`
                  : ''
              }
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">
              ${item.quantity}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
              $${Number(item.line_total ?? 0).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join('')

    await resend.emails.send({
      from: 'Local Connect <orders@lcfoodservice.ca>',
      to: customerEmail,
      subject: `Order Confirmation #${order.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f1f1f;">
          <div style="background:#244f3d;padding:24px;border-radius:16px 16px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">Order received</h1>
            <p style="color:#e8f3ee;margin:8px 0 0;">Thanks for ordering with Local Connect.</p>
          </div>

          <div style="border:1px solid #ddd;border-top:0;padding:24px;border-radius:0 0 16px 16px;">
            <p>Hi ${customer?.contact_name || customer?.business_name || 'there'},</p>

            <p>We’ve received your wholesale order and will process it shortly.</p>

            <p><strong>Delivery date:</strong> ${
              order.delivery_date || 'To be confirmed'
            }</p>

            <table style="width:100%;border-collapse:collapse;margin-top:20px;">
              <thead>
                <tr>
                  <th align="left" style="padding-bottom:8px;">Product</th>
                  <th align="center" style="padding-bottom:8px;">Qty</th>
                  <th align="right" style="padding-bottom:8px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <p style="font-size:18px;margin-top:20px;">
              <strong>Order subtotal:</strong> $${Number(order.subtotal ?? 0).toFixed(2)}
            </p>

            ${
              invoiceUrl
                ? `<p style="margin-top:24px;">
                    <a href="${invoiceUrl}" style="background:#244f3d;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">
                      View invoice
                    </a>
                  </p>`
                : ''
            }

            <p style="margin-top:28px;">
              Cheers,<br />
              Local Connect
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />

            <p style="font-size:12px;color:#777;">
              Supporting Canadian foodservice 🇨🇦
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Confirmation email error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send confirmation email',
      },
      { status: 500 }
    )
  }
}