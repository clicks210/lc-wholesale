import { supabase } from './supabase'

export async function submitOrder({
  items,
  deliveryDate,
  notes,
}: {
  items: any[]
  deliveryDate: string
  notes: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not logged in')

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    throw new Error('Customer profile not found')
  }

  if (!customer.approved) {
    throw new Error('Your account is still pending approval')
  }

  if (!items.length) {
    throw new Error('Cart is empty')
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price ?? 0) * item.quantity
  }, 0)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      user_id: user.id,
      subtotal,
      delivery_date: deliveryDate || null,
      notes,
      status: 'submitted',
      invoice_status: 'pending',
    })
    .select('*')
    .single()

  if (orderError || !order) throw orderError

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    sku: item.product.sku,
    unit: item.product.unit,
    quantity: item.quantity,
    unit_price: Number(item.product.price ?? 0),
    line_total: Number(item.product.price ?? 0) * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) throw itemsError

  let invoiceData: any = null

  try {
    const invoiceRes = await fetch(`/api/admin/orders/${order.id}/zoho`, {
      method: 'POST',
    })

    invoiceData = await invoiceRes.json()

    if (!invoiceData.success) {
      console.error('Zoho invoice creation failed:', invoiceData.error)
    }
  } catch (error) {
    console.error('Zoho invoice request failed:', error)
  }

  try {
    const emailRes = await fetch(`/api/orders/${order.id}/confirmation-email`, {
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
    })

    const emailData = await emailRes.json()

    if (!emailData.success) {
      console.error('Order confirmation email failed:', emailData.error)
    }
  } catch (error) {
    console.error('Order confirmation email request failed:', error)
  }

  return order
}

export async function getAdminOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        business_name,
        contact_name,
        phone,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_notes,
        zoho_customer_id
      ),
      order_items (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin orders:', error)
    return []
  }

  return data ?? []
}