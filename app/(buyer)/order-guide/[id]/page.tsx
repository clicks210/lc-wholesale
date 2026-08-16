'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

type Guide = {
  id: string
  name: string | null
  description: string | null
  created_at: string
}

type GuideItem = {
  id: string
  quantity: number
  sort_order?: number | null
  product: Product & {
    image_url?: string | null
    supplier?: string | null
    unit?: string | null
    case_size?: string | null
  }
}

export default function SingleOrderGuidePage() {
  const params = useParams()
  const guideId = params.id as string

  const [guide, setGuide] = useState<Guide | null>(null)
  const [items, setItems] = useState<GuideItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  useEffect(() => {
    loadGuide()
  }, [guideId])

  async function loadGuide() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

  const { data: membership, error: membershipError } = await supabase
  .from('customer_members')
  .select('customer_id, role')
  .eq('user_id', user.id)
  .single()

if (membershipError || !membership) {
  console.error('Membership fetch error:', membershipError)
  setMessage('Could not find your customer account.')
  setLoading(false)
  return
}

const { data: guideData, error: guideError } = await supabase
  .from('customer_order_guides')
  .select('id, name, description, created_at')
  .eq('id', guideId)
  .eq('customer_id', membership.customer_id)
  .single()

    if (guideError || !guideData) {
      console.error('Guide fetch error:', guideError)
      setMessage('Could not load this order guide.')
      setLoading(false)
      return
    }

    const { data: itemData, error: itemError } = await supabase
      .from('order_guide_items')
      .select(`
        id,
        quantity,
        sort_order,
        product:products (*)
      `)
      .eq('guide_id', guideId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (itemError) {
      console.error('Guide items fetch error:', itemError)
      setMessage('Could not load guide products.')
      setLoading(false)
      return
    }

    const guideItems: GuideItem[] = (itemData || []).map((item: any) => ({
  ...item,
  product: Array.isArray(item.product)
    ? item.product[0]
    : item.product,
}))
    const startingQuantities: Record<string, number> = {}

    guideItems.forEach((item) => {
      if (item.product?.id) {
        startingQuantities[item.product.id] = 0
      }
    })

    setGuide(guideData)
    setItems(guideItems)
    setQuantities(startingQuantities)
    setLoading(false)
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, nextQuantity),
    }))
  }

  function reorderItems(fromId: string, toId: string) {
    if (fromId === toId) return

    setItems((currentItems) => {
      const fromIndex = currentItems.findIndex((item) => item.id === fromId)
      const toIndex = currentItems.findIndex((item) => item.id === toId)

      if (fromIndex === -1 || toIndex === -1) return currentItems

      const nextItems = [...currentItems]
      const [movedItem] = nextItems.splice(fromIndex, 1)
      nextItems.splice(toIndex, 0, movedItem)

      saveItemOrder(nextItems)

      return nextItems
    })
  }

  async function saveItemOrder(nextItems: GuideItem[]) {
    setSavingOrder(true)
    setMessage('Saving order...')

    const results = await Promise.all(
      nextItems.map((item, index) =>
        supabase
          .from('order_guide_items')
          .update({ sort_order: index + 1 })
          .eq('id', item.id)
          .eq('guide_id', guideId)
      )
    )

    const failed = results.find((result) => result.error)

    if (failed?.error) {
      console.error('Save item order error:', failed.error)
      setMessage('Could not save product order.')
      setSavingOrder(false)
      return
    }

    setMessage('Product order saved.')
    setSavingOrder(false)
  }

  async function removeGuideItem(itemId: string, productId: string) {
    const confirmed = window.confirm('Remove this product from the guide?')
    if (!confirmed) return

    setDeletingItemId(itemId)

    const { error } = await supabase
      .from('order_guide_items')
      .delete()
      .eq('id', itemId)
      .eq('guide_id', guideId)

    if (error) {
      console.error('Remove guide item error:', error)
      setMessage('Could not remove product from guide.')
      setDeletingItemId(null)
      return
    }

    setItems((current) => current.filter((item) => item.id !== itemId))

    setQuantities((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })

    setMessage('Product removed from guide.')
    setDeletingItemId(null)
  }

  function addSelectedToCart() {
    let count = 0

    items.forEach((item) => {
      const product = item.product
      const quantity = quantities[product.id] || 0

      if (quantity > 0) {
        addToCart({
          product,
          quantity,
        })

        count += quantity
      }
    })

    window.dispatchEvent(new Event('cartUpdated'))
    window.dispatchEvent(new Event('cart-updated'))

    setMessage(
      count > 0 ? `${count} items added to cart.` : 'Choose quantities first.'
    )
  }

  async function deleteGuide() {
    const confirmed = window.confirm('Delete this order guide?')
    if (!confirmed) return

    const { error } = await supabase
      .from('customer_order_guides')
      .delete()
      .eq('id', guideId)

    if (error) {
      console.error('Delete guide error:', error)
      setMessage('Could not delete order guide.')
      return
    }

    window.location.href = '/order-guide'
  }

  const selectedCount = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }, [quantities])

  const orderTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = quantities[item.product.id] || 0
      return sum + Number(item.product.price ?? 0) * qty
    }, 0)
  }, [items, quantities])

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f2] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px] border-t border-[#d9ddd8] pt-6 text-sm text-[#69716b]">
          Loading order guide...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f5f2] px-5 py-7 text-[#181c19] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href="/order-guide"
          className="mb-5 inline-flex text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f5a43] transition-opacity hover:opacity-65"
        >
          ← Back to Order Guides
        </Link>

        <section className="mb-6 border-b border-[#d9ddd8] bg-transparent pb-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                Saved Order Guide
              </p>

              <h1 className="mt-3 break-words text-4xl font-semibold leading-[1] tracking-[-0.045em] sm:text-5xl">
                {guide?.name || 'Untitled Guide'}
              </h1>

              {guide?.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69716b]">
                  {guide.description}
                </p>
              )}

              {guide?.created_at && (
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b928d]">
                  Created {formatDate(guide.created_at)}
                </p>
              )}

              <p className="mt-3 max-w-2xl text-xs leading-5 text-[#69716b]">
                Quantities start at zero. Pick what you need, remove old
                products, or drag products to reorder them.
              </p>
            </div>

          </div>
        </section>

        {items.length === 0 ? (
          <div className="border-y border-[#d9ddd8] bg-white px-6 py-16 text-sm text-[#69716b] sm:px-8">
            {message || 'No products in this order guide yet.'}
          </div>
        ) : (
          <section className="overflow-hidden border border-[#d9ddd8] bg-white">
            <div className="hidden lg:block">
              <div className="grid grid-cols-[60px_90px_2fr_1fr_1fr_0.9fr_0.8fr_1.2fr_110px] border-b border-[#d9ddd8] bg-[#f8f9f7] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b837d]">
                <div>Move</div>
                <div>SKU</div>
                <div>Product</div>
                <div>Supplier</div>
                <div>Category</div>
                <div>Unit</div>
                <div>Price</div>
                <div>Quantity</div>
                <div className="text-right">Remove</div>
              </div>

              {items.map((item) => {
                const product = item.product
                const qty = quantities[product.id] || 0
                const isDragging = draggedItemId === item.id

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedItemId) reorderItems(draggedItemId, item.id)
                      setDraggedItemId(null)
                    }}
                    className={`grid cursor-move grid-cols-[60px_90px_2fr_1fr_1fr_0.9fr_0.8fr_1.2fr_110px] items-center border-b border-[#e1e4df] px-5 py-5 text-sm last:border-b-0 ${
                      isDragging ? 'bg-[#eef2ef] opacity-50' : 'bg-white hover:bg-[#fafbf9]'
                    }`}
                  >
                    <div className="text-xl font-semibold text-[#1f5a43]">☰</div>

                    <div className="break-all font-mono text-xs text-[#69716b]">
                      {product.sku || '—'}
                    </div>

                    <div className="flex min-w-0 items-center gap-4">
                      <ProductImage product={product} size="desktop" />

                      <span className="min-w-0 break-words font-semibold leading-snug">
                        {product.name}
                      </span>
                    </div>

                    <div className="font-semibold text-[#1f5a43]">
                      {product.supplier || 'Local Connect'}
                    </div>

                    <div className="text-[#444]">{product.category || '—'}</div>

                    <div className="text-[#444]">
                      {product.case_size || product.unit || '—'}
                    </div>

                    <div className="font-semibold">
                      ${Number(product.price ?? 0).toFixed(2)}
                    </div>

                    <QuantityControl
                      qty={qty}
                      onDecrease={() => updateQuantity(product.id, qty - 1)}
                      onIncrease={() => updateQuantity(product.id, qty + 1)}
                      onChange={(value) => updateQuantity(product.id, value)}
                    />

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => removeGuideItem(item.id, product.id)}
                        disabled={deletingItemId === item.id}
                        className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-700 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingItemId === item.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {items.map((item) => {
                const product = item.product
                const qty = quantities[product.id] || 0
                const lineTotal = Number(product.price ?? 0) * qty
                const isDragging = draggedItemId === item.id

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedItemId) reorderItems(draggedItemId, item.id)
                      setDraggedItemId(null)
                    }}
                    className={`border border-[#d9ddd8] bg-white p-3 sm:p-4 ${
                      isDragging ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-[#e1e4df] bg-[#f8f9f7] px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#858c86]">
                        Drag to reorder
                      </p>

                      <span className="text-lg font-semibold text-[#1f5a43]">
                        ☰
                      </span>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <ProductImage product={product} size="mobile" />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
                          {product.name}
                        </p>

                        <p className="mt-1 break-all font-mono text-[10px] font-medium text-[#69716b] sm:text-[11px]">
                          {product.sku || '—'}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#1f5a43]">
                          {product.supplier || 'Local Connect'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MiniStat label="Category" value={product.category || '—'} />
                      <MiniStat
                        label="Unit"
                        value={product.case_size || product.unit || '—'}
                      />
                      <MiniStat
                        label="Price"
                        value={`$${Number(product.price ?? 0).toFixed(2)}`}
                      />
                      <MiniStat
                        label="Line Total"
                        value={`$${lineTotal.toFixed(2)}`}
                        highlight
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border border-[#e1e4df] bg-[#f8f9f7] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#858c86]">
                        Quantity
                      </p>

                      <QuantityControl
                        qty={qty}
                        onDecrease={() => updateQuantity(product.id, qty - 1)}
                        onIncrease={() => updateQuantity(product.id, qty + 1)}
                        onChange={(value) => updateQuantity(product.id, value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeGuideItem(item.id, product.id)}
                      disabled={deletingItemId === item.id}
                      className="mt-3 w-full border border-red-300 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingItemId === item.id
                        ? 'Removing Product...'
                        : 'Remove Product From Guide'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[#d9ddd8] bg-[#f8f9f7] p-4 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#303731]">
                    {selectedCount} total units selected
                  </p>
                  <p className="mt-1 text-sm text-[#69716b]">
                    {savingOrder
                      ? 'Saving product order...'
                      : 'Adjust quantities, then add this guide to your cart.'}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                  <div className="sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7f867f]">
                      Order Total
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#1f5a43]">
                      ${orderTotal.toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSelectedToCart}
                    disabled={selectedCount === 0}
                    className="w-full bg-[#FFD09A] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#171B18] transition-colors hover:bg-[#FFBE73] disabled:opacity-50 sm:w-auto"
                  >
                    Add to Cart ({selectedCount})
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {message && (
          <p className="mt-4 border-l-2 border-[#1f5a43] bg-white px-4 py-3 text-sm text-[#69716b]">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function ProductImage({
  product,
  size,
}: {
  product: GuideItem['product']
  size: 'desktop' | 'mobile'
}) {
  const imageUrl = product.image_url

  return (
    <div
      className={`shrink-0 overflow-hidden border border-[#d9ddd8] bg-[#f8f9f7] ${
        size === 'desktop' ? 'h-12 w-12' : 'h-16 w-16 sm:h-20 sm:w-20'
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name || 'Product image'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b928d]">
          No Image
        </div>
      )}
    </div>
  )
}

function QuantityControl({
  qty,
  onDecrease,
  onIncrease,
  onChange,
}: {
  qty: number
  onDecrease: () => void
  onIncrease: () => void
  onChange: (value: number) => void
}) {
  return (
    <div className="flex w-full items-center sm:w-auto">
      <button
        type="button"
        onClick={onDecrease}
        className="h-10 w-10 shrink-0 border border-[#d9ddd8] bg-[#f8f9f7] text-lg font-semibold hover:border-[#1f5a43]"
      >
        −
      </button>

      <input
        value={qty}
        min={0}
        inputMode="numeric"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-10 min-w-0 flex-1 border-y border-[#d9ddd8] bg-white text-center font-semibold outline-none sm:w-14 sm:flex-none"
      />

      <button
        type="button"
        onClick={onIncrease}
        className="h-10 w-10 shrink-0 border border-[#d9ddd8] bg-[#f8f9f7] text-lg font-semibold hover:border-[#1f5a43]"
      >
        +
      </button>
    </div>
  )
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="border border-[#e1e4df] bg-[#f8f9f7] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#858c86]">
        {label}
      </p>

      <p
        className={`mt-1.5 break-words text-sm font-semibold ${
          highlight ? 'text-[#1f5a43]' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}