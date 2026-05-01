'use client'

import { useEffect, useState } from 'react'
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

  return (
    <div>
      <div className="mb-8 border-b border-[#d6cec0] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Order Management
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Orders
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Review incoming wholesale orders, customer details, delivery notes, and order items.
        </p>
      </div>

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[1fr_1.2fr_0.9fr_0.8fr_0.8fr_0.7fr] border-b border-[#d6cec0] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>Order</div>
          <div>Customer</div>
          <div>Delivery</div>
          <div>Status</div>
          <div>Total</div>
          <div></div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-[#6f675c]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-5 text-sm text-[#6f675c]">No orders found.</div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_1.2fr_0.9fr_0.8fr_0.8fr_0.7fr] items-center border-b border-[#eee7da] px-5 py-4 text-sm last:border-b-0"
            >
              <div>
                <p className="font-mono text-xs font-bold">
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-[#6f675c]">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  {order.customers?.business_name || '—'}
                </p>
                <p className="mt-1 text-xs text-[#6f675c]">
                  {order.customers?.contact_name || 'No contact'}
                </p>
              </div>

              <div className="text-[#6f675c]">
                {order.delivery_date || 'Not set'}
              </div>

              <div>
                <span className="border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-bold uppercase text-[#6f675c]">
                  {order.status}
                </span>
              </div>

              <div className="font-semibold">
                ${Number(order.subtotal ?? 0).toFixed(2)}
              </div>

              <div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="border border-[#d6cec0] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-[#d6cec0] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#d6cec0] bg-[#f4f1ea] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
              Order Details
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>

            <p className="mt-2 text-sm text-[#6f675c]">
              Submitted {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="border border-[#d6cec0] bg-white px-3 py-2 text-sm font-bold text-[#6f675c]"
          >
            ✕
          </button>
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

            <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Order Notes
              </p>
              <p className="mt-2">{order.notes || 'No order notes.'}</p>
            </div>

            <div className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Saved Delivery Notes
              </p>
              <p className="mt-2">
                {order.customers?.delivery_notes || 'No saved delivery notes.'}
              </p>
            </div>
          </Section>

          <Section title="Items">
            <div className="border border-[#d6cec0]">
              <div className="grid grid-cols-[1.5fr_0.7fr_0.6fr_0.7fr] bg-[#f4f1ea] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                <div>Product</div>
                <div>Unit Price</div>
                <div>Qty</div>
                <div>Total</div>
              </div>

              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.5fr_0.7fr_0.6fr_0.7fr] border-t border-[#eee7da] px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="mt-1 font-mono text-xs text-[#6f675c]">
                      {item.sku || '—'} · {item.unit || '—'}
                    </p>
                  </div>

                  <div>${Number(item.unit_price ?? 0).toFixed(2)}</div>
                  <div>{item.quantity}</div>
                  <div className="font-bold">
                    ${Number(item.line_total ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end text-lg font-bold">
              Total: ${Number(order.subtotal ?? 0).toFixed(2)}
            </div>
          </Section>
        </div>
      </div>
    </div>
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
      <div className="border-b border-[#d6cec0] px-5 py-3">
        <h3 className="font-semibold">{title}</h3>
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
          <p className="mt-2 font-semibold break-words">{value || '—'}</p>
        </div>
      ))}
    </div>
  )
}