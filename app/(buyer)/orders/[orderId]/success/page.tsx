'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrderSuccessPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          customers (
            business_name,
            contact_name,
            delivery_address,
            delivery_city,
            delivery_postal_code
          )
        `)
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder(data)
      }

      setLoading(false)
    }

    if (orderId) loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-8 text-[#1e1e1e]">
        <div className="mx-auto max-w-3xl border border-[#d6cec0] bg-white p-8 shadow-sm">
          <p className="font-black text-[#244f3d]">Loading confirmation...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-8 text-[#1e1e1e]">
        <div className="mx-auto max-w-3xl border border-[#d6cec0] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Order not found</h1>
          <Link href="/products" className="mt-6 inline-block bg-[#244f3d] px-5 py-3 text-sm font-black text-white">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = Number(order.subtotal || 0)

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-8 text-[#1e1e1e]">
      <div className="mx-auto max-w-4xl">
        <div className="border border-[#d6cec0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <div className="mt-4 rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-800 w-fit">
            Order Confirmed
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Thank you! Your order has been received.
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-[#6f675c]">
            We&apos;ll review your order, confirm inventory, and send your invoice shortly.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info label="Order ID" value={order.id} />
            <Info label="Delivery" value={order.delivery_label || 'To be confirmed'} />
            <Info label="Subtotal" value={formatMoney(subtotal)} />
          </div>

          {order.customers?.business_name && (
            <div className="mt-6 border border-[#d6cec0] bg-[#f4f1ea] p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
                Account
              </p>
              <p className="mt-1 text-lg font-black">
                {order.customers.business_name}
              </p>
              <p className="mt-1 text-sm font-medium text-[#6f675c]">
                {order.customers.delivery_address}, {order.customers.delivery_city}, BC
              </p>
            </div>
          )}

          <div className="mt-6 border border-[#d6cec0]">
            <div className="bg-[#244f3d] px-4 py-3">
              <h2 className="font-black text-white">Order Summary</h2>
            </div>

            <div className="divide-y divide-[#eee7da]">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between gap-4 p-4 text-sm">
                  <div>
                    <p className="font-black">{item.product_name}</p>
                    <p className="mt-1 text-xs font-medium text-[#6f675c]">
                      {item.quantity} × {formatMoney(item.unit_price)}
                    </p>
                  </div>

                  <p className="font-black text-[#244f3d]">
                    {formatMoney(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/account"
              className="bg-[#244f3d] px-5 py-3 text-center text-sm font-black text-white hover:bg-[#2f5d46]"
            >
              View My Orders
            </Link>

            <Link
              href="/products"
              className="border border-[#244f3d] px-5 py-3 text-center text-sm font-black text-[#244f3d] hover:bg-[#244f3d] hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#eee7da] bg-[#f4f1ea] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
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