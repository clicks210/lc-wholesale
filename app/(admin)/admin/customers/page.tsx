'use client'

import { useEffect, useState } from 'react'
import {
  getCustomers,
  approveCustomer,
  unapproveCustomer,
} from '@/lib/customers'

type ZohoInvoice = {
  invoice_id: string
  invoice_number: string
  date: string
  due_date?: string
  status: string
  total: number
  balance: number
  currency_code?: string
  customer_name?: string
  invoice_url?: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadCustomers() {
    setLoading(true)
    const data = await getCustomers()
    setCustomers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  async function handleToggle(customer: any) {
    if (customer.approved) {
      await unapproveCustomer(customer.id)
    } else {
      await approveCustomer(customer.id)
    }

    await loadCustomers()
  }

  return (
    <div>
      <div className="mb-8 border-b border-[#d6cec0] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Buyer Management
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Customers
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Approve new wholesale buyers and view customer account, delivery, and
          invoice details.
        </p>
      </div>

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_0.8fr] border-b border-[#d6cec0] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>Business</div>
          <div>Contact</div>
          <div>Phone</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-[#6f675c]">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-5 text-sm text-[#6f675c]">No customers found.</div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_0.8fr] items-center border-b border-[#eee7da] px-5 py-4 last:border-b-0"
            >
              <div>
                <p className="font-semibold">{customer.business_name}</p>
                <p className="mt-1 text-xs text-[#6f675c]">
                  Created {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  {customer.contact_name || '—'}
                </p>
              </div>

              <div className="text-sm text-[#6f675c]">
                {customer.phone || '—'}
              </div>

              <div>
                <button
                  onClick={() => handleToggle(customer)}
                  className={
                    customer.approved
                      ? 'border border-[#244f3d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#244f3d]'
                      : 'bg-[#244f3d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white'
                  }
                >
                  {customer.approved ? 'Approved' : 'Approve'}
                </button>
              </div>

              <div>
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="border border-[#d6cec0] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggle={async () => {
            await handleToggle(selectedCustomer)

            setSelectedCustomer({
              ...selectedCustomer,
              approved: !selectedCustomer.approved,
            })
          }}
        />
      )}
    </div>
  )
}

function CustomerModal({
  customer,
  onClose,
  onToggle,
}: {
  customer: any
  onClose: () => void
  onToggle: () => void
}) {
  const [invoices, setInvoices] = useState<ZohoInvoice[]>([])
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState('')

  useEffect(() => {
    async function loadInvoices() {
      try {
        setInvoiceLoading(true)
        setInvoiceError('')

        const res = await fetch(`/api/admin/customers/${customer.id}/invoices`, {
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

    if (customer?.id) {
      loadInvoices()
    }
  }, [customer?.id])

  const totalOutstanding = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.balance || 0)
  }, 0)

  const totalBilled = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.total || 0)
  }, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-[#d6cec0] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#d6cec0] bg-[#f4f1ea] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
              Customer Details
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {customer.business_name || 'Unnamed Business'}
            </h2>
            <p className="mt-2 text-sm text-[#6f675c]">
              Account #{customer.id?.slice(0, 8).toUpperCase()}
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
          <Section title="Account Status">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={
                    customer.approved
                      ? 'font-bold text-green-700'
                      : 'font-bold text-orange-600'
                  }
                >
                  {customer.approved ? 'Approved' : 'Pending Approval'}
                </p>
                <p className="mt-1 text-sm text-[#6f675c]">
                  Created {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={onToggle}
                className={
                  customer.approved
                    ? 'border border-[#244f3d] px-4 py-2 text-sm font-bold text-[#244f3d]'
                    : 'bg-[#244f3d] px-4 py-2 text-sm font-bold text-white'
                }
              >
                {customer.approved ? 'Unapprove Customer' : 'Approve Customer'}
              </button>
            </div>
          </Section>

          <Section title="Business Information">
            <InfoGrid
              items={[
                ['Business Name', customer.business_name],
                ['Contact Name', customer.contact_name],
                ['Phone', customer.phone],
                ['Zoho Customer ID', customer.zoho_customer_id],
                ['User ID', customer.user_id],
              ]}
            />
          </Section>

          <Section title="Delivery Information">
            <InfoGrid
              items={[
                ['Address', customer.delivery_address],
                ['City', customer.delivery_city],
                ['Postal Code', customer.delivery_postal_code],
              ]}
            />

            <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Delivery Notes
              </p>
              <p className="mt-2 text-sm">
                {customer.delivery_notes || 'No delivery notes added.'}
              </p>
            </div>
          </Section>

          <Section title="Zoho Invoices">
            {invoiceLoading ? (
              <p className="text-sm text-[#6f675c]">Loading invoices...</p>
            ) : invoiceError ? (
              <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {invoiceError}
              </div>
            ) : !customer.zoho_customer_id ? (
              <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm text-[#6f675c]">
                This customer does not have a Zoho customer ID yet.
              </div>
            ) : invoices.length === 0 ? (
              <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm text-[#6f675c]">
                No invoices found in Zoho for this customer.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard
                    label="Invoices"
                    value={invoices.length.toString()}
                  />
                  <StatCard
                    label="Total Billed"
                    value={formatMoney(totalBilled)}
                  />
                  <StatCard
                    label="Outstanding"
                    value={formatMoney(totalOutstanding)}
                  />
                </div>

                <div className="overflow-hidden border border-[#d6cec0]">
                  <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] bg-[#f4f1ea] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                    <div>Invoice</div>
                    <div>Date</div>
                    <div>Due</div>
                    <div>Status</div>
                    <div className="text-right">Total</div>
                    <div className="text-right">Balance</div>
                  </div>

                  {invoices.map((invoice) => (
                    <div
                      key={invoice.invoice_id}
                      className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.8fr_0.8fr] items-center border-t border-[#eee7da] px-4 py-4 text-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          {invoice.invoice_number || 'Invoice'}
                        </p>

                        {invoice.invoice_id && (
  <a
    href={`/api/admin/invoices/${invoice.invoice_id}/pdf`}
    target="_blank"
    rel="noreferrer"
    className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-[#244f3d] underline"
  >
    View PDF
  </a>
)}
                      </div>

                      <div className="text-[#6f675c]">
                        {invoice.date || '—'}
                      </div>

                      <div className="text-[#6f675c]">
                        {invoice.due_date || '—'}
                      </div>

                      <div>
                        <span className={getStatusClass(invoice.status)}>
                          {invoice.status || '—'}
                        </span>
                      </div>

                      <div className="text-right font-semibold">
                        {formatMoney(invoice.total)}
                      </div>

                      <div className="text-right font-semibold">
                        {formatMoney(invoice.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          <p className="mt-2 break-words font-semibold">{value || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}

function formatMoney(value: any) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(number)
}

function getStatusClass(status: string) {
  const normalized = status?.toLowerCase()

  if (normalized === 'paid') {
    return 'inline-block bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700'
  }

  if (normalized === 'overdue') {
    return 'inline-block bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700'
  }

  if (normalized === 'sent') {
    return 'inline-block bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700'
  }

  return 'inline-block bg-[#f4f1ea] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6f675c]'
}