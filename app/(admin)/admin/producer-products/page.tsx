'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminProducerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [message, setMessage] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [bulkUpdating, setBulkUpdating] = useState(false)

  async function loadProducts() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('producer_products')
      .select(`
        *,
        customers:producer_customer_id (
          business_name,
          contact_name,
          email
        )
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return products.filter((product) => {
      const producerName = product.customers?.business_name || ''
      const isActive = product.is_active !== false

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        producerName.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        statusFilter === product.status ||
        (statusFilter === 'live' && isActive) ||
        (statusFilter === 'disabled' && !isActive)

      return matchesSearch && matchesStatus
    })
  }, [products, searchQuery, statusFilter])

  const selectableProducts = filteredProducts.filter(
    (product) => product.status === 'pending_review'
  )

  const allSelectableSelected =
    selectableProducts.length > 0 &&
    selectableProducts.every((product) => selectedProductIds.includes(product.id))

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  function toggleAllSelectable() {
    setSelectedProductIds((current) => {
      if (allSelectableSelected) {
        return current.filter(
          (id) => !selectableProducts.some((product) => product.id === id)
        )
      }

      return Array.from(
        new Set([...current, ...selectableProducts.map((product) => product.id)])
      )
    })
  }

  async function bulkApproveSelected() {
    if (selectedProductIds.length === 0) return

    setBulkUpdating(true)
    setMessage('')

    const { error } = await supabase
      .from('producer_products')
      .update({
        status: 'approved',
        is_active: true,
        reviewed_at: new Date().toISOString(),
      })
      .in('id', selectedProductIds)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`Approved ${selectedProductIds.length} product(s).`)
      setSelectedProductIds([])
      await loadProducts()
    }

    setBulkUpdating(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between border-b border-[#d6cec0] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
            Marketplace Review
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Producer Products
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
            Review producer-submitted products and monitor whether approved
            products are live or disabled by the producer.
          </p>
        </div>
      </div>

      <div className="mb-5 border border-[#d6cec0] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_auto]">
          <input
            type="text"
            value={searchQuery}
            placeholder="Search by product, SKU, category, or producer..."
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border border-[#d6cec0] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-[#d6cec0] px-4 py-3 text-sm font-semibold outline-none focus:border-[#244f3d]"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="disabled">Disabled</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('pending_review')
              setSelectedProductIds([])
            }}
            className="border border-[#244f3d] px-5 py-3 text-sm font-bold text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
          >
            Reset
          </button>
        </div>

        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          Showing {filteredProducts.length} of {products.length} submissions
        </p>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="mb-5 flex items-center justify-between border border-[#244f3d] bg-[#f4f1ea] p-4">
          <p className="text-sm font-semibold text-[#244f3d]">
            {selectedProductIds.length} product(s) selected
          </p>

          <button
            type="button"
            onClick={bulkApproveSelected}
            disabled={bulkUpdating}
            className="bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b3d30] disabled:opacity-50"
          >
            {bulkUpdating ? 'Approving...' : 'Approve Selected'}
          </button>
        </div>
      )}

      {message && (
        <div className="mb-5 border border-[#d6cec0] bg-white p-4 text-sm text-[#6f675c]">
          {message}
        </div>
      )}

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[0.3fr_0.9fr_1.4fr_0.9fr_0.7fr_0.9fr_0.8fr_0.8fr] border-b border-[#d6cec0] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>
            <input
              type="checkbox"
              checked={allSelectableSelected}
              onChange={toggleAllSelectable}
            />
          </div>
          <div>Producer</div>
          <div>Product</div>
          <div>Category</div>
          <div>Price</div>
          <div>Review</div>
          <div>Live</div>
          <div>Action</div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-[#6f675c]">
            Loading producer products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-5 text-sm text-[#6f675c]">
            No producer products match your filters.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isActive = product.is_active !== false

            return (
              <div
                key={product.id}
                className="grid grid-cols-[0.3fr_0.9fr_1.4fr_0.9fr_0.7fr_0.9fr_0.8fr_0.8fr] items-center border-b border-[#eee7da] px-5 py-4 text-sm last:border-b-0"
              >
                <div>
                  {product.status === 'pending_review' ? (
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                    />
                  ) : (
                    <span className="text-xs text-[#6f675c]">—</span>
                  )}
                </div>

                <div>
                  <p className="font-semibold">
                    {product.customers?.business_name || 'Unknown producer'}
                  </p>
                  <p className="mt-1 text-xs text-[#6f675c]">
                    {product.customers?.contact_name || '—'}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="mt-1 font-mono text-xs text-[#6f675c]">
                    {product.sku || 'No SKU'} · {product.unit || 'No unit'}
                  </p>
                </div>

                <div className="text-[#6f675c]">
                  {product.category || '—'}
                </div>

                <div className="font-semibold">
                  {product.price_on_request ? 'POR' : formatMoney(product.price)}
                </div>

                <div>
                  <StatusBadge status={product.status} />
                </div>

                <div>
                  <LiveBadge active={isActive} />
                </div>

                <div>
                  <Link
                    href={`/admin/producer-products/${product.id}`}
                    className="inline-block border border-[#244f3d] px-3 py-2 text-xs font-bold uppercase text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
                  >
                    Review
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
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
      ? 'border border-green-700 text-green-700'
      : status === 'pending_review'
        ? 'border border-yellow-700 text-yellow-700'
        : status === 'rejected'
          ? 'border border-red-700 text-red-700'
          : 'border border-[#6f675c] text-[#6f675c]'

  return (
    <span className={`px-3 py-2 text-xs font-bold uppercase ${className}`}>
      {label}
    </span>
  )
}

function LiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'border border-green-700 px-3 py-2 text-xs font-bold uppercase text-green-700'
          : 'border border-red-700 px-3 py-2 text-xs font-bold uppercase text-red-700'
      }
    >
      {active ? 'Live' : 'Disabled'}
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