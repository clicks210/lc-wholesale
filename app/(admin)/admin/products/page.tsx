'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  getProducts,
  toggleProductActive,
  deleteProduct,
  deleteProducts,
} from '@/lib/products'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadProducts() {
    setLoading(true)
    const data = await getProducts()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

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
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  async function handleToggle(product: any) {
    await toggleProductActive(product.id, !product.is_active)
    await loadProducts()
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function toggleSelectAll() {
    const visibleIds = filteredProducts.map((product) => product.id)
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id))

    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id))
      )
    } else {
      setSelectedIds((current) => [...new Set([...current, ...visibleIds])])
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  async function handleDelete(product: any) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(product.id)
      await deleteProduct(product.id)
      setSelectedIds((current) => current.filter((id) => id !== product.id))
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Could not delete product.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected product${
        selectedIds.length === 1 ? '' : 's'
      }? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      setBulkDeleting(true)
      await deleteProducts(selectedIds)
      setSelectedIds([])
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Could not delete selected products.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const visibleIds = filteredProducts.map((product) => product.id)

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  return (
    <div>
      <div className="mb-8 flex items-end justify-between border-b border-[#d6cec0] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
            Catalog Management
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Products
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
            Manage product availability, pricing, units, and wholesale catalog status.
          </p>
        </div>

        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="border border-red-700 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkDeleting
                ? 'Deleting...'
                : `Delete Selected (${selectedIds.length})`}
            </button>
          )}

          <Link
            href="/admin/products/new"
            className="bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46]"
          >
            Add Product
          </Link>
        </div>
      </div>

      <div className="mb-5 border border-[#d6cec0] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_0.8fr_auto]">
          <input
            type="text"
            value={searchQuery}
            placeholder="Search by name, SKU, supplier, or category..."
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border border-[#d6cec0] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-[#d6cec0] px-4 py-3 text-sm font-semibold outline-none focus:border-[#244f3d]"
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
            className="border border-[#d6cec0] px-4 py-3 text-sm font-semibold outline-none focus:border-[#244f3d]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="border border-[#244f3d] px-5 py-3 text-sm font-bold text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
          >
            Clear
          </button>
        </div>

        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[0.3fr_0.8fr_1.4fr_0.8fr_0.65fr_0.65fr_0.65fr_0.6fr_0.7fr] border-b border-[#d6cec0] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
            />
          </div>
          <div>SKU</div>
          <div>Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Cost</div>
          <div>Status</div>
          <div>Edit</div>
          <div>Delete</div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-[#6f675c]">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-5 text-sm text-[#6f675c]">
            No products match your filters.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[0.3fr_0.8fr_1.4fr_0.8fr_0.65fr_0.65fr_0.65fr_0.6fr_0.7fr] items-center border-b border-[#eee7da] px-5 py-4 text-sm last:border-b-0"
            >
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleSelected(product.id)}
                />
              </div>

              <div className="font-mono text-xs text-[#6f675c]">
                {product.sku}
              </div>

              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="mt-1 text-xs text-[#6f675c]">
                  {product.unit || '—'} · {product.supplier || 'No supplier'}
                </p>
              </div>

              <div className="text-[#6f675c]">{product.category || '—'}</div>

              <div className="font-semibold">{formatMoney(product.price)}</div>

              <div className="font-semibold text-[#6f675c]">
                {formatMoney(product.cost_price)}
              </div>

              <div>
                <button
                  onClick={() => handleToggle(product)}
                  className={
                    product.is_active
                      ? 'border border-[#244f3d] px-3 py-2 text-xs font-bold uppercase text-[#244f3d]'
                      : 'bg-[#6f675c] px-3 py-2 text-xs font-bold uppercase text-white'
                  }
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="inline-block border border-[#244f3d] px-3 py-2 text-xs font-bold uppercase text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
                >
                  Edit
                </Link>
              </div>

              <div>
                <button
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id}
                  className="border border-red-700 px-3 py-2 text-xs font-bold uppercase text-red-700 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === product.id ? 'Deleting' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
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