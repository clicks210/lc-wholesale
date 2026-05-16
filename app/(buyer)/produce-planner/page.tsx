'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ProfileStatus = 'draft' | 'active'
type ProduceItem = [id: string, name: string, unit: string]

type ProduceCategory = {
  name: string
  helper: string
  items: ProduceItem[]
}

type MasterProduceItem = {
  id: string
  item_key: string
  product_name: string
  category: string
  unit: string
  is_active: boolean | null
}

type ProductRequest = {
  id: string
  product_name: string
  expected_use: string
  notes: string
}

type ExistingProfile = {
  id: string
  status: ProfileStatus
  notes: string | null
  last_reviewed_at: string | null
}

const CATEGORY_HELPERS: Record<string, string> = {
  'Leafy Greens': 'Lettuces, greens, salad mix, and cooking greens.',
  'Tomatoes & Cucumbers': 'Core vine crops and salad vegetables.',
  'Potatoes & Roots': 'High-volume storage crops and staple roots.',
  'Alliums & Herbs': 'Onions, garlic, and fresh herbs.',
  Brassicas: 'Cabbage, broccoli, cauliflower, and celery.',
  'Peppers & Squash': 'Peppers, zucchini, squash, and similar market crops.',
  'Fruit & Seasonal': 'Seasonal market items and special requests.',
}

const DEFAULT_CATEGORIES: ProduceCategory[] = [
  {
    name: 'Leafy Greens',
    helper: CATEGORY_HELPERS['Leafy Greens'],
    items: [
      ['romaine', 'Romaine Lettuce', '24 ct case'],
      ['iceberg', 'Iceberg Lettuce', '24 ct case'],
      ['romaine-hearts', 'Romaine Hearts', '12/3 ct case'],
      ['arugula', 'Arugula', '4 lb case'],
      ['spring-mix', 'Spring Mix', '3 lb tub'],
      ['spinach', 'Baby Spinach', '10 lb case'],
    ],
  },
  {
    name: 'Tomatoes & Cucumbers',
    helper: CATEGORY_HELPERS['Tomatoes & Cucumbers'],
    items: [
      ['roma-tomatoes', 'Roma Tomatoes', '25 lb case'],
      ['field-tomatoes', 'Field Tomatoes', '25 lb case'],
      ['cherry-tomatoes', 'Cherry Tomatoes', '12/1 pt case'],
      ['grape-tomatoes', 'Grape Tomatoes', '12/1 pt case'],
      ['english-cucumbers', 'English Cucumbers', '20 lb case'],
    ],
  },
  {
    name: 'Potatoes & Roots',
    helper: CATEGORY_HELPERS['Potatoes & Roots'],
    items: [
      ['russets', 'Russet Potatoes', '50 lb case'],
      ['red-potatoes', 'Red Potatoes', '50 lb sack'],
      ['yellow-potatoes', 'Yellow Potatoes', '50 lb case'],
      ['fingerlings', 'Fingerling Potatoes', '20 lb carton'],
      ['carrots', 'Jumbo Carrots', '50 lb sack'],
      ['beets', 'Red Beets', '25 lb sack'],
    ],
  },
  {
    name: 'Alliums & Herbs',
    helper: CATEGORY_HELPERS['Alliums & Herbs'],
    items: [
      ['yellow-onions', 'Yellow Onions', '50 lb sack'],
      ['red-onions', 'Red Onions', '25 lb sack'],
      ['garlic', 'White Garlic', '30 lb carton'],
      ['green-onion', 'Green Onion', '48 bunch case'],
      ['parsley', 'Parsley', '30 bunch case'],
      ['cilantro', 'Cilantro', '30 bunch case'],
      ['basil', 'Basil', '12 bunch case'],
    ],
  },
  {
    name: 'Brassicas',
    helper: CATEGORY_HELPERS.Brassicas,
    items: [
      ['green-cabbage', 'Green Cabbage', '45 lb case'],
      ['broccoli', 'Broccoli', '14 ct case'],
      ['cauliflower', 'Cauliflower', '12 ct case'],
      ['celery', 'Celery', '24 ct case'],
    ],
  },
  {
    name: 'Peppers & Squash',
    helper: CATEGORY_HELPERS['Peppers & Squash'],
    items: [
      ['green-peppers', 'Green Bell Peppers', '28 lb bushel'],
      ['red-peppers', 'Red Bell Peppers', '28 lb bushel'],
      ['mixed-peppers', 'Mixed Bell Peppers', '28 lb bushel'],
      ['zucchini', 'Medium Zucchini', '20 lb box'],
    ],
  },
  {
    name: 'Fruit & Seasonal',
    helper: CATEGORY_HELPERS['Fruit & Seasonal'],
    items: [
      ['apples', 'Apples', '40 lb box'],
      ['asparagus', 'Asparagus', '11 lb case'],
    ],
  },
]

