'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  name?: string | null
  business_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
}

type ProduceProfile = {
  id: string
  customer_id: string
  status: string
  notes: string | null
  last_reviewed_at: string | null
  updated_at?: string | null
}

type ProduceProfileItem = {
  id: string
  profile_id: string
  customer_id: string
  category: string
  item_key: string
  product_name: string
  unit: string | null
  weekly_case_estimate: number | string | null
  flexible_substitution: boolean | null
}

type ProductRequest = {
  id: string
  profile_id: string | null
  customer_id: string
  product_name: string
  expected_use: string | null
  notes: string | null
  status: string
  created_at?: string | null
}

type CategoryGroup = {
  category: string
  totalCases: number
  flexible: boolean
  items: ProduceProfileItem[]
}

function getCustomerName(customer: Customer | null) {
  if (!customer) return 'Customer'

  return (
    customer.business_name ||
    customer.company_name ||
    customer.name ||
    customer.email ||
    'Unnamed customer'
  )
}

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not reviewed'

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'arrow-left') {
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    )
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    )
  }

  return null
}

export default function AdminCustomerProducePlannerPage() {
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [profile, setProfile] = useState<ProduceProfile | null>(null)
  const [items, setItems] = useState<ProduceProfileItem[]>([])
  const [requests, setRequests] = useState<ProductRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customerId) loadCustomerProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  async function loadCustomerProfile() {
    setLoading(true)
    setError(null)

  const { data: customerData, error: customerError } = await supabase
  .from('customers')
  .select('*')
  .eq('id', customerId)
  .single()

if (customerError || !customerData) {
  setError('Could not load customer.')
  setLoading(false)
  return
}

setCustomer(customerData as Customer)

    const { data: profileData, error: profileError } = await supabase
      .from('customer_produce_profiles')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (profileError) {
      setError('Could not load produce profile.')
      setLoading(false)
      return
    }

    if (!profileData) {
      setProfile(null)
      setItems([])
      setRequests([])
      setLoading(false)
      return
    }

    setProfile(profileData as ProduceProfile)

    const { data: itemData, error: itemError } = await supabase
      .from('customer_produce_profile_items')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('category', { ascending: true })
      .order('product_name', { ascending: true })

    if (itemError) {
      setError('Could not load profile items.')
      setLoading(false)
      return
    }

    const { data: requestData, error: requestError } = await supabase
      .from('produce_product_requests')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false })

    if (requestError) {
      setError('Could not load product requests.')
      setLoading(false)
      return
    }

    setItems((itemData || []) as ProduceProfileItem[])
    setRequests((requestData || []) as ProductRequest[])
    setLoading(false)
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => toNumber(item.weekly_case_estimate) > 0)
  }, [items])

  const totalCases = useMemo(() => {
    return visibleItems.reduce((sum, item) => sum + toNumber(item.weekly_case_estimate), 0)
  }, [visibleItems])

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup>()

    visibleItems.forEach((item) => {
      const existing = map.get(item.category)
      const qty = toNumber(item.weekly_case_estimate)

      if (!existing) {
        map.set(item.category, {
          category: item.category,
          totalCases: qty,
          flexible: item.flexible_substitution ?? true,
          items: [item],
        })
        return
      }

      existing.totalCases += qty
      existing.items.push(item)
      existing.flexible = existing.flexible && (item.flexible_substitution ?? true)
    })

    return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category))
  }, [visibleItems])

  if (loading) {
    return (
      <main className="min-h-screen bg-lc-bg py-8 text-lc-ink">
        <div className="lc-container">
          <div className="lc-card p-6 shadow-sm">
            <div className="h-4 w-40 animate-pulse bg-lc-sand" />
            <div className="mt-4 h-32 animate-pulse bg-lc-bg" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lc-bg text-lc-ink">
      <div className="lc-container py-6">
        <div className="mb-4">
          <Link
            href="/admin/produce-planner"
            className="inline-flex items-center text-sm font-black text-lc-green transition hover:text-lc-green-soft"
          >
            <Icon name="arrow-left" className="mr-2 h-4 w-4" />
            Back to Produce Planner
          </Link>
        </div>

        <section className="mb-6 overflow-hidden border border-lc-border bg-lc-green text-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                <span className="h-1.5 w-1.5 bg-white" />
                Customer Produce Profile
              </div>

              <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
                {getCustomerName(customer)}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
                {customer?.email && <span>{customer.email}</span>}
                {customer?.phone && <span>{customer.phone}</span>}
              </div>
            </div>

            <div className="border-t border-white/15 bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                    Last Reviewed
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {formatDate(profile?.last_reviewed_at)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/15 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">Status</p>
                    <p className="mt-1 font-bold capitalize">{profile?.status || 'Not started'}</p>
                  </div>
                  <div className="border border-white/15 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">Cases</p>
                    <p className="mt-1 font-bold">{Number(totalCases.toFixed(2))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {!profile && (
          <section className="lc-card p-6 text-center shadow-sm">
            <h2 className="text-xl font-black tracking-tight">No produce profile yet</h2>
            <p className="mt-2 text-sm text-lc-muted">
              This customer has not filled out their standard weekly produce usage yet.
            </p>
          </section>
        )}

        {profile && (
          <>
            <div className="mb-5 grid gap-4 md:grid-cols-4">
              <StatCard label="Weekly Cases" value={Number(totalCases.toFixed(2))} />
              <StatCard label="Categories Used" value={categoryGroups.length} />
              <StatCard label="Products Used" value={visibleItems.length} />
              <StatCard label="Requests" value={requests.length} />
            </div>

            <section className="lc-card mb-6 p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Profile Notes</h2>
                  <p className="mt-1 text-sm text-lc-muted">
                    Customer-specific context for menu style, substitutions, or seasonality.
                  </p>
                </div>
              </div>

              <div className="mt-4 border border-lc-border bg-lc-bg p-4 text-sm leading-6 text-lc-ink">
                {profile.notes || 'No profile notes added.'}
              </div>
            </section>

            <section className="mb-6 space-y-4">
              {categoryGroups.map((group) => (
                <div key={group.category} className="lc-card overflow-hidden shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-lc-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">{group.category}</h2>
                        <span className="bg-lc-sand px-2.5 py-1 text-xs font-bold text-lc-green">
                          {Number(group.totalCases.toFixed(2))} cases / week
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-lc-muted">
                        Substitutions: {group.flexible ? 'Flexible' : 'Specific items only'}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-lc-border bg-lc-bg text-xs uppercase tracking-[0.14em] text-lc-muted">
                        <tr>
                          <th className="px-5 py-3 font-black">Product</th>
                          <th className="px-5 py-3 font-black">Unit</th>
                          <th className="px-5 py-3 text-right font-black">Cases / Week</th>
                          <th className="px-5 py-3 text-right font-black">Substitution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lc-border">
                        {group.items.map((item) => (
                          <tr key={item.id} className="bg-white hover:bg-lc-bg/60">
                            <td className="px-5 py-4 font-bold">{item.product_name}</td>
                            <td className="px-5 py-4 text-lc-muted">{item.unit || ''}</td>
                            <td className="px-5 py-4 text-right font-black">
                              {toNumber(item.weekly_case_estimate)}
                            </td>
                            <td className="px-5 py-4 text-right text-lc-muted">
                              {item.flexible_substitution ? 'Flexible' : 'Exact'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {categoryGroups.length === 0 && (
                <div className="lc-card p-6 text-center text-sm text-lc-muted shadow-sm">
                  This customer has a profile, but no active produce quantities yet.
                </div>
              )}
            </section>

            <section className="lc-card overflow-hidden shadow-sm">
              <div className="border-b border-lc-border p-5 sm:p-6">
                <h2 className="text-xl font-black tracking-tight">Product Requests</h2>
                <p className="mt-1 text-sm text-lc-muted">
                  These do not count toward standardized demand until you approve and add them to the master guide.
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {requests.map((request) => (
                  <div key={request.id} className="border border-lc-border bg-lc-bg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-lc-muted">
                          Product Request
                        </p>
                        <h3 className="mt-2 text-lg font-black tracking-tight text-lc-ink">
                          {request.product_name}
                        </h3>
                      </div>
                      <span className="bg-lc-sand px-2.5 py-1 text-xs font-bold capitalize text-lc-green">
                        {request.status || 'new'}
                      </span>
                    </div>

                    {request.expected_use && (
                      <p className="mt-3 text-sm text-lc-muted">
                        <span className="font-bold text-lc-ink">Use:</span> {request.expected_use}
                      </p>
                    )}

                    {request.notes && (
                      <p className="mt-2 text-sm leading-6 text-lc-muted">{request.notes}</p>
                    )}

                    <div className="mt-4 border-t border-lc-border pt-3 text-xs font-bold text-lc-muted">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                ))}

                {requests.length === 0 && (
                  <div className="border border-dashed border-lc-border bg-lc-bg p-5 text-sm text-lc-muted sm:col-span-2 lg:col-span-3">
                    No product requests.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="lc-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-lc-muted">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
    </div>
  )
}
