'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProducerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadProducts() {
    setLoading(true)
    setMessage('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('You must be signed in.')
      setLoading(false)
      return
    }

    const userId = userData.user.id

    const { data: memberships, error: membershipError } = await supabase
      .from('customer_members')
      .select('customer_id')
      .eq('user_id', userId)

    if (membershipError || !memberships || memberships.length === 0) {
      setMessage('Producer account could not be found.')
      setLoading(false)
      return
    }

    const customerIds = memberships.map((membership) => membership.customer_id)

    const { data, error } = await supabase
      .from('producer_products')
      .select('*')
      .in('producer_customer_id', customerIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage('Could not load producer products.')
      setProducts([])
      setLoading(false)
      return
    }

    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function toggleProductActive(product: any) {
    setUpdatingId(product.id)
    setMessage('')

    const currentActive = product.is_active !== false
    const nextActive = !currentActive

    const { data, error } = await supabase
      .from('producer_products')
      .update({ is_active: nextActive })
      .eq('id', product.id)
      .select()
      .single()

    if (error) {
      console.error('Toggle product active error:', error)
      setMessage(error.message || 'Could not update product activity.')
      setUpdatingId(null)
      return
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, ...data } : item
      )
    )

    setMessage(nextActive ? 'Product enabled.' : 'Product disabled.')
    setUpdatingId(null)
  }

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
          .sort()
      ),
    ]
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return products.filter((product) => {
      const currentActive = product.is_active !== false

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.supplier?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)

      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && currentActive) ||
        (statusFilter === 'inactive' && !currentActive) ||
        product.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  function clearFilters() {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  return (
    <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="lc-card flex flex-col gap-5 rounded-3xl p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-lc-green">
              Producer Catalog
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              My Products
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-lc-muted">
              Add products, manage submissions, and enable or disable live items
              from the Local Connect buyer catalog.
            </p>
          </div>

          <Link
            href="/producer/products/new"
            className="lc-button-primary inline-flex items-center justify-center rounded-2xl text-sm transition hover:opacity-90"
          >
            Add Product
          </Link>
        </header>

        <section className="lc-card sticky top-4 z-20 rounded-3xl p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_0.9fr_auto]">
            <input
              type="text"
              value={searchQuery}
              placeholder="Search by name, SKU, supplier, or category..."
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input rounded-2xl bg-white"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="input rounded-2xl bg-white font-semibold"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input rounded-2xl bg-white font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="lc-button-secondary rounded-2xl text-sm transition hover:bg-lc-green hover:text-white"
            >
              Clear
            </button>
          </div>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-lc-muted">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </section>

        {message && (
          <div className="lc-card rounded-3xl p-5 text-sm font-semibold text-lc-muted shadow-sm">
            {message}
          </div>
        )}

        <section className="lc-card overflow-hidden rounded-3xl shadow-sm">
          <div className="hidden grid-cols-[90px_0.8fr_1.5fr_0.9fr_0.7fr_0.9fr_1.1fr] border-b border-lc-border bg-lc-sand px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-lc-muted lg:grid">
            <div>Image</div>
            <div>SKU</div>
            <div>Name</div>
            <div>Category</div>
            <div>Price</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-lc-muted">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-2xl font-black">No products found</h2>
              <p className="mt-2 text-sm text-lc-muted">
                Add your first product to submit it for review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-lc-border">
              {filteredProducts.map((product) => {
                const currentActive = product.is_active !== false

                return (
                  <article
                    key={product.id}
                    className="grid gap-4 p-4 transition hover:bg-lc-bg lg:grid-cols-[90px_0.8fr_1.5fr_0.9fr_0.7fr_0.9fr_1.1fr] lg:items-center lg:px-5"
                  >
                    <div className="flex items-center gap-4 lg:block">
                      <ProductImage product={product} />

                      <div className="lg:hidden">
                        <p className="text-base font-black">{product.name}</p>
                        <p className="mt-1 text-xs text-lc-muted">
                          {product.unit || '—'} ·{' '}
                          {product.supplier || 'No supplier'}
                        </p>
                      </div>
                    </div>

                    <div className="font-mono text-xs font-semibold text-lc-muted">
                      {product.sku || '—'}
                    </div>

                    <div className="hidden lg:block">
                      <p className="font-black">{product.name}</p>
                      <p className="mt-1 text-xs text-lc-muted">
                        {product.unit || '—'} ·{' '}
                        {product.supplier || 'No supplier'}
                      </p>
                    </div>

                    <div className="text-sm font-semibold text-lc-muted">
                      {product.category || '—'}
                    </div>

                    <div className="text-sm font-black">
                      {formatMoney(product.price)}
                    </div>

                    <div>
                      <StatusBadge status={product.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/producer/products/${product.id}/edit`}
                        className="rounded-xl border border-lc-green px-3 py-2 text-xs font-black uppercase text-lc-green transition hover:bg-lc-green hover:text-white"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={updatingId === product.id}
                        onClick={() => toggleProductActive(product)}
                        className={
                          currentActive
                            ? 'rounded-xl border border-lc-green px-3 py-2 text-xs font-black uppercase text-lc-green transition hover:border-red-700 hover:bg-red-700 hover:text-white disabled:opacity-50'
                            : 'rounded-xl border border-lc-muted bg-lc-muted px-3 py-2 text-xs font-black uppercase text-white transition hover:border-green-700 hover:bg-green-700 disabled:opacity-50'
                        }
                      >
                        {updatingId === product.id
                          ? 'Saving'
                          : currentActive
                            ? 'Active'
                            : 'Disabled'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function ProductImage({ product }: { product: any }) {
  if (!product.image_url) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-lc-border bg-lc-bg text-xs font-black uppercase text-lc-muted">
        No img
      </div>
    )
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-lc-border bg-lc-bg">
      <Image
        src={product.image_url}
        alt={product.name || 'Product image'}
        fill
        className="object-cover"
        sizes="80px"
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'pending_review'
      ? 'Pending'
      : status === 'changes_requested'
        ? 'Changes'
        : status || 'Draft'

  const className =
    status === 'approved'
      ? 'border-green-700 bg-green-50 text-green-700'
      : status === 'pending_review'
        ? 'border-yellow-700 bg-yellow-50 text-yellow-800'
        : status === 'rejected'
          ? 'border-red-700 bg-red-50 text-red-700'
          : 'border-lc-border bg-lc-bg text-lc-muted'

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase ${className}`}
    >
      {label}
    </span>
  )
}

function formatMoney(value: any) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(number)
}