const QTY_OPTIONS = [0, 1, 2, 3, 5]

function buildCategoriesFromMasterItems(masterItems: MasterProduceItem[]) {
  if (masterItems.length === 0) return DEFAULT_CATEGORIES

  const grouped = new Map<string, ProduceCategory>()

  masterItems.forEach((item) => {
    const categoryName = item.category || 'Other Produce'
    const existing = grouped.get(categoryName)
    const produceItem: ProduceItem = [item.item_key, item.product_name, item.unit]

    if (!existing) {
      grouped.set(categoryName, {
        name: categoryName,
        helper: CATEGORY_HELPERS[categoryName] || 'Standard weekly produce usage.',
        items: [produceItem],
      })
      return
    }

    existing.items.push(produceItem)
  })

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function buildInitialQuantities(categories: ProduceCategory[]) {
  const starter: Record<string, number> = {}

  categories.forEach((category) => {
    category.items.forEach(([id]) => {
      starter[id] = 0
    })
  })

  return starter
}

function buildInitialFlex(categories: ProduceCategory[]) {
  return Object.fromEntries(
    categories.map((category) => [category.name, true])
  ) as Record<string, boolean>
}

function buildInitialOpen(categories: ProduceCategory[]) {
  return Object.fromEntries(
    categories.map((category) => [category.name, true])
  ) as Record<string, boolean>
}

function calculateTotalCases(quantities: Record<string, number>) {
  return Object.values(quantities).reduce((sum, value) => sum + Number(value || 0), 0)
}

function createProductRequest(): ProductRequest {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `request-${Date.now()}-${Math.random()}`

  return {
    id,
    product_name: '',
    expected_use: '',
    notes: '',
  }
}

function formatReviewDate(value: string | null) {
  if (!value) return 'Not reviewed yet'

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

  if (name === 'plus') {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    )
  }

  if (name === 'trash') {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M6 6l1 14h10l1-14" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    )
  }

  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    )
  }

  if (name === 'save') {
    return (
      <svg {...common}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </svg>
    )
  }

  if (name === 'send') {
    return (
      <svg {...common}>
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4z" />
      </svg>
    )
  }

  return null
}

export default function ProduceProfilePage() {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [status, setStatus] = useState<ProfileStatus>('draft')
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProduceCategory[]>(DEFAULT_CATEGORIES)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    buildInitialQuantities(DEFAULT_CATEGORIES)
  )
  const [flex, setFlex] = useState<Record<string, boolean>>(() =>
    buildInitialFlex(DEFAULT_CATEGORIES)
  )
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    buildInitialOpen(DEFAULT_CATEGORIES)
  )
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const totalCases = useMemo(() => calculateTotalCases(quantities), [quantities])
  const statusLabel = status === 'active' ? 'Active' : 'Draft'

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    setLoading(true)
    setMessage(null)

    const { data: masterItems, error: masterItemsError } = await supabase
      .from('produce_master_items')
      .select('id, item_key, product_name, category, unit, is_active')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('product_name', { ascending: true })

    if (masterItemsError) {
      setMessage('Could not load master produce guide. Using default guide for now.')
    }

    const nextCategories = buildCategoriesFromMasterItems(
      !masterItemsError && masterItems ? (masterItems as MasterProduceItem[]) : []
    )

    setCategories(nextCategories)

    const nextQuantities = buildInitialQuantities(nextCategories)
    const nextFlex = buildInitialFlex(nextCategories)
    const nextOpen = buildInitialOpen(nextCategories)

    setQuantities(nextQuantities)
    setFlex(nextFlex)
    setOpen(nextOpen)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('You need to be logged in to manage your produce profile.')
      setLoading(false)
      return
    }

    const { data: membership, error: membershipError } = await supabase
  .from('customer_members')
  .select('customer_id, role')
  .eq('user_id', user.id)
  .single()

