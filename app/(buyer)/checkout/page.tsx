'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCart, clearCart } from '@/lib/cart'
import { submitOrder } from '@/lib/orders'
import { supabase } from '@/lib/supabase'
import { getDeliveryGroups } from '@/lib/delivery'

export default function CheckoutPage() {
  const [items, setItems] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
    async function loadCheckout() {
      setItems([...getCart()])

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

      if (customerData.delivery_notes) {
        setNotes(customerData.delivery_notes)
      }
    }

    loadCheckout()
  }, [])

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price ?? 0) * item.quantity
  }, 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const orderMinimum = Number(customer?.order_minimum ?? 0)
  const deliveryCost = Number(customer?.delivery_cost ?? 0)

  const freightApplied =
    orderMinimum > 0 && subtotal < orderMinimum ? deliveryCost : 0

  const amountUntilFreeDelivery = Math.max(orderMinimum - subtotal, 0)

  const total = subtotal + freightApplied

  const categoryDeliveryGroups = getDeliveryGroups(items)

  const deliveryGroups = categoryDeliveryGroups.reduce(
    (groups: any[], group: any) => {
      const deliveryLabel = group.delivery?.label || 'To be confirmed'
      const existing = groups.find((g) => g.deliveryLabel === deliveryLabel)

      if (existing) {
        existing.items.push(...group.items)
        existing.categories.push(group.category)
      } else {
        groups.push({
          deliveryLabel,
          categories: [group.category],
          items: [...group.items],
        })
      }

      return groups
    },
    []
  )

  async function handleSubmitOrder() {
    setSubmitting(true)
    setMessage('')

    const deliverySummary = deliveryGroups
      .map((group: any) => {
        const itemSummary = group.items
          .map((item: any) => `- ${item.product.name} x ${item.quantity}`)
          .join('\n')

        return `${group.deliveryLabel}\n${[
          ...new Set(group.categories),
        ].join(' / ')}\n${itemSummary}`
      })
      .join('\n\n')

    const freightSummary =
      freightApplied > 0
        ? `Freight Applied: ${formatMoney(freightApplied)} because subtotal ${formatMoney(
            subtotal
          )} is below order minimum ${formatMoney(orderMinimum)}.`
        : `Freight: Free. Subtotal ${formatMoney(
            subtotal
          )} meets order minimum ${formatMoney(orderMinimum)}.`

    try {
      await submitOrder({
        items,
        deliveryDate: '',
        notes: `${notes}

Delivery Schedule:
${deliverySummary}

Delivery Terms:
Order Minimum: ${formatMoney(orderMinimum)}
Freight Rate: ${formatMoney(deliveryCost)}
${freightSummary}

Order Totals:
Subtotal: ${formatMoney(subtotal)}
Freight: ${formatMoney(freightApplied)}
Total: ${formatMoney(total)}`.trim(),
      })

      clearCart()
      window.dispatchEvent(new Event('cartUpdated'))
      window.dispatchEvent(new Event('cart-updated'))
      setItems([])
      setMessage('Order submitted successfully.')
    } catch (error: any) {
      setMessage(error.message || 'Order submission failed.')
    }

    setSubmitting(false)
  }

  if (items.length === 0 && !message) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-3 py-4 text-[#1e1e1e] sm:px-6 sm:py-5 lg:px-10">
        <div className="mx-auto max-w-4xl border border-[#d6cec0] bg-white p-5 shadow-sm sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#244f3d] sm:text-[11px]">
            Local Connect Wholesale
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Checkout
          </h1>

          <p className="mt-3 text-sm font-medium text-[#6f675c]">
            Your cart is empty.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block bg-[#244f3d] px-5 py-3 text-sm font-black text-white hover:bg-[#2f5d46]"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-3 py-4 text-[#1e1e1e] sm:px-6 sm:py-5 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 border border-[#d6cec0] bg-white p-4 shadow-sm sm:mb-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#244f3d] sm:text-[11px]">
            Local Connect Wholesale
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                Checkout
              </h1>

              <p className="mt-1 text-sm font-medium leading-5 text-[#6f675c]">
                Review your account, delivery schedule, and order total.
              </p>
            </div>

            <Link
              href="/cart"
              className="inline-flex w-fit border border-[#244f3d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
            >
              Back to Cart
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-5">
            <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
              <div className="border-b border-[#d6cec0] bg-[#244f3d] px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-base font-black text-white sm:text-lg">
                  Account Information
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Business" value={customer?.business_name} />
                  <Info label="Contact" value={customer?.contact_name} />
                  <Info label="Phone" value={customer?.phone} />
                  <Info
                    label="Account Status"
                    value={customer?.approved ? 'Approved' : 'Pending'}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat
                    label="Order Minimum"
                    value={formatMoney(orderMinimum)}
                  />
                  <MiniStat
                    label="Freight If Below Minimum"
                    value={formatMoney(deliveryCost)}
                  />
                </div>

                <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] sm:text-[11px]">
                    Delivery Address
                  </p>

                  <p className="mt-2 font-black leading-snug">
                    {customer?.delivery_address || 'No delivery address on file'}
                  </p>

                  <p className="mt-1 font-medium text-[#6f675c]">
                    {customer?.delivery_city || '—'}, BC{' '}
                    {customer?.delivery_postal_code || ''}
                  </p>

                  <p className="mt-3 leading-5 text-[#6f675c]">
                    {customer?.delivery_notes || 'No delivery notes added.'}
                  </p>
                </div>

                <Link
                  href="/account"
                  className="mt-4 inline-block text-sm font-black text-[#244f3d]"
                >
                  Edit account details →
                </Link>
              </div>
            </div>

            <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
              <div className="border-b border-[#d6cec0] bg-[#244f3d] px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-base font-black text-white sm:text-lg">
                  Delivery Schedule & Items
                </h2>
              </div>

              <div className="divide-y divide-[#eee7da]">
                {deliveryGroups.map((group: any) => (
                  <div key={group.deliveryLabel} className="p-3 sm:p-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black text-[#244f3d]">
                          {group.deliveryLabel}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#6f675c] sm:text-xs">
                          {[...new Set(group.categories)].join(' / ')}
                        </p>
                      </div>

                      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] sm:text-xs">
                        {group.items.length} products
                      </p>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item: any) => {
                        const lineTotal =
                          Number(item.product.price ?? 0) * item.quantity
                        const imageUrl = getProductImage(item.product)

                        return (
                          <div
                            key={item.product.id}
                            className="flex gap-3 border border-[#eee7da] bg-[#f9f7f1] p-3 text-sm sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#d6cec0] bg-[#f4f1ea] sm:h-20 sm:w-20">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.product.name || 'Product image'}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-black uppercase tracking-wide text-[#8a8173] sm:text-[10px]">
                                    No Image
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-black leading-snug sm:text-base">
                                  {item.product.name}
                                </p>

                                <p className="mt-1 text-[11px] font-medium leading-4 text-[#6f675c] sm:text-xs">
                                  {item.quantity} ×{' '}
                                  {formatMoney(item.product.price)}
                                  {item.product.category
                                    ? ` · ${item.product.category}`
                                    : ''}
                                </p>

                                {item.product.sku && (
                                  <p className="mt-1 truncate font-mono text-[10px] text-[#8a8173] sm:text-[11px]">
                                    {item.product.sku}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c] sm:hidden">
                                Total
                              </p>
                              <p className="text-sm font-black text-[#244f3d] sm:text-base">
                                {formatMoney(lineTotal)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
              <div className="border-b border-[#d6cec0] bg-[#244f3d] px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-base font-black text-white sm:text-lg">
                  Order Notes
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#6f675c]">
                  Notes for Local Connect
                </label>

                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Substitutions, receiving instructions, special handling..."
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>
            </div>
          </section>

          <aside className="h-fit border border-[#d6cec0] bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-5">
            <h2 className="text-lg font-black tracking-[-0.03em] sm:text-xl">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3 border-b border-[#d6cec0] pb-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-[#6f675c]">Items</span>
                <span className="font-bold">{itemCount}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-medium text-[#6f675c]">Subtotal</span>
                <span className="font-bold">{formatMoney(subtotal)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-medium text-[#6f675c]">Deliveries</span>
                <span className="font-bold">{deliveryGroups.length}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-medium text-[#6f675c]">
                  Order Minimum
                </span>
                <span className="font-bold">{formatMoney(orderMinimum)}</span>
              </div>

              {freightApplied > 0 ? (
                <div className="border border-orange-200 bg-orange-50 p-3">
                  <div className="flex justify-between gap-4 text-orange-800">
                    <span className="font-black">Freight</span>
                    <span className="font-black">
                      {formatMoney(freightApplied)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-5 text-orange-800">
                    Add {formatMoney(amountUntilFreeDelivery)} more to reach
                    this account&apos;s minimum and remove freight.
                  </p>
                </div>
              ) : (
                <div className="border border-green-200 bg-green-50 p-3">
                  <div className="flex justify-between gap-4 text-green-800">
                    <span className="font-black">Freight</span>
                    <span className="font-black">Free</span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-5 text-green-800">
                    This order meets the account minimum.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-between gap-4 text-base font-black sm:text-lg">
              <span>Total</span>
              <span className="text-[#244f3d]">{formatMoney(total)}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting || items.length === 0}
              className="mt-6 w-full bg-[#244f3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2f5d46] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Placing Order...
                </span>
              ) : (
                'Place Order'
              )}
            </button>

            <Link
              href="/cart"
              className="mt-3 block w-full border border-[#d6cec0] px-5 py-3 text-center text-sm font-black text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
            >
              Back to Cart
            </Link>

            {message && (
              <p className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-3 text-sm font-medium text-[#6f675c]">
                {message}
              </p>
            )}

            <p className="mt-5 text-xs leading-5 text-[#6f675c]">
              Orders are reviewed by Local Connect before fulfillment.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black sm:text-base">
        {value || '—'}
      </p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold sm:text-base">
        {value}
      </p>
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