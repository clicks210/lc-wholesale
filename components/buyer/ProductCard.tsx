'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/shared/Modal'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

type ScheduleItem = {
  delivery_day: string
  cutoff_day: string
  cutoff_time: string
}

const standardLcSchedule: ScheduleItem[] = [
  {
    delivery_day: 'Tuesday',
    cutoff_day: 'Sunday',
    cutoff_time: '17:00',
  },
  {
    delivery_day: 'Friday',
    cutoff_day: 'Wednesday',
    cutoff_time: '17:00',
  },
]

export default function ProductCard({
  product,
  autoOpen = false,
}: {
  product: Product
  autoOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (autoOpen) setIsOpen(true)
  }, [autoOpen])

  const productAny = product as any

  const isPriceOnRequest = Boolean(product.price_on_request)
  const isProducerProduct = Boolean(productAny.producer_customer_id)

  const fulfillmentType = productAny.fulfillment_type
  const producerDeliveryFulfillmentType =
    productAny.producer_delivery_fulfillment_type

  const isLcFulfilled =
    fulfillmentType === 'lc_stocked' ||
    producerDeliveryFulfillmentType === 'local_connect'

  const isProducerFulfilled =
    fulfillmentType === 'producer_fulfilled' ||
    producerDeliveryFulfillmentType === 'self_fulfilled'

  const inStock = Boolean(productAny.in_stock)
  const categoryMinimum = Number(productAny.category_minimum || 0)

  const producerSchedule = getSchedule(
    productAny.producer_delivery_schedule || productAny.delivery_schedule
  )

  const categorySchedule = getSchedule(productAny.category_delivery_schedule)

  const deliverySchedule =
    isProducerProduct && isProducerFulfilled
      ? producerSchedule
      : !inStock
        ? categorySchedule
        : standardLcSchedule

  const dropoffNotes =
    isProducerProduct && isProducerFulfilled
      ? productAny.producer_dropoff_notes
      : null

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    if (isPriceOnRequest) return

    addToCart({ product, quantity: 1 })
    window.dispatchEvent(new Event('cartUpdated'))
    window.dispatchEvent(new Event('cart-updated'))

    setAdded(true)
    setTimeout(() => setAdded(false), 900)
  }

  return (
    <>
      <div className="flex h-full flex-col bg-white">
        <div
          onClick={() => setIsOpen(true)}
          className="flex flex-1 cursor-pointer flex-col bg-white p-2.5 transition sm:p-4"
        >
          <div className="mb-2 flex aspect-square w-full items-center justify-center bg-white p-1.5 sm:mb-4 sm:p-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f675c]/50 sm:text-xs">
                No Image
              </div>
            )}
          </div>

          <p className="truncate text-[9px] font-mono text-[#6f675c] sm:text-xs">
            {product.sku}
          </p>

          <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-tight sm:min-h-[2.6em] sm:text-base">
            {product.name}
          </h2>

          <p className="mt-1 line-clamp-1 text-[11px] text-[#6f675c] sm:text-sm">
            {product.category}
          </p>

          {product.supplier && (
            <p className="mt-1 hidden text-xs font-medium text-[#244f3d] sm:line-clamp-1 sm:block">
              {product.supplier}
            </p>
          )}

          <div className="mt-2">
            {isProducerProduct && isProducerFulfilled ? (
              <StatusBadge type="blue" label="Producer Delivered" />
            ) : inStock ? (
              <StatusBadge type="green" label="In Stock" />
            ) : (
              <StatusBadge type="orange" label="Special Order" />
            )}
          </div>

          <div className="mt-auto pt-3 sm:pt-4">
            {isPriceOnRequest ? (
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#b45309] sm:text-base">
                Price on Request
              </p>
            ) : (
              <p className="text-base font-bold sm:text-xl">
                ${Number(product.price ?? 0).toFixed(2)}
              </p>
            )}

            <p className="line-clamp-1 text-[11px] text-[#6f675c] sm:text-sm">
              {product.unit}
            </p>
          </div>
        </div>

        <div className="border-t border-[#1d1d1b]/10 bg-white p-2 sm:p-3">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isPriceOnRequest}
            className={`w-full px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] transition sm:px-4 sm:py-3 sm:text-xs ${
              isPriceOnRequest
                ? 'cursor-not-allowed bg-[#d6cec0] text-[#6f675c]'
                : added
                  ? 'bg-[#79dd52] text-[#102011]'
                  : 'bg-[#244f3d] text-white hover:bg-[#1d1d1b]'
            }`}
          >
            {isPriceOnRequest
              ? 'Request Pricing'
              : added
                ? 'Added'
                : 'Quick Add'}
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="relative max-h-[85vh] overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-[#1d1d1b] shadow hover:bg-[#f4efe6]"
            aria-label="Close product details"
          >
            ×
          </button>

          <div className="mb-5 flex h-64 w-full items-center justify-center bg-white p-4 sm:h-72">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#6f675c]/50">
                No Image
              </div>
            )}
          </div>

          <p className="text-xs font-mono text-[#6f675c]">{product.sku}</p>

          <h2 className="mt-1 pr-10 text-2xl font-bold">{product.name}</h2>

          <p className="mt-1 text-sm text-[#6f675c]">
            {product.category} · {product.unit}
          </p>

          {product.supplier && (
            <div className="mt-3 inline-flex rounded-full bg-[#eef7f1] px-3 py-1 text-sm font-semibold text-[#244f3d]">
              From {product.supplier}
            </div>
          )}

          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              isProducerProduct && isProducerFulfilled
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : inStock
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-orange-200 bg-orange-50 text-orange-800'
            }`}
          >
            <p className="font-bold">
              {isProducerProduct && isProducerFulfilled
                ? 'Producer Delivered'
                : inStock
                  ? 'In Stock'
                  : 'Special Order'}
            </p>

            {!inStock ? (
              <SpecialOrderTerms
                minimum={categoryMinimum}
                category={product.category ?? undefined}
                schedule={deliverySchedule}
                expanded
              />
            ) : (
              <ScheduleList
                schedule={deliverySchedule}
                fallback="Delivery schedule has not been set."
              />
            )}

            {dropoffNotes && (
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm leading-6">
                {dropoffNotes}
              </p>
            )}
          </div>

          {product.description && (
            <div className="mt-5 max-h-40 overflow-y-auto border-t border-[#d6cec0] pt-5">
              <p className="text-sm leading-6 text-[#4d4d4d]">
                {product.description}
              </p>
            </div>
          )}

          <div className="my-6">
            {isPriceOnRequest ? (
              <>
                <p className="text-2xl font-black uppercase tracking-[0.08em] text-[#b45309]">
                  Price on Request
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f675c]">
                  This item is available for custom or contract pricing. Contact
                  Local Connect for current availability and pricing.
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">
                  ${Number(product.price ?? 0).toFixed(2)}
                </p>
                <p className="text-sm text-[#6f675c]">{product.unit}</p>
              </>
            )}
          </div>

          {isPriceOnRequest ? (
            <button
              type="button"
              className="w-full bg-[#244f3d] px-5 py-3 font-semibold text-white transition hover:bg-[#1d1d1b]"
              onClick={() => setIsOpen(false)}
            >
              Contact for Pricing
            </button>
          ) : (
            <div className="flex items-center justify-between border-t border-[#d6cec0] pt-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="border border-[#d6cec0] px-3 py-1 transition hover:border-[#244f3d] hover:bg-[#244f3d] hover:text-white"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  -
                </button>

                <span className="w-8 text-center font-bold">{qty}</span>

                <button
                  type="button"
                  className="border border-[#d6cec0] px-3 py-1 transition hover:border-[#244f3d] hover:bg-[#244f3d] hover:text-white"
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="bg-[#244f3d] px-5 py-2 font-semibold text-white transition hover:bg-[#1d1d1b]"
                onClick={() => {
                  addToCart({ product, quantity: qty })
                  window.dispatchEvent(new Event('cartUpdated'))
                  window.dispatchEvent(new Event('cart-updated'))
                  setQty(1)
                  setIsOpen(false)
                }}
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

function StatusBadge({
  type,
  label,
}: {
  type: 'green' | 'blue' | 'orange'
  label: string
}) {
  const className =
    type === 'green'
      ? 'bg-green-100 text-green-700'
      : type === 'blue'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-orange-100 text-orange-700'

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px] ${className}`}
    >
      {label}
    </span>
  )
}

