'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

export default function ProductCard({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

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
          className="flex flex-1 cursor-pointer flex-col bg-white p-3 transition sm:p-4"
        >
          <div className="mb-3 flex aspect-square w-full items-center justify-center bg-white p-2 sm:mb-4 sm:p-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-xs font-bold uppercase tracking-[0.12em] text-[#6f675c]/50">
                No Image
              </div>
            )}
          </div>

          <p className="truncate text-[10px] font-mono text-[#6f675c] sm:text-xs">
            {product.sku}
          </p>

          <h2 className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-tight sm:text-base">
            {product.name}
          </h2>

          <p className="mt-1 truncate text-xs text-[#6f675c] sm:text-sm">
            {product.category}
          </p>

          <div className="mt-3 sm:mt-4">
            <p className="text-lg font-bold sm:text-xl">
              ${Number(product.price ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-[#6f675c] sm:text-sm">{product.unit}</p>
          </div>
        </div>

        <div className="border-t border-[#1d1d1b]/10 bg-white p-2 sm:p-3">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] transition sm:px-4 sm:text-xs ${
              added
                ? 'bg-[#79dd52] text-[#102011]'
                : 'bg-[#244f3d] text-white hover:bg-[#1d1d1b]'
            }`}
          >
            {added ? 'Added' : 'Quick Add'}
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mb-5 flex h-72 w-full items-center justify-center bg-white p-4">
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

        <h2 className="mt-1 text-2xl font-bold">{product.name}</h2>

        <p className="mt-1 text-sm text-[#6f675c]">
          {product.category} · {product.unit}
        </p>

        {product.description && (
          <p className="mt-5 border-t border-[#d6cec0] pt-5 text-sm leading-6 text-[#4d4d4d]">
            {product.description}
          </p>
        )}

        <div className="my-6">
          <p className="text-3xl font-bold">
            ${Number(product.price ?? 0).toFixed(2)}
          </p>
          <p className="text-sm text-[#6f675c]">{product.unit}</p>
        </div>

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
      </Modal>
    </>
  )
}