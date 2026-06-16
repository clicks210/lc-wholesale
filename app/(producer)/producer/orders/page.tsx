'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProducerOrdersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  async function loadOrders() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('producer_order_items')
      .select(`
        *,
        order:orders!producer_order_items_order_id_fkey (
          id,
          created_at,
          status,
          notes,
          delivery_address,
          delivery_city,
          delivery_postal_code,
          delivery_notes
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function toggleHidden(orderId: string, hidden: boolean) {
    setTogglingId(orderId)
    setMessage('')

    const nextHidden = !hidden

    const { error } = await supabase
      .from('producer_order_items')
      .update({ hidden: nextHidden })
      .eq('order_id', orderId)

    if (error) {
      setMessage(error.message)
      setTogglingId(null)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.order_id === orderId ? { ...item, hidden: nextHidden } : item
      )
    )

    setTogglingId(null)
  }

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any> = {}

    for (const item of items) {
      const isItemHidden = Boolean(item.hidden)
      if (!showHidden && isItemHidden) continue

      const orderId = item.order_id
      const orderRecord = item.order || null

      if (!groups[orderId]) {
        groups[orderId] = {
          orderId,
          order: orderRecord,
          buyer_business_name: item.buyer_business_name || 'Buyer Account',
          buyer_contact_name: item.buyer_contact_name || null,
          order_submitted_at:
            item.order_submitted_at || orderRecord?.created_at || item.created_at,
          delivery_label: item.delivery_label,
          delivery_date: item.delivery_date,
          delivery_address:
            item.delivery_address || orderRecord?.delivery_address || null,
          delivery_city: item.delivery_city || orderRecord?.delivery_city || null,
          delivery_postal_code:
            item.delivery_postal_code ||
            orderRecord?.delivery_postal_code ||
            null,
          delivery_notes:
            item.delivery_notes || orderRecord?.delivery_notes || null,
          po_status: item.po_status,
          zoho_purchaseorder_id: item.zoho_purchaseorder_id,
          items: [],
        }
      }

      groups[orderId].items.push(item)

      if (!groups[orderId].zoho_purchaseorder_id && item.zoho_purchaseorder_id) {
        groups[orderId].zoho_purchaseorder_id = item.zoho_purchaseorder_id
      }

      if (item.po_status === 'created') groups[orderId].po_status = 'created'

      if (
        item.po_status === 'failed' &&
        groups[orderId].po_status !== 'created'
      ) {
        groups[orderId].po_status = 'failed'
      }
    }

    return Object.values(groups)
  }, [items, showHidden])

  const stats = useMemo(() => {
    const visibleItems = items.filter((item) => showHidden || !item.hidden)

    const total = visibleItems.reduce(
      (sum, item) => sum + Number(item.line_total || 0),
      0
    )

    return {
      orders: groupedOrders.length,
      items: visibleItems.length,
      total,
    }
  }, [items, groupedOrders.length, showHidden])

  if (loading) {
    return (
      <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
        <div className="lc-card rounded-3xl p-6 text-sm text-lc-muted shadow-sm">
          Loading producer orders...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="lc-card rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-lc-green">
            Producer Orders
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Incoming Orders
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-lc-muted">
            View buyer orders, purchase orders, delivery addresses, and product
            quantities.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <StatCard label="Orders" value={stats.orders} />
          <StatCard label="Items" value={stats.items} />
          <StatCard label="Total" value={formatMoney(stats.total)} />

          <button
            type="button"
            onClick={() => setShowHidden((current) => !current)}
            className="lc-button-secondary rounded-2xl text-sm uppercase tracking-wide"
          >
            {showHidden ? 'Hide Archived' : 'Show Archived'}
          </button>
        </section>

        {message && (
          <div className="rounded-3xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
            {message}
          </div>
        )}

        {groupedOrders.length === 0 ? (
          <div className="lc-card rounded-3xl p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black">No visible producer orders</h2>
            <p className="mt-2 text-sm text-lc-muted">
              New buyer orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedOrders.map((group: any) => {
              const poStatus = getPoStatus(group)
              const orderTotal = group.items.reduce(
                (sum: number, item: any) => sum + Number(item.line_total || 0),
                0
              )

              const purchaseOrderId = group.zoho_purchaseorder_id
              const purchaseOrderUrl = purchaseOrderId
                ? `/api/producer/purchase-orders/${purchaseOrderId}/pdf`
                : ''

              const deliveryAddress = formatDeliveryAddress(group)
              const isHidden = group.items.every((item: any) => item.hidden)

              return (
                <section
                  key={group.orderId}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                    isHidden ? 'border-orange-300 opacity-80' : 'border-lc-border'
                  }`}
                >
                  <div className="border-b border-lc-border bg-[#fbfaf7] px-5 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-lc-muted">
                            Order #{group.orderId.slice(0, 8).toUpperCase()}
                          </p>

                          {isHidden && (
                            <span className="rounded-full border border-orange-700 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">
                              Archived
                            </span>
                          )}
                        </div>

                        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                          {group.buyer_business_name}
                        </h2>

                        {group.buyer_contact_name && (
                          <p className="mt-1 text-sm font-semibold text-lc-muted">
                            {group.buyer_contact_name}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-lc-muted">
                          Submitted {formatDateTime(group.order_submitted_at)}
                        </p>

                        {deliveryAddress && (
                          <div className="mt-4 rounded-2xl border border-lc-border bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-wide text-lc-muted">
                              Delivery Address
                            </p>

                            <p className="mt-1 text-sm font-bold leading-6 text-lc-ink">
                              {deliveryAddress}
                            </p>

                            {group.delivery_notes && (
                              <p className="mt-2 text-sm leading-6 text-lc-muted">
                                {group.delivery_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <InfoPill
                          label="Delivery"
                          value={group.delivery_label || 'TBD'}
                        />
                        <InfoPill label="Total" value={formatMoney(orderTotal)} />

                        {purchaseOrderId ? (
                          <a
                            href={purchaseOrderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-lc-green bg-lc-green px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-lc-ink"
                          >
                            View PO
                          </a>
                        ) : (
                          <span className={poStatus.className}>
                            {poStatus.label}
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={togglingId === group.orderId}
                          onClick={() => toggleHidden(group.orderId, isHidden)}
                          className={
                            isHidden
                              ? 'rounded-xl border border-green-700 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-green-700 transition hover:bg-green-700 hover:text-white disabled:opacity-50'
                              : 'rounded-xl border border-lc-border bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-lc-muted transition hover:border-red-700 hover:bg-red-700 hover:text-white disabled:opacity-50'
                          }
                        >
                          {togglingId === group.orderId
                            ? 'Saving'
                            : isHidden
                              ? 'Restore'
                              : 'Archive'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {group.order?.notes && (
                    <div className="border-b border-lc-border bg-lc-bg px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-lc-muted">
                        Buyer Notes
                      </p>

                      <p className="mt-1 text-sm leading-6 text-lc-ink">
                        {group.order.notes}
                      </p>
                    </div>
                  )}

                  <div className="divide-y divide-lc-border">
                    {group.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="grid gap-4 px-5 py-4 transition hover:bg-lc-bg md:grid-cols-[1fr_110px_130px] md:items-center"
                      >
                        <div className="flex min-w-0 gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-lc-border bg-lc-bg">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[9px] font-black uppercase text-lc-muted">
                                No Image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-black leading-snug">
                              {item.product_name}
                            </p>

                            <p className="mt-1 font-mono text-xs text-lc-muted">
                              {item.sku || '—'} · {item.unit || '—'}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full border border-lc-border bg-lc-bg px-3 py-1 text-[10px] font-black uppercase tracking-wide text-lc-muted">
                                {item.category || 'Product'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-lc-muted md:hidden">
                            Quantity
                          </p>
                          <p className="text-xl font-black">{item.quantity}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-lc-muted md:hidden">
                            Line Total
                          </p>
                          <p className="text-xl font-black text-lc-green">
                            {formatMoney(item.line_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="lc-card rounded-3xl p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lc-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-lc-green">
        {value}
      </p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-lc-border bg-white px-4 py-2">
      <p className="text-[9px] font-black uppercase tracking-wide text-lc-muted">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-lc-ink">{value}</p>
    </div>
  )
}

function getPoStatus(group: any) {
  const firstItem = group.items?.[0]

  if (firstItem?.po_status === 'created' || group.po_status === 'created') {
    return {
      label: 'PO Created',
      className:
        'rounded-xl border border-green-700 bg-green-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-700',
    }
  }

  if (firstItem?.po_status === 'failed' || group.po_status === 'failed') {
    return {
      label: 'PO Failed',
      className:
        'rounded-xl border border-red-700 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-700',
    }
  }

  return {
    label: 'Pending PO',
    className:
      'rounded-xl border border-yellow-700 bg-yellow-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-yellow-700',
  }
}

function formatDeliveryAddress(group: any) {
  return [
    group.delivery_address,
    group.delivery_city,
    group.delivery_postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMoney(value: any) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value || 0))
}