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
          id,
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

    if (error || !order) {
      console.error('Order lookup failed:', error)

      return NextResponse.json(
        {
          success: false,
          error: error?.message || 'Order not found',
        },
        {
          status: 500,
        }
      )
    }

    const customer = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers

    /*
      ---------------------------------------
      GET ALL CUSTOMER MEMBER EMAILS
      ---------------------------------------
    */

    const recipientEmails: string[] = []

    const { data: members, error: membersError } = await supabaseAdmin
      .from('customer_members')
      .select('user_id')
      .eq('customer_id', customer.id)

    if (membersError) {
      console.error('Customer members lookup failed:', membersError)
    }

    if (members) {
      for (const member of members) {
        const { data: authUser } =
          await supabaseAdmin.auth.admin.getUserById(member.user_id)

        const email = authUser?.user?.email

        if (email && !recipientEmails.includes(email)) {
          recipientEmails.push(email)
        }
      }
    }

    /*
      ---------------------------------------
      ADD ALL ADMIN USERS
      ---------------------------------------
    */

    const { data: adminProfiles, error: adminError } =
      await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

    if (adminError) {
      console.error('Admin lookup failed:', adminError)
    }

    if (adminProfiles) {
      for (const admin of adminProfiles) {
        const { data: authUser } =
          await supabaseAdmin.auth.admin.getUserById(admin.id)

        const email = authUser?.user?.email

        if (email && !recipientEmails.includes(email)) {
          recipientEmails.push(email)
        }
      }
    }

    /*
      ---------------------------------------
      BUILD ITEMS HTML
      ---------------------------------------
    */

    const itemsHtml = (order.order_items ?? [])
      .map(
        (item: any) => `
          <tr>
            <td
              style="
                padding:16px;
                border-top:1px solid #e7dfd2;
                font-size:14px;
                font-weight:700;
                color:#1f1a14;
              "
            >
              ${item.product_name}

              ${
                item.sku
                  ? `
                    <div
                      style="
                        margin-top:4px;
                        font-size:11px;
                        color:#8a8175;
                        font-weight:500;
                      "
                    >
                      SKU: ${item.sku}
                    </div>
                  `
                  : ''
              }
            </td>

            <td
              align="center"
              style="
                padding:16px;
                border-top:1px solid #e7dfd2;
                font-size:14px;
                font-weight:700;
                color:#1f1a14;
              "
            >
              ${item.quantity}
            </td>

            <td
              align="right"
              style="
                padding:16px;
                border-top:1px solid #e7dfd2;
                font-size:14px;
                font-weight:900;
                color:#244f3d;
              "
            >
              $${Number(item.line_total ?? 0).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join('')

    /*
      ---------------------------------------
      SEND EMAIL
      ---------------------------------------
    */

    await resend.emails.send({
      from: 'Local Connect <orders@lcfoodservice.ca>',
      to: recipientEmails,
      subject: `Order Confirmation #${order.id
        .slice(0, 8)
        .toUpperCase()}`,

      html: `
        <div
          style="
            background:#f8f3ea;
            padding:60px 20px;
            font-family:Arial,sans-serif;
          "
        >
          <div
            style="
              max-width:640px;
              margin:0 auto;
              background:white;
              border:1px solid #d6cec0;
              padding:40px;
              box-shadow:0 1px 2px rgba(0,0,0,0.04);
            "
          >
            <p
              style="
                margin:0;
                font-size:11px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.12em;
                color:#244f3d;
              "
            >
              Local Connect Wholesale
            </p>

            <h1
              style="
                margin-top:18px;
                margin-bottom:0;
                font-size:34px;
                line-height:1.15;
                font-weight:900;
                color:#1f1a14;
              "
            >
              Order received
            </h1>

            <p
              style="
                margin-top:20px;
                font-size:15px;
                line-height:1.7;
                color:#6f675c;
                font-weight:500;
              "
            >
              Thanks for your order. We’ve received your wholesale submission and
              our team is now preparing it for fulfillment.
            </p>

            <div
              style="
                margin-top:28px;
                border:1px solid #d6cec0;
                background:#f4f1ea;
                padding:18px;
              "
            >
              <p
                style="
                  margin:0;
                  font-size:11px;
                  font-weight:900;
                  text-transform:uppercase;
                  letter-spacing:.12em;
                  color:#6f675c;
                "
              >
                Order Number
              </p>

              <p
                style="
                  margin-top:8px;
                  margin-bottom:0;
                  font-size:15px;
                  font-weight:900;
                  color:#1f1a14;
                "
              >
                #${order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div
              style="
                margin-top:18px;
                border:1px solid #d6cec0;
                background:#f4f1ea;
                padding:18px;
              "
            >
              <p
                style="
                  margin:0;
                  font-size:11px;
                  font-weight:900;
                  text-transform:uppercase;
                  letter-spacing:.12em;
                  color:#6f675c;
                "
              >
                Delivery Date
              </p>

              <p
                style="
                  margin-top:8px;
                  margin-bottom:0;
                  font-size:15px;
                  font-weight:900;
                  color:#1f1a14;
                "
              >
                ${order.delivery_date || 'To be confirmed'}
              </p>
            </div>

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                width:100%;
                border-collapse:collapse;
                margin-top:30px;
                border:1px solid #d6cec0;
              "
            >
              <thead>
                <tr style="background:#f4f1ea;">
                  <th
                    align="left"
                    style="
                      padding:14px;
                      font-size:11px;
                      text-transform:uppercase;
                      letter-spacing:.12em;
                      color:#6f675c;
                    "
                  >
                    Product
                  </th>

                  <th
                    align="center"
                    style="
                      padding:14px;
                      font-size:11px;
                      text-transform:uppercase;
                      letter-spacing:.12em;
                      color:#6f675c;
                    "
                  >
                    Qty
                  </th>

                  <th
                    align="right"
                    style="
                      padding:14px;
                      font-size:11px;
                      text-transform:uppercase;
                      letter-spacing:.12em;
                      color:#6f675c;
                    "
                  >
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div
              style="
                margin-top:24px;
                border:1px solid #d6cec0;
                background:#f4f1ea;
                padding:18px;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="border-collapse:collapse;"
              >
                <tr>
                  <td
                    style="
                      font-size:11px;
                      font-weight:900;
                      text-transform:uppercase;
                      letter-spacing:.12em;
                      color:#6f675c;
                    "
                  >
                    Order Subtotal
                  </td>

                  <td
                    align="right"
                    style="
                      font-size:20px;
                      font-weight:900;
                      color:#244f3d;
                    "
                  >
                    $${Number(order.subtotal ?? 0).toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>

            ${
              invoiceUrl
                ? `
                  <a
                    href="${invoiceUrl}"
                    style="
                      display:inline-block;
                      margin-top:30px;
                      background:#244f3d;
                      color:white;
                      padding:14px 22px;
                      text-decoration:none;
                      font-size:14px;
                      font-weight:900;
                    "
                  >
                    View Invoice
                  </a>
                `
                : ''
            }

            <p
              style="
                margin-top:34px;
                font-size:14px;
                line-height:1.7;
                color:#6f675c;
              "
            >
              Cheers,<br />
              Local Connect
            </p>

            <div
              style="
                margin-top:34px;
                padding-top:24px;
                border-top:1px solid #e7dfd2;
              "
            >
              <p
                style="
                  margin:0;
                  font-size:12px;
                  color:#8a8175;
                "
              >
                Supporting Canadian foodservice 🇨🇦
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Confirmation email error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send confirmation email',
      },
      {
        status: 500,
      }
    )
  }
}