'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

    const { data: guideData, error: guideError } = await supabase
      .from('customer_order_guides')
      .select('id, name, description, created_at')
      .eq('id', guideId)
      .eq('user_id', user.id)
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
        product:products (*)
      `)
      .eq('guide_id', guideId)
      .order('created_at', { ascending: true })

    if (itemError) {
      console.error('Guide items fetch error:', itemError)
      setMessage('Could not load guide products.')
      setLoading(false)
      return
    }

    const guideItems = (itemData || []) as any[]
    const startingQuantities: Record<string, number> = {}

    guideItems.forEach((item) => {
      if (item.product?.id) {
        startingQuantities[item.product.id] = item.quantity || 0
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

    setMessage(`${count} items added to cart.`)
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

    window.location.href = '/order-guides'
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
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl border border-[#d6cec0] bg-white p-6 text-sm font-medium text-[#6f675c] shadow-sm sm:p-8">
          Loading order guide...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/order-guides"
          className="mb-5 inline-flex text-sm font-black text-[#244f3d]"
        >
          ← Back to Order Guides
        </Link>

        <section className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
                Saved Order Guide
              </p>

              <h1 className="mt-2 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {guide?.name || 'Untitled Guide'}
              </h1>

              {guide?.description && (
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#6f675c]">
                  {guide.description}
                </p>
              )}

              {guide?.created_at && (
                <p className="mt-4 text-sm font-medium text-[#6f675c]">
                  Created {formatDate(guide.created_at)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={deleteGuide}
              className="w-full border border-red-500 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50 md:w-auto"
            >
              Delete Guide
            </button>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="border border-[#d6cec0] bg-white p-6 text-sm font-medium text-[#6f675c] shadow-sm sm:p-8">
            {message || 'No products in this order guide yet.'}
          </div>
        ) : (
          <section className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
            <div className="hidden lg:block">
              <div className="grid grid-cols-[110px_2fr_1.2fr_1fr_1fr_0.8fr_1.2fr] bg-[#244f3d] px-5 py-4 text-sm font-black text-white">
                <div>SKU</div>
                <div>Product</div>
                <div>Supplier</div>
                <div>Category</div>
                <div>Unit</div>
                <div>Price</div>
                <div>Quantity</div>
              </div>

              {items.map((item) => {
                const product = item.product
                const qty = quantities[product.id] || 0

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[110px_2fr_1.2fr_1fr_1fr_0.8fr_1.2fr] items-center border-b border-[#eee7da] px-5 py-5 text-sm last:border-b-0"
                  >
                    <div className="break-all font-mono text-xs text-[#6f675c]">
                      {product.sku || '—'}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-[#e5ded2] bg-[#f4f1ea]">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#6f675c]">
                            No img
                          </div>
                        )}
                      </div>

                      <span className="font-black leading-snug">
                        {product.name}
                      </span>
                    </div>

                    <div className="font-bold text-[#244f3d]">
                      {product.supplier || 'Local Connect'}
                    </div>

                    <div className="text-[#444]">{product.category || '—'}</div>

                    <div className="text-[#444]">
                      {product.case_size || product.unit || '—'}
                    </div>

                    <div className="font-black">
                      ${Number(product.price ?? 0).toFixed(2)}
                    </div>

                    <QuantityControl
                      qty={qty}
                      onDecrease={() => updateQuantity(product.id, qty - 1)}
                      onIncrease={() => updateQuantity(product.id, qty + 1)}
                      onChange={(value) => updateQuantity(product.id, value)}
                    />
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {items.map((item) => {
                const product = item.product
                const qty = quantities[product.id] || 0
                const lineTotal = Number(product.price ?? 0) * qty

                return (
                  <div
                    key={item.id}
                    className="border border-[#d6cec0] bg-white p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#e5ded2] bg-[#f4f1ea]">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#6f675c]">
                            No img
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-black leading-snug">
                          {product.name}
                        </p>

                        <p className="mt-1 break-all font-mono text-[11px] font-medium text-[#6f675c]">
                          {product.sku || '—'}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#244f3d]">
                          {product.supplier || 'Local Connect'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MiniStat
                        label="Category"
                        value={product.category || '—'}
                      />
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

                    <div className="mt-4 flex items-center justify-between gap-4 border border-[#eee7da] bg-[#f4f1ea] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                        Quantity
                      </p>

                      <QuantityControl
                        qty={qty}
                        onDecrease={() => updateQuantity(product.id, qty - 1)}
                        onIncrease={() => updateQuantity(product.id, qty + 1)}
                        onChange={(value) => updateQuantity(product.id, value)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[#d6cec0] bg-[#e9dfcf] p-4 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-black text-[#4f4f4f]">
                    {selectedCount} total units selected
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#4f4f4f]">
                    Adjust quantities, then add this guide to your cart.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                  <div className="sm:text-right">
                    <p className="text-sm font-medium text-[#4f4f4f]">
                      Order Total
                    </p>
                    <p className="text-3xl font-black tracking-[-0.04em] text-[#244f3d]">
                      ${orderTotal.toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSelectedToCart}
                    disabled={selectedCount === 0}
                    className="w-full bg-[#79dd52] px-8 py-4 text-base font-black text-[#102011] hover:brightness-95 disabled:opacity-50 sm:w-auto"
                  >
                    Add to Cart ({selectedCount})
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {message && (
          <p className="mt-4 border border-[#d6cec0] bg-white p-4 text-sm font-medium text-[#6f675c] shadow-sm">
            {message}
          </p>
        )}
      </div>
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
    <div className="flex items-center">
      <button
        type="button"
        onClick={onDecrease}
        className="h-10 w-10 border border-[#d6cec0] bg-white text-lg font-black hover:border-[#244f3d]"
      >
        −
      </button>

      <input
        value={qty}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-10 w-14 border-y border-[#d6cec0] bg-white text-center font-black outline-none"
      />

      <button
        type="button"
        onClick={onIncrease}
        className="h-10 w-10 border border-[#d6cec0] bg-white text-lg font-black hover:border-[#244f3d]"
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
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-black ${
          highlight ? 'text-[#244f3d]' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}