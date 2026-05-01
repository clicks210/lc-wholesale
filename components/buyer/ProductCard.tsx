'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types/product'

export default function ProductCard({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false)
  const [qty, setQty] = useState(1)

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer border border-[#d6cec0] bg-white p-4 transition hover:border-[#244f3d]"
      >
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="mb-4 h-40 w-full object-cover"
          />
        )}

        <p className="text-xs font-mono text-[#6f675c]">{product.sku}</p>
        <h2 className="mt-1 font-semibold">{product.name}</h2>
        <p className="text-sm text-[#6f675c]">{product.category}</p>

        <div className="mt-4">
          <p className="text-xl font-bold">
            ${Number(product.price ?? 0).toFixed(2)}
          </p>
          <p className="text-sm text-[#6f675c]">{product.unit}</p>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="mb-5 h-64 w-full object-cover"
          />
        )}

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
              className="border border-[#d6cec0] px-3 py-1"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              -
            </button>

            <span className="w-8 text-center font-bold">{qty}</span>

            <button
              className="border border-[#d6cec0] px-3 py-1"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>

          <button
            className="bg-[#244f3d] px-5 py-2 font-semibold text-white"
            onClick={() => {
              addToCart({ product, quantity: qty })
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