function requireEnv(keys: string[]) {
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Missing Zoho env var: ${key}`)
    }
  }
}

function cleanString(value: any, fallback = '') {
  if (typeof value !== 'string') return fallback
  return value.trim() || fallback
}

async function parseZohoResponse(res: Response) {
  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch {
    return {
      raw: text,
      status: res.status,
      statusText: res.statusText,
    }
  }
}

export async function getZohoAccessToken() {
  requireEnv([
    'ZOHO_ACCOUNTS_URL',
    'ZOHO_REFRESH_TOKEN',
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
  ])

  console.log('APP Zoho accounts URL:', process.env.ZOHO_ACCOUNTS_URL)
  console.log('APP refresh token preview:', process.env.ZOHO_REFRESH_TOKEN?.slice(0, 30))

  const res = await fetch(`${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await parseZohoResponse(res)

  if (!res.ok || !data.access_token) {
    console.error('Zoho token error:', JSON.stringify(data, null, 2))
    throw new Error(data.error || data.message || 'Failed to refresh Zoho access token')
  }

  return data.access_token as string
}

export async function createZohoCustomer(customer: any) {
  requireEnv(['ZOHO_BOOKS_API_URL', 'ZOHO_ORGANIZATION_ID'])

  const accessToken = await getZohoAccessToken()

  const contactName = cleanString(
    customer.contact_name ||
      customer.business_name ||
      customer.email,
    'Local Connect Customer'
  )

  const companyName = cleanString(
    customer.business_name || customer.contact_name,
    contactName
  )

  const payload = {
    contact_name: contactName,
    company_name: companyName,
    contact_type: 'customer',
    billing_address: {
      address: cleanString(customer.delivery_address),
      city: cleanString(customer.delivery_city),
      zip: cleanString(customer.delivery_postal_code),
      country: 'Canada',
    },
  }

  console.log('APP Zoho org id:', process.env.ZOHO_ORGANIZATION_ID)
  console.log('APP Zoho API URL:', process.env.ZOHO_BOOKS_API_URL)
  console.log('Creating Zoho customer payload:', JSON.stringify(payload, null, 2))

  const res = await fetch(
    `${process.env.ZOHO_BOOKS_API_URL}/contacts?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await parseZohoResponse(res)

  if (!res.ok || !data.contact?.contact_id) {
    console.error('Zoho customer error:', JSON.stringify(data, null, 2))
    throw new Error(
      data.message ||
        data.error ||
        String(data.code) ||
        'Failed to create Zoho customer'
    )
  }

  return data.contact.contact_id as string
}

export async function createZohoInvoice(order: any, zohoCustomerId: string) {
  requireEnv(['ZOHO_BOOKS_API_URL', 'ZOHO_ORGANIZATION_ID'])

  const accessToken = await getZohoAccessToken()

  const lineItems = (order.items || [])
    .map((item: any) => {
      const name = cleanString(
        item.product?.name ||
          item.product_name ||
          item.description,
        'Wholesale item'
      )

      const quantity = Number(item.quantity || 0)
      const rate = Number(item.unit_price || item.price || 0)

      return {
        name,
        description: name,
        quantity,
        rate,
      }
    })
    .filter((item: any) => item.quantity > 0)

  if (!lineItems.length) {
    throw new Error('Cannot create Zoho invoice without valid line items')
  }

  // 🔥 NEW: Generate invoice number
  const shortOrderId = String(order.id).slice(0, 8).toUpperCase()
  const invoiceNumber = `LC-${shortOrderId}`

  const payload = {
    customer_id: zohoCustomerId,
    invoice_number: invoiceNumber, // 🔥 THIS FIXES YOUR ERROR
    reference_number: order.id,
    date: new Date().toISOString().split('T')[0],
    payment_terms: 14,
    line_items: lineItems,
    notes: 'Thank you for supporting local foodservice.',
  }

  console.log('APP Zoho org id:', process.env.ZOHO_ORGANIZATION_ID)
  console.log('APP Zoho API URL:', process.env.ZOHO_BOOKS_API_URL)
  console.log('Creating Zoho invoice payload:', JSON.stringify(payload, null, 2))

  const res = await fetch(
    `${process.env.ZOHO_BOOKS_API_URL}/invoices?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await parseZohoResponse(res)

  if (!res.ok || !data.invoice?.invoice_id) {
    console.error('Zoho invoice error:', JSON.stringify(data, null, 2))
    throw new Error(
      data.message ||
        data.error ||
        String(data.code) ||
        'Failed to create Zoho invoice'
    )
  }

  return data.invoice
}