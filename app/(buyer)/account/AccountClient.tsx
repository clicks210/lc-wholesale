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
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
        Loading account...
      </div>
    )
  }

  const contactParts = customer?.contact_name?.split(' ') || []
  const firstName = contactParts[0] || '—'
  const lastName = contactParts.slice(1).join(' ') || '—'

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Account Dashboard
          </h1>

          <p className="mt-1 text-sm font-medium text-[#6f675c]">
            Welcome back, {firstName}
          </p>
        </div>

        <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
          <div className="grid grid-cols-1 border-b border-[#d6cec0] sm:grid-cols-3">
            <TabButton
              label="$ Finance"
              active={tab === 'finance'}
              onClick={() => setTab('finance')}
            />
            <TabButton
              label="Account Information"
              active={tab === 'account'}
              onClick={() => setTab('account')}
            />
            <TabButton
              label="Orders"
              active={tab === 'orders'}
              onClick={() => setTab('orders')}
            />
          </div>

          <div className="p-4 sm:p-6">
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
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <FinanceCard title="Total Billed" value={formatMoney(totalBilled)} />
        <FinanceCard
          title="Outstanding in Zoho"
          value={formatMoney(outstanding)}
          danger={outstanding > 0}
        />
        <FinanceCard title="Paid This Month" value={formatMoney(paidThisMonth)} success />
      </div>

      <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Invoice History</h2>
            <p className="mt-1 text-sm font-medium text-white/75">
              Live invoice status from Zoho.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full border border-white/40 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-[#244f3d] disabled:opacity-50 sm:w-auto"
          >
            {loading ? 'Refreshing...' : 'Refresh Zoho'}
          </button>
        </div>

        {error ? (
          <div className="m-4 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 sm:m-6">
            {error}
          </div>
        ) : !customer?.zoho_customer_id ? (
          <div className="p-5 text-sm font-medium text-[#6f675c]">
            No Zoho account is connected yet.
          </div>
        ) : loading ? (
          <div className="p-5 text-sm font-medium text-[#6f675c]">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-5 text-sm font-medium text-[#6f675c]">
            No invoices available yet.
          </div>
        ) : (
          <div>
            <div className="hidden md:block">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] bg-[#f4f1ea] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#6f675c]">
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
                  <div className="break-all font-mono text-xs font-bold">
                    {invoice.invoice_number || invoice.invoice_id}
                  </div>

                  <div className="text-[#6f675c]">{invoice.date || '—'}</div>
                  <div className="text-[#6f675c]">{invoice.due_date || '—'}</div>

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

            <div className="space-y-3 p-4 md:hidden">
              {invoices.map((invoice) => (
                <div
                  key={invoice.invoice_id}
                  className="border border-[#d6cec0] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs font-black">
                        {invoice.invoice_number || invoice.invoice_id}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#6f675c]">
                        {invoice.date || '—'} · Due {invoice.due_date || '—'}
                      </p>
                    </div>

                    <span className={getInvoiceStatusClass(invoice.status)}>
                      {invoice.status || 'draft'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniStat label="Total" value={formatMoney(invoice.total)} />
                    <MiniStat
                      label="Balance"
                      value={formatMoney(invoice.balance)}
                      danger={Number(invoice.balance || 0) > 0}
                      success={Number(invoice.balance || 0) <= 0}
                    />
                  </div>

                  <a
                    href={`/api/account/invoices/${invoice.invoice_id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full border border-[#244f3d] px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-[#244f3d]"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Orders({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  return (
    <div className="space-y-5">
      <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
        <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
          <h2 className="text-lg font-black text-white">Order History</h2>
          <p className="mt-1 text-sm font-medium text-white/75">
            View submitted wholesale orders and item details.
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="px-5 py-8 text-sm font-medium text-[#6f675c]">
            No orders submitted yet.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_0.7fr] bg-[#f4f1ea] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#6f675c]">
                <div>Order</div>
                <div>Date</div>
                <div>Status</div>
                <div>Total</div>
                <div></div>
              </div>

              {orders.map((order) => (
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

                  <div className="font-semibold">{formatMoney(order.subtotal)}</div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="border border-[#d6cec0] px-3 py-2 text-xs font-bold uppercase text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-[#d6cec0] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-black">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#6f675c]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-black uppercase text-[#6f675c]">
                      {order.status || 'submitted'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border border-[#eee7da] bg-[#f4f1ea] p-3">
                    <span className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                      Total
                    </span>
                    <span className="font-black text-[#244f3d]">
                      {formatMoney(order.subtotal)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="mt-3 w-full border border-[#244f3d] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#244f3d]"
                  >
                    View Order
                  </button>
                </div>
              ))}
            </div>
          </>
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
    <div className="space-y-5">
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
          <p className="font-black">
            {customer?.delivery_address || 'No delivery address on file'}
          </p>

          {(customer?.delivery_city || customer?.delivery_postal_code) && (
            <p className="mt-1 font-medium text-[#6f675c]">
              {customer?.delivery_city || '—'}, BC {customer?.delivery_postal_code || ''}
            </p>
          )}

          <div className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-[#6f675c]">
            <p className="text-xs font-black uppercase tracking-wide">
              Delivery Instructions
            </p>
            <p className="mt-2 leading-5">
              {customer?.delivery_notes || 'No delivery notes added yet.'}
            </p>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="mt-4 w-full border border-[#244f3d] px-4 py-3 text-sm font-black text-[#244f3d] hover:bg-[#f4f1ea] sm:w-auto"
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

          <div className="grid gap-3 sm:flex">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Delivery Info'}
            </button>

            <button
              onClick={() => setEditing(false)}
              className="border border-[#d6cec0] px-4 py-3 text-sm font-black text-[#6f675c]"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#d6cec0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#d6cec0] bg-[#244f3d] p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
              Order Details
            </p>
            <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-2 text-sm font-medium text-white/75">
              Submitted {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 border border-white/40 bg-white px-3 py-2 text-sm font-black text-[#244f3d]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
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
                className="mt-5 inline-block w-full bg-[#244f3d] px-4 py-3 text-center text-sm font-black text-white sm:w-auto"
              >
                View Invoice
              </a>
            )}
          </Section>

          <Section title="Items">
            {items.length === 0 ? (
              <p className="text-sm font-medium text-[#6f675c]">
                No items found for this order.
              </p>
            ) : (
              <div>
                <div className="hidden border border-[#d6cec0] md:block">
                  <div className="grid grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr] bg-[#f4f1ea] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#6f675c]">
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

                <div className="space-y-3 md:hidden">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="border border-[#d6cec0] bg-white p-4 shadow-sm"
                    >
                      <p className="font-black leading-snug">{item.product_name}</p>
                      <p className="mt-1 break-all font-mono text-[11px] font-medium text-[#6f675c]">
                        {item.sku || '—'} · {item.unit || '—'}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <MiniStat label="Qty" value={String(item.quantity)} />
                        <MiniStat label="Price" value={formatMoney(item.unit_price)} />
                        <MiniStat
                          label="Total"
                          value={formatMoney(item.line_total)}
                          success
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Order Notes">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[#6f675c]">
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
    <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
      <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
        <h2 className="text-base font-black text-white sm:text-lg">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

function InfoGrid({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="border border-[#eee7da] bg-[#f4f1ea] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
            {label}
          </p>
          <p className="mt-1 break-words font-black">{value}</p>
        </div>
      ))}
    </div>
  )
}

function MiniStat({
  label,
  value,
  danger,
  success,
}: {
  label: string
  value: string
  danger?: boolean
  success?: boolean
}) {
  return (
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-black ${
          danger ? 'text-red-700' : success ? 'text-green-700' : ''
        }`}
      >
        {value}
      </p>
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
      className={`border p-4 shadow-sm ${
        danger
          ? 'border-red-300 bg-red-50'
          : success
            ? 'border-green-300 bg-green-50'
            : 'border-[#d6cec0] bg-white'
      }`}
    >
      <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{value}</p>
    </div>
  )
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
      className={`border-b border-[#d6cec0] px-4 py-4 text-left text-sm font-black sm:text-center ${
        active
          ? 'bg-[#244f3d] text-white'
          : 'bg-white text-[#6f675c] hover:bg-[#f4f1ea]'
      }`}
    >
      {label}
    </button>
  )
}

function getInvoiceStatusClass(status: string) {
  const normalized = status?.toLowerCase()

  if (normalized === 'paid') {
    return 'shrink-0 border border-green-300 bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700'
  }

  if (normalized === 'sent') {
    return 'shrink-0 border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700'
  }

  if (normalized === 'draft') {
    return 'shrink-0 border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-black uppercase text-[#6f675c]'
  }

  if (normalized === 'overdue') {
    return 'shrink-0 border border-red-300 bg-red-50 px-3 py-1 text-xs font-black uppercase text-red-700'
  }

  return 'shrink-0 border border-[#d6cec0] bg-[#f4f1ea] px-3 py-1 text-xs font-black uppercase text-[#6f675c]'
}

function formatMoney(value: any) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value || 0))
}