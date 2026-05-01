import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  items,
  deliveryDate,
  invoiceUrl,
}: {
  to: string
  customerName: string
  orderId: string
  items: any[]
  deliveryDate: string
  invoiceUrl?: string
}) {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0;">${item.name}</td>
          <td style="padding: 8px 0;">${item.quantity}</td>
        </tr>
      `
    )
    .join('')

  await resend.emails.send({
    from: 'Local Connect <orders@yourdomain.com>',
    to,
    subject: `Order Confirmation #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #244f3d;">Thanks for your order, ${customerName}!</h2>

        <p>Your order has been received and is being processed.</p>

        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left">Product</th>
              <th align="left">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p><strong>Delivery Date:</strong> ${deliveryDate}</p>

        ${
          invoiceUrl
            ? `<p><a href="${invoiceUrl}" style="color: #244f3d;">View Invoice</a></p>`
            : ''
        }

        <hr />

        <p style="font-size: 12px; color: #666;">
          Local Connect — Supporting Canadian Foodservice 🇨🇦
        </p>
      </div>
    `,
  })
}