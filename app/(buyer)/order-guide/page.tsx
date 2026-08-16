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
      <div className="min-h-screen bg-[#f4f5f2] px-5 py-8 text-[#181c19] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
            Local Connect / Order Guides
          </p>

          <div className="mt-5 border-t border-[#d9ddd8] pt-6">
            <p className="text-sm text-[#69716b]">
              Loading order guides…
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#181c19]">
      <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 sm:py-9 lg:px-12">

        {/* PAGE HEADER */}
        <section className="border-b border-[#d9ddd8] pb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
            Local Connect / Order Guides
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.045em] sm:text-5xl">
                Order Guides
              </h1>

              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#69716b] sm:text-[15px]">
                Save repeat orders and reorder your regular products faster.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex min-h-12 w-full items-center justify-center bg-[#1f5a43] px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#174735] sm:w-auto"
            >
              Build New Guide
            </Link>
          </div>
        </section>

        {/* REP SUPPORT */}
        <section className="mt-6 border-l-2 border-[#1f5a43] bg-white px-5 py-4">
          <p className="text-sm leading-6 text-[#5f675f]">
            Don’t want to build your order guide?{' '}
            <span className="font-semibold text-[#1f5a43]">
              Your Local Connect rep can set it up for you.
            </span>
          </p>

          <p className="mt-1 text-sm text-[#69716b]">
            Reach out or email{' '}
            <a
              href="mailto:liam@localconnectfood.ca"
              className="font-semibold text-[#1f5a43] underline underline-offset-4"
            >
              lmilovick@gmail.com
            </a>
          </p>
        </section>

        {/* PRODUCE PLANNING */}
        <section className="mt-6 border border-[#d9ddd8] bg-white">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                Produce Planning
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                Standard Weekly Produce Profile
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#69716b]">
                Set your standard weekly produce usage so Local Connect can better
                forecast inventory and source from local farms for your deliveries.
              </p>
            </div>

            <Link
              href="/produce-planner"
              className="inline-flex min-h-11 w-full items-center justify-center border border-[#1f5a43] px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f5a43] transition-colors hover:bg-[#f1f5f2] sm:w-auto"
            >
              Open Produce Planner
            </Link>
          </div>
        </section>

        {message && (
          <div className="mt-6 border-l-2 border-[#1f5a43] bg-white px-4 py-3 text-sm text-[#69716b]">
            {message}
          </div>
        )}

        {/* GUIDES */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f9690]">
                Saved Guides
              </p>

              <p className="mt-1 text-sm text-[#69716b]">
                {guides.length} {guides.length === 1 ? 'guide' : 'guides'}
              </p>
            </div>
          </div>

          {guides.length === 0 ? (
            <div className="border-y border-[#d9ddd8] bg-white px-6 py-16 sm:px-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                No saved guides
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                No order guides yet
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#69716b]">
                Add products to your cart, then save the cart as an order guide.
                Perfect for weekly kitchen orders, paper supplies, produce lists,
                and recurring prep orders.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex min-h-11 items-center bg-[#1f5a43] px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#174735]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid border-l border-t border-[#d9ddd8] sm:grid-cols-2 xl:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/order-guide/${guide.id}`}
                  className="group flex min-h-[280px] flex-col border-b border-r border-[#d9ddd8] bg-white p-5 transition-colors hover:bg-[#fafbf9] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8f9690]">
                        Saved Guide
                      </p>

                      <h2 className="mt-3 break-words text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#1f5a43]">
                        {guide.name || 'Untitled Guide'}
                      </h2>
                    </div>

                    <span className="shrink-0 text-xl text-[#1f5a43] transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  {guide.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#69716b]">
                      {guide.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-[#969c97]">
                      No description added.
                    </p>
                  )}

                  <div className="mt-auto border-t border-[#e1e4df] pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8f9690]">
                        Created
                      </span>

                      <span className="text-xs font-semibold text-[#1f5a43]">
                        {formatDate(guide.created_at)}
                      </span>
                    </div>

                    <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f5a43]">
                      Open Guide →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}