import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  createZohoCustomer,
  createZohoInvoice,
  createZohoVendor,
  createZohoPurchaseOrder,
} from '@/lib/zoho'

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

  try {
    let invoiceId = order.zoho_invoice_id
    let invoiceUrl = order.zoho_invoice_url
    let alreadyExists = Boolean(order.zoho_invoice_id)

    if (!invoiceId) {
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

      invoiceUrl =
        invoice.invoice_url ||
        invoice.invoice_url_link ||
        invoice.url ||
        invoice.invoice?.invoice_url ||
        invoice.invoice?.invoice_url_link ||
        null

      invoiceId =
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

      alreadyExists = false
    }

    await createProducerPurchaseOrders(order)

    return {
      success: true,
      invoiceId,
      url: invoiceUrl,
      alreadyExists,
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

async function createProducerPurchaseOrders(order: any) {
  const { data: producerItems, error } = await supabaseAdmin
    .from('producer_order_items')
    .select(`
      *,
      producer:customers!producer_order_items_producer_customer_id_fkey(*)
    `)
    .eq('order_id', order.id)
    .is('zoho_purchaseorder_id', null)

  if (error) {
    console.error('Producer PO item lookup failed:', error)
    return
  }

  if (!producerItems?.length) return

  const groupedByProducer = producerItems.reduce(
    (groups: Record<string, any[]>, item: any) => {
      const producerId = item.producer_customer_id

      if (!producerId) return groups

      if (!groups[producerId]) {
        groups[producerId] = []
      }

      groups[producerId].push(item)

      return groups
    },
    {}
  )

  for (const producerId of Object.keys(groupedByProducer)) {
    const groupItems = groupedByProducer[producerId]
    const producer = groupItems[0]?.producer

    if (!producer) {
      console.error('Producer customer not found for PO:', producerId)
      await markProducerPoFailed(order.id, producerId)
      continue
    }

    try {
      let vendorId = producer.zoho_vendor_id

      if (!vendorId) {
        vendorId = await createZohoVendor(producer)

        const { error: vendorUpdateError } = await supabaseAdmin
          .from('customers')
          .update({ zoho_vendor_id: vendorId })
          .eq('id', producerId)

        if (vendorUpdateError) {
          console.error('Failed to save Zoho vendor ID:', vendorUpdateError)
        }
      }

      await supabaseAdmin
        .from('producer_order_items')
        .update({
          po_status: 'creating',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.id)
        .eq('producer_customer_id', producerId)

      const purchaseOrder = await createZohoPurchaseOrder({
        vendorId,
        order,
        producerItems: groupItems,
      })

      const purchaseOrderId =
        purchaseOrder.purchaseorder_id ||
        purchaseOrder.purchaseorder?.purchaseorder_id ||
        purchaseOrder.id ||
        null

      const purchaseOrderUrl =
        purchaseOrder.purchaseorder_url ||
        purchaseOrder.purchaseorder_url_link ||
        purchaseOrder.url ||
        null

      if (!purchaseOrderId) {
        throw new Error('Zoho PO created but no purchase order ID was returned')
      }

      const { error: updateError } = await supabaseAdmin
        .from('producer_order_items')
        .update({
          zoho_purchaseorder_id: purchaseOrderId,
          zoho_purchaseorder_url: purchaseOrderUrl,
          po_status: 'created',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.id)
        .eq('producer_customer_id', producerId)

      if (updateError) {
        console.error('Failed to save producer PO data:', updateError)
        throw updateError
      }
    } catch (error: any) {
      console.error('Producer PO creation failed:', {
        producerId,
        error: error?.message,
      })

      await markProducerPoFailed(order.id, producerId)
    }
  }
}

async function markProducerPoFailed(orderId: string, producerId: string) {
  const { error } = await supabaseAdmin
    .from('producer_order_items')
    .update({
      po_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .eq('producer_customer_id', producerId)

  if (error) {
    console.error('Failed to mark producer PO as failed:', error)
  }
}