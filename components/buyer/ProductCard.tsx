'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

export default function ProductCard({
  product,
}: {
  product: Product
}) {
  const router = useRouter()

  const [added, setAdded] = useState(false)

  const productAny = product as any

  const isPriceOnRequest = Boolean(product.price_on_request)
  const isProducerProduct = Boolean(productAny.producer_customer_id)

  const fulfillmentType = productAny.fulfillment_type
  const producerDeliveryFulfillmentType =
    productAny.producer_delivery_fulfillment_type

  const isProducerFulfilled =
    fulfillmentType === 'producer_fulfilled' ||
    producerDeliveryFulfillmentType === 'self_fulfilled'

  const inStock = Boolean(productAny.in_stock)

  function openProduct() {
    router.push(`/products/${product.id}`)
  }

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (isPriceOnRequest) return

    addToCart({
      product,
      quantity: 1,
    })

    window.dispatchEvent(new Event('cartUpdated'))
    window.dispatchEvent(new Event('cart-updated'))

    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 900)
  }

  return (
    <article className="flex h-full flex-col bg-white">
      {/* PRODUCT LINK AREA */}

      <button
        type="button"
        onClick={openProduct}
        className="
          group
          flex
          flex-1
          cursor-pointer
          flex-col
          bg-white
          p-2.5
          text-left
          transition-colors
          hover:bg-[#fafbf9]
          sm:p-4
        "
      >
        {/* IMAGE */}

        <div
          className="
            mb-2
            flex
            aspect-square
            w-full
            items-center
            justify-center
            overflow-hidden
            bg-white
            p-1.5
            sm:mb-4
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
                group-hover:scale-[1.03]
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-center
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#6f675c]/50
                sm:text-xs
              "
            >
              No Image
            </div>
          )}
        </div>

        {/* SKU */}

        <p className="truncate text-[9px] font-mono text-[#6f675c] sm:text-xs">
          {product.sku}
        </p>

        {/* NAME */}

        <h2
          className="
            mt-1
            line-clamp-2
            text-sm
            font-semibold
            leading-tight
            text-[#181c19]
            sm:min-h-[2.6em]
            sm:text-base
          "
        >
          {product.name}
        </h2>

        {/* CATEGORY */}

        <p className="mt-1 line-clamp-1 text-[11px] text-[#6f675c] sm:text-sm">
          {product.category}
        </p>

        {/* SUPPLIER */}

        {product.supplier && (
          <p
            className="
              mt-1
              hidden
              text-xs
              font-medium
              text-[#244f3d]
              sm:line-clamp-1
              sm:block
            "
          >
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

        <div className="mt-auto pt-3 sm:pt-4">
          {isPriceOnRequest ? (
            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-[#b45309]
                sm:text-base
              "
            >
              Price on Request
            </p>
          ) : (
            <p className="text-base font-bold text-[#181c19] sm:text-xl">
              ${Number(product.price ?? 0).toFixed(2)}
            </p>
          )}

          <p className="line-clamp-1 text-[11px] text-[#6f675c] sm:text-sm">
            {product.unit}
          </p>
        </div>

        {/* VIEW DETAILS HINT */}

        <div
          className="
            mt-3
            hidden
            items-center
            gap-1
            text-[10px]
            font-bold
            uppercase
            tracking-[0.1em]
            text-[#1f5a43]
            opacity-70
            transition-opacity
            group-hover:opacity-100
            sm:flex
          "
        >
          View details

          <span aria-hidden="true">
            →
          </span>
        </div>
      </button>

      {/* QUICK ADD */}

      <div className="border-t border-[#1d1d1b]/10 bg-white p-2 sm:p-3">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isPriceOnRequest}
          className={`
            w-full
            px-3
            py-2.5
            text-[10px]
            font-black
            uppercase
            tracking-[0.1em]
            transition
            sm:px-4
            sm:py-3
            sm:text-xs

            ${
              isPriceOnRequest
                ? 'cursor-not-allowed bg-[#d6cec0] text-[#6f675c]'
                : added
                  ? 'bg-[#79dd52] text-[#102011]'
                  : 'bg-[#244f3d] text-white hover:bg-[#1d1d1b]'
            }
          `}
        >
          {isPriceOnRequest
            ? 'Request Pricing'
            : added
              ? 'Added'
              : 'Quick Add'}
        </button>
      </div>
    </article>
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
      className={`
        inline-flex
        rounded-full
        px-2
        py-1
        text-[9px]
        font-black
        uppercase
        tracking-[0.08em]
        sm:text-[10px]
        ${className}
      `}
    >
      {label}
    </span>
  )
}