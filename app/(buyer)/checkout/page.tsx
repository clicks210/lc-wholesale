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

  useEffect(() => {
    async function loadCheckout() {
      setItems([...getCart()])

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setCustomer(data)

      if (data?.delivery_notes) {
        setNotes(data.delivery_notes)
      }
    }

    loadCheckout()
  }, [])

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price ?? 0) * item.quantity
  }, 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const categoryDeliveryGroups = getDeliveryGroups(items)

  const deliveryGroups = categoryDeliveryGroups.reduce((groups: any[], group: any) => {
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
  }, [])

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

    try {
      await submitOrder({
        items,
        deliveryDate: '',
        notes: `${notes}\n\nDelivery Schedule:\n${deliverySummary}`.trim(),
      })

      clearCart()
      window.dispatchEvent(new Event('cartUpdated'))
      setMessage('Order submitted successfully.')
    } catch (error: any) {
      setMessage(error.message || 'Order submission failed.')
    }

    setSubmitting(false)
  }

  if (items.length === 0 && !message) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
        <div className="mx-auto max-w-4xl border border-[#d6cec0] bg-white p-8">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="mt-3 text-sm text-[#6f675c]">Your cart is empty.</p>

          <Link
            href="/products"
            className="mt-6 inline-block bg-[#244f3d] px-5 py-3 text-sm font-bold text-white"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 border border-[#d6cec0] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <h1 className="mt-2 text-2xl font-semibold">Checkout</h1>

          <p className="mt-1 text-sm text-[#6f675c]">
            Review account details, delivery timing, and place your order.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <div className="border border-[#d6cec0] bg-white p-6">
              <h2 className="text-lg font-semibold">Account Information</h2>

              <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                <Info label="Business" value={customer?.business_name} />
                <Info label="Contact" value={customer?.contact_name} />
                <Info label="Phone" value={customer?.phone} />
                <Info
                  label="Account Status"
                  value={customer?.approved ? 'Approved' : 'Pending'}
                />
              </div>

              <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Delivery Address
                </p>

                <p className="mt-2 font-semibold">
                  {customer?.delivery_address || 'No delivery address on file'}
                </p>

                <p className="mt-1 text-[#6f675c]">
                  {customer?.delivery_city || '—'}, BC{' '}
                  {customer?.delivery_postal_code || ''}
                </p>

                <p className="mt-3 text-[#6f675c]">
                  {customer?.delivery_notes || 'No delivery notes added.'}
                </p>
              </div>

              <Link
                href="/account"
                className="mt-4 inline-block text-sm font-bold text-[#244f3d]"
              >
                Edit account details →
              </Link>
            </div>

            <div className="border border-[#d6cec0] bg-white">
              <div className="border-b border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Delivery Schedule & Items
              </div>

              <div className="divide-y divide-[#eee7da]">
                {deliveryGroups.map((group: any) => (
                  <div key={group.deliveryLabel} className="p-4">
                    <div className="mb-4">
                      <p className="font-bold text-[#244f3d]">
                        {group.deliveryLabel}
                      </p>

                      <p className="mt-1 text-xs text-[#6f675c]">
                        {[...new Set(group.categories)].join(' / ')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item: any) => (
                        <div key={item.product.id} className="text-sm">
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="mt-1 text-xs text-[#6f675c]">
                            {item.product.sku} · {item.product.category} ·{' '}
                            {item.quantity} × $
                            {Number(item.product.price ?? 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#d6cec0] bg-white p-6">
              <h2 className="text-lg font-semibold">Order Notes</h2>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
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

          <aside className="h-fit border border-[#d6cec0] bg-white p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-5 space-y-3 border-b border-[#d6cec0] pb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6f675c]">Items</span>
                <span>{itemCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6f675c]">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6f675c]">Deliveries</span>
                <span>{deliveryGroups.length}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting || items.length === 0}
              className="mt-6 w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f5d46] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="mt-3 block w-full border border-[#d6cec0] px-5 py-3 text-center text-sm font-bold text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
            >
              Back to Cart
            </Link>

            {message && (
              <p className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-3 text-sm text-[#6f675c]">
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
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value || '—'}</p>
    </div>
  )
}