if (membershipError || !membership?.customer_id) {
  setMessage('No customer profile found for this user.')
  setLoading(false)
  return
}

setCustomerId(membership.customer_id)

    const { data: existing, error: profileError } = await supabase
      .from('customer_produce_profiles')
      .select('id, status, notes, last_reviewed_at')
      .eq('customer_id', membership.customer_id)
      .maybeSingle<ExistingProfile>()

    if (profileError) {
      setMessage('Could not load produce profile.')
      setLoading(false)
      return
    }

    if (!existing) {
      setLoading(false)
      return
    }

    setProfileId(existing.id)
    setStatus(existing.status)
    setNotes(existing.notes || '')
    setLastReviewedAt(existing.last_reviewed_at)

    const { data: items, error: itemsError } = await supabase
      .from('customer_produce_profile_items')
      .select('*')
      .eq('profile_id', existing.id)

    if (itemsError) {
      setMessage('Could not load profile items.')
      setLoading(false)
      return
    }

    const { data: requests, error: requestsError } = await supabase
      .from('produce_product_requests')
      .select('*')
      .eq('profile_id', existing.id)
      .neq('status', 'approved')
      .order('created_at', { ascending: true })

    if (requestsError) {
      setMessage('Could not load product requests.')
      setLoading(false)
      return
    }

    const loadedQuantities = { ...nextQuantities }
    const loadedFlex = { ...nextFlex }

    items?.forEach((item) => {
      if (item.item_key && item.item_key in loadedQuantities) {
        loadedQuantities[item.item_key] = Number(item.weekly_case_estimate || 0)
      }

      if (item.category) {
        loadedFlex[item.category] = item.flexible_substitution ?? true
      }
    })

    setQuantities(loadedQuantities)
    setFlex(loadedFlex)
    setProductRequests(
      requests?.map((request) => ({
        id: request.id,
        product_name: request.product_name || '',
        expected_use: request.expected_use || '',
        notes: request.notes || '',
      })) || []
    )

    setLoading(false)
  }

  async function saveProfile(nextStatus: ProfileStatus) {
    if (!customerId) {
      setMessage('No customer profile found for this user.')
      return
    }

    setSaving(true)
    setMessage(null)

    const now = new Date().toISOString()

    const { data: profile, error: profileError } = await supabase
      .from('customer_produce_profiles')
      .upsert(
        {
          id: profileId || undefined,
          customer_id: customerId,
          status: nextStatus,
          notes,
          last_reviewed_at: now,
          updated_at: now,
        },
        { onConflict: 'customer_id' }
      )
      .select('id, last_reviewed_at')
      .single()

    if (profileError || !profile?.id) {
      setMessage('Could not save produce profile.')
      setSaving(false)
      return
    }

    setProfileId(profile.id)
    setLastReviewedAt(profile.last_reviewed_at)

    const { error: deleteItemsError } = await supabase
      .from('customer_produce_profile_items')
      .delete()
      .eq('profile_id', profile.id)

    if (deleteItemsError) {
      setMessage('Could not refresh profile items.')
      setSaving(false)
      return
    }

    const standardItems = categories.flatMap((category) =>
      category.items.map(([itemKey, productName, unit]) => ({
        profile_id: profile.id,
        customer_id: customerId,
        category: category.name,
        item_key: itemKey,
        product_name: productName,
        unit,
        weekly_case_estimate: Number(quantities[itemKey] || 0),
        flexible_substitution: flex[category.name] ?? true,
      }))
    )

    const { error: insertItemsError } = await supabase
      .from('customer_produce_profile_items')
      .insert(standardItems)

    if (insertItemsError) {
      setMessage('Could not save profile items.')
      setSaving(false)
      return
    }

    const { error: deleteRequestsError } = await supabase
      .from('produce_product_requests')
      .delete()
      .eq('profile_id', profile.id)
      .eq('status', 'new')

    if (deleteRequestsError) {
      setMessage('Could not refresh product requests.')
      setSaving(false)
      return
    }

    const requestRows = productRequests
      .filter(
        (request) =>
          request.product_name.trim() ||
          request.expected_use.trim() ||
          request.notes.trim()
      )
      .map((request) => ({
        profile_id: profile.id,
        customer_id: customerId,
        product_name: request.product_name.trim() || 'Product request',
        expected_use: request.expected_use.trim() || null,
        notes: request.notes.trim() || null,
        status: 'new',
      }))

    if (requestRows.length > 0) {
      const { error: insertRequestsError } = await supabase
        .from('produce_product_requests')
        .insert(requestRows)

      if (insertRequestsError) {
        setMessage('Could not save product requests.')
        setSaving(false)
        return
      }
    }

    setStatus(nextStatus)
    setMessage(nextStatus === 'active' ? 'Produce profile saved.' : 'Draft saved.')
    setSaving(false)
  }

  function addProductRequest() {
    setProductRequests((requests) => [...requests, createProductRequest()])
  }

  function updateProductRequest(id: string, patch: Partial<ProductRequest>) {
    setProductRequests((requests) =>
      requests.map((request) => (request.id === id ? { ...request, ...patch } : request))
    )
  }

  function removeProductRequest(id: string) {
    setProductRequests((requests) => requests.filter((request) => request.id !== id))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-lc-bg py-8 text-lc-ink">
        <div className="lc-container">
          <div className="lc-card p-6 shadow-sm">
            <div className="h-4 w-40 animate-pulse bg-lc-sand" />
            <div className="mt-4 h-24 animate-pulse bg-lc-bg" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lc-bg pb-28 text-lc-ink">
      <div className="lc-container py-6">
        <section className="mb-6 overflow-hidden border border-lc-border bg-lc-green text-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                <span className="h-1.5 w-1.5 bg-white" />
                Produce Profile
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                Standard Weekly Produce Usage
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Set your normal weekly case usage once during onboarding. Local Connect will
                use this as your standing produce demand profile until you update it.
              </p>
            </div>

            <div className="border-t border-white/15 bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                    Last Reviewed
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {formatReviewDate(lastReviewedAt)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/15 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">Status</p>
                    <p className="mt-1 font-bold">{statusLabel}</p>
                  </div>

                  <div className="border border-white/15 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">Cases</p>
                    <p className="mt-1 font-bold">{totalCases}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="mb-5 border border-lc-border bg-lc-sand px-4 py-3 text-sm font-medium text-lc-ink">
            {message}
          </div>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="lc-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lc-muted">
              Standard Weekly Cases
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight">{totalCases}</p>
          </div>

          <div className="lc-card p-5 shadow-sm md:col-span-2">
            <p className="text-lg font-black tracking-tight">This stays active until updated</p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-lc-muted">
              Update this only when your normal produce usage changes. Local Connect may
              send a bi-weekly reminder to review and confirm it is still accurate.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((category) => {
            const categoryTotal = category.items.reduce(
              (sum, [id]) => sum + Number(quantities[id] || 0),
              0
            )

            return (
              <section key={category.name} className="lc-card overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setOpen((prev) => ({
                      ...prev,
                      [category.name]: !prev[category.name],
                    }))
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-lc-bg sm:px-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">{category.name}</h2>

                      {categoryTotal > 0 && (
                        <span className="bg-lc-sand px-2.5 py-1 text-xs font-bold text-lc-green">
                          {categoryTotal} cases / week
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-sm text-lc-muted">{category.helper}</p>
                  </div>

                  <Icon
                    name="chevron"
                    className={`h-5 w-5 text-lc-muted transition ${
                      open[category.name] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {open[category.name] && (
                  <div className="border-t border-lc-border">
                    <div className="flex flex-col gap-3 border-b border-lc-border bg-lc-bg px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className="text-sm font-bold text-lc-ink">Flexible substitutions</p>
                        <p className="text-xs text-lc-muted">
                          Allow similar local items when exact product is unavailable.
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`Toggle flexible substitutions for ${category.name}`}
                        onClick={() =>
                          setFlex((prev) => ({
                            ...prev,
                            [category.name]: !prev[category.name],
                          }))
                        }
                        className={`relative h-8 w-14 transition ${
                          flex[category.name] ? 'bg-lc-green' : 'bg-lc-border'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 bg-white shadow-sm transition ${
                            flex[category.name] ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="divide-y divide-lc-border">
                      {category.items.map(([id, name, unit]) => (
                        <div
                          key={id}
                          className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_170px_320px] md:items-center sm:px-6"
                        >
                          <div>
                            <p className="font-bold tracking-tight">{name}</p>
                            <p className="text-sm text-lc-muted">{unit}</p>
                          </div>

                          <p className="hidden text-xs font-bold uppercase tracking-[0.16em] text-lc-muted md:block">
                            Cases / Week
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {QTY_OPTIONS.map((qty) => (
                              <button
                                type="button"
                                key={qty}
                                onClick={() =>
                                  setQuantities((prev) => ({ ...prev, [id]: qty }))
                                }
                                className={`min-w-12 border px-4 py-2 text-sm font-black transition ${
                                  quantities[id] === qty
                                    ? 'border-lc-green bg-lc-green text-white'
                                    : 'border-lc-border bg-lc-bg text-lc-ink hover:border-lc-green hover:bg-white'
                                }`}
                              >
                                {qty === 5 ? '5+' : qty}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )
          })}

          <section className="lc-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-tight">Product requests</h2>
                <p className="mt-1 text-sm text-lc-muted">
                  Use this for products not listed above. Requests are reviewed separately
                  and do not count toward your standardized profile until added to the guide.
                </p>
              </div>

              <button
                type="button"
                onClick={addProductRequest}
                className="lc-button-secondary hidden bg-white px-4 py-2 text-sm sm:inline-flex"
              >
                <Icon name="plus" className="mr-2 h-4 w-4" />
                Add request
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {productRequests.length === 0 && (
                <div className="border border-dashed border-lc-border bg-lc-bg p-4 text-sm text-lc-muted">
                  No product requests added. Your profile data will stay fully standardized.
                </div>
              )}

              {productRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid gap-3 border border-lc-border bg-lc-bg p-4 md:grid-cols-[1fr_180px_1fr_40px] md:items-center"
                >
                  <input
                    value={request.product_name}
                    onChange={(event) =>
                      updateProductRequest(request.id, {
                        product_name: event.target.value,
                      })
                    }
                    placeholder="Product name"
                    className="input bg-white"
                  />

                  <input
                    value={request.expected_use}
                    onChange={(event) =>
                      updateProductRequest(request.id, {
                        expected_use: event.target.value,
                      })
                    }
                    placeholder="Expected use"
                    className="input bg-white"
                  />

                  <input
                    value={request.notes}
                    onChange={(event) =>
                      updateProductRequest(request.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Notes, sizing, seasonality, etc."
                    className="input bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => removeProductRequest(request.id)}
                    className="p-2 text-lc-muted transition hover:bg-white hover:text-red-600"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addProductRequest}
              className="lc-button-secondary mt-4 inline-flex bg-white px-4 py-2 text-sm sm:hidden"
            >
              <Icon name="plus" className="mr-2 h-4 w-4" />
              Add request
            </button>
          </section>

          <section className="lc-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-tight">Profile notes</h2>
                <p className="mt-1 text-sm text-lc-muted">
                  Use this for seasonal context, menu structure, substitution preferences,
                  or general produce planning notes.
                </p>
              </div>

              <span className="hidden bg-lc-bg px-3 py-1 text-xs font-bold uppercase tracking-wide text-lc-muted sm:inline-flex">
                Optional
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: Patio menu increases salad volume in summer. Open to local substitutions if pricing is good."
              className="input mt-4 min-h-28 resize-none"
            />
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-lc-border bg-white/90 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="lc-container flex items-center justify-between gap-3 px-0">
          <div>
            <p className="text-sm font-black tracking-tight">
              {totalCases} standard weekly cases
            </p>
            <p className="text-xs text-lc-muted">
              This profile stays active until you update it.
            </p>
          </div>

          <div className="flex gap-2">
           

            <button
              type="button"
              disabled={saving}
              onClick={() => saveProfile('active')}
              className="lc-button-primary inline-flex items-center px-4 py-2 text-sm transition hover:bg-lc-green-soft disabled:opacity-50"
            >
              <Icon name="send" className="mr-2 h-4 w-4" />
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
