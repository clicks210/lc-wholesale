'use client'

import { useEffect, useState } from 'react'
import {
  getCart,
  clearCart,
  updateCartItem,
  removeFromCart,
} from '@/lib/cart'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CartPage() {
  const [items, setItems] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [guideName, setGuideName] = useState('')
  const [savingGuide, setSavingGuide] = useState(false)
  const [message, setMessage] = useState('')

  function notifyCartUpdated() {
    window.dispatchEvent(new Event('cartUpdated'))
    window.dispatchEvent(new Event('cart-updated'))
  }

  function refreshCart() {
    setItems([...getCart()])
    notifyCartUpdated()
  }

  function getProductImage(product: any) {
    return (
      product?.image_url ||
      product?.image ||
      product?.photo_url ||
      product?.thumbnail_url ||
      product?.product_image ||
      null
    )
  }

  useEffect(() => {
    async function loadCart() {
      refreshCart()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: membership, error: membershipError } = await supabase
        .from('customer_members')
        .select('customer_id, role')
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        setMessage('Could not find your customer account.')
        return
      }

      setCustomerId(membership.customer_id)

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', membership.customer_id)
        .single()

      if (customerError || !customerData) {
        setMessage('Could not load your customer account.')
        return
      }

      setCustomer(customerData)
    }

    loadCart()
  }, [])

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price ?? 0) * item.quantity,
    0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const orderMinimum = Number(customer?.order_minimum ?? 0)
  const deliveryCost = Number(customer?.delivery_cost ?? 0)

  const freightApplied =
    orderMinimum > 0 && subtotal < orderMinimum ? deliveryCost : 0

  const amountUntilFreeDelivery = Math.max(orderMinimum - subtotal, 0)
  const estimatedTotal = subtotal + freightApplied

  const lcItems = items.filter((item) => !item.product.producer_customer_id)
  const fulfillment = evaluateCartFulfillment(lcItems)
  const canCheckout = fulfillment.valid

  async function createOrderGuide() {
    setSavingGuide(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You need to be logged in to create an order guide.')
      setSavingGuide(false)
      return
    }

    if (!customerId) {
      setMessage('Could not find your customer account.')
      setSavingGuide(false)
      return
    }

    if (!guideName.trim()) {
      setMessage('Give your order guide a name first.')
      setSavingGuide(false)
      return
    }

    if (items.length === 0) {
      setMessage('Add products to your cart first.')
      setSavingGuide(false)
      return
    }

    const { data: guide, error: guideError } = await supabase
      .from('customer_order_guides')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        name: guideName.trim(),
        description: notes || null,
      })
      .select()
      .single()

    if (guideError || !guide) {
      setMessage('Could not create order guide.')
      setSavingGuide(false)
      return
    }

    const rows = items.map((item) => ({
      guide_id: guide.id,
      product_id: item.product.id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_guide_items')
      .insert(rows)

    if (itemsError) {
      setMessage('Guide created, but products could not be saved.')
      setSavingGuide(false)
      return
    }

    setGuideName('')
    setMessage('Order guide created successfully.')
    setSavingGuide(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f5f2] px-5 py-7 text-[#181c19] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 border-b border-[#d9ddd8] bg-transparent pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
            Local Connect Wholesale
          </p>

          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Cart</h1>
              <p className="mt-2 text-sm text-[#69716b]">
                {itemCount} items in your wholesale order
              </p>
            </div>

            <Link
              href="/products"
              className="mt-3 inline-flex min-h-11 w-fit items-center border border-[#1f5a43] px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f5a43] transition-colors hover:bg-[#1f5a43] hover:text-white sm:mt-0"
            >
              Keep Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border-y border-[#d9ddd8] bg-white py-20 text-center text-sm text-[#69716b]">
            {message || 'No items in cart.'}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="hidden overflow-hidden border border-[#d9ddd8] bg-white md:block">
                <div className="grid grid-cols-[2fr_0.55fr_0.6fr_0.7fr_0.75fr] border-b border-[#d9ddd8] bg-[#f8f9f7] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7b837d]">
                  <div>Product</div>
                  <div>Unit</div>
                  <div>Price</div>
                  <div>Qty</div>
                  <div className="text-right">Total</div>
                </div>

                {items.map((item) => (
                  <CartRow
                    key={item.product.id}
                    item={item}
                    imageUrl={getProductImage(item.product)}
                    refreshCart={refreshCart}
                  />
                ))}
              </div>

              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <MobileCartRow
                    key={item.product.id}
                    item={item}
                    imageUrl={getProductImage(item.product)}
                    refreshCart={refreshCart}
                  />
                ))}
              </div>
            </div>

            <aside className="border border-[#d9ddd8] bg-white p-5 lg:sticky lg:top-5 lg:self-start sm:p-6">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3 border-b border-[#d9ddd8] pb-6 text-sm">
                <SummaryRow label="Items" value={String(itemCount)} />
                <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
                <SummaryRow
                  label="Account Minimum"
                  value={formatMoney(orderMinimum)}
                />

                {freightApplied > 0 ? (
                  <div className="border-l-2 border-orange-300 bg-orange-50/70 px-4 py-3">
                    <div className="flex justify-between text-orange-800">
                      <span className="font-semibold">Freight</span>
                      <span className="font-semibold">
                        {formatMoney(freightApplied)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium leading-5 text-orange-800">
                      Add {formatMoney(amountUntilFreeDelivery)} more to remove
                      freight.
                    </p>
                  </div>
                ) : (
                  <div className="border-l-2 border-green-300 bg-green-50/70 px-4 py-3">
                    <div className="flex justify-between text-green-800">
                      <span className="font-semibold">Freight</span>
                      <span className="font-semibold">Free</span>
                    </div>

                    <p className="mt-2 text-xs font-medium leading-5 text-green-800">
                      This order meets the account minimum.
                    </p>
                  </div>
                )}
              </div>

              {fulfillment.failures.length > 0 && (
                <div className="mt-5 space-y-3">
                  {fulfillment.failures.map((group: any) => (
                    <div
                      key={group.category}
                      className="border-l-2 border-orange-300 bg-orange-50/70 px-4 py-3 text-sm text-orange-900"
                    >
                      <p className="font-semibold">
                        {group.category} minimum not met
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5">
                        Add {formatMoney(group.minimum - group.subtotal)} more
                        from {group.category} to unlock these special-order
                        items.
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-end justify-between border-t border-[#d9ddd8] pt-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7f867f]">Estimated Total</span>
                <span className="text-2xl font-semibold tracking-[-0.03em] text-[#1f5a43]">
                  {formatMoney(estimatedTotal)}
                </span>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#818882]">
                  Order Notes
                </label>

                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery notes, substitutions, timing, etc."
                  className="w-full border border-[#d9ddd8] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#969d97] focus:border-[#1f5a43]"
                />
              </div>

              {canCheckout ? (
                <Link
                  href="/checkout"
                  className="mt-6 flex min-h-12 w-full items-center justify-center bg-[#1f5a43] px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#174735]"
                >
                  Continue to Checkout
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 flex min-h-12 w-full cursor-not-allowed items-center justify-center bg-[#a6ada7] px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-white opacity-70"
                >
                  Minimums Required
                </button>
              )}

              <div className="mt-4 border-t border-[#d9ddd8] bg-[#f8f9f7] p-4">
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#818882]">
                  Save Cart as Order Guide
                </label>

                <input
                  value={guideName}
                  onChange={(e) => setGuideName(e.target.value)}
                  placeholder="e.g. Weekly Kitchen Order"
                  className="w-full border border-[#d9ddd8] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#969d97] focus:border-[#1f5a43]"
                />

                <button
                  type="button"
                  onClick={createOrderGuide}
                  disabled={savingGuide}
                  className="mt-3 flex min-h-11 w-full items-center justify-center border border-[#1f5a43] bg-white px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f5a43] transition-colors hover:bg-[#f1f5f2] disabled:opacity-60"
                >
                  {savingGuide
                    ? 'Creating Order Guide...'
                    : 'Create Order Guide'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  clearCart()
                  refreshCart()
                }}
                className="mt-3 flex min-h-11 w-full items-center justify-center border border-[#d9ddd8] px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#69716b] transition-colors hover:border-[#1f5a43] hover:text-[#1f5a43]"
              >
                Clear Cart
              </button>

              {message && (
                <p className="mt-4 border-l-2 border-[#1f5a43] bg-[#f8f9f7] px-4 py-3 text-sm text-[#69716b]">
                  {message}
                </p>
              )}

              <p className="mt-5 text-xs leading-5 text-[#69716b]">
                Orders are reviewed by Local Connect before fulfillment.
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function evaluateCartFulfillment(items: any[]) {
  const categoryGroups = new Map<
    string,
    {
      category: string
      subtotal: number
      minimum: number
      hasSpecialOrder: boolean
    }
  >()

  for (const item of items) {
    const product = item.product
    const category = product.category || 'Uncategorized'
    const lineTotal = Number(product.price ?? 0) * item.quantity
    const minimum = Number(product.category_minimum || 0)
    const inStock = Boolean(product.in_stock)

    const existing =
      categoryGroups.get(category) ||
      {
        category,
        subtotal: 0,
        minimum,
        hasSpecialOrder: false,
      }

    existing.subtotal += lineTotal
    existing.minimum = Math.max(existing.minimum, minimum)

    if (!inStock) {
      existing.hasSpecialOrder = true
    }

    categoryGroups.set(category, existing)
  }

  const failures = Array.from(categoryGroups.values()).filter(
    (group) =>
      group.hasSpecialOrder &&
      group.minimum > 0 &&
      group.subtotal < group.minimum
  )

  return {
    valid: failures.length === 0,
    failures,
  }
}

function CartRow({ item, imageUrl, refreshCart }: any) {
  const lineTotal = Number(item.product.price ?? 0) * item.quantity

  return (
    <div className="grid grid-cols-[2fr_0.55fr_0.6fr_0.7fr_0.75fr] items-center border-b border-[#e1e4df] px-4 py-4 text-sm transition-colors hover:bg-[#fafbf9] last:border-b-0">
      <ProductCell item={item} imageUrl={imageUrl} />

      <div className="text-[#69716b]">
        {item.product.unit || '—'}
      </div>

      <div className="font-semibold">{formatMoney(item.product.price)}</div>

      <QuantityControls item={item} refreshCart={refreshCart} />

      <div className="text-right">
        <p className="font-semibold">{formatMoney(lineTotal)}</p>

        <button
          type="button"
          onClick={() => {
            removeFromCart(item.product.id)
            refreshCart()
          }}
          className="mt-1 text-xs font-bold text-red-700 hover:text-red-900"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function MobileCartRow({ item, imageUrl, refreshCart }: any) {
  const lineTotal = Number(item.product.price ?? 0) * item.quantity

  return (
    <div className="border border-[#d9ddd8] bg-white p-4">
      <div className="flex items-start gap-3 border-b border-[#e1e4df] pb-3">
        <ProductCell item={item} imageUrl={imageUrl} mobile />

        <button
          type="button"
          onClick={() => {
            removeFromCart(item.product.id)
            refreshCart()
          }}
          className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <InfoBox label="Unit" value={item.product.unit || '—'} />
        <InfoBox label="Price" value={formatMoney(item.product.price)} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <QuantityControls item={item} refreshCart={refreshCart} />

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#69716b]">
            Line Total
          </p>
          <p className="text-lg font-semibold text-[#244f3d]">
            {formatMoney(lineTotal)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProductCell({ item, imageUrl, mobile = false }: any) {
  return (
    <div className="flex min-w-0 items-center gap-4 pr-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden border border-[#d9ddd8] bg-[#f8f9f7]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product.name || 'Product image'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#8b928d]">
            No Image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={
            mobile ? 'text-base font-semibold leading-snug' : 'font-bold leading-snug'
          }
        >
          {item.product.name}
        </p>

        <p className="mt-1 break-all font-mono text-xs text-[#69716b]">
          {item.product.sku}
        </p>

        <FulfillmentBadge product={item.product} />
      </div>
    </div>
  )
}

function QuantityControls({ item, refreshCart }: any) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => {
          updateCartItem(item.product.id, item.quantity - 1)
          refreshCart()
        }}
        className="h-9 w-9 border border-[#d9ddd8] bg-[#f8f9f7] text-sm font-semibold transition-colors hover:border-[#1f5a43] hover:text-[#1f5a43]"
      >
        -
      </button>

      <span className="flex h-9 w-11 items-center justify-center border-y border-[#d9ddd8] bg-white text-sm font-semibold">
        {item.quantity}
      </span>

      <button
        type="button"
        onClick={() => {
          updateCartItem(item.product.id, item.quantity + 1)
          refreshCart()
        }}
        className="h-9 w-9 border border-[#d9ddd8] bg-[#f8f9f7] text-sm font-semibold transition-colors hover:border-[#1f5a43] hover:text-[#1f5a43]"
      >
        +
      </button>
    </div>
  )
}

function FulfillmentBadge({ product }: { product: any }) {
  const isProducerProduct = Boolean(product.producer_customer_id)

  const fulfillmentType = product.fulfillment_type
  const producerDeliveryFulfillmentType =
    product.producer_delivery_fulfillment_type

  const isLcFulfilled =
    fulfillmentType === 'lc_stocked' ||
    producerDeliveryFulfillmentType === 'local_connect'

  const schedule = getSchedule(
    isProducerProduct
      ? product.producer_delivery_schedule || product.delivery_schedule
      : product.delivery_schedule || product.category_delivery_schedule
  )

  if (isProducerProduct) {
    return (
      <div className="mt-2">
        <p
          className={`inline-flex px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
            isLcFulfilled
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isLcFulfilled ? 'Fulfilled by LC' : 'Producer Delivered'}
        </p>

        {schedule.length > 0 ? (
          <p className="mt-1 text-[11px] leading-4 text-[#69716b]">
            {formatSchedule(schedule)}
          </p>
        ) : (
          <p className="mt-1 text-[11px] leading-4 text-[#69716b]">
            Producer delivery terms not set.
          </p>
        )}
      </div>
    )
  }

  const inStock = Boolean(product.in_stock)
  const minimum = Number(product.category_minimum || 0)

  return (
    <div className="mt-2">
      <p
        className={`inline-flex px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
          inStock
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}
      >
        {inStock
          ? 'In Stock'
          : minimum > 0
            ? `Special Order · $${minimum} ${product.category} min`
            : 'Special Order'}
      </p>

      {!inStock && schedule.length > 0 && (
        <p className="mt-1 text-[11px] leading-4 text-[#69716b]">
          {formatSchedule(schedule)}
        </p>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#69716b]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e1e4df] bg-[#f8f9f7] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#69716b]">
        {label}
      </p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}

function getSchedule(value: any) {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function formatSchedule(schedule: any[]) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return 'Delivery schedule not set.'
  }

  return schedule
    .map(
      (item) =>
        `${item.delivery_day} delivery, order by ${item.cutoff_day} at ${formatTime(
          item.cutoff_time
        )}`
    )
    .join(' · ')
}

function formatTime(time: string) {
  if (!time) return 'cutoff not set'

  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}

function formatMoney(value: any) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(number)
}