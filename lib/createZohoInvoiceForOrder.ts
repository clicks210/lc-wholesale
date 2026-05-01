import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createZohoCustomer, createZohoInvoice } from '@/lib/zoho'

export async function createZohoInvoiceForOrder(orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError) {
    console.error('Order lookup failed:', orderError)
    throw orderError
  }

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.zoho_invoice_id) {
    return {
      success: true,
      invoiceId: order.zoho_invoice_id,
      url: order.zoho_invoice_url,
      alreadyExists: true,
    }
  }

  try {
    let zohoCustomerId = order.customer?.zoho_customer_id

    if (!zohoCustomerId) {
      zohoCustomerId = await createZohoCustomer(order.customer)

      const { error: customerUpdateError } = await supabaseAdmin
        .from('customers')
        .update({ zoho_customer_id: zohoCustomerId })
        .eq('id', order.customer.id)

      if (customerUpdateError) {
        console.error('Failed to save Zoho customer ID:', customerUpdateError)
      }
    }

    const invoice = await createZohoInvoice(order, zohoCustomerId)

    const invoiceUrl =
      invoice.invoice_url ||
      invoice.invoice_url_link ||
      invoice.url ||
      invoice.invoice?.invoice_url ||
      invoice.invoice?.invoice_url_link ||
      null

    const invoiceId =
      invoice.invoice_id ||
      invoice.invoice?.invoice_id ||
      invoice.invoice?.id ||
      null

    if (!invoiceId) {
      throw new Error('Zoho invoice created but no invoice ID was returned')
    }

    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        zoho_invoice_id: invoiceId,
        zoho_invoice_url: invoiceUrl,
        invoice_status: 'created',
      })
      .eq('id', order.id)

    if (orderUpdateError) {
      console.error('Failed to save Zoho invoice data:', orderUpdateError)
      throw orderUpdateError
    }

    return {
      success: true,
      invoiceId,
      url: invoiceUrl,
      alreadyExists: false,
    }
  } catch (error: any) {
    console.error('Zoho invoice creation failed:', error)

    await supabaseAdmin
      .from('orders')
      .update({
        invoice_status: 'failed',
      })
      .eq('id', order.id)

    return {
      success: false,
      invoiceId: null,
      url: null,
      alreadyExists: false,
      error: error?.message || 'Zoho invoice creation failed',
    }
  }
}