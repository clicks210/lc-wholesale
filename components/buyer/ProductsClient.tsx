'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/buyer/ProductCard'
import type { Product } from '@/types/product'

export default function ProductsClient({
  products,
  initialCategory,
}: {
  products: Product[]
  initialCategory: string
}) {
  const searchParams = useSearchParams()
  const autoOpenProductId = searchParams.get('product')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory || 'All')
  const [sort, setSort] = useState('name')

  useEffect(() => {
    setCategory(initialCategory || 'All')
  }, [initialCategory])

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value))

    return ['All', ...Array.from(new Set(values)).sort()]
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (category !== 'All') {
      result = result.filter(
        (product) =>
          product.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase()

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
      result.sort(
        (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)
      )
    }

    if (sort === 'price-high') {
      result.sort(
        (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)
      )
    }

    return result
  }, [products, category, search, sort])

  const hasActiveFilters =
    search.trim().length > 0 || category !== 'All'

  function clearFilters() {
    setSearch('')
    setCategory('All')
    setSort('name')
  }

  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#181c19]">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6 md:px-8 lg:px-10 xl:px-12">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b border-[#d9ddd8] pb-5 sm:pb-7">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                Wholesale Catalogue
              </p>

              <h1 className="mt-2 text-[34px] font-semibold leading-[0.98] tracking-[-0.045em] sm:mt-3 sm:text-5xl">
                {category === 'All'
                  ? 'Products'
                  : category}
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#69716b] sm:mt-3 sm:text-[15px] sm:leading-6">
                {category === 'All'
                  ? 'Browse available products across Local Connect suppliers and foodservice programs.'
                  : `Browse available ${category.toLowerCase()} products for wholesale ordering.`}
              </p>
            </div>

            <div className="flex items-end gap-6 sm:gap-8">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#929994]">
                  Available
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1f5a43] sm:text-3xl">
                  {filteredProducts.length}
                </p>
              </div>

              <div className="hidden max-w-[260px] border-l border-[#d9ddd8] pl-5 md:block">
                <p className="text-[12px] leading-5 text-[#727a73]">
                  Need something not listed?
                </p>

                <p className="mt-1 text-[12px] font-semibold text-[#1f5a43]">
                  Ask your Local Connect rep.
                </p>
              </div>
            </div>

          </div>
        </section>


        {/* =====================================================
            FILTER TOOLBAR
        ===================================================== */}

        <section className="sticky top-[62px] z-20 -mx-3 mt-0 border-b border-[#d9ddd8] bg-white/94 px-3 backdrop-blur-2xl backdrop-saturate-150 sm:top-0 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12">
          <div className="mx-auto grid max-w-[1500px] grid-cols-2 md:grid-cols-[1fr_220px_220px]">

            {/* SEARCH */}

            <div className="relative col-span-2 border-b border-[#e1e4df] md:col-span-1 md:border-b-0 md:border-r">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777e78] sm:left-0"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, SKU, category..."
                className="
                  h-14
                  w-full
                  bg-transparent
                  pl-8
                  pr-4
                  text-[14px]
                  sm:h-16
                  sm:pl-7
                  font-medium
                  text-[#202621]
                  outline-none
                  placeholder:text-[#929994]
                "
              />
            </div>


            {/* CATEGORY */}

            <div className="relative border-r border-[#e1e4df] md:border-b-0 md:border-r">
              <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:left-5 sm:top-2.5">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="
                  h-14
                  w-full
                  cursor-pointer
                  sm:h-16
                  appearance-none
                  bg-transparent
                  px-4
                  pt-3
                  text-[12px]
                  sm:px-5
                  sm:text-[13px]
                  font-semibold
                  text-[#343b36]
                  outline-none
                "
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737973]"
              >
                <path
                  d="m7 10 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>


            {/* SORT */}

            <div className="relative">
              <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:left-5 sm:top-2.5">
                Sort
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="
                  h-14
                  w-full
                  cursor-pointer
                  sm:h-16
                  appearance-none
                  bg-transparent
                  px-4
                  pt-3
                  text-[12px]
                  sm:px-5
                  sm:text-[13px]
                  font-semibold
                  text-[#343b36]
                  outline-none
                "
              >
                <option value="name">
                  Name A–Z
                </option>

                <option value="price-low">
                  Price: Low → High
                </option>

                <option value="price-high">
                  Price: High → Low
                </option>
              </select>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737973]"
              >
                <path
                  d="m7 10 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

          </div>
        </section>


        <div className="flex items-center justify-between border-b border-[#e1e4df] bg-white/70 px-1 py-2.5 text-[10px] text-[#737a74] sm:hidden">
          <span>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-bold uppercase tracking-[0.08em] text-[#1f5a43]"
            >
              Reset
            </button>
          )}
        </div>

        {/* =====================================================
            CATALOGUE STATUS
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 sm:gap-3 sm:py-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-[#6f766f] sm:text-[10px] sm:tracking-[0.12em]">
            {category === 'All'
              ? 'Full catalogue'
              : category}

            <span className="ml-2 text-[#9ba19c]">
              / {filteredProducts.length}{' '}
              {filteredProducts.length === 1
                ? 'product'
                : 'products'}
            </span>
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-[#1f5a43]
                transition-opacity
                hover:opacity-65
              "
            >
              Clear filters
            </button>
          )}
        </div>


        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {filteredProducts.length === 0 ? (
          <div className="border-y border-[#d9ddd8] bg-white px-5 py-16 text-center sm:py-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
              No results
            </p>

            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Nothing matched that search.
            </h2>

            <p className="mt-3 text-sm text-[#737973]">
              Try another product, SKU, or category.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="
                mt-7
                border
                border-[#1f5a43]
                px-5
                py-3
                text-[10px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-[#1f5a43]
                transition-colors
                hover:bg-[#1f5a43]
                hover:text-white
              "
            >
              Clear filters
            </button>
          </div>
        ) : (

          /* =====================================================
              PRODUCT GRID
          ===================================================== */

          <div
            className="
              grid
              grid-cols-1
              gap-px
              min-[430px]:grid-cols-2
              overflow-hidden
              border
              border-[#d9ddd8]
              bg-[#d9ddd8]
              lg:grid-cols-3
              xl:grid-cols-4
              2xl:grid-cols-5
            "
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="
                  group
                  relative
                  min-w-0
                  bg-white
                  transition-colors
                  duration-150
                  hover:bg-[#fafbf9]
                "
              >
                <ProductCard
                  product={product}
                  autoOpen={product.id === autoOpenProductId}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}