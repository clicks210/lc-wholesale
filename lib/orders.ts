import { supabase } from './supabase'

export async function submitOrder({
  items,
  deliveryDate,
  deliveryLabel,
  deliverySummary,
  fulfillmentSummary,
  notes,
}: {
  items: any[]
  deliveryDate: string
  deliveryLabel?: string
  deliverySummary?: string
  fulfillmentSummary?: string
  notes: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not logged in')

  const { data: membership, error: membershipError } = await supabase
    .from('customer_members')
    .select('customer_id, role')
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error('Customer membership not found')
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', membership.customer_id)
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
    delivery_label: deliveryLabel || null,
    delivery_summary: deliverySummary || null,
    fulfillment_summary: fulfillmentSummary || null,

    delivery_address: customer.delivery_address || null,
    delivery_city: customer.delivery_city || null,
    delivery_postal_code: customer.delivery_postal_code || null,
    delivery_notes: customer.delivery_notes || null,

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

    image_url:
      item.product.image_url ||
      item.product.image ||
      item.product.product_image ||
      null,

    category: item.product.category || null,

    producer_customer_id: item.product.producer_customer_id || null,
    source_type: item.product.source_type || 'lc',
    fulfillment_type: item.product.fulfillment_type || null,
  }))

  const { data: insertedOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select('*')

  if (itemsError) throw itemsError

  const producerOrderItems = insertedOrderItems
  .filter((item: any) => item.producer_customer_id)
  .map((item: any) => ({
    order_id: order.id,
    order_item_id: item.id,

    producer_customer_id: item.producer_customer_id,
    buyer_customer_id: customer.id,
    buyer_business_name: customer.business_name || null,
    buyer_contact_name: customer.contact_name || null,
    order_submitted_at: order.created_at || new Date().toISOString(),

    product_id: item.product_id,
    product_name: item.product_name,
    sku: item.sku,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    image_url: item.image_url,
    category: item.category,

    delivery_label: deliveryLabel || null,
    delivery_date: deliveryDate || null,

    delivery_address: customer.delivery_address || null,
    delivery_city: customer.delivery_city || null,
    delivery_postal_code: customer.delivery_postal_code || null,
    delivery_notes: customer.delivery_notes || null,

    status: 'new',
  }))

  if (producerOrderItems.length > 0) {
    const { error: producerItemsError } = await supabase
      .from('producer_order_items')
      .insert(producerOrderItems)

    if (producerItemsError) throw producerItemsError
  }

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