'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from '@/components/buyer/ProductCard'
import type { Product } from '@/types/product'
import { addToCart } from '@/lib/cart'

const categories = ['All', 'Produce', 'Bread', 'Poultry', 'Paper']

export default function ProductsClient({
  products,
  initialCategory,
}: {
  products: Product[]
  initialCategory: string
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory || 'All')
  const [sort, setSort] = useState('name')
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    setCategory(initialCategory || 'All')
  }, [initialCategory])

  function quickAddToCart(product: Product) {
    addToCart({ product, quantity: 1 })
    setAddedId(product.id)
    window.dispatchEvent(new Event('cartUpdated'))
    window.dispatchEvent(new Event('cart-updated'))
    setTimeout(() => setAddedId(null), 900)
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (category !== 'All') {
      result = result.filter(
        (product) => product.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter((product) => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        )
      })
    }

    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (sort === 'price-low') {
      result.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
    }

    if (sort === 'price-high') {
      result.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
    }

    return result
  }, [products, category, search, sort])

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-3 py-5 text-[#1d1d1b] sm:px-4 md:px-6">
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-5 border border-[#1d1d1b]/15 bg-white shadow-[8px_8px_0_#244f3d]/10 sm:mb-6">
          <div className="border-b border-[#1d1d1b]/10 bg-[#244f3d] px-4 py-5 text-white md:px-7 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                  {category === 'All' ? 'All Products' : category}
                </h1>

                <p className="mt-2 text-sm font-medium text-white/70">
                  {filteredProducts.length} products available for wholesale ordering.
                </p>
              </div>

              <div className="border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white/80">
                Need something not listed? Contact your Local Connect rep.
              </div>
            </div>
          </div>

          <div className="grid gap-3 bg-white p-3 sm:p-4 md:grid-cols-[1fr_190px_190px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, category..."
              className="w-full border border-[#1d1d1b]/15 bg-[#fbfaf7] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#244f3d] focus:bg-white"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-[#1d1d1b]/15 bg-[#fbfaf7] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#244f3d] focus:bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-[#1d1d1b]/15 bg-[#fbfaf7] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#244f3d] focus:bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
        </section>

        {filteredProducts.length === 0 ? (
          <div className="border border-[#1d1d1b]/15 bg-white p-10 text-center shadow-[8px_8px_0_#244f3d]/10">
            <h2 className="text-2xl font-black tracking-[-0.03em]">
              No products found
            </h2>
            <p className="mt-2 text-sm text-[#6f675c]">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
  {filteredProducts.map((product) => (
    <div
      key={product.id}
      className="group relative overflow-hidden border border-[#1d1d1b]/15 bg-white transition hover:border-[#244f3d] hover:shadow-[7px_7px_0_#244f3d]/20"
    >
      <ProductCard product={product} />

      
    </div>
  ))}
</div>
        )}
      </div>
    </div>
  )
}