'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAdminOrders } from '@/lib/orders'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      const data = await getAdminOrders()
      setOrders(data)
      setLoading(false)
    }

    loadOrders()
  }, [])

  const stats = useMemo(() => {
    const total = orders.reduce(
      (sum, order) => sum + Number(order.subtotal || 0),
      0
    )

    const itemCount = orders.reduce(
      (sum, order) => sum + Number(order.order_items?.length || 0),
      0
    )

    return {
      orders: orders.length,
      items: itemCount,
      total,
    }
  }, [orders])

  if (loading) {
    return (
      <div className="border border-[#d6cec0] bg-white p-6 text-sm text-[#6f675c]">
        Loading orders...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 border-b border-[#d6cec0] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Order Management
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Incoming Orders
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Review wholesale orders, customer details, delivery notes, invoices,
          and product quantities.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Orders" value={stats.orders} />
        <StatCard label="Items" value={stats.items} />
        <StatCard label="Total" value={formatMoney(stats.total)} />
      </div>

      {orders.length === 0 ? (
        <div className="border border-[#d6cec0] bg-white p-8 text-sm text-[#6f675c]">
          No orders found.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const items = order.order_items || []
            const deliveryAddress = formatDeliveryAddress(order)
            const orderTotal = Number(order.subtotal || 0)

            const invoiceId =
              order.zoho_invoice_id ||
              order.invoice_id ||
              order.zoho_invoice?.invoice_id

            const invoiceUrl = invoiceId
              ? `/api/admin/invoices/${invoiceId}/pdf`
              : null

            return (
              <section
                key={order.id}
                className="overflow-hidden border border-[#d6cec0] bg-white"
              >
                <div className="border-b border-[#eee7da] bg-[#fbfaf7] px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6f675c]">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                        {order.customers?.business_name || 'Customer Account'}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-[#6f675c]">
                        {order.customers?.contact_name || 'No contact'}
                      </p>

                      <p className="mt-1 text-sm text-[#6f675c]">
                        Submitted {formatDateTime(order.created_at)}
                      </p>

                      {deliveryAddress && (
                        <div className="mt-4 border border-[#d6cec0] bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                            Delivery Address
                          </p>

                          <p className="mt-1 text-sm font-bold leading-6 text-[#1d1d1b]">
                            {deliveryAddress}
                          </p>

                          {order.customers?.delivery_notes && (
                            <p className="mt-2 text-sm leading-6 text-[#6f675c]">
                              {order.customers.delivery_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <InfoPill
                        label="Delivery"
                        value={order.delivery_date || 'TBD'}
                      />

                      <InfoPill label="Items" value={String(items.length)} />

                      <InfoPill label="Total" value={formatMoney(orderTotal)} />

                      <StatusPill status={order.status} />

                      {invoiceUrl ? (
                        <a
                          href={invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#244f3d] bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
                        >
                          View Invoice
                        </a>
                      ) : (
                        <span className="border border-[#d6cec0] bg-[#f4f1ea] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#6f675c]">
                          No Invoice
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="border border-[#244f3d] bg-[#244f3d] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#1d1d1b]"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="border-b border-[#eee7da] bg-[#f4f1ea] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                      Buyer Notes
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#4d4d4d]">
                      {order.notes}
                    </p>
                  </div>
                )}

                <div className="divide-y divide-[#eee7da]">
                  {items.slice(0, 4).map((item: any) => (
                    <OrderItemRow key={item.id} item={item} />
                  ))}
                </div>

                {items.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="w-full border-t border-[#eee7da] bg-[#fbfaf7] px-5 py-4 text-xs font-black uppercase tracking-wide text-[#244f3d] hover:bg-[#f4f1ea]"
                  >
                    View {items.length - 4} More Items
                  </button>
                )}
              </section>
            )
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

function OrderModal({
  order,
  onClose,
}: {
  order: any
  onClose: () => void
}) {
  const items = order.order_items || []

  const invoiceId =
    order.zoho_invoice_id ||
    order.invoice_id ||
    order.zoho_invoice?.invoice_id

  const invoiceUrl = invoiceId ? `/api/admin/invoices/${invoiceId}/pdf` : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-[#d6cec0] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#d6cec0] bg-[#fbfaf7] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
              Order Details
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>

            <p className="mt-2 text-sm text-[#6f675c]">
              Submitted {formatDateTime(order.created_at)}
            </p>
          </div>

          <div className="flex gap-2">
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-[#244f3d] bg-[#244f3d] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#1d1d1b]"
              >
                View Invoice
              </a>
            )}

            <button
              onClick={onClose}
              className="border border-[#d6cec0] bg-white px-3 py-2 text-sm font-bold text-[#6f675c] hover:border-red-700 hover:bg-red-700 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Section title="Customer">
            <InfoGrid
              items={[
                ['Business', order.customers?.business_name],
                ['Contact', order.customers?.contact_name],
                ['Phone', order.customers?.phone],
                ['Status', order.status],
              ]}
            />
          </Section>

          <Section title="Delivery">
            <InfoGrid
              items={[
                ['Requested Date', order.delivery_date],
                ['Address', order.customers?.delivery_address],
                ['City', order.customers?.delivery_city],
                ['Postal Code', order.customers?.delivery_postal_code],
              ]}
            />

            <NoteBox label="Order Notes" value={order.notes} />
            <NoteBox
              label="Saved Delivery Notes"
              value={order.customers?.delivery_notes}
            />
          </Section>

          <Section title="Items">
            <div className="divide-y divide-[#eee7da] border border-[#d6cec0]">
              {items.map((item: any) => (
                <OrderItemRow key={item.id} item={item} showUnitPrice />
              ))}
            </div>

            <div className="mt-5 flex justify-end text-xl font-black text-[#244f3d]">
              Total: {formatMoney(order.subtotal)}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function OrderItemRow({
  item,
  showUnitPrice = false,
}: {
  item: any
  showUnitPrice?: boolean
}) {
  return (
    <div
      className={
        showUnitPrice
          ? 'grid gap-4 px-5 py-4 md:grid-cols-[1fr_110px_110px_130px] md:items-center'
          : 'grid gap-4 px-5 py-4 md:grid-cols-[1fr_110px_130px] md:items-center'
      }
    >
      <div className="flex min-w-0 gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#d6cec0] bg-[#f4f1ea]">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.product_name || 'Product image'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[9px] font-black uppercase text-[#8a8173]">
              No Image
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-black leading-snug">{item.product_name}</p>

          <p className="mt-1 font-mono text-xs text-[#6f675c]">
            {item.sku || '—'} · {item.unit || '—'}
          </p>

          {item.category && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="border border-[#d6cec0] bg-[#f4f1ea] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                {item.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {showUnitPrice && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] md:hidden">
            Unit Price
          </p>
          <p className="text-sm font-bold">{formatMoney(item.unit_price)}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] md:hidden">
          Quantity
        </p>
        <p className="text-xl font-black">{item.quantity}</p>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] md:hidden">
          Line Total
        </p>
        <p className="text-xl font-black text-[#244f3d]">
          {formatMoney(item.line_total)}
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#d6cec0] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6f675c]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#244f3d]">
        {value}
      </p>
    </div>
  )
}

function InfoPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-[#d6cec0] bg-white px-4 py-2">
      <p className="text-[9px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-[#1d1d1b]">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="border border-[#d6cec0] bg-[#f4f1ea] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#6f675c]">
      {status || 'Pending'}
    </span>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-[#d6cec0] bg-white">
      <div className="border-b border-[#d6cec0] bg-[#fbfaf7] px-5 py-3">
        <h3 className="font-black tracking-[-0.02em]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoGrid({ items }: { items: [string, any][] }) {
  return (
    <div className="grid gap-5 text-sm md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
            {label}
          </p>
          <p className="mt-2 break-words font-semibold">{value || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function NoteBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-2 leading-6">{value || 'None.'}</p>
    </div>
  )
}

function formatDeliveryAddress(order: any) {
  return [
    order.customers?.delivery_address,
    order.customers?.delivery_city,
    order.customers?.delivery_postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMoney(value: any) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value || 0))
}