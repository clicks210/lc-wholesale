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

    const { data: membership, error: membershipError } = await supabase
      .from('customer_members')
      .select('customer_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      setMessage('Could not find your customer account.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('customer_order_guides')
      .select('id, user_id, customer_id, name, description, created_at')
      .eq('customer_id', membership.customer_id)
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
      <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl border border-[#d6cec0] bg-white p-6 text-sm font-medium text-[#6f675c] shadow-sm sm:p-8">
          Loading order guides...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-5 text-[#1e1e1e] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
            Local Connect Wholesale
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Order Guides
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[#6f675c]">
                Save repeat orders and reorder your regular products faster.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex w-full justify-center bg-[#244f3d] px-5 py-3 text-sm font-black text-white hover:bg-[#2f5d46] md:w-auto"
            >
              Build New Guide
            </Link>
          </div>
        </section>

        <div className="mb-5 border border-[#1d1d1b]/15 bg-white p-4 text-sm font-medium leading-6 text-[#5f5f57] shadow-sm sm:p-5">
          <p>
            Don’t want to build your order guide?{' '}
            <span className="font-black text-[#244f3d]">
              Your Local Connect rep can set it up for you.
            </span>
          </p>

          <p className="mt-2">
            Reach out or email{' '}
            <a
              href="mailto:liam@localconnectfood.ca"
              className="font-black underline underline-offset-4 hover:text-[#244f3d]"
            >
              lmilovick@gmail.com
            </a>
          </p>
        </div>

        <div className="mb-5 border border-[#d6cec0] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
                Produce Planning
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Standard Weekly Produce Profile
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#6f675c]">
                Set your standard weekly produce usage so Local Connect can better
                forecast inventory and source from local farms for your deliveries.
              </p>
            </div>

            <Link
              href="/produce-planner"
              className="inline-flex w-full items-center justify-center bg-[#244f3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2f5d46] md:w-auto"
            >
              Open Produce Planner
            </Link>
          </div>
        </div>

        {message && (
          <div className="mb-5 border border-[#d6cec0] bg-white p-4 text-sm font-medium text-[#6f675c] shadow-sm">
            {message}
          </div>
        )}

        {guides.length === 0 ? (
          <div className="border border-[#d6cec0] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#244f3d]">
              No saved guides
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              No order guides yet
            </h2>

            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#6f675c]">
              Add products to your cart, then save the cart as an order guide.
              Perfect for weekly kitchen orders, paper supplies, produce lists,
              and recurring prep orders.
            </p>

            <Link
              href="/products"
              className="mt-5 inline-flex w-full justify-center bg-[#244f3d] px-5 py-3 text-sm font-black text-white hover:bg-[#2f5d46] sm:w-auto"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={`/order-guide/${guide.id}`}
                className="group block border border-[#d6cec0] bg-white p-4 shadow-sm transition hover:border-[#244f3d] sm:p-5"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#eee7da] pb-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#244f3d]">
                      Saved Guide
                    </p>

                    <h2 className="mt-2 break-words text-xl font-black tracking-[-0.03em] group-hover:text-[#244f3d]">
                      {guide.name || 'Untitled Guide'}
                    </h2>
                  </div>

                  <span className="shrink-0 text-2xl font-black text-[#6f675c] group-hover:text-[#244f3d]">
                    →
                  </span>
                </div>

                {guide.description ? (
                  <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-[#6f675c]">
                    {guide.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm font-medium leading-6 text-[#6f675c]">
                    No description added.
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 border border-[#eee7da] bg-[#f4f1ea] p-3 text-xs">
                  <span className="font-black uppercase tracking-wide text-[#6f675c]">
                    Created
                  </span>
                  <span className="font-black text-[#244f3d]">
                    {formatDate(guide.created_at)}
                  </span>
                </div>

                <div className="mt-3 w-full border border-[#244f3d] px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-[#244f3d] group-hover:bg-[#244f3d] group-hover:text-white">
                  Open Guide
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}