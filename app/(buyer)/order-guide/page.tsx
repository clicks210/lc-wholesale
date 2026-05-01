'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type OrderGuide = {
  id: string
  user_id?: string | null
  customer_id?: string | null
  name: string | null
  description: string | null
  created_at: string
}

export default function OrderGuidesPage() {
  const [guides, setGuides] = useState<OrderGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (customerError || !customer) {
      setMessage('Could not find your customer account.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('customer_order_guides')
      .select('id, user_id, customer_id, name, description, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Could not load order guides.')
      setLoading(false)
      return
    }

    setGuides(data || [])
    setLoading(false)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
        <div className="mx-auto max-w-7xl border border-[#d6cec0] bg-white p-8 text-sm text-[#6f675c]">
          Loading order guides...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 text-[#1e1e1e]">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <section className="mb-6 border border-[#d6cec0] bg-white px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Order Guides</h1>
              <p className="mt-1 text-sm text-[#6f675c]">
                Save repeat orders and reorder your regular products faster.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46]"
            >
              Build New Guide
            </Link>
          </div>
        </section>

        {/* 🔥 SUPPORT NOTE */}
        <div className="mb-6 border border-[#1d1d1b]/15 bg-[#fbfaf7] px-5 py-4 text-sm text-[#5f5f57]">
          Don’t want to build your order guide?{' '}
          <span className="font-semibold text-[#244f3d]">
            Your Local Connect rep can set it up for you.
          </span>{' '}
          Just reach out or email{' '}
          <a
            href="mailto:liam@localconnectfood.ca"
            className="underline hover:text-[#244f3d]"
          >
            liam@localconnectfood.ca
          </a>
        </div>

        {message && (
          <div className="mb-5 border border-[#d6cec0] bg-white p-4 text-sm text-[#6f675c]">
            {message}
          </div>
        )}

        {/* EMPTY STATE */}
        {guides.length === 0 ? (
          <div className="border border-[#d6cec0] bg-white p-8">
            <h2 className="text-xl font-semibold">No order guides yet</h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f675c]">
              Add products to your cart, then save the cart as an order guide.
              This is perfect for weekly kitchen orders, paper supplies,
              produce lists, and recurring prep orders.
            </p>

            <Link
              href="/products"
              className="mt-5 inline-flex bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={`/order-guide/${guide.id}`}
                className="group border border-[#d6cec0] bg-white p-5 transition hover:border-[#244f3d] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#244f3d]">
                      Saved Guide
                    </p>

                    <h2 className="mt-2 text-xl font-semibold group-hover:text-[#244f3d]">
                      {guide.name || 'Untitled Guide'}
                    </h2>
                  </div>

                  <span className="text-xl text-[#6f675c] group-hover:text-[#244f3d]">
                    →
                  </span>
                </div>

                {guide.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6f675c]">
                    {guide.description}
                  </p>
                )}

                <div className="mt-6 border-t border-[#eee7da] pt-4 text-sm text-[#6f675c]">
                  Created {formatDate(guide.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}