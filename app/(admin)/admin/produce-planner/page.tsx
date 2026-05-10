'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type SortDirection = 'asc' | 'desc'

type DemandSortKey =
  | 'product_name'
  | 'category'
  | 'total_weekly_cases'
  | 'customers_using'
  | 'avg_cases_per_customer'

type CustomerSortKey =
  | 'customer_name'
  | 'status'
  | 'last_reviewed_at'
  | 'total_weekly_cases'
  | 'product_requests'

type Customer = {
  id: string
  name?: string | null
  business_name?: string | null
  company_name?: string | null
  email?: string | null
}

type ProduceProfile = {
  id: string
  customer_id: string
  status: 'draft' | 'active' | string
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

type DemandRow = {
  item_key: string
  product_name: string
  category: string
  unit: string
  total_weekly_cases: number
  customers_using: number
  avg_cases_per_customer: number
}

type CustomerRow = {
  customer_id: string
  customer_name: string
  email: string
  profile_id: string | null
  status: string
  last_reviewed_at: string | null
  total_weekly_cases: number
  product_requests: number
}

type RequestRow = ProductRequest & {
  customer_name: string
  customer_email: string
}

function getCustomerName(customer: Customer | undefined | null) {
  if (!customer) return 'Unknown customer'

  return (
    customer.business_name ||
    customer.company_name ||
    customer.name ||
    customer.email ||
    'Unnamed customer'
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not reviewed'

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0)
}

function createItemKey(productName: string) {
  return productName
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function compareValues(a: string | number | null, b: string | number | null, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier
  }

  return String(a ?? '').localeCompare(String(b ?? '')) * multiplier
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

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    )
  }

  if (name === 'sort') {
    return (
      <svg {...common}>
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }

  return null
}

