'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ProducerCustomer = {
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
}

type ProducerOrderItem = {
  id: string
  order_id: string
  created_at: string
  line_total: number | null
  po_status: string | null
  zoho_purchaseorder_id: string | null
  hidden?: boolean | null
  buyer_business_name?: string | null
  buyer_contact_name?: string | null
  order_submitted_at?: string | null
}

export default function ProducerAccountPage() {
  const [tab, setTab] = useState<'account' | 'finance'>('account')
  const [producer, setProducer] = useState<ProducerCustomer | null>(null)
  const [financeItems, setFinanceItems] = useState<ProducerOrderItem[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [memberRole] = useState('admin')

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

      const { data: producerData, error: producerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (producerError || !producerData) {
        console.error('Producer customer lookup failed:', producerError)
        setLoading(false)
        return
      }

      setProducer(producerData)

      const { data: poData, error: poError } = await supabase
        .from('producer_order_items')
        .select(`
          id,
          order_id,
          created_at,
          line_total,
          po_status,
          zoho_purchaseorder_id,
          hidden,
          buyer_business_name,
          buyer_contact_name,
          order_submitted_at
        `)
        .order('created_at', { ascending: false })

      if (poError) {
        console.warn('Producer finance lookup failed:', poError)
        setFinanceItems([])
      } else {
        setFinanceItems(poData || [])
      }

      setLoading(false)
    }

    loadAccount()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
        Loading producer account...
      </div>
    )
  }

  const contactParts = producer?.contact_name?.split(' ') || []
  const firstName = contactParts[0] || '—'
  const lastName = contactParts.slice(1).join(' ') || '—'

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Producer Portal
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Producer Account
          </h1>

          <p className="mt-1 text-sm font-medium text-[#6f675c]">
            Welcome back, {firstName}
          </p>
        </div>

        <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
          <div className="grid grid-cols-1 border-b border-[#d6cec0] sm:grid-cols-2">
            <TabButton
              label="Account Information"
              active={tab === 'account'}
              onClick={() => setTab('account')}
            />

            <TabButton
              label="$ Finance"
              active={tab === 'finance'}
              onClick={() => setTab('finance')}
            />
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'account' && (
              <ProducerAccountInfo
                producer={producer}
                setProducer={setProducer}
                email={email}
                firstName={firstName}
                lastName={lastName}
                memberRole={memberRole}
              />
            )}

            {tab === 'finance' && <ProducerFinance items={financeItems} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProducerAccountInfo({
  producer,
  setProducer,
  email,
  firstName,
  lastName,
  memberRole,
}: {
  producer: ProducerCustomer | null
  setProducer: (producer: ProducerCustomer) => void
  email: string
  firstName: string
  lastName: string
  memberRole: string
}) {
  return (
    <div className="space-y-5">
      <Section title="Personal Information">
        <InfoGrid
          items={[
            ['First Name', firstName],
            ['Last Name', lastName],
            ['Email', email],
            ['Phone', producer?.phone || '—'],
          ]}
        />
      </Section>

      <Section title="Business Information">
        <InfoGrid
          items={[
            ['Business Name', producer?.business_name || '—'],
            ['Account Status', producer?.approved ? 'Approved' : 'Pending Approval'],
            ['Producer Number', producer?.id?.slice(0, 8).toUpperCase() || '—'],
            [
              'Member Since',
              producer?.created_at
                ? new Date(producer.created_at).toLocaleDateString()
                : '—',
            ],
            ['Role', memberRole],
          ]}
        />
      </Section>

      <EditableAddressSection
        producer={producer}
        onUpdated={setProducer}
        memberRole={memberRole}
      />

      <PasswordResetSection email={email} />

      <ProducerTeamAccessSection memberRole={memberRole} />
    </div>
  )
}

function ProducerFinance({ items }: { items: ProducerOrderItem[] }) {
  const visibleItems = items.filter((item) => !item.hidden)

  const groupedPOs = useMemo(() => {
    const groups: Record<string, any> = {}

    for (const item of visibleItems) {
      const orderId = item.order_id

      if (!groups[orderId]) {
        groups[orderId] = {
          order_id: orderId,
          buyer_business_name: item.buyer_business_name || 'Buyer Account',
          buyer_contact_name: item.buyer_contact_name || null,
          created_at: item.order_submitted_at || item.created_at,
          po_status: item.po_status,
          zoho_purchaseorder_id: item.zoho_purchaseorder_id,
          total: 0,
          items: [],
        }
      }

      groups[orderId].items.push(item)
      groups[orderId].total += Number(item.line_total || 0)

      if (!groups[orderId].zoho_purchaseorder_id && item.zoho_purchaseorder_id) {
        groups[orderId].zoho_purchaseorder_id = item.zoho_purchaseorder_id
      }

      if (item.po_status === 'created') {
        groups[orderId].po_status = 'created'
      }

      if (
        item.po_status === 'failed' &&
        groups[orderId].po_status !== 'created'
      ) {
        groups[orderId].po_status = 'failed'
      }
    }

    return Object.values(groups)
  }, [visibleItems])

  const totalPOValue = visibleItems.reduce((sum, item) => {
    return sum + Number(item.line_total || 0)
  }, 0)

  const createdPOCount = groupedPOs.filter((po: any) => {
    return po.po_status === 'created' || po.zoho_purchaseorder_id
  }).length

  const pendingValue = groupedPOs.reduce((sum: number, po: any) => {
    if (po.po_status === 'created' || po.zoho_purchaseorder_id) return sum
    return sum + Number(po.total || 0)
  }, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
  <FinanceCard
    title="Total Sales"
    value={formatMoney(totalPOValue)}
  />

  <FinanceCard
    title="POs Created"
    value={String(createdPOCount)}
    success
  />
</div>

      <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
        <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
          <h2 className="text-lg font-black text-white">Purchase Orders</h2>
          <p className="mt-1 text-sm font-medium text-white/75">
            View purchase orders and order totals attached to your producer account.
          </p>
        </div>

        {groupedPOs.length === 0 ? (
          <div className="p-5 text-sm font-medium text-[#6f675c]">
            No purchase orders available yet.
          </div>
        ) : (
          <div className="divide-y divide-[#eee7da]">
            {groupedPOs.map((po: any) => {
              const purchaseOrderUrl = po.zoho_purchaseorder_id
                ? `/api/producer/purchase-orders/${po.zoho_purchaseorder_id}/pdf`
                : ''

              return (
                <div key={po.order_id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-xs font-black">
                        ORDER #{po.order_id.slice(0, 8).toUpperCase()}
                      </p>

                      <h3 className="mt-2 text-xl font-black tracking-[-0.03em]">
                        {po.buyer_business_name}
                      </h3>

                      {po.buyer_contact_name && (
                        <p className="mt-1 text-sm font-semibold text-[#6f675c]">
                          {po.buyer_contact_name}
                        </p>
                      )}

                      <p className="mt-1 text-xs font-medium text-[#6f675c]">
                        Submitted {formatDateTime(po.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={getPoStatusClass(po)}>
                        {getPoStatusLabel(po)}
                      </span>

                      {purchaseOrderUrl && (
                        <a
                          href={purchaseOrderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#244f3d] bg-[#244f3d] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#1d1d1b]"
                        >
                          View PO
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="PO Total" value={formatMoney(po.total)} />
                    <MiniStat label="Items" value={String(po.items.length)} />
                    <MiniStat
                      label="Zoho PO"
                      value={po.zoho_purchaseorder_id ? 'Created' : 'Not created yet'}
                      success={Boolean(po.zoho_purchaseorder_id)}
                      danger={!po.zoho_purchaseorder_id}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EditableAddressSection({
  producer,
  onUpdated,
  memberRole,
}: {
  producer: ProducerCustomer | null
  onUpdated: (producer: ProducerCustomer) => void
  memberRole: string
}) {
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState(producer?.delivery_address || '')
  const [city, setCity] = useState(producer?.delivery_city || '')
  const [postalCode, setPostalCode] = useState(
    producer?.delivery_postal_code || ''
  )
  const [notes, setNotes] = useState(producer?.delivery_notes || '')
  const [saving, setSaving] = useState(false)

  const canEdit = memberRole === 'admin'

  async function handleSave() {
    if (!producer || !canEdit) return

    setSaving(true)

    const { data, error } = await supabase
      .from('customers')
      .update({
        delivery_address: address,
        delivery_city: city,
        delivery_postal_code: postalCode,
        delivery_notes: notes,
      })
      .eq('id', producer.id)
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
    <Section title="Address">
      {!editing ? (
        <div className="text-sm">
          <p className="font-black">
            {producer?.delivery_address || 'No address on file'}
          </p>

          {(producer?.delivery_city || producer?.delivery_postal_code) && (
            <p className="mt-1 font-medium text-[#6f675c]">
              {producer?.delivery_city || '—'}, BC{' '}
              {producer?.delivery_postal_code || ''}
            </p>
          )}

          <div className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-[#6f675c]">
            <p className="text-xs font-black uppercase tracking-wide">Notes</p>
            <p className="mt-2 leading-5">
              {producer?.delivery_notes || 'No notes added yet.'}
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 w-full border border-[#244f3d] px-4 py-3 text-sm font-black text-[#244f3d] hover:bg-[#f4f1ea] sm:w-auto"
            >
              Edit Address
            </button>
          )}
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
            placeholder="Pickup notes, farm gate instructions, loading details..."
            className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <div className="grid gap-3 sm:flex">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Address'}
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

function PasswordResetSection({ email }: { email: string }) {
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function sendPasswordReset() {
    setSuccess('')
    setErrorMessage('')

    if (!email) {
      setErrorMessage('No email found for this account.')
      return
    }

    setSending(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setSending(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setSuccess('Password reset email sent. Check your inbox.')
  }

  return (
    <Section title="Password & Security">
      <div className="space-y-4">
        <p className="text-sm font-medium leading-6 text-[#6f675c]">
          Send yourself a secure password reset email.
        </p>

        <div className="border border-[#eee7da] bg-[#f4f1ea] p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
            Account Email
          </p>
          <p className="mt-1 break-words font-black">{email || '—'}</p>
        </div>

        <button
          type="button"
          onClick={sendPasswordReset}
          disabled={sending || !email}
          className="w-full bg-[#244f3d] px-4 py-3 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
        >
          {sending ? 'Sending Reset Email...' : 'Send Password Reset Email'}
        </button>

        {success && (
          <div className="border border-[#244f3d] bg-[#eef5f0] p-4 text-sm font-bold text-[#244f3d]">
            {success}
          </div>
        )}

        {errorMessage && (
          <div className="border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
    </Section>
  )
}

function ProducerTeamAccessSection({ memberRole }: { memberRole: string }) {
  return (
    <Section title="Team Access">
      <div className="space-y-4">
        <p className="text-sm font-medium leading-6 text-[#6f675c]">
          Team access is currently limited to admin users.
        </p>

        <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
            Current Access Level
          </p>
          <p className="mt-1 font-black">{memberRole || 'admin'}</p>
        </div>
      </div>
    </Section>
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
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-b border-[#d6cec0] px-4 py-4 text-left text-sm font-black transition sm:text-center ${
        disabled
          ? 'cursor-not-allowed bg-[#f4f1ea] text-[#b0a79a] opacity-60'
          : active
            ? 'bg-[#244f3d] text-white'
            : 'bg-white text-[#6f675c] hover:bg-[#f4f1ea]'
      }`}
    >
      {label}
    </button>
  )
}

function getPoStatusLabel(po: any) {
  if (po.zoho_purchaseorder_id || po.po_status === 'created') return 'PO Created'
  if (po.po_status === 'failed') return 'PO Failed'
  return 'Pending PO'
}

function getPoStatusClass(po: any) {
  if (po.zoho_purchaseorder_id || po.po_status === 'created') {
    return 'border border-green-700 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-700'
  }

  if (po.po_status === 'failed') {
    return 'border border-red-700 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-700'
  }

  return 'border border-yellow-700 bg-yellow-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-yellow-700'
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