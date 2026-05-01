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

  useEffect(() => {
    refreshCart()
  }, [])

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price ?? 0) * item.quantity
  }, 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

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

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      console.error('Customer fetch error:', customerError)
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
        customer_id: customer.id,
        name: guideName.trim(),
        description: notes || null,
      })
      .select()
      .single()

    if (guideError || !guide) {
      console.error('Create guide error:', guideError)
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
      console.error('Create guide items error:', itemsError)
      setMessage('Guide created, but products could not be saved.')
      setSavingGuide(false)
      return
    }

    setGuideName('')
    setMessage('Order guide created successfully.')
    setSavingGuide(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-6 text-[#1e1e1e]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 border border-[#d6cec0] bg-white px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <div className="mt-2">
            <h1 className="text-2xl font-semibold">Cart</h1>
            <p className="mt-1 text-sm text-[#6f675c]">
              {itemCount} items in your wholesale order
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border border-[#d6cec0] bg-white p-8 text-sm text-[#6f675c]">
            {message || 'No items in cart.'}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="border border-[#d6cec0] bg-white">
              <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_80px] border-b border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                <div>Product</div>
                <div>Unit</div>
                <div>Price</div>
                <div>Qty</div>
                <div></div>
              </div>

              {items.map((item) => {
                const lineTotal =
                  Number(item.product.price ?? 0) * item.quantity

                return (
                  <div
                    key={item.product.id}
                    className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_80px] items-center border-b border-[#eee7da] px-4 py-4 text-sm last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="mt-1 font-mono text-xs text-[#6f675c]">
                        {item.product.sku}
                      </p>
                    </div>

                    <div className="text-[#6f675c]">
                      {item.product.unit || '—'}
                    </div>

                    <div className="font-semibold">
                      ${Number(item.product.price ?? 0).toFixed(2)}
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          updateCartItem(item.product.id, item.quantity - 1)
                          refreshCart()
                        }}
                        className="border border-[#d6cec0] px-2 py-1"
                      >
                        -
                      </button>

                      <span className="w-10 border-y border-[#d6cec0] py-1 text-center">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          updateCartItem(item.product.id, item.quantity + 1)
                          refreshCart()
                        }}
                        className="border border-[#d6cec0] px-2 py-1"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">${lineTotal.toFixed(2)}</p>

                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.product.id)
                          refreshCart()
                        }}
                        className="mt-1 text-xs font-semibold text-[#6f675c] hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <aside className="border border-[#d6cec0] bg-white p-5">
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
                  <span className="text-[#6f675c]">Delivery</span>
                  <span>Calculated later</span>
                </div>
              </div>

              <div className="mt-5 flex justify-between text-lg font-bold">
                <span>Estimated Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Order Notes
                </label>

                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery notes, substitutions, timing, etc."
                  className="w-full border border-[#d6cec0] bg-white px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full bg-[#244f3d] px-5 py-3 text-center text-sm font-bold text-white hover:bg-[#2f5d46]"
              >
                Continue to Checkout
              </Link>

              <div className="mt-3 border border-[#d6cec0] bg-[#f4f1ea] p-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Save Cart as Order Guide
                </label>

                <input
                  value={guideName}
                  onChange={(e) => setGuideName(e.target.value)}
                  placeholder="e.g. Weekly Kitchen Order"
                  className="w-full border border-[#d6cec0] bg-white px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />

                <button
                  type="button"
                  onClick={createOrderGuide}
                  disabled={savingGuide}
                  className="mt-3 w-full border border-[#244f3d] bg-white px-5 py-3 text-sm font-bold text-[#244f3d] hover:bg-white/70 disabled:opacity-60"
                >
                  {savingGuide ? 'Creating Order Guide...' : 'Create Order Guide'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  clearCart()
                  refreshCart()
                }}
                className="mt-3 w-full border border-[#d6cec0] px-5 py-3 text-sm font-bold text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
              >
                Clear Cart
              </button>

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
        )}
      </div>
    </div>
  )
}