export default function AdminProducePlannerPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [profiles, setProfiles] = useState<ProduceProfile[]>([])
  const [items, setItems] = useState<ProduceProfileItem[]>([])
  const [requests, setRequests] = useState<ProductRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [demandSearch, setDemandSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [demandSortKey, setDemandSortKey] = useState<DemandSortKey>('total_weekly_cases')
  const [demandSortDirection, setDemandSortDirection] = useState<SortDirection>('desc')
  const [customerSortKey, setCustomerSortKey] = useState<CustomerSortKey>('total_weekly_cases')
  const [customerSortDirection, setCustomerSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    loadAdminProducePlanner()
  }, [])

  async function loadAdminProducePlanner() {
    setLoading(true)
    setError(null)

    const [customersResult, profilesResult, itemsResult, requestsResult] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('customer_produce_profiles').select('*'),
      supabase.from('customer_produce_profile_items').select('*'),
      supabase.from('produce_product_requests').select('*'),
    ])

    if (customersResult.error) {
      setError('Could not load customers.')
      setLoading(false)
      return
    }

    if (profilesResult.error) {
      setError('Could not load produce profiles.')
      setLoading(false)
      return
    }

    if (itemsResult.error) {
      setError('Could not load produce profile items.')
      setLoading(false)
      return
    }

    if (requestsResult.error) {
      setError('Could not load product requests.')
      setLoading(false)
      return
    }

    setCustomers((customersResult.data || []) as Customer[])
    setProfiles((profilesResult.data || []) as ProduceProfile[])
    setItems((itemsResult.data || []) as ProduceProfileItem[])
    setRequests((requestsResult.data || []) as ProductRequest[])
    setLoading(false)
  }

  async function approveProductRequest(request: RequestRow) {
    const defaultCategory = 'Other Produce'
    const category = window.prompt('Category for this product?', defaultCategory)?.trim()
    if (!category) return

    const unit = window.prompt('Standard unit? Example: 25 lb case')?.trim()
    if (!unit) return

    const itemKey = createItemKey(request.product_name)
    if (!itemKey) {
      setError('Could not create item key for this product request.')
      return
    }

    setApprovingRequestId(request.id)
    setError(null)
    setMessage(null)

    const { error: masterError } = await supabase.from('produce_master_items').upsert(
      {
        item_key: itemKey,
        product_name: request.product_name.trim(),
        category,
        unit,
        is_active: true,
      },
      { onConflict: 'item_key' }
    )

    if (masterError) {
      setError('Could not add product to the master planner.')
      setApprovingRequestId(null)
      return
    }

    const { error: requestError } = await supabase
      .from('produce_product_requests')
      .update({ status: 'approved' })
      .eq('id', request.id)

    if (requestError) {
      setError('Product was added to the master planner, but the request status could not be updated.')
      setApprovingRequestId(null)
      return
    }

    setMessage(`${request.product_name} was added to the master planner.`)
    setApprovingRequestId(null)
    await loadAdminProducePlanner()
  }

  const demandRows = useMemo<DemandRow[]>(() => {
    const map = new Map<string, DemandRow>()

    items.forEach((item) => {
      const qty = toNumber(item.weekly_case_estimate)
      if (qty <= 0) return

      const key = item.item_key
      const existing = map.get(key)

      if (!existing) {
        map.set(key, {
          item_key: key,
          product_name: item.product_name,
          category: item.category,
          unit: item.unit || '',
          total_weekly_cases: qty,
          customers_using: 1,
          avg_cases_per_customer: qty,
        })
        return
      }

      existing.total_weekly_cases += qty
      existing.customers_using += 1
      existing.avg_cases_per_customer = existing.total_weekly_cases / existing.customers_using
    })

    return Array.from(map.values()).map((row) => ({
      ...row,
      total_weekly_cases: Number(row.total_weekly_cases.toFixed(2)),
      avg_cases_per_customer: Number(row.avg_cases_per_customer.toFixed(2)),
    }))
  }, [items])

  const customerRows = useMemo<CustomerRow[]>(() => {
    return customers.map((customer) => {
      const profile = profiles.find((profileItem) => profileItem.customer_id === customer.id)
      const customerItems = items.filter((item) => item.customer_id === customer.id)
      const customerRequests = requests.filter((request) => request.customer_id === customer.id && request.status !== 'approved')
      const totalWeeklyCases = customerItems.reduce((sum, item) => {
        return sum + toNumber(item.weekly_case_estimate)
      }, 0)

      return {
        customer_id: customer.id,
        customer_name: getCustomerName(customer),
        email: customer.email || '',
        profile_id: profile?.id || null,
        status: profile?.status || 'not started',
        last_reviewed_at: profile?.last_reviewed_at || null,
        total_weekly_cases: Number(totalWeeklyCases.toFixed(2)),
        product_requests: customerRequests.length,
      }
    })
  }, [customers, profiles, items, requests])

  const requestRows = useMemo<RequestRow[]>(() => {
    return requests
      .filter((request) => request.status !== 'approved')
      .map((request) => {
        const customer = customers.find((customerItem) => customerItem.id === request.customer_id)

        return {
          ...request,
          customer_name: getCustomerName(customer),
          customer_email: customer?.email || '',
        }
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
  }, [requests, customers])

  const filteredDemandRows = useMemo(() => {
    const query = demandSearch.toLowerCase().trim()

    return demandRows
      .filter((row) => {
        if (!query) return true
        return (
          row.product_name.toLowerCase().includes(query) ||
          row.category.toLowerCase().includes(query) ||
          row.unit.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => compareValues(a[demandSortKey], b[demandSortKey], demandSortDirection))
  }, [demandRows, demandSearch, demandSortKey, demandSortDirection])

  const filteredCustomerRows = useMemo(() => {
    const query = customerSearch.toLowerCase().trim()

    return customerRows
      .filter((row) => {
        if (!query) return true
        return (
          row.customer_name.toLowerCase().includes(query) ||
          row.email.toLowerCase().includes(query) ||
          row.status.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        if (customerSortKey === 'last_reviewed_at') {
          const dateA = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0
          const dateB = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0
          return compareValues(dateA, dateB, customerSortDirection)
        }

        return compareValues(a[customerSortKey], b[customerSortKey], customerSortDirection)
      })
  }, [customerRows, customerSearch, customerSortKey, customerSortDirection])

  const totalCustomersWithProfiles = profiles.length
  const totalWeeklyCases = demandRows.reduce((sum, row) => sum + row.total_weekly_cases, 0)
  const totalActiveProducts = demandRows.length
  const totalProductRequests = requestRows.length

  function toggleDemandSort(key: DemandSortKey) {
    if (demandSortKey === key) {
      setDemandSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
      return
    }

    setDemandSortKey(key)
    setDemandSortDirection('desc')
  }

  function toggleCustomerSort(key: CustomerSortKey) {
    if (customerSortKey === key) {
      setCustomerSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
      return
    }

    setCustomerSortKey(key)
    setCustomerSortDirection('desc')
  }

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
        <section className="mb-6 overflow-hidden border border-lc-border bg-lc-green text-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="mb-5 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <span className="h-1.5 w-1.5 bg-white" />
              Admin Produce Planner
            </div>
            <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
              Produce Demand Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/80 sm:text-base">
              View total standardized produce demand across customers, product requests, and individual customer profiles.
            </p>
          </div>
        </section>

        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 border border-lc-border bg-lc-sand px-4 py-3 text-sm font-medium text-lc-ink">
            {message}
          </div>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <StatCard label="Profiled Customers" value={totalCustomersWithProfiles} />
          <StatCard label="Weekly Cases" value={Number(totalWeeklyCases.toFixed(2))} />
          <StatCard label="Active Products" value={totalActiveProducts} />
          <StatCard label="Open Requests" value={totalProductRequests} />
        </div>

        <section className="lc-card mb-6 overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 border-b border-lc-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-black tracking-tight">Master Produce Demand</h2>
              <p className="mt-1 text-sm text-lc-muted">
                Total and average standard weekly case demand across all customer produce profiles.
              </p>
            </div>

            <input
              value={demandSearch}
              onChange={(event) => setDemandSearch(event.target.value)}
              placeholder="Search products..."
              className="input bg-white sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-lc-border bg-lc-bg text-xs uppercase tracking-[0.14em] text-lc-muted">
                <tr>
                  <SortableHeader label="Product" onClick={() => toggleDemandSort('product_name')} />
                  <SortableHeader label="Category" onClick={() => toggleDemandSort('category')} />
                  <th className="px-5 py-3 font-black">Unit</th>
                  <SortableHeader label="Total Cases" onClick={() => toggleDemandSort('total_weekly_cases')} align="right" />
                  <SortableHeader label="Customers" onClick={() => toggleDemandSort('customers_using')} align="right" />
                  <SortableHeader label="Avg / Customer" onClick={() => toggleDemandSort('avg_cases_per_customer')} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-lc-border">
                {filteredDemandRows.map((row) => (
                  <tr key={row.item_key} className="bg-white hover:bg-lc-bg/60">
                    <td className="px-5 py-4 font-bold">{row.product_name}</td>
                    <td className="px-5 py-4 text-lc-muted">{row.category}</td>
                    <td className="px-5 py-4 text-lc-muted">{row.unit}</td>
                    <td className="px-5 py-4 text-right font-black">{row.total_weekly_cases}</td>
                    <td className="px-5 py-4 text-right">{row.customers_using}</td>
                    <td className="px-5 py-4 text-right">{row.avg_cases_per_customer}</td>
                  </tr>
                ))}

                {filteredDemandRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-lc-muted">
                      No produce demand found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lc-card mb-6 overflow-hidden shadow-sm">
          <div className="border-b border-lc-border p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-tight">All Product Requests</h2>
            <p className="mt-1 text-sm text-lc-muted">
              Approving a request adds it to the master planner table and makes it available to customer produce profiles.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {requestRows.map((request) => (
              <div key={request.id} className="border border-lc-border bg-lc-bg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-lc-muted">
                      {request.customer_name}
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
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-lc-muted">
                    {request.notes}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-lc-border pt-3 text-xs font-bold text-lc-muted">
                  <span>{formatDate(request.created_at)}</span>
                  <Link
                    href={`/admin/produce-planner/${request.customer_id}`}
                    className="inline-flex items-center text-lc-green transition hover:text-lc-green-soft"
                  >
                    View customer <Icon name="arrow" className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>

                <button
                  type="button"
                  disabled={approvingRequestId === request.id}
                  onClick={() => approveProductRequest(request)}
                  className="mt-4 inline-flex w-full items-center justify-center border border-lc-green bg-white px-3 py-2 text-xs font-black text-lc-green transition hover:bg-lc-green hover:text-white disabled:opacity-50"
                >
                  <Icon name="check" className="mr-2 h-3.5 w-3.5" />
                  {approvingRequestId === request.id ? 'Adding...' : 'Add to Planner'}
                </button>
              </div>
            ))}

            {requestRows.length === 0 && (
              <div className="border border-dashed border-lc-border bg-lc-bg p-5 text-sm text-lc-muted sm:col-span-2 lg:col-span-3">
                No open product requests.
              </div>
            )}
          </div>
        </section>

        <section className="lc-card overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 border-b border-lc-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-black tracking-tight">Customer Produce Profiles</h2>
              <p className="mt-1 text-sm text-lc-muted">
                Sort by customer, status, last reviewed, case volume, or open product requests.
              </p>
            </div>

            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search customers..."
              className="input bg-white sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-lc-border bg-lc-bg text-xs uppercase tracking-[0.14em] text-lc-muted">
                <tr>
                  <SortableHeader label="Customer" onClick={() => toggleCustomerSort('customer_name')} />
                  <SortableHeader label="Status" onClick={() => toggleCustomerSort('status')} />
                  <SortableHeader label="Last Reviewed" onClick={() => toggleCustomerSort('last_reviewed_at')} />
                  <SortableHeader label="Weekly Cases" onClick={() => toggleCustomerSort('total_weekly_cases')} align="right" />
                  <SortableHeader label="Requests" onClick={() => toggleCustomerSort('product_requests')} align="right" />
                  <th className="px-5 py-3 text-right font-black">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lc-border">
                {filteredCustomerRows.map((row) => (
                  <tr key={row.customer_id} className="bg-white hover:bg-lc-bg/60">
                    <td className="px-5 py-4">
                      <p className="font-bold">{row.customer_name}</p>
                      {row.email && <p className="mt-0.5 text-xs text-lc-muted">{row.email}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-lc-sand px-2.5 py-1 text-xs font-bold capitalize text-lc-green">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-lc-muted">{formatDate(row.last_reviewed_at)}</td>
                    <td className="px-5 py-4 text-right font-black">{row.total_weekly_cases}</td>
                    <td className="px-5 py-4 text-right">{row.product_requests}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/produce-planner/${row.customer_id}`}
                        className="inline-flex items-center border border-lc-green px-3 py-1.5 text-xs font-black text-lc-green transition hover:bg-lc-green hover:text-white"
                      >
                        View
                        <Icon name="arrow" className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredCustomerRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-lc-muted">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
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

function SortableHeader({
  label,
  onClick,
  align = 'left',
}: {
  label: string
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <th className={`px-5 py-3 font-black ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition hover:text-lc-green ${
          align === 'right' ? 'justify-end' : 'justify-start'
        }`}
      >
        {label}
        <Icon name="sort" className="h-3.5 w-3.5" />
      </button>
    </th>
  )
}
