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
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl border border-[#d6cec0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
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
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em]">
                Checkout
              </h1>

              <p className="mt-1 text-sm font-medium text-[#6f675c]">
                Review your account, delivery schedule, and order total.
              </p>
            </div>

            <Link
              href="/cart"
              className="mt-3 inline-flex w-fit border border-[#244f3d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#244f3d] hover:bg-[#244f3d] hover:text-white sm:mt-0"
            >
              Back to Cart
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
              <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
                <h2 className="text-base font-black text-white sm:text-lg">
                  Account Information
                </h2>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Business" value={customer?.business_name} />
                  <Info label="Contact" value={customer?.contact_name} />
                  <Info label="Phone" value={customer?.phone} />
                  <Info
                    label="Account Status"
                    value={customer?.approved ? 'Approved' : 'Pending'}
                  />
                </div>

                <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-4 text-sm">
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#6f675c]">
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
  <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
    <h2 className="text-base font-black text-white sm:text-lg">
      Delivery Schedule & Items
    </h2>
  </div>

  <div className="divide-y divide-[#eee7da]">
    {deliveryGroups.map((group: any) => (
      <div key={group.deliveryLabel} className="p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-[#244f3d]">
              {group.deliveryLabel}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
              {[...new Set(group.categories)].join(' / ')}
            </p>
          </div>

          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            {group.items.length} products
          </p>
        </div>

        <div className="space-y-2">
          {group.items.map((item: any) => {
            const lineTotal =
              Number(item.product.price ?? 0) * item.quantity

            return (
              <div
                key={item.product.id}
                className="flex items-start justify-between gap-3 border border-[#eee7da] bg-[#f9f7f1] px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">
                    {item.product.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#6f675c]">
                    {item.quantity} × ${Number(item.product.price ?? 0).toFixed(2)}
                    {item.product.category ? ` · ${item.product.category}` : ''}
                  </p>
                </div>

                <p className="shrink-0 font-black text-[#244f3d]">
                  ${lineTotal.toFixed(2)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    ))}
  </div>
</div>

            <div className="overflow-hidden border border-[#d6cec0] bg-white shadow-sm">
              <div className="border-b border-[#d6cec0] bg-[#244f3d] px-5 py-4">
                <h2 className="text-base font-black text-white sm:text-lg">
                  Order Notes
                </h2>
              </div>

              <div className="p-5 sm:p-6">
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

          <aside className="h-fit border border-[#d6cec0] bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="text-xl font-black tracking-[-0.03em]">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3 border-b border-[#d6cec0] pb-5 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-[#6f675c]">Items</span>
                <span className="font-bold">{itemCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-[#6f675c]">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-[#6f675c]">Deliveries</span>
                <span className="font-bold">{deliveryGroups.length}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-between text-lg font-black">
              <span>Total</span>
              <span className="text-[#244f3d]">${subtotal.toFixed(2)}</span>
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
      <p className="mt-1 break-words font-black">{value || '—'}</p>
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 break-words font-bold">{value}</p>
    </div>
  )
}