function SpecialOrderTerms({
  minimum,
  category,
  schedule,
  expanded = false,
}: {
  minimum: number
  category?: string
  schedule: ScheduleItem[]
  expanded?: boolean
}) {
  return (
    <div
      className={
        expanded
          ? 'mt-2 space-y-3 text-sm'
          : 'mt-2 space-y-1 text-[11px] text-[#6f675c]'
      }
    >
      {minimum > 0 && (
        <p>
          ${minimum.toFixed(2)} {category} minimum
        </p>
      )}

      {schedule.length > 0 ? (
        expanded ? (
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <ScheduleCard key={`${item.delivery_day}-${index}`} item={item} />
            ))}
          </div>
        ) : (
          <p className="line-clamp-2">{formatScheduleShort(schedule)}</p>
        )
      ) : (
        <p>No delivery schedule set.</p>
      )}
    </div>
  )
}

function ScheduleList({
  schedule,
  fallback,
}: {
  schedule: ScheduleItem[]
  fallback: string
}) {
  if (!schedule || schedule.length === 0) {
    return <p className="mt-2">{fallback}</p>
  }

  return (
    <div className="mt-2 space-y-2">
      {schedule.map((item, index) => (
        <ScheduleCard key={`${item.delivery_day}-${index}`} item={item} />
      ))}
    </div>
  )
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <p className="font-bold">{item.delivery_day} delivery</p>
      <p className="mt-1">
        Order by {item.cutoff_day} at {formatTime(item.cutoff_time)}
      </p>
    </div>
  )
}

function getSchedule(value: any): ScheduleItem[] {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function formatScheduleShort(schedule: ScheduleItem[]) {
  return schedule
    .map(
      (item) =>
        `${item.delivery_day} by ${item.cutoff_day} ${formatTime(
          item.cutoff_time
        )}`
    )
    .join(' · ')
}

function formatTime(time: string) {
  if (!time) return 'cutoff not set'

  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}