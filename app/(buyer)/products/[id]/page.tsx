'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

type ScheduleItem = {
  delivery_day: string
  cutoff_day: string
  cutoff_time: string
}

const LC_SCHEDULE: ScheduleItem[] = [
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

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()

  const id = String(params.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  /* =====================================================
     LOAD PRODUCT
  ===================================================== */

  useEffect(() => {
    let active = true

    async function loadProduct() {
      setLoading(true)
      setError('')
      setRelatedProducts([])
      setQty(1)

      const {
        data,
        error: productError,
      } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!active) return

      if (productError || !data) {
        setError('This product could not be found.')
        setLoading(false)
        return
      }

      const loadedProduct = data as Product

      setProduct(loadedProduct)
      setLoading(false)

      /* =====================================================
         RELATED PRODUCTS
      ===================================================== */

      if (!data.category) return

      const {
        data: related,
        error: relatedError,
      } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category', data.category)
        .neq('id', data.id)
        .limit(4)

      if (!active) return

      if (!relatedError && related) {
        setRelatedProducts(related as Product[])
      }
    }

    loadProduct()

    return () => {
      active = false
    }
  }, [id])

  /* =====================================================
     PRODUCT DATA
  ===================================================== */

  const productAny = product as any

  const isPriceOnRequest = Boolean(
    product?.price_on_request
  )

  const isProducerProduct = Boolean(
    productAny?.producer_customer_id
  )

  const fulfillmentType =
    productAny?.fulfillment_type

  const producerDeliveryFulfillmentType =
    productAny?.producer_delivery_fulfillment_type

  const isLcFulfilled =
    fulfillmentType === 'lc_stocked' ||
    producerDeliveryFulfillmentType === 'local_connect'

  const isProducerFulfilled =
    fulfillmentType === 'producer_fulfilled' ||
    producerDeliveryFulfillmentType === 'self_fulfilled'

  const inStock = Boolean(
    productAny?.in_stock
  )

  const categoryMinimum = Number(
    productAny?.category_minimum || 0
  )

  const dropoffNotes =
    productAny?.producer_dropoff_notes

  const deliverySchedule = useMemo(
    () =>
      getSchedule(
        isProducerProduct
          ? productAny?.producer_delivery_schedule ||
              productAny?.delivery_schedule
          : productAny?.delivery_schedule ||
              productAny?.category_delivery_schedule
      ),
    [
      productAny,
      isProducerProduct,
    ]
  )

  const displayedSchedule =
    !isProducerProduct || isLcFulfilled
      ? LC_SCHEDULE
      : deliverySchedule

  /* =====================================================
     CART
  ===================================================== */

  function handleAddToCart() {
    if (!product || isPriceOnRequest) {
      return
    }

    addToCart({
      product,
      quantity: qty,
    })

    window.dispatchEvent(
      new Event('cartUpdated')
    )

    window.dispatchEvent(
      new Event('cart-updated')
    )

    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 1200)
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f5f2]">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">

          <div className="mb-8 h-4 w-32 animate-pulse rounded bg-[#dfe2de]" />

          <div className="grid gap-10 lg:grid-cols-2">

            <div className="aspect-square animate-pulse bg-white" />

            <div className="space-y-5 py-4">

              <div className="h-3 w-24 animate-pulse rounded bg-[#dfe2de]" />

              <div className="h-12 w-3/4 animate-pulse rounded bg-[#dfe2de]" />

              <div className="h-5 w-1/3 animate-pulse rounded bg-[#dfe2de]" />

              <div className="mt-10 h-32 animate-pulse rounded bg-white" />

            </div>

          </div>

        </div>
      </main>
    )
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f5f2] px-4">

        <div className="max-w-md text-center">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
            Product unavailable
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            We couldn&apos;t find that product.
          </h1>

          <button
            type="button"
            onClick={() => router.push('/products')}
            className="mt-7 bg-[#244f3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d1d1b]"
          >
            Back to products
          </button>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#181c19]">

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

        {/* =====================================================
            BACK
        ===================================================== */}

        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-5
            inline-flex
            items-center
            gap-2
            text-[11px]
            font-bold
            uppercase
            tracking-[0.1em]
            text-[#1f5a43]
            transition-opacity
            hover:opacity-60
            sm:mb-8
          "
        >
          ← Back to catalogue
        </button>

        {/* =====================================================
            MAIN PRODUCT
        ===================================================== */}

        <section
          className="
            overflow-hidden
            border
            border-[#d9ddd8]
            bg-white
            lg:grid
            lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]
          "
        >

          {/* IMAGE */}

          <div
            className="
              flex
              aspect-square
              items-center
              justify-center
              bg-white
              p-5
              sm:p-10
              lg:aspect-auto
              lg:min-h-[620px]
              lg:p-14
            "
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                decoding="async"
                className="h-full max-h-[650px] w-full object-contain"
              />
            ) : (
              <div className="flex h-full min-h-[300px] w-full items-center justify-center text-sm font-bold uppercase tracking-[0.15em] text-[#777]/50">
                No Image
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div
            className="
              flex
              flex-col
              border-t
              border-[#d9ddd8]
              p-5
              sm:p-8
              lg:border-l
              lg:border-t-0
              lg:p-10
            "
          >

            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858c86]">
              {product.sku}
            </p>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1f5a43]">
              {product.category}
            </p>

            <h1
              className="
                mt-2
                text-[32px]
                font-semibold
                leading-[1.02]
                tracking-[-0.045em]
                sm:text-[42px]
                lg:text-[48px]
              "
            >
              {product.name}
            </h1>

            <p className="mt-3 text-[14px] text-[#747b75]">
              {product.unit}
            </p>

            {/* SUPPLIER */}

            {product.supplier && (
              <div className="mt-5">

                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#989f99]">
                  Supplied by
                </p>

                <p className="mt-1 text-sm font-semibold text-[#1f5a43]">
                  {product.supplier}
                </p>

              </div>
            )}

            {/* STATUS */}

            <div className="mt-7">

              {isProducerProduct && isProducerFulfilled ? (
                <StatusBadge
                  type="blue"
                  label="Producer Delivered"
                />
              ) : inStock ? (
                <StatusBadge
                  type="green"
                  label="In Stock"
                />
              ) : (
                <StatusBadge
                  type="orange"
                  label="Special Order"
                />
              )}

            </div>

            {/* DESCRIPTION */}

            {product.description && (
              <div className="mt-7 border-t border-[#e1e4df] pt-6">

                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#999f9a]">
                  Product details
                </p>

                <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#555d57]">
                  {product.description}
                </p>

              </div>
            )}

            {/* FULFILLMENT */}

            <div className="mt-7 border-t border-[#e1e4df] pt-6">

              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#999f9a]">
                Fulfillment
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                {isProducerProduct && isLcFulfilled
                  ? 'Local Connect Fulfilled'
                  : isProducerProduct && isProducerFulfilled
                    ? 'Producer Delivered'
                    : inStock
                      ? 'In Stock'
                      : 'Special Order'}
              </h2>

              <div className="mt-4 grid gap-2">

                {displayedSchedule.length > 0 ? (
                  displayedSchedule.map(
                    (item, index) => (
                      <ScheduleCard
                        key={`${item.delivery_day}-${index}`}
                        item={item}
                      />
                    )
                  )
                ) : (
                  <p className="text-sm text-[#747b75]">
                    Delivery schedule has not been set.
                  </p>
                )}

              </div>

              {dropoffNotes && (
                <div className="mt-4 bg-[#f4f5f2] p-4">

                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#898f8a]">
                    Delivery notes
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#555d57]">
                    {dropoffNotes}
                  </p>

                </div>
              )}

              {!inStock &&
                !isProducerProduct &&
                categoryMinimum > 0 && (
                  <p className="mt-4 text-sm font-medium text-[#b45309]">
                    ${categoryMinimum.toFixed(2)}{' '}
                    {product.category}{' '}
                    minimum
                  </p>
                )}

            </div>

            {/* =====================================================
                ORDER AREA
            ===================================================== */}

            <div className="mt-auto pt-8">

              <div className="border-t border-[#d9ddd8] pt-7">

                {isPriceOnRequest ? (
                  <>

                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b45309]">
                      Price on Request
                    </p>

                    <p className="mt-2 max-w-md text-sm leading-6 text-[#6f766f]">
                      This item is available with custom or contract pricing.
                      Contact Local Connect for current pricing and availability.
                    </p>

                    <button
                      type="button"
                      className="
                        mt-6
                        w-full
                        bg-[#244f3d]
                        px-6
                        py-4
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:bg-[#1d1d1b]
                      "
                    >
                      Contact for Pricing
                    </button>

                  </>
                ) : (
                  <>

                    {/* PRICE */}

                    <div>

                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#989f99]">
                        Price
                      </p>

                      <p className="mt-1 text-4xl font-semibold tracking-[-0.045em]">
                        $
                        {Number(
                          product.price ?? 0
                        ).toFixed(2)}
                      </p>

                      <p className="mt-1 text-sm text-[#747b75]">
                        {product.unit}
                      </p>

                    </div>

                    {/* QUANTITY */}

                    <div className="mt-6">

                      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#989f99]">
                        Quantity
                      </p>

                      <div className="grid grid-cols-[54px_1fr_54px] border border-[#d9ddd8]">

                        <button
                          type="button"
                          onClick={() =>
                            setQty(
                              Math.max(
                                1,
                                qty - 1
                              )
                            )
                          }
                          className="
                            h-14
                            border-r
                            border-[#d9ddd8]
                            text-xl
                            font-medium
                            transition
                            hover:bg-[#f4f5f2]
                          "
                        >
                          −
                        </button>

                        <div className="flex h-14 items-center justify-center font-semibold">
                          {qty}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setQty(qty + 1)
                          }
                          className="
                            h-14
                            border-l
                            border-[#d9ddd8]
                            text-xl
                            font-medium
                            transition
                            hover:bg-[#f4f5f2]
                          "
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* ADD */}

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`
                        mt-3
                        w-full
                        px-6
                        py-4
                        text-sm
                        font-bold
                        uppercase
                        tracking-[0.08em]
                        transition

                        ${
                          added
                            ? 'bg-[#79dd52] text-[#102011]'
                            : 'bg-[#244f3d] text-white hover:bg-[#1d1d1b]'
                        }
                      `}
                    >
                      {added
                        ? `${qty} Added`
                        : `Add ${qty} to Cart`}
                    </button>

                  </>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RELATED PRODUCTS
        ===================================================== */}

        {relatedProducts.length > 0 && (
          <section className="mt-10 border-t border-[#d9ddd8] pt-8 sm:mt-14 sm:pt-10">

            {/* HEADER */}

            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                  You might also need
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                  Related products
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#747b75]">
                  More products from the{' '}
                  {product.category?.toLowerCase()} category.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/products?category=${encodeURIComponent(
                      product.category ?? ''
                    )}`
                  )
                }
                className="
                  hidden
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-[#1f5a43]
                  transition-opacity
                  hover:opacity-60
                  sm:block
                "
              >
                View category →
              </button>

            </div>

            {/* GRID */}

            <div
              className="
                grid
                grid-cols-2
                gap-px
                overflow-hidden
                border
                border-[#d9ddd8]
                bg-[#d9ddd8]
                lg:grid-cols-4
              "
            >
              {relatedProducts.map(
                (relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    onOpen={() =>
                      router.push(
                        `/products/${relatedProduct.id}`
                      )
                    }
                  />
                )
              )}
            </div>

            {/* MOBILE VIEW ALL */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/products?category=${encodeURIComponent(
                    product.category ?? ''
                  )}`
                )
              }
              className="
                mt-4
                w-full
                border
                border-[#1f5a43]
                px-5
                py-3
                text-[10px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-[#1f5a43]
                sm:hidden
              "
            >
              View more {product.category}
            </button>

          </section>
        )}

      </div>

    </main>
  )
}

/* =====================================================
   RELATED PRODUCT CARD
===================================================== */

function RelatedProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  const productAny = product as any

  const inStock = Boolean(
    productAny.in_stock
  )

  const isProducerProduct = Boolean(
    productAny.producer_customer_id
  )

  const fulfillmentType =
    productAny.fulfillment_type

  const producerDeliveryFulfillmentType =
    productAny.producer_delivery_fulfillment_type

  const isProducerFulfilled =
    fulfillmentType === 'producer_fulfilled' ||
    producerDeliveryFulfillmentType === 'self_fulfilled'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="
        group
        flex
        min-w-0
        flex-col
        bg-white
        p-3
        text-left
        transition-colors
        hover:bg-[#fafbf9]
        sm:p-4
      "
    >

      {/* IMAGE */}

      <div
        className="
          flex
          aspect-square
          w-full
          items-center
          justify-center
          overflow-hidden
          bg-white
          p-2
          sm:p-3
        "
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="
              h-full
              w-full
              object-contain
              transition-transform
              duration-300
              group-hover:scale-[1.04]
            "
          />
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777]/40">
            No Image
          </span>
        )}
      </div>

      {/* CONTENT */}

      <div className="mt-3 flex flex-1 flex-col">

        {product.sku && (
          <p className="truncate font-mono text-[9px] text-[#8a908b]">
            {product.sku}
          </p>
        )}

        <h3
          className="
            mt-1
            line-clamp-2
            text-sm
            font-semibold
            leading-tight
            sm:min-h-[2.5em]
            sm:text-base
          "
        >
          {product.name}
        </h3>

        {product.supplier && (
          <p className="mt-1 hidden truncate text-[11px] font-medium text-[#1f5a43] sm:block">
            {product.supplier}
          </p>
        )}

        {/* STATUS */}

        <div className="mt-2">

          {isProducerProduct && isProducerFulfilled ? (
            <StatusBadge
              type="blue"
              label="Producer Delivered"
            />
          ) : inStock ? (
            <StatusBadge
              type="green"
              label="In Stock"
            />
          ) : (
            <StatusBadge
              type="orange"
              label="Special Order"
            />
          )}

        </div>

        {/* PRICE */}

        <div className="mt-auto pt-4">

          {product.price_on_request ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#b45309] sm:text-xs">
              Price on Request
            </p>
          ) : (
            <p className="text-base font-bold sm:text-lg">
              $
              {Number(
                product.price ?? 0
              ).toFixed(2)}
            </p>
          )}

          <p className="mt-0.5 truncate text-[10px] text-[#747b75] sm:text-xs">
            {product.unit}
          </p>

        </div>

        {/* VIEW */}

        <div className="mt-3 border-t border-[#eceeeb] pt-3">

          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#1f5a43]">
            View product →
          </span>

        </div>

      </div>

    </button>
  )
}

