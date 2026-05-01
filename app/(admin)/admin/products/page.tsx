'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

  async function loadProducts() {
    setLoading(true)
    const data = await getProducts()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

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
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map((product) => product.id))
    }
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

      <div className="border border-[#d6cec0] bg-white">
        <div className="grid grid-cols-[0.3fr_0.9fr_1.5fr_0.8fr_0.7fr_0.7fr_0.7fr] border-b border-[#d6cec0] bg-[#f4f1ea] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
          <div>
            <input
              type="checkbox"
              checked={products.length > 0 && selectedIds.length === products.length}
              onChange={toggleSelectAll}
            />
          </div>
          <div>SKU</div>
          <div>Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Status</div>
          <div>Delete</div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-[#6f675c]">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-5 text-sm text-[#6f675c]">No products found.</div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[0.3fr_0.9fr_1.5fr_0.8fr_0.7fr_0.7fr_0.7fr] items-center border-b border-[#eee7da] px-5 py-4 text-sm last:border-b-0"
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

              <div className="text-[#6f675c]">
                {product.category || '—'}
              </div>

              <div className="font-semibold">
                ${Number(product.price ?? 0).toFixed(2)}
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