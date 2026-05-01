'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  user_id: string
  business_name: string | null
  contact_name: string | null
  phone: string | null
  approved: boolean
  created_at: string
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_notes: string | null
  zoho_customer_id?: string | null
}

type Order = {
  id: string
  status: string | null
  subtotal: number | null
  delivery_date: string | null
  notes: string | null
  created_at: string
  invoice_status?: string | null
  zoho_invoice_id?: string | null
  zoho_invoice_url?: string | null
  order_items?: any[]
}

type ZohoInvoice = {
  invoice_id: string
  invoice_number: string
  date: string
  due_date?: string
  status: string
  total: number
  balance: number
}

export default function AccountPage() {
  const [tab, setTab] = useState<'account' | 'finance' | 'orders'>('account')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<ZohoInvoice[]>([])
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadInvoices() {
    try {
      setInvoiceLoading(true)
      setInvoiceError('')

      const res = await fetch('/api/account/invoices', {
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load invoices')
      }

      setInvoices(data.invoices || [])
    } catch (error: any) {
      setInvoiceError(error.message || 'Failed to load invoices')
    } finally {
      setInvoiceLoading(false)
    }
  }

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setEmail(user.email || '')

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setCustomer(customerData)

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(orderData || [])

      await loadInvoices()

      setLoading(false)
    }

    loadAccount()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
        Loading account...
      </div>
    )
  }

  const contactParts = customer?.contact_name?.split(' ') || []
  const firstName = contactParts[0] || '—'
  const lastName = contactParts.slice(1).join(' ') || '—'

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Account Dashboard</h1>
          <p className="mt-1 text-sm text-[#6f675c]">
            Welcome back, {firstName}
          </p>
        </div>

        <div className="border border-[#d6cec0] bg-white">
          <div className="flex border-b border-[#d6cec0]">
            <TabButton label="$ Finance" active={tab === 'finance'} onClick={() => setTab('finance')} />
            <TabButton label="Account Information" active={tab === 'account'} onClick={() => setTab('account')} />
            <TabButton label="Orders" active={tab === 'orders'} onClick={() => setTab('orders')} />
          </div>

          <div className="p-6">
            {tab === 'account' && (
              <AccountInfo
                customer={customer}
                setCustomer={setCustomer}
                email={email}
                firstName={firstName}
                lastName={lastName}
              />
            )}

            {tab === 'finance' && (
              <Finance
                customer={customer}
                invoices={invoices}
                loading={invoiceLoading}
                error={invoiceError}
                onRefresh={loadInvoices}
              />
            )}

            {tab === 'orders' && <Orders orders={orders} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Finance({
  customer,
  invoices,
  loading,
  error,
  onRefresh,
}: {
  customer: Customer | null
  invoices: ZohoInvoice[]
  loading: boolean
  error: string
  onRefresh: () => void
}) {
  const outstanding = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.balance || 0)
  }, 0)

  const totalBilled = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.total || 0)
  }, 0)

  const paidThisMonth = invoices.reduce((sum, invoice) => {
    if (invoice.status?.toLowerCase() !== 'paid') return sum

    const invoiceDate = new Date(invoice.date)
    const now = new Date()

    if (
      invoiceDate.getMonth() === now.getMonth() &&
      invoiceDate.getFullYear() === now.getFullYear()
    ) {
      return sum + Number(invoice.total || 0)
    }

    return sum
  }, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <FinanceCard title="Total Billed" value={formatMoney(totalBilled)} />
        <FinanceCard title="Outstanding in Zoho" value={formatMoney(outstanding)} danger={outstanding > 0} />
        <FinanceCard title="Paid This Month" value={formatMoney(paidThisMonth)} success />
      </div>

      <div className="border border-[#d6cec0] bg-white">
        <div className="flex items-center justify-between border-b border-[#d6cec0] px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Invoice History</h2>
            <p className="mt-1 text-sm text-[#6f675c]">
              Live invoice status from Zoho.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="border border-[#244f3d] px-4 py-2 text-xs font-bold uppercase text-[#244f3d] disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Zoho'}
          </button>
        </div>

        {error ? (
          <div className="m-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : !customer?.zoho_customer_id ? (
          <div className="p-6 text-sm text-[#6f675c]">
            No Zoho account is connected yet.
          </div>
        ) : loading ? (
          <div className="p-6 text-sm text-[#6f675c]">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-sm text-[#6f675c]">
            No invoices available yet.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
              <div>Invoice</div>
              <div>Date</div>
              <div>Due</div>
              <div>Status</div>
              <div>Total</div>
              <div></div>
            </div>

            {invoices.map((invoice) => (
              <div
                key={invoice.invoice_id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] items-center border-t border-[#eee7da] px-5 py-4 text-sm"
              >
                <div className="font-mono text-xs font-bold">
                  {invoice.invoice_number || invoice.invoice_id}
                </div>

                <div className="text-[#6f675c]">
                  {invoice.date || '—'}
                </div>

                <div className="text-[#6f675c]">
                  {invoice.due_date || '—'}
                </div>

                <div>
                  <span className={getInvoiceStatusClass(invoice.status)}>
                    {invoice.status || 'draft'}
                  </span>
                </div>

                <div>
                  <p className="font-semibold">{formatMoney(invoice.total)}</p>

                  {Number(invoice.balance || 0) > 0 ? (
                    <p className="mt-1 text-xs font-bold text-red-700">
                      Balance: {formatMoney(invoice.balance)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-bold text-green-700">
                      Paid
                    </p>
                  )}
                </div>

                <div>
                  <a
                    href={`/api/account/invoices/${invoice.invoice_id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-[#244f3d] px-3 py-2 text-xs font-bold uppercase text-[#244f3d] hover:bg-[#f4f1ea]"
                  >
                    View PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getInvoiceStatusClass(status: string) {
  const normalized = status?.toLowerCase()

  if (normalized === 'paid') {
    return 'border border-green-300 bg-green-50 px-3 py-1 text-xs font-bold uppercase text-green-700'
  }

  if (normalized === 'sent') {
    return 'border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700'
  }

  if (normalized === 'draft') {
    return 'border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-bold uppercase text-[#6f675c]'
  }

  if (normalized === 'overdue') {
    return 'border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700'
  }

  return 'border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-bold uppercase text-[#6f675c]'
}

function formatMoney(value: any) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value || 0))
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-4 text-sm font-semibold ${
        active
          ? 'border-b-2 border-[#244f3d] text-[#244f3d]'
          : 'text-[#6f675c]'
      }`}
    >
      {label}
    </button>
  )
}

function Orders({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  return (
    <div className="space-y-6">
      <div className="border border-[#d6cec0] bg-white p-6">
        <h2 className="text-xl font-semibold">Order History</h2>
        <p className="mt-3 text-sm text-[#6f675c]">
          View submitted wholesale orders and item details.
        </p>
      </div>

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_0.7fr] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>Order</div>
          <div>Date</div>
          <div>Status</div>
          <div>Total</div>
          <div></div>
        </div>

        {orders.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#6f675c]">
            No orders submitted yet.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_0.7fr] items-center border-t border-[#eee7da] px-5 py-4 text-sm"
            >
              <div className="font-mono text-xs font-bold">
                {order.id.slice(0, 8).toUpperCase()}
              </div>

              <div className="text-[#6f675c]">
                {new Date(order.created_at).toLocaleDateString()}
              </div>

              <div>
                <span className="border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-bold uppercase text-[#6f675c]">
                  {order.status || 'submitted'}
                </span>
              </div>

              <div className="font-semibold">
                {formatMoney(order.subtotal)}
              </div>

              <button
                onClick={() => setSelectedOrder(order)}
                className="border border-[#d6cec0] px-3 py-2 text-xs font-bold uppercase text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

function AccountInfo({
  customer,
  setCustomer,
  email,
  firstName,
  lastName,
}: {
  customer: Customer | null
  setCustomer: (customer: Customer) => void
  email: string
  firstName: string
  lastName: string
}) {
  return (
    <div className="space-y-6">
      <Section title="Personal Information">
        <InfoGrid
          items={[
            ['First Name', firstName],
            ['Last Name', lastName],
            ['Email', email],
            ['Phone', customer?.phone || '—'],
          ]}
        />
      </Section>

      <Section title="Business Information">
        <InfoGrid
          items={[
            ['Business Name', customer?.business_name || '—'],
            ['Account Status', customer?.approved ? 'Approved' : 'Pending Approval'],
            ['Account Number', customer?.id?.slice(0, 8).toUpperCase() || '—'],
            [
              'Member Since',
              customer?.created_at
                ? new Date(customer.created_at).toLocaleDateString()
                : '—',
            ],
          ]}
        />
      </Section>

      <EditableDeliverySection customer={customer} onUpdated={setCustomer} />
    </div>
  )
}

function EditableDeliverySection({
  customer,
  onUpdated,
}: {
  customer: Customer | null
  onUpdated: (customer: Customer) => void
}) {
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState(customer?.delivery_address || '')
  const [city, setCity] = useState(customer?.delivery_city || '')
  const [postalCode, setPostalCode] = useState(customer?.delivery_postal_code || '')
  const [notes, setNotes] = useState(customer?.delivery_notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!customer) return

    setSaving(true)

    const { data, error } = await supabase
      .from('customers')
      .update({
        delivery_address: address,
        delivery_city: city,
        delivery_postal_code: postalCode,
        delivery_notes: notes,
      })
      .eq('id', customer.id)
      .select('*')
      .single()

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    onUpdated(data)
    setEditing(false)
  }

  return (
    <Section title="Delivery Address">
      {!editing ? (
        <div className="text-sm">
          <p className="font-semibold">
            {customer?.delivery_address || 'No delivery address on file'}
          </p>

          {(customer?.delivery_city || customer?.delivery_postal_code) && (
            <p className="mt-1 text-[#6f675c]">
              {customer?.delivery_city || '—'}, BC {customer?.delivery_postal_code || ''}
            </p>
          )}

          <div className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-[#6f675c]">
            <p className="text-xs font-bold uppercase tracking-wide">
              Delivery Instructions
            </p>
            <p className="mt-2">
              {customer?.delivery_notes || 'No delivery notes added yet.'}
            </p>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="mt-4 border border-[#244f3d] px-4 py-2 text-sm font-bold text-[#244f3d] hover:bg-[#f4f1ea]"
          >
            Edit Delivery Info
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
            />

            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal code"
              className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
            />
          </div>

          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery notes, receiving instructions, entrance details..."
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#244f3d] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Delivery Info'}
            </button>

            <button
              onClick={() => setEditing(false)}
              className="border border-[#d6cec0] px-4 py-2 text-sm font-bold text-[#6f675c]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

function OrderDetailsModal({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const items = order.order_items || []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#d6cec0] bg-white"
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
          <Section title="Order Summary">
            <InfoGrid
              items={[
                ['Status', order.status || 'submitted'],
                ['Invoice Status', order.invoice_status || 'pending'],
                ['Total', formatMoney(order.subtotal)],
                [
                  'Requested Delivery',
                  order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString()
                    : 'Auto-scheduled by category',
                ],
              ]}
            />

            {order.zoho_invoice_url && (
              <a
                href={`/api/orders/${order.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block bg-[#244f3d] px-4 py-2 text-sm font-bold text-white"
              >
                View Invoice
              </a>
            )}
          </Section>

          <Section title="Items">
            <div className="border border-[#d6cec0]">
              <div className="grid grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr] bg-[#f4f1ea] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                <div>Product</div>
                <div>Qty</div>
                <div>Price</div>
                <div>Total</div>
              </div>

              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr] border-t border-[#eee7da] px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="mt-1 font-mono text-xs text-[#6f675c]">
                      {item.sku || '—'} · {item.unit || '—'}
                    </p>
                  </div>

                  <div>{item.quantity}</div>
                  <div>{formatMoney(item.unit_price)}</div>
                  <div className="font-bold">
                    {formatMoney(item.line_total)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Order Notes">
            <pre className="whitespace-pre-wrap text-sm leading-6 text-[#6f675c]">
              {order.notes || 'No notes added.'}
            </pre>
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
      <div className="border-b border-[#d6cec0] px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function InfoGrid({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-6 text-sm md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
            {label}
          </p>
          <p className="mt-2 font-semibold">{value}</p>
        </div>
      ))}
    </div>
  )
}

function FinanceCard({
  title,
  value,
  danger,
  success,
}: {
  title: string
  value: string
  danger?: boolean
  success?: boolean
}) {
  return (
    <div
      className={`border p-5 ${
        danger
          ? 'border-red-300 bg-red-50'
          : success
            ? 'border-green-300 bg-green-50'
            : 'border-[#d6cec0] bg-[#f4f1ea]'
      }`}
    >
      <p className="text-sm text-[#6f675c]">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}