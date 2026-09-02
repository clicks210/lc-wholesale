'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProducerOrdersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

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
      .order('created_at', {
        ascending: false,
      })

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

  /* =====================================================
     ARCHIVE / RESTORE
  ===================================================== */

  async function toggleHidden(
    orderId: string,
    hidden: boolean
  ) {
    setTogglingId(orderId)
    setMessage('')

    const nextHidden = !hidden

    const { error } = await supabase
      .from('producer_order_items')
      .update({
        hidden: nextHidden,
      })
      .eq('order_id', orderId)

    if (error) {
      setMessage(error.message)
      setTogglingId(null)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.order_id === orderId
          ? {
              ...item,
              hidden: nextHidden,
            }
          : item
      )
    )

    setTogglingId(null)
  }

  /* =====================================================
     GROUP ORDERS
  ===================================================== */

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any> = {}

    for (const item of items) {
      const isItemHidden = Boolean(item.hidden)

      if (!showHidden && isItemHidden) {
        continue
      }

      const orderId = item.order_id
      const orderRecord = item.order || null

      if (!groups[orderId]) {
        groups[orderId] = {
          orderId,

          order: orderRecord,

          buyer_business_name:
            item.buyer_business_name ||
            'Buyer Account',

          buyer_contact_name:
            item.buyer_contact_name ||
            null,

          order_submitted_at:
            item.order_submitted_at ||
            orderRecord?.created_at ||
            item.created_at,

          delivery_label:
            item.delivery_label,

          delivery_date:
            item.delivery_date,

          delivery_address:
            item.delivery_address ||
            orderRecord?.delivery_address ||
            null,

          delivery_city:
            item.delivery_city ||
            orderRecord?.delivery_city ||
            null,

          delivery_postal_code:
            item.delivery_postal_code ||
            orderRecord?.delivery_postal_code ||
            null,

          delivery_notes:
            item.delivery_notes ||
            orderRecord?.delivery_notes ||
            null,

          po_status:
            item.po_status,

          zoho_purchaseorder_id:
            item.zoho_purchaseorder_id,

          items: [],
        }
      }

      groups[orderId].items.push(item)

      if (
        !groups[orderId].zoho_purchaseorder_id &&
        item.zoho_purchaseorder_id
      ) {
        groups[orderId].zoho_purchaseorder_id =
          item.zoho_purchaseorder_id
      }

      if (item.po_status === 'created') {
        groups[orderId].po_status =
          'created'
      }

      if (
        item.po_status === 'failed' &&
        groups[orderId].po_status !==
          'created'
      ) {
        groups[orderId].po_status =
          'failed'
      }
    }

    return Object.values(groups)
  }, [items, showHidden])

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    const visibleItems =
      items.filter(
        (item) =>
          showHidden ||
          !item.hidden
      )

    const total =
      visibleItems.reduce(
        (sum, item) =>
          sum +
          Number(
            item.line_total || 0
          ),
        0
      )

    return {
      orders:
        groupedOrders.length,

      items:
        visibleItems.length,

      total,
    }
  }, [
    items,
    groupedOrders.length,
    showHidden,
  ])

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">
        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
          <div className="border border-[#aeb6ae] bg-white">

            <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] p-5">
              <div className="h-3 w-32 animate-pulse bg-[#dfe3df]" />
              <div className="mt-4 h-10 w-72 max-w-full animate-pulse bg-[#dfe3df]" />
            </div>

            <div className="divide-y divide-[#c5cbc5]">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="p-5"
                >
                  <div className="h-4 w-1/3 animate-pulse bg-[#e2e5e2]" />
                  <div className="mt-3 h-3 w-1/2 animate-pulse bg-[#eceeeb]" />
                  <div className="mt-5 h-16 w-full animate-pulse bg-[#f0f1ef]" />
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Producer Orders
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
                Incoming Orders
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
                Review buyer orders, delivery details, purchase orders, and product quantities.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowHidden(
                  (current) =>
                    !current
                )
              }
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                border
                border-[#aeb6ae]
                bg-white
                px-4
                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]
                text-[#4f5750]
                transition-colors
                hover:border-[#1f5a43]
                hover:text-[#1f5a43]
              "
            >
              {showHidden
                ? 'Hide Archived'
                : 'Show Archived'}
            </button>

          </div>

        </section>

        {/* =====================================================
            METRICS
        ===================================================== */}

        <section className="grid grid-cols-3 border-b border-[#aeb6ae]">

          <StatMetric
            label="Orders"
            value={stats.orders}
          />

          <StatMetric
            label="Items"
            value={stats.items}
          />

          <StatMetric
            label="Order Value"
            value={formatMoney(
              stats.total
            )}
          />

        </section>

        {/* =====================================================
            STATUS BAR
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">

          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159] sm:text-[10px]">
            {showHidden
              ? 'All Orders'
              : 'Active Orders'}

            <span className="ml-2 text-[#8a918b]">
              / {groupedOrders.length}{' '}
              {groupedOrders.length === 1
                ? 'order'
                : 'orders'}
            </span>
          </p>

          {message && (
            <p className="border border-[#d59c94] bg-[#fff0ed] px-3 py-2 text-[10px] font-bold text-[#9a4e43]">
              {message}
            </p>
          )}

        </div>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {groupedOrders.length === 0 ? (
          <section className="border border-[#aeb6ae] bg-white px-5 py-16 text-center sm:py-24">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1f5a43]">
              No Orders
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#202621]">
              No visible producer orders.
            </h2>

            <p className="mt-2 text-[13px] font-medium text-[#5f675f]">
              New buyer orders will appear here.
            </p>

          </section>
        ) : (

          /* =====================================================
             ORDER LIST
          ===================================================== */

          <div className="space-y-6">

            {groupedOrders.map(
              (group: any) => {
                const poStatus =
                  getPoStatus(group)

                const orderTotal =
                  group.items.reduce(
                    (
                      sum: number,
                      item: any
                    ) =>
                      sum +
                      Number(
                        item.line_total ||
                          0
                      ),
                    0
                  )

                const purchaseOrderId =
                  group.zoho_purchaseorder_id

                const purchaseOrderUrl =
                  purchaseOrderId
                    ? `/api/producer/purchase-orders/${purchaseOrderId}/pdf`
                    : ''

                const deliveryAddress =
                  formatDeliveryAddress(
                    group
                  )

                const isHidden =
                  group.items.every(
                    (
                      item: any
                    ) =>
                      item.hidden
                  )

                return (
                  <section
                    key={
                      group.orderId
                    }
                    className={`
                      relative
                      overflow-hidden
                      border-2

                      ${
                        isHidden
                          ? 'border-[#d4a867] bg-[#fff6e8] opacity-85'
                          : 'border-[#9fb0a4] bg-[#e9f0eb]'
                      }
                    `}
                  >

                    {/* LEFT ACCENT */}

                    {!isHidden && (
                      <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-[#1f5a43]" />
                    )}

                    {/* =================================================
                        ORDER HEADER
                    ================================================= */}

                    <div
                      className={`
                        border-b
                        border-[#9fb0a4]
                        px-5
                        py-5
                        sm:px-6

                        ${
                          isHidden
                            ? 'bg-[#fff2df]'
                            : 'bg-[#dfe9e3]'
                        }
                      `}
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        {/* BUYER */}

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#455047]">
                              Order #
                              {group.orderId
                                .slice(
                                  0,
                                  8
                                )
                                .toUpperCase()}
                            </p>

                            {isHidden && (
                              <span className="bg-[#fff0dc] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#875521]">
                                Archived
                              </span>
                            )}

                            <span className={poStatus.className}>
                              {poStatus.label}
                            </span>

                          </div>

                          <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.035em] text-[#202621] sm:text-[28px]">
                            {group.buyer_business_name}
                          </h2>

                          {group.buyer_contact_name && (
                            <p className="mt-1 text-[12px] font-bold text-[#4f5750]">
                              {group.buyer_contact_name}
                            </p>
                          )}

                          <p className="mt-1 text-[11px] font-semibold text-[#687068]">
                            Submitted{' '}
                            {formatDateTime(
                              group.order_submitted_at
                            )}
                          </p>

                        </div>

                        {/* SUMMARY GRID */}

                        <div className="grid grid-cols-2 gap-px border border-[#9fb0a4] bg-[#9fb0a4] sm:grid-cols-4 lg:min-w-[430px]">

                          <HeaderStat
                            label="Delivery"
                            value={
                              group.delivery_label ||
                              'TBD'
                            }
                          />

                          <HeaderStat
                            label="Items"
                            value={String(
                              group.items.length
                            )}
                          />

                          <HeaderStat
                            label="Total"
                            value={
                              formatMoney(
                                orderTotal
                              )
                            }
                          />

                          <div className="flex items-center justify-center bg-white p-2">

                            {purchaseOrderId ? (
                              <a
                                href={
                                  purchaseOrderUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="
                                  flex
                                  min-h-10
                                  w-full
                                  items-center
                                  justify-center
                                  bg-[#1f5a43]
                                  px-3
                                  text-[9px]
                                  font-black
                                  uppercase
                                  tracking-[0.08em]
                                  text-white
                                  transition-colors
                                  hover:bg-[#163f30]
                                "
                              >
                                View PO
                              </a>
                            ) : (
                              <span className="text-center text-[9px] font-black uppercase tracking-[0.08em] text-[#596159]">
                                PO Pending
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* ARCHIVE */}

                      <div className="mt-5 flex justify-end">

                        <button
                          type="button"
                          disabled={
                            togglingId ===
                            group.orderId
                          }
                          onClick={() =>
                            toggleHidden(
                              group.orderId,
                              isHidden
                            )
                          }
                          className={`
                            min-h-9
                            border
                            bg-white
                            px-3
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.09em]
                            transition-colors
                            disabled:opacity-50

                            ${
                              isHidden
                                ? 'border-[#8eb09d] text-[#1f5a43] hover:bg-[#eef3f0]'
                                : 'border-[#b99f9b] text-[#8f5148] hover:bg-[#fff0ed]'
                            }
                          `}
                        >
                          {togglingId ===
                          group.orderId
                            ? 'Saving'
                            : isHidden
                              ? 'Restore Order'
                              : 'Archive Order'}
                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        ORDER BODY
                    ================================================= */}

                    <div className="mx-3 mb-3 bg-white sm:mx-4 sm:mb-4">

                      {/* DELIVERY */}

                      {(deliveryAddress ||
                        group.delivery_notes) && (
                        <div className="grid border-b border-[#bfc5bf] md:grid-cols-2">

                          <div className="border-b border-[#bfc5bf] p-5 md:border-b-0 md:border-r">

                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159]">
                              Delivery Address
                            </p>

                            <p className="mt-2 text-[13px] font-bold leading-6 text-[#303732]">
                              {deliveryAddress ||
                                'Address not provided'}
                            </p>

                          </div>

                          <div className="p-5">

                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159]">
                              Delivery Notes
                            </p>

                            <p className="mt-2 text-[12px] font-medium leading-6 text-[#5f675f]">
                              {group.delivery_notes ||
                                'No delivery notes.'}
                            </p>

                          </div>

                        </div>
                      )}

                      {/* BUYER NOTES */}

                      {group.order?.notes && (
                        <div className="border-b border-[#bfc5bf] bg-[#fff8e8] px-5 py-4 sm:px-6">

                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#805c24]">
                            Buyer Notes
                          </p>

                          <p className="mt-2 text-[12px] font-semibold leading-6 text-[#5c4931]">
                            {group.order.notes}
                          </p>

                        </div>
                      )}

                      {/* PRODUCT HEADER */}

                      <div
                        className="
                          hidden
                          grid-cols-[minmax(0,1fr)_110px_140px]
                          border-b
                          border-[#bfc5bf]
                          bg-[#f7f8f5]
                          px-5
                          py-3
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-[#596159]
                          md:grid
                        "
                      >
                        <div>
                          Product
                        </div>

                        <div>
                          Quantity
                        </div>

                        <div>
                          Line Total
                        </div>
                      </div>

                      {/* ITEMS */}

                      <div className="divide-y divide-[#c5cbc5]">

                        {group.items.map(
                          (
                            item: any
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="
                                grid
                                gap-4
                                px-4
                                py-4
                                transition-colors
                                hover:bg-[#fafbf9]
                                sm:px-5
                                md:grid-cols-[minmax(0,1fr)_110px_140px]
                                md:items-center
                              "
                            >

                              <div className="flex min-w-0 items-center gap-4">

                                <ProductImage
                                  item={
                                    item
                                  }
                                />

                                <div className="min-w-0">

                                  <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[#202621] sm:text-[14px]">
                                    {item.product_name}
                                  </p>

                                  <p className="mt-1 font-mono text-[10px] font-semibold text-[#737b74]">
                                    {item.sku ||
                                      '—'}
                                    {' · '}
                                    {item.unit ||
                                      '—'}
                                  </p>

                                  <span className="mt-2 inline-flex bg-[#eef0ed] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#596159]">
                                    {item.category ||
                                      'Product'}
                                  </span>

                                </div>

                              </div>

                              {/* MOBILE QUANTITY / TOTAL */}

                              <div className="grid grid-cols-2 gap-px border border-[#c5cbc5] bg-[#c5cbc5] md:block md:border-0 md:bg-transparent">

                                <div className="bg-white p-3 md:bg-transparent md:p-0">

                                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#596159] md:hidden">
                                    Quantity
                                  </p>

                                  <p className="mt-1 text-lg font-bold text-[#202621] md:mt-0">
                                    {item.quantity}
                                  </p>

                                </div>

                                <div className="bg-white p-3 md:hidden">

                                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#596159]">
                                    Line Total
                                  </p>

                                  <p className="mt-1 text-lg font-bold text-[#1f5a43]">
                                    {formatMoney(
                                      item.line_total
                                    )}
                                  </p>

                                </div>

                              </div>

                              {/* DESKTOP TOTAL */}

                              <div className="hidden md:block">

                                <p className="text-lg font-bold text-[#1f5a43]">
                                  {formatMoney(
                                    item.line_total
                                  )}
                                </p>

                              </div>

                            </div>
                          )
                        )}

                      </div>

                      {/* TOTAL */}

                      <div className="flex items-center justify-between border-t border-[#bfc5bf] bg-[#f7f8f5] px-5 py-4">

                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#596159]">
                          Order Total
                        </p>

                        <p className="text-xl font-bold tracking-[-0.03em] text-[#1f5a43]">
                          {formatMoney(
                            orderTotal
                          )}
                        </p>

                      </div>

                    </div>

                  </section>
                )
              }
            )}

          </div>
        )}

      </div>

    </main>
  )
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function ProductImage({
  item,
}: {
  item: any
}) {
  if (!item.image_url) {
    return (
      <div
        className="
          flex
          h-16
          w-16
          shrink-0
          items-center
          justify-center
          border
          border-[#aeb6ae]
          bg-[#f4f5f2]
          px-2
          text-center
          text-[8px]
          font-black
          uppercase
          tracking-[0.08em]
          text-[#7d857e]
        "
      >
        No Image
      </div>
    )
  }

  return (
    <div
      className="
        h-16
        w-16
        shrink-0
        overflow-hidden
        border
        border-[#aeb6ae]
        bg-white
      "
    >
      <img
        src={item.image_url}
        alt={
          item.product_name ||
          'Product'
        }
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain p-1"
      />
    </div>
  )
}

/* =========================================================
   STATS
========================================================= */

function StatMetric({
  label,
  value,
}: {
  label: string
  value:
    | string
    | number
}) {
  return (
    <div className="border-r border-[#aeb6ae] px-3 py-4 last:border-r-0 sm:px-5 sm:py-5">

      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#596159] sm:text-[9px]">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#1f5a43] sm:text-2xl">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   ORDER HEADER STAT
========================================================= */

function HeaderStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-white p-3">

      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-bold text-[#303732]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   PO STATUS
========================================================= */

function getPoStatus(
  group: any
) {
  const firstItem =
    group.items?.[0]

  if (
    firstItem?.po_status ===
      'created' ||
    group.po_status ===
      'created'
  ) {
    return {
      label:
        'PO Created',

      className:
        'bg-[#eaf4ee] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#26734f]',
    }
  }

  if (
    firstItem?.po_status ===
      'failed' ||
    group.po_status ===
      'failed'
  ) {
    return {
      label:
        'PO Failed',

      className:
        'bg-[#fff0ed] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#9a4e43]',
    }
  }

  return {
    label:
      'Pending PO',

    className:
      'bg-[#fff0dc] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#875521]',
  }
}

/* =========================================================
   DELIVERY ADDRESS
========================================================= */

function formatDeliveryAddress(
  group: any
) {
  return [
    group.delivery_address,
    group.delivery_city,
    group.delivery_postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}

/* =========================================================
   DATE
========================================================= */

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return '—'
  }

  return new Date(
    value
  ).toLocaleString(
    'en-CA',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  )
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: any
) {
  return new Intl.NumberFormat(
    'en-CA',
    {
      style: 'currency',
      currency: 'CAD',
    }
  ).format(
    Number(
      value || 0
    )
  )
}