/* =====================================================
   STATUS BADGE
===================================================== */

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
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1.5
        text-[8px]
        font-black
        uppercase
        tracking-[0.08em]
        sm:text-[9px]
        ${className}
      `}
    >
      {label}
    </span>
  )
}

/* =====================================================
   SCHEDULE
===================================================== */

function ScheduleCard({
  item,
}: {
  item: ScheduleItem
}) {
  return (
    <div className="border border-[#e1e4df] bg-[#fafbf9] p-3">

      <p className="text-sm font-semibold">
        {item.delivery_day} delivery
      </p>

      <p className="mt-1 text-xs text-[#737a74]">
        Order by {item.cutoff_day} at{' '}
        {formatTime(item.cutoff_time)}
      </p>

    </div>
  )
}

/* =====================================================
   HELPERS
===================================================== */

function getSchedule(
  value: any
): ScheduleItem[] {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed =
        JSON.parse(value)

      return Array.isArray(parsed)
        ? parsed
        : []
    } catch {
      return []
    }
  }

  return []
}

function formatTime(
  time: string
) {
  if (!time) {
    return 'cutoff not set'
  }

  const [
    hourString,
    minute,
  ] = time.split(':')

  const hour =
    Number(hourString)

  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM'

  const displayHour =
    hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}