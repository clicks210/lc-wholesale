'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  user_id: string | null
  business_name: string | null
  contact_name: string | null
  email: string | null
}

type Product = {
  id: string
  name: string
  category: string | null
  supplier: string | null
  unit: string | null
  price: number | null
  image_url: string | null
}

type OrderGuide = {
  id: string
  customer_id: string | null
  user_id: string | null
  name: string
  description: string | null
  sort_order: number | null
  created_at: string
}

type SupabaseGuideItem = {
  id: string
  guide_id: string
  product_id: string
  quantity: number
  sort_order: number | null
  created_at: string
  product?: Product | Product[] | null
}

type GuideItem = {
  id: string
  guide_id: string
  product_id: string
  quantity: number
  sort_order: number
  created_at: string
  product?: Product | null
}

export default function AdminOrderGuidesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [guides, setGuides] = useState<OrderGuide[]>([])
  const [items, setItems] = useState<GuideItem[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedGuideId, setSelectedGuideId] = useState('')

  const [guideName, setGuideName] = useState('')
  const [guideDescription, setGuideDescription] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId]
  )

  const selectedGuide = useMemo(
    () => guides.find((guide) => guide.id === selectedGuideId),
    [guides, selectedGuideId]
  )

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase()

    if (!search) return products.slice(0, 25)

    return products
      .filter((product) =>
        [product.name, product.category, product.supplier, product.unit]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search)
      )
      .slice(0, 30)
  }, [products, productSearch])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) {
      setGuides([])
      setSelectedGuideId('')
      setItems([])
      return
    }

    loadGuides(selectedCustomerId)
    setSelectedGuideId('')
    setItems([])
  }, [selectedCustomerId])

  useEffect(() => {
    if (!selectedGuideId) return
    loadGuideItems(selectedGuideId)
  }, [selectedGuideId])

  function normalizeGuideItem(item: SupabaseGuideItem): GuideItem {
    return {
      ...item,
      quantity: item.quantity || 1,
      sort_order: item.sort_order ?? 0,
      product: Array.isArray(item.product)
        ? item.product[0] || null
        : item.product || null,
    }
  }

  async function loadInitialData() {
    setLoading(true)

    const [customersRes, productsRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, user_id, business_name, contact_name, email')
        .order('business_name', { ascending: true }),

      supabase
        .from('products')
        .select('id, name, category, supplier, unit, price, image_url')
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ])

    if (customersRes.error) {
      console.error('Customers query error:', customersRes.error)
    }

    if (productsRes.error) {
      console.error('Products query error:', productsRes.error)
    }

    setCustomers((customersRes.data as Customer[]) || [])
    setProducts((productsRes.data as Product[]) || [])
    setLoading(false)
  }

  async function loadGuides(customerId: string) {
    const { data, error } = await supabase
      .from('customer_order_guides')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Guides query error:', error)
      return
    }

    setGuides((data as OrderGuide[]) || [])
  }

  async function loadGuideItems(guideId: string) {
    const { data, error } = await supabase
      .from('order_guide_items')
      .select(`
        id,
        guide_id,
        product_id,
        quantity,
        sort_order,
        created_at,
        product:products (
          id,
          name,
          category,
          supplier,
          unit,
          price,
          image_url
        )
      `)
      .eq('guide_id', guideId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Guide items query error:', error)
      return
    }

    setItems(((data || []) as SupabaseGuideItem[]).map(normalizeGuideItem))
  }

  async function createGuide() {
    if (!selectedCustomer?.id || !guideName.trim()) return

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('customer_order_guides')
      .insert({
        customer_id: selectedCustomer.id,
        user_id: user?.id || null,
        name: guideName.trim(),
        description: guideDescription.trim() || null,
        sort_order: 0,
      })
      .select('*')
      .single()

    setSaving(false)

    if (error) {
      console.error('Create guide error:', error)
      return
    }

    setGuides((prev) => [data as OrderGuide, ...prev])
    setSelectedGuideId(data.id)
    setGuideName('')
    setGuideDescription('')
  }

  async function addProductToGuide(product: Product) {
    if (!selectedGuideId) return
    if (items.some((item) => item.product_id === product.id)) return

    const { data, error } = await supabase
      .from('order_guide_items')
      .insert({
        guide_id: selectedGuideId,
        product_id: product.id,
        quantity: 1,
        sort_order: items.length,
      })
      .select(`
        id,
        guide_id,
        product_id,
        quantity,
        sort_order,
        created_at,
        product:products (
          id,
          name,
          category,
          supplier,
          unit,
          price,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error('Add product error:', error)
      return
    }

    setItems((prev) => [...prev, normalizeGuideItem(data as SupabaseGuideItem)])
  }

  async function updateQuantity(itemId: string, quantity: number) {
    const safeQuantity = Math.max(1, quantity || 1)

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: safeQuantity } : item
      )
    )

    const { error } = await supabase
      .from('order_guide_items')
      .update({ quantity: safeQuantity })
      .eq('id', itemId)

    if (error) console.error('Update quantity error:', error)
  }

  async function removeItem(itemId: string) {
    const { error } = await supabase
      .from('order_guide_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Remove item error:', error)
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  async function deleteGuide() {
    if (!selectedGuideId) return
    if (!window.confirm('Delete this order guide?')) return

    const { error } = await supabase
      .from('customer_order_guides')
      .delete()
      .eq('id', selectedGuideId)

    if (error) {
      console.error('Delete guide error:', error)
      return
    }

    setGuides((prev) => prev.filter((guide) => guide.id !== selectedGuideId))
    setSelectedGuideId('')
    setItems([])
  }

  function getCustomerLabel(customer: Customer) {
    return (
      customer.business_name ||
      customer.contact_name ||
      customer.email ||
      'Unnamed customer'
    )
  }

  function formatPrice(price: number | null) {
    if (price === null || price === undefined) return ''
    return `$${Number(price).toFixed(2)}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] p-8 text-[#1e1e1e]">
        Loading order guide builder...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] p-6 text-[#1e1e1e]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5f6f52]">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Order Guide Builder
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#6f6a60]">
            Create custom ordering lists for each customer.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Customers</h2>

            <div className="mt-4 space-y-2">
              {customers.map((customer) => {
                const active = customer.id === selectedCustomerId

                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-[#2f5d3a] bg-[#e7f0df]'
                        : 'border-black/10 bg-white hover:bg-[#f7f3ea]'
                    }`}
                  >
                    <p className="font-semibold">{getCustomerLabel(customer)}</p>

                    {customer.contact_name && (
                      <p className="mt-1 text-xs text-[#6f6a60]">
                        Contact: {customer.contact_name}
                      </p>
                    )}

                    {customer.email && (
                      <p className="mt-1 text-xs text-[#6f6a60]">
                        {customer.email}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="space-y-6">
            {!selectedCustomer ? (
              <div className="rounded-3xl border border-dashed border-black/20 bg-white p-10 text-center">
                <h2 className="text-2xl font-bold">Select a customer</h2>
                <p className="mt-2 text-sm text-[#6f6a60]">
                  Choose a customer to create or edit their guides.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="flex-1">
                      <label className="text-sm font-semibold">
                        New guide name
                      </label>
                      <input
                        value={guideName}
                        onChange={(e) => setGuideName(e.target.value)}
                        placeholder="Example: Weekly Produce Guide"
                        className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#2f5d3a]"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="text-sm font-semibold">
                        Description
                      </label>
                      <input
                        value={guideDescription}
                        onChange={(e) => setGuideDescription(e.target.value)}
                        placeholder="Optional"
                        className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#2f5d3a]"
                      />
                    </div>

                    <button
                      onClick={createGuide}
                      disabled={saving || !guideName.trim()}
                      className="rounded-2xl bg-[#2f5d3a] px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? 'Creating...' : 'Create Guide'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
                  <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold">
                      Guides for {getCustomerLabel(selectedCustomer)}
                    </h2>

                    <div className="mt-4 space-y-2">
                      {guides.length === 0 && (
                        <p className="text-sm text-[#6f6a60]">No guides yet.</p>
                      )}

                      {guides.map((guide) => (
                        <button
                          key={guide.id}
                          onClick={() => setSelectedGuideId(guide.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            guide.id === selectedGuideId
                              ? 'border-[#2f5d3a] bg-[#e7f0df]'
                              : 'border-black/10 bg-white hover:bg-[#f7f3ea]'
                          }`}
                        >
                          <p className="font-semibold">{guide.name}</p>
                          {guide.description && (
                            <p className="mt-1 text-xs text-[#6f6a60]">
                              {guide.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!selectedGuideId ? (
                      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-10 text-center">
                        <h2 className="text-2xl font-bold">Select a guide</h2>
                        <p className="mt-2 text-sm text-[#6f6a60]">
                          Pick a guide to start adding products.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-2xl font-black">
                                {selectedGuide?.name}
                              </h2>
                              <p className="mt-1 text-sm text-[#6f6a60]">
                                {items.length} products in this guide
                              </p>
                            </div>

                            <button
                              onClick={deleteGuide}
                              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                            >
                              Delete Guide
                            </button>
                          </div>

                          <div className="mt-5">
                            <label className="text-sm font-semibold">
                              Search products
                            </label>
                            <input
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder="Search product, category, supplier..."
                              className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#2f5d3a]"
                            />
                          </div>

                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {filteredProducts.map((product) => {
                              const added = items.some(
                                (item) => item.product_id === product.id
                              )

                              return (
                                <button
                                  key={product.id}
                                  onClick={() => addProductToGuide(product)}
                                  disabled={added}
                                  className={`rounded-2xl border p-3 text-left transition ${
                                    added
                                      ? 'cursor-not-allowed border-black/10 bg-black/5 opacity-50'
                                      : 'border-black/10 bg-white hover:border-[#2f5d3a] hover:bg-[#f7f3ea]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">
                                        {product.name}
                                      </p>
                                      <p className="mt-1 text-xs text-[#6f6a60]">
                                        {[
                                          product.category,
                                          product.supplier,
                                          product.unit,
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </p>
                                    </div>

                                    {product.price !== null && (
                                      <p className="text-sm font-bold text-[#2f5d3a]">
                                        {formatPrice(product.price)}
                                      </p>
                                    )}
                                  </div>

                                  <p className="mt-2 text-xs font-bold text-[#2f5d3a]">
                                    {added ? 'Added' : 'Add to guide'}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                          <h2 className="text-lg font-bold">Guide Items</h2>

                          <div className="mt-4 space-y-3">
                            {items.length === 0 && (
                              <p className="text-sm text-[#6f6a60]">
                                No products added yet.
                              </p>
                            )}

                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#fbfaf7] p-4 md:flex-row md:items-center md:justify-between"
                              >
                                <div>
                                  <p className="font-bold">
                                    {item.product?.name || 'Unnamed product'}
                                  </p>
                                  <p className="mt-1 text-xs text-[#6f6a60]">
                                    {[
                                      item.product?.category,
                                      item.product?.supplier,
                                      item.product?.unit,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                  {item.product?.price !== null &&
                                    item.product?.price !== undefined && (
                                      <p className="mt-1 text-xs font-bold text-[#2f5d3a]">
                                        {formatPrice(item.product.price)}
                                      </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateQuantity(
                                        item.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-24 rounded-xl border border-black/10 bg-white px-3 py-2 text-center font-bold outline-none focus:border-[#2f5d3a]"
                                  />

                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}