'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAdminOrders } from '@/lib/orders'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)

      const data =
        await getAdminOrders()

      setOrders(data)
      setLoading(false)
    }

    loadOrders()
  }, [])

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    const total = orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.subtotal || 0
        ),
      0
    )

    const itemCount =
      orders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.order_items
              ?.length || 0
          ),
        0
      )

    return {
      orders:
        orders.length,

      items:
        itemCount,

      total,
    }
  }, [orders])

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

          <div className="border border-[#aeb6ae] bg-white">

            <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] p-5">

              <div className="h-3 w-36 animate-pulse bg-[#dfe3df]" />

              <div className="mt-4 h-10 w-72 max-w-full animate-pulse bg-[#dfe3df]" />

              <div className="mt-3 h-3 w-96 max-w-full animate-pulse bg-[#e7eae7]" />

            </div>

            <div className="divide-y divide-[#c5cbc5]">

              {Array.from({
                length: 4,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="p-5"
                  >

                    <div className="h-4 w-1/3 animate-pulse bg-[#e2e5e2]" />

                    <div className="mt-3 h-3 w-1/2 animate-pulse bg-[#eceeeb]" />

                    <div className="mt-5 h-20 w-full animate-pulse bg-[#f0f1ef]" />

                  </div>
                )
              )}

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

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
            Order Management
          </p>

          <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
            Incoming Orders
          </h1>

          <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
            Review wholesale orders, customer details, delivery notes, invoices, and ordered products.
          </p>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="grid grid-cols-3 border-b border-[#aeb6ae]">

          <StatMetric
            label="Orders"
            value={
              stats.orders
            }
          />

          <StatMetric
            label="Items"
            value={
              stats.items
            }
          />

          <StatMetric
            label="Order Value"
            value={
              formatMoney(
                stats.total
              )
            }
          />

        </section>

        {/* =====================================================
            STATUS BAR
        ===================================================== */}

        <div className="flex items-center justify-between py-4">

          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159] sm:text-[10px]">
            Active Orders

            <span className="ml-2 text-[#8a918b]">
              / {orders.length}{' '}
              {orders.length === 1
                ? 'order'
                : 'orders'}
            </span>
          </p>

        </div>

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {orders.length === 0 ? (

          <section className="border border-[#aeb6ae] bg-white px-5 py-16 text-center sm:py-24">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1f5a43]">
              No Orders
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#202621]">
              No orders found.
            </h2>

            <p className="mt-2 text-[13px] font-medium text-[#5f675f]">
              New wholesale orders will appear here.
            </p>

          </section>

        ) : (

          /* =====================================================
             ORDERS
          ===================================================== */

          <div className="space-y-6">

            {orders.map(
              (order) => {
                const items =
                  order.order_items ||
                  []

                const deliveryAddress =
                  formatDeliveryAddress(
                    order
                  )

                const orderTotal =
                  Number(
                    order.subtotal ||
                      0
                  )

                const invoiceId =
                  order.zoho_invoice_id ||
                  order.invoice_id ||
                  order.zoho_invoice
                    ?.invoice_id

                const invoiceUrl =
                  invoiceId
                    ? `/api/admin/invoices/${invoiceId}/pdf`
                    : null

                return (
                  <section
                    key={
                      order.id
                    }
                    className="
                      relative
                      overflow-hidden
                      border-2
                      border-[#9fb0a4]
                      bg-[#e9f0eb]
                    "
                  >

                    {/* LEFT ACCENT */}

                    <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-[#1f5a43]" />

                    {/* =================================================
                        ORDER HEADER
                    ================================================= */}

                    <div className="border-b border-[#9fb0a4] bg-[#dfe9e3] px-5 py-5 sm:px-6">

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        {/* CUSTOMER */}

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#455047]">
                              Order #
                              {order.id
                                .slice(
                                  0,
                                  8
                                )
                                .toUpperCase()}
                            </p>

                            <StatusBadge
                              status={
                                order.status
                              }
                            />

                          </div>

                          <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.035em] text-[#202621] sm:text-[28px]">
                            {order.customers
                              ?.business_name ||
                              'Customer Account'}
                          </h2>

                          <p className="mt-1 text-[12px] font-bold text-[#4f5750]">
                            {order.customers
                              ?.contact_name ||
                              'No contact'}
                          </p>

                          <p className="mt-1 text-[11px] font-semibold text-[#687068]">
                            Submitted{' '}
                            {formatDateTime(
                              order.created_at
                            )}
                          </p>

                        </div>

                        {/* SUMMARY */}

                        <div className="grid grid-cols-2 gap-px border border-[#9fb0a4] bg-[#9fb0a4] sm:grid-cols-4 lg:min-w-[470px]">

                          <HeaderStat
                            label="Delivery"
                            value={
                              order.delivery_date ||
                              'TBD'
                            }
                          />

                          <HeaderStat
                            label="Items"
                            value={String(
                              items.length
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

                            {invoiceUrl ? (
                              <a
                                href={
                                  invoiceUrl
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
                                Invoice
                              </a>
                            ) : (
                              <span className="text-center text-[9px] font-black uppercase tracking-[0.08em] text-[#737b74]">
                                No Invoice
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* ORDER ACTION */}

                      <div className="mt-5 flex justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="
                            min-h-10
                            bg-[#1f5a43]
                            px-4
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.1em]
                            text-white
                            transition-colors
                            hover:bg-[#163f30]
                          "
                        >
                          View Full Order
                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        WHITE ORDER BODY
                    ================================================= */}

                    <div className="mx-3 mb-3 bg-white sm:mx-4 sm:mb-4">

                      {/* DELIVERY */}

                      {deliveryAddress && (
                        <div className="grid border-b border-[#bfc5bf] md:grid-cols-2">

                          <div className="border-b border-[#bfc5bf] p-5 md:border-b-0 md:border-r">

                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159]">
                              Delivery Address
                            </p>

                            <p className="mt-2 text-[13px] font-bold leading-6 text-[#303732]">
                              {deliveryAddress}
                            </p>

                          </div>

                          <div className="p-5">

                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159]">
                              Delivery Notes
                            </p>

                            <p className="mt-2 text-[12px] font-medium leading-6 text-[#5f675f]">
                              {order.customers
                                ?.delivery_notes ||
                                'No delivery notes.'}
                            </p>

                          </div>

                        </div>
                      )}

                      {/* BUYER NOTES */}

                      {order.notes && (
                        <div className="border-b border-[#bfc5bf] bg-[#fff8e8] px-5 py-4 sm:px-6">

                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#805c24]">
                            Buyer Notes
                          </p>

                          <p className="mt-2 text-[12px] font-semibold leading-6 text-[#5c4931]">
                            {order.notes}
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

                      {/* PREVIEW ITEMS */}

                      <div className="divide-y divide-[#c5cbc5]">

                        {items
                          .slice(
                            0,
                            4
                          )
                          .map(
                            (
                              item: any
                            ) => (
                              <OrderItemRow
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                              />
                            )
                          )}

                      </div>

                      {/* MORE ITEMS */}

                      {items.length > 4 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="
                            w-full
                            border-t
                            border-[#bfc5bf]
                            bg-[#f7f8f5]
                            px-5
                            py-4
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.1em]
                            text-[#1f5a43]
                            transition-colors
                            hover:bg-[#edf1ed]
                          "
                        >
                          View{' '}
                          {items.length -
                            4}{' '}
                          More{' '}
                          {items.length -
                            4 ===
                          1
                            ? 'Item'
                            : 'Items'}
                        </button>
                      )}

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

      {/* =====================================================
          ORDER MODAL
      ===================================================== */}

      {selectedOrder && (
        <OrderModal
          order={
            selectedOrder
          }
          onClose={() =>
            setSelectedOrder(
              null
            )
          }
        />
      )}

    </main>
  )
}

/* =========================================================
   ORDER MODAL
========================================================= */

function OrderModal({
  order,
  onClose,
}: {
  order: any
  onClose: () => void
}) {
  const items =
    order.order_items || []

  const invoiceId =
    order.zoho_invoice_id ||
    order.invoice_id ||
    order.zoho_invoice
      ?.invoice_id

  const invoiceUrl =
    invoiceId
      ? `/api/admin/invoices/${invoiceId}/pdf`
      : null

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-end
        justify-center
        bg-black/50
        backdrop-blur-[2px]
        sm:items-center
        sm:px-4
        sm:py-8
      "
      onClick={onClose}
    >

      <div
        className="
          max-h-[94dvh]
          w-full
          overflow-y-auto
          border
          border-[#8f9990]
          bg-[#f2f4f1]
          shadow-2xl
          sm:max-w-6xl
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* MODAL HEADER */}

        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#9fb0a4] bg-[#dfe9e3] p-5 sm:p-6">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1f5a43]">
              Order Details
            </p>

            <h2 className="mt-2 text-[26px] font-bold leading-none tracking-[-0.04em] text-[#202621] sm:text-3xl">
              Order #
              {order.id
                .slice(0, 8)
                .toUpperCase()}
            </h2>

            <p className="mt-2 text-[11px] font-semibold text-[#5f675f]">
              Submitted{' '}
              {formatDateTime(
                order.created_at
              )}
            </p>

          </div>

          <div className="flex shrink-0 gap-2">

            {invoiceUrl && (
              <a
                href={
                  invoiceUrl
                }
                target="_blank"
                rel="noreferrer"
                className="
                  hidden
                  min-h-10
                  items-center
                  bg-[#1f5a43]
                  px-4
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  text-white
                  transition-colors
                  hover:bg-[#163f30]
                  sm:flex
                "
              >
                View Invoice
              </a>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                border
                border-[#8f9990]
                bg-white
                text-[#596159]
                transition-colors
                hover:border-[#944d44]
                hover:bg-[#fff0ed]
                hover:text-[#944d44]
              "
              aria-label="Close order"
            >
              <CloseIcon />
            </button>

          </div>

        </div>

        {/* MODAL BODY */}

        <div className="space-y-6 p-4 sm:p-6">

          {/* CUSTOMER */}

          <ModalSection
            eyebrow="01"
            title="Customer"
          >

            <InfoGrid
              items={[
                [
                  'Business',
                  order.customers
                    ?.business_name,
                ],
                [
                  'Contact',
                  order.customers
                    ?.contact_name,
                ],
                [
                  'Phone',
                  order.customers
                    ?.phone,
                ],
                [
                  'Status',
                  formatStatus(
                    order.status
                  ),
                ],
              ]}
            />

          </ModalSection>

          {/* DELIVERY */}

          <ModalSection
            eyebrow="02"
            title="Delivery"
          >

            <InfoGrid
              items={[
                [
                  'Requested Date',
                  order.delivery_date,
                ],
                [
                  'Address',
                  order.customers
                    ?.delivery_address,
                ],
                [
                  'City',
                  order.customers
                    ?.delivery_city,
                ],
                [
                  'Postal Code',
                  order.customers
                    ?.delivery_postal_code,
                ],
              ]}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <NoteBox
                label="Order Notes"
                value={
                  order.notes
                }
              />

              <NoteBox
                label="Saved Delivery Notes"
                value={
                  order.customers
                    ?.delivery_notes
                }
              />

            </div>

          </ModalSection>

          {/* ITEMS */}

          <ModalSection
            eyebrow="03"
            title="Order Items"
          >

            <div className="border border-[#aeb6ae]">

              <div
                className="
                  hidden
                  grid-cols-[minmax(0,1fr)_110px_110px_140px]
                  border-b
                  border-[#aeb6ae]
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
                  Unit Price
                </div>

                <div>
                  Quantity
                </div>

                <div>
                  Line Total
                </div>
              </div>

              <div className="divide-y divide-[#c5cbc5]">

                {items.map(
                  (
                    item: any
                  ) => (
                    <OrderItemRow
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      showUnitPrice
                    />
                  )
                )}

              </div>

              <div className="flex items-center justify-between border-t border-[#aeb6ae] bg-[#dfe9e3] px-5 py-4">

                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#455047]">
                  Order Total
                </p>

                <p className="text-2xl font-bold tracking-[-0.04em] text-[#1f5a43]">
                  {formatMoney(
                    order.subtotal
                  )}
                </p>

              </div>

            </div>

          </ModalSection>

          {/* MOBILE INVOICE */}

          {invoiceUrl && (
            <a
              href={
                invoiceUrl
              }
              target="_blank"
              rel="noreferrer"
              className="
                flex
                min-h-13
                w-full
                items-center
                justify-center
                bg-[#1f5a43]
                px-5
                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]
                text-white
                sm:hidden
              "
            >
              View Invoice
            </a>
          )}

        </div>

      </div>

    </div>
  )
}

/* =========================================================
   ORDER ITEM
========================================================= */

function OrderItemRow({
  item,
  showUnitPrice = false,
}: {
  item: any
  showUnitPrice?: boolean
}) {
  return (
    <div
      className={`
        grid
        gap-4
        bg-white
        px-4
        py-4
        transition-colors
        hover:bg-[#fafbf9]
        sm:px-5

        ${
          showUnitPrice
            ? 'md:grid-cols-[minmax(0,1fr)_110px_110px_140px]'
            : 'md:grid-cols-[minmax(0,1fr)_110px_140px]'
        }

        md:items-center
      `}
    >

      {/* PRODUCT */}

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

          {item.category && (
            <span className="mt-2 inline-flex bg-[#eef0ed] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#596159]">
              {item.category}
            </span>
          )}

        </div>

      </div>

      {/* MOBILE NUMBERS */}

      <div
        className={`
          grid
          gap-px
          border
          border-[#c5cbc5]
          bg-[#c5cbc5]
          md:contents

          ${
            showUnitPrice
              ? 'grid-cols-3'
              : 'grid-cols-2'
          }
        `}
      >

        {showUnitPrice && (
          <MetricCell
            label="Unit Price"
            value={
              formatMoney(
                item.unit_price
              )
            }
          />
        )}

        <MetricCell
          label="Quantity"
          value={String(
            item.quantity
          )}
        />

        <MetricCell
          label="Line Total"
          value={
            formatMoney(
              item.line_total
            )
          }
          emphasized
        />

      </div>

    </div>
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
  if (
    !item.image_url
  ) {
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
        src={
          item.image_url
        }
        alt={
          item.product_name ||
          'Product image'
        }
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain p-1"
      />

    </div>
  )
}

/* =========================================================
   MOBILE / DESKTOP METRIC CELL
========================================================= */

function MetricCell({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="bg-white p-3 md:bg-transparent md:p-0">

      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#596159] md:hidden">
        {label}
      </p>

      <p
        className={`
          mt-1
          font-bold
          md:mt-0

          ${
            emphasized
              ? 'text-lg text-[#1f5a43]'
              : 'text-[13px] text-[#202621]'
          }
        `}
      >
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   PAGE STATS
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
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string
}) {
  const normalized =
    String(
      status || ''
    ).toLowerCase()

  const className =
    normalized ===
      'completed' ||
    normalized ===
      'fulfilled' ||
    normalized ===
      'paid'
      ? 'bg-[#eaf4ee] text-[#26734f]'
      : normalized ===
          'cancelled' ||
        normalized ===
          'canceled'
        ? 'bg-[#fff0ed] text-[#9a4e43]'
        : normalized ===
            'processing'
          ? 'bg-[#edf4f8] text-[#4d7896]'
          : 'bg-[#fff0dc] text-[#875521]'

  return (
    <span
      className={`
        inline-flex
        px-2.5
        py-1
        text-[8px]
        font-black
        uppercase
        tracking-[0.08em]
        ${className}
      `}
    >
      {formatStatus(
        status
      )}
    </span>
  )
}

/* =========================================================
   MODAL SECTION
========================================================= */

function ModalSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children:
    React.ReactNode
}) {
  return (
    <section className="border border-[#aeb6ae] bg-white">

      <div className="flex items-center gap-3 border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-4">

        <span
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            bg-[#dfe9e3]
            text-[9px]
            font-black
            text-[#1f5a43]
          "
        >
          {eyebrow}
        </span>

        <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#202621]">
          {title}
        </h3>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  )
}

/* =========================================================
   INFO GRID
========================================================= */

function InfoGrid({
  items,
}: {
  items: [
    string,
    any,
  ][]
}) {
  return (
    <div className="grid gap-px border border-[#aeb6ae] bg-[#aeb6ae] md:grid-cols-2">

      {items.map(
        ([
          label,
          value,
        ]) => (
          <div
            key={
              label
            }
            className="min-w-0 bg-white p-4"
          >

            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#596159]">
              {label}
            </p>

            <p className="mt-1.5 break-words text-[12px] font-bold leading-5 text-[#303732]">
              {value ||
                '—'}
            </p>

          </div>
        )
      )}

    </div>
  )
}

/* =========================================================
   NOTES
========================================================= */

function NoteBox({
  label,
  value,
}: {
  label: string
  value: any
}) {
  return (
    <div className="border border-[#aeb6ae] bg-[#f7f8f5] p-4">

      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#596159]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-[12px] font-medium leading-6 text-[#4f5750]">
        {value ||
          'None.'}
      </p>

    </div>
  )
}

/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

function formatDeliveryAddress(
  order: any
) {
  return [
    order.customers
      ?.delivery_address,

    order.customers
      ?.delivery_city,

    order.customers
      ?.delivery_postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}

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

function formatStatus(
  status:
    | string
    | null
    | undefined
) {
  if (!status) {
    return 'Pending'
  }

  return status
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    )
}

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