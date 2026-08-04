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
      BUILD RECIPIENT LIST
      ---------------------------------------
    */

    const recipientEmails = new Set<string>()

    function addRecipient(email?: string | null) {
      const normalized = email?.trim().toLowerCase()

      if (normalized) {
        recipientEmails.add(normalized)
      }
    }

    /*
      ---------------------------------------
      ADD CUSTOMER MEMBER EMAILS
      ---------------------------------------
    */

    const { data: members, error: membersError } = await supabaseAdmin
      .from('customer_members')
      .select('user_id')
      .eq('customer_id', customer.id)

    if (membersError) {
      console.error('Customer members lookup failed:', membersError)
    }

    for (const member of members ?? []) {
      const { data: authUser, error: authUserError } =
        await supabaseAdmin.auth.admin.getUserById(member.user_id)

      if (authUserError) {
        console.error(
          `Customer member auth lookup failed for ${member.user_id}:`,
          authUserError
        )
        continue
      }

      addRecipient(authUser?.user?.email)
    }

    /*
      ---------------------------------------
      ADD SAVED CONFIRMATION CONTACTS
      ---------------------------------------
    */

    const { data: confirmationContacts, error: contactsError } =
      await supabaseAdmin
        .from('customer_contacts')
        .select('email')
        .eq('customer_id', customer.id)
        .eq('receives_order_confirmations', true)

    if (contactsError) {
      console.error(
        'Customer confirmation contacts lookup failed:',
        contactsError
      )
    }

    for (const contact of confirmationContacts ?? []) {
      addRecipient(contact.email)
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

    for (const admin of adminProfiles ?? []) {
      const { data: authUser, error: authUserError } =
        await supabaseAdmin.auth.admin.getUserById(admin.id)

      if (authUserError) {
        console.error(
          `Admin auth lookup failed for ${admin.id}:`,
          authUserError
        )
        continue
      }

      addRecipient(authUser?.user?.email)
    }

    const recipients = Array.from(recipientEmails)

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No confirmation email recipients found for this order',
        },
        {
          status: 400,
        }
      )
    }

    /*
      ---------------------------------------
      BUILD MODERN EMAIL CONTENT
      ---------------------------------------
    */

    const logoUrl =
      'https://www.lcfoodservice.ca/images/logo.png'

    const formatMoney = (value: unknown) =>
      new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
      }).format(Number(value || 0))

    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    const formatDate = (value: string | null | undefined) => {
      if (!value) return 'To be confirmed'

      const date = new Date(`${value}T12:00:00`)

      if (Number.isNaN(date.getTime())) {
        return escapeHtml(value)
      }

      return date.toLocaleDateString('en-CA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }

    const productCardsHtml = (order.order_items ?? [])
      .map((item: any) => {
        const imageUrl = item.image_url?.trim()
        const productName = escapeHtml(item.product_name || 'Product')
        const sku = item.sku ? escapeHtml(item.sku) : ''
        const unit = item.unit ? escapeHtml(item.unit) : ''
        const quantity = Number(item.quantity || 0)
        const unitPrice = Number(item.unit_price || 0)
        const lineTotal = Number(item.line_total || unitPrice * quantity || 0)

        return `
          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              width:100%;
              border-collapse:separate;
              border-spacing:0;
              margin-bottom:14px;
              border:1px solid #e3ddd2;
              background:#ffffff;
              border-radius:14px;
              overflow:hidden;
            "
          >
            <tr>
              <td style="padding:16px;">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="width:100%;border-collapse:collapse;"
                >
                  <tr>
                    <td
                      width="92"
                      valign="top"
                      style="width:92px;padding-right:16px;"
                    >
                      ${
                        imageUrl
                          ? `
                            <img
                              src="${escapeHtml(imageUrl)}"
                              alt="${productName}"
                              width="92"
                              height="92"
                              style="
                                display:block;
                                width:92px;
                                height:92px;
                                object-fit:cover;
                                border-radius:12px;
                                border:1px solid #e3ddd2;
                                background:#f4f1ea;
                              "
                            />
                          `
                          : `
                            <div
                              style="
                                width:92px;
                                height:92px;
                                border-radius:12px;
                                border:1px solid #e3ddd2;
                                background:#f4f1ea;
                                text-align:center;
                                line-height:92px;
                                color:#8a8175;
                                font-size:10px;
                                font-weight:800;
                                text-transform:uppercase;
                                letter-spacing:.08em;
                              "
                            >
                              No image
                            </div>
                          `
                      }
                    </td>

                    <td valign="top">
                      <p
                        style="
                          margin:0;
                          font-size:17px;
                          line-height:1.35;
                          font-weight:800;
                          color:#1f1a14;
                        "
                      >
                        ${productName}
                      </p>

                      ${
                        sku || unit
                          ? `
                            <p
                              style="
                                margin:7px 0 0;
                                font-size:12px;
                                line-height:1.5;
                                color:#7b7368;
                              "
                            >
                              ${sku ? `SKU ${sku}` : ''}
                              ${sku && unit ? ' · ' : ''}
                              ${unit || ''}
                            </p>
                          `
                          : ''
                      }

                      <table
                        role="presentation"
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        style="
                          width:100%;
                          border-collapse:collapse;
                          margin-top:16px;
                        "
                      >
                        <tr>
                          <td
                            style="
                              font-size:13px;
                              color:#6f675c;
                              font-weight:600;
                            "
                          >
                            ${quantity} × ${formatMoney(unitPrice)}
                          </td>

                          <td
                            align="right"
                            style="
                              font-size:17px;
                              color:#244f3d;
                              font-weight:900;
                            "
                          >
                            ${formatMoney(lineTotal)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      })
      .join('')

    const businessName = escapeHtml(
      customer?.business_name || 'Wholesale Customer'
    )
    const contactName = escapeHtml(customer?.contact_name || '')
    const deliveryAddress = escapeHtml(customer?.delivery_address || '')
    const deliveryCity = escapeHtml(customer?.delivery_city || '')
    const deliveryPostalCode = escapeHtml(
      customer?.delivery_postal_code || ''
    )
    const orderNumber = order.id.slice(0, 8).toUpperCase()
    const deliveryDate = formatDate(order.delivery_date)

    const { data: resendData, error: resendError } =
      await resend.emails.send({
        from: 'Local Connect <orders@lcfoodservice.ca>',
        to: recipients,
        subject: `Order confirmed · ${businessName} · #${orderNumber}`,
        html: `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Order Confirmation</title>
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#f3efe7;
                font-family:Arial,Helvetica,sans-serif;
                color:#1f1a14;
              "
            >
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                Your Local Connect order #${orderNumber} has been received.
              </div>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="width:100%;border-collapse:collapse;background:#f3efe7;"
              >
                <tr>
                  <td align="center" style="padding:32px 14px;">
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        width:100%;
                        max-width:680px;
                        border-collapse:separate;
                        border-spacing:0;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            padding:30px 24px 24px;
                            background:#fbfaf7;
                            border:1px solid #ded7cb;
                            border-bottom:0;
                            border-radius:18px 18px 0 0;
                          "
                        >
                          <img
                            src="${logoUrl}"
                            alt="Local Connect"
                            width="210"
                            style="
                              display:block;
                              width:210px;
                              max-width:78%;
                              height:auto;
                              margin:0 auto;
                            "
                          />

                          <div
                            style="
                              width:54px;
                              height:3px;
                              margin:20px auto 0;
                              border-radius:999px;
                              background:#244f3d;
                            "
                          ></div>

                          <p
                            style="
                              margin:14px 0 0;
                              font-size:10px;
                              line-height:1.4;
                              font-weight:800;
                              text-transform:uppercase;
                              letter-spacing:.16em;
                              color:#7b7368;
                            "
                          >
                            Local Connect Wholesale
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:34px 28px 30px;
                            background:#ffffff;
                            border-left:1px solid #ded7cb;
                            border-right:1px solid #ded7cb;
                          "
                        >
                          <div
                            style="
                              display:inline-block;
                              padding:7px 11px;
                              border:1px solid #b8cdbf;
                              border-radius:999px;
                              background:#f6faf7;
                              color:#244f3d;
                              font-size:11px;
                              font-weight:900;
                              text-transform:uppercase;
                              letter-spacing:.08em;
                            "
                          >
                            Order confirmed
                          </div>

                          <h1
                            style="
                              margin:18px 0 0;
                              font-size:34px;
                              line-height:1.12;
                              letter-spacing:-.03em;
                              color:#1f1a14;
                            "
                          >
                            Thanks, ${contactName || businessName}.
                          </h1>

                          <p
                            style="
                              margin:16px 0 0;
                              font-size:15px;
                              line-height:1.7;
                              color:#6f675c;
                            "
                          >
                            We’ve received your wholesale order for
                            <strong style="color:#1f1a14;">${businessName}</strong>.
                            Our team is reviewing it and preparing everything for
                            fulfillment.
                          </p>

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            style="
                              width:100%;
                              border-collapse:separate;
                              border-spacing:12px;
                              margin:22px -12px 0;
                            "
                          >
                            <tr>
                              <td
                                width="50%"
                                valign="top"
                                style="
                                  width:50%;
                                  padding:16px;
                                  border:1px solid #e3ddd2;
                                  border-radius:12px;
                                  background:#f8f5ef;
                                "
                              >
                                <p
                                  style="
                                    margin:0;
                                    font-size:10px;
                                    font-weight:900;
                                    text-transform:uppercase;
                                    letter-spacing:.11em;
                                    color:#7b7368;
                                  "
                                >
                                  Order number
                                </p>

                                <p
                                  style="
                                    margin:8px 0 0;
                                    font-size:16px;
                                    font-weight:900;
                                    color:#1f1a14;
                                  "
                                >
                                  #${orderNumber}
                                </p>
                              </td>

                              <td
                                width="50%"
                                valign="top"
                                style="
                                  width:50%;
                                  padding:16px;
                                  border:1px solid #e3ddd2;
                                  border-radius:12px;
                                  background:#f8f5ef;
                                "
                              >
                                <p
                                  style="
                                    margin:0;
                                    font-size:10px;
                                    font-weight:900;
                                    text-transform:uppercase;
                                    letter-spacing:.11em;
                                    color:#7b7368;
                                  "
                                >
                                  Delivery
                                </p>

                                <p
                                  style="
                                    margin:8px 0 0;
                                    font-size:16px;
                                    line-height:1.4;
                                    font-weight:900;
                                    color:#1f1a14;
                                  "
                                >
                                  ${deliveryDate}
                                </p>
                              </td>
                            </tr>
                          </table>

                          ${
                            deliveryAddress || deliveryCity
                              ? `
                                <div
                                  style="
                                    margin-top:12px;
                                    padding:18px;
                                    border:1px solid #dfe7e1;
                                    border-left:4px solid #244f3d;
                                    border-radius:12px;
                                    background:#f8faf8;
                                  "
                                >
                                  <p
                                    style="
                                      margin:0;
                                      font-size:10px;
                                      font-weight:900;
                                      text-transform:uppercase;
                                      letter-spacing:.11em;
                                      color:#244f3d;
                                    "
                                  >
                                    Delivery address
                                  </p>

                                  <p
                                    style="
                                      margin:9px 0 0;
                                      font-size:15px;
                                      line-height:1.55;
                                      font-weight:800;
                                      color:#1f1a14;
                                    "
                                  >
                                    ${deliveryAddress || 'Address to be confirmed'}
                                    ${
                                      deliveryCity || deliveryPostalCode
                                        ? `<br />${deliveryCity}${deliveryCity && deliveryPostalCode ? ', ' : ''}${deliveryPostalCode}`
                                        : ''
                                    }
                                  </p>
                                </div>
                              `
                              : ''
                          }
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:0 28px 30px;
                            background:#ffffff;
                            border-left:1px solid #ded7cb;
                            border-right:1px solid #ded7cb;
                          "
                        >
                          <h2
                            style="
                              margin:0 0 16px;
                              font-size:21px;
                              line-height:1.3;
                              letter-spacing:-.02em;
                              color:#1f1a14;
                            "
                          >
                            Your order
                          </h2>

                          ${productCardsHtml}

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            style="
                              width:100%;
                              border-collapse:separate;
                              border-spacing:0;
                              margin-top:22px;
                              border-radius:14px;
                              background:#f4f1ea;
                            "
                          >
                            <tr>
                              <td style="padding:20px;">
                                <p
                                  style="
                                    margin:0;
                                    font-size:11px;
                                    font-weight:900;
                                    text-transform:uppercase;
                                    letter-spacing:.11em;
                                    color:#6f675c;
                                  "
                                >
                                  Order subtotal
                                </p>
                              </td>

                              <td
                                align="right"
                                style="
                                  padding:20px;
                                  font-size:26px;
                                  font-weight:900;
                                  letter-spacing:-.03em;
                                  color:#244f3d;
                                "
                              >
                                ${formatMoney(order.subtotal)}
                              </td>
                            </tr>
                          </table>

                          ${
                            invoiceUrl
                              ? `
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellpadding="0"
                                  cellspacing="0"
                                  style="
                                    width:100%;
                                    border-collapse:collapse;
                                    margin-top:22px;
                                  "
                                >
                                  <tr>
                                    <td align="center">
                                      <a
                                        href="${escapeHtml(invoiceUrl)}"
                                        style="
                                          display:block;
                                          padding:16px 22px;
                                          border-radius:12px;
                                          background:#244f3d;
                                          color:#ffffff;
                                          font-size:14px;
                                          font-weight:900;
                                          text-align:center;
                                          text-decoration:none;
                                        "
                                      >
                                        View invoice
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              `
                              : ''
                          }

                          <p
                            style="
                              margin:28px 0 0;
                              font-size:13px;
                              line-height:1.65;
                              color:#7b7368;
                            "
                          >
                            Orders are reviewed before fulfillment. We’ll contact
                            you if anything needs clarification or if availability
                            affects your order.
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td
                          align="center"
                          style="
                            padding:26px 22px;
                            background:#fbfaf7;
                            border:1px solid #ded7cb;
                            border-top:0;
                            border-radius:0 0 18px 18px;
                          "
                        >
                          <p
                            style="
                              margin:0;
                              font-size:13px;
                              line-height:1.7;
                              color:#1f1a14;
                              font-weight:800;
                            "
                          >
                            Questions about this order?
                          </p>

                          <p
                            style="
                              margin:6px 0 0;
                              font-size:12px;
                              line-height:1.7;
                              color:#7b7368;
                            "
                          >
                            Reply to this email or visit
                            <a
                              href="https://www.lcfoodservice.ca"
                              style="color:#244f3d;text-decoration:none;font-weight:800;"
                            >
                              lcfoodservice.ca
                            </a>
                          </p>

                          <div
                            style="
                              width:42px;
                              height:2px;
                              margin:18px auto 0;
                              border-radius:999px;
                              background:#244f3d;
                            "
                          ></div>

                          <p
                            style="
                              margin:14px 0 0;
                              font-size:10px;
                              font-weight:800;
                              text-transform:uppercase;
                              letter-spacing:.13em;
                              color:#8f887d;
                            "
                          >
                            Supporting Canadian foodservice
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      })

    if (resendError) {
      console.error('Resend confirmation email failed:', resendError)

      return NextResponse.json(
        {
          success: false,
          error: resendError.message || 'Failed to send confirmation email',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
      emailId: resendData?.id || null,
      recipients,
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