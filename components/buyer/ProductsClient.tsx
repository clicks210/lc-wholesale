'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ProductCard from '@/components/buyer/ProductCard'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'

const PRODUCTS_PER_BATCH = 20
const PRODUCTS_PER_SECTION = 4

const WEEKLY_SPECIAL_CATEGORY = 'Weekly Special'

const CATEGORY_ORDER = [
  'Produce',
  'Poultry',
  'Beef',
  'Pork',
  'Seafood',
  'Bakery',
  'Bread & Bakery',
  'Dairy',
  'Eggs & Dairy',
  'Paper',
  'Paper & Packaging',
  'Chemicals',
]

type OrderGuide = {
  id: string
  name: string
  description?: string | null
  created_at?: string | null
}

type GuideItemRow = {
  id: string
  product_id: string
  sort_order?: number | null
}

export default function ProductsClient({
  products,
  initialCategory,
}: {
  products: Product[]
  initialCategory: string
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory || 'All')
  const [sort, setSort] = useState('recommended')

  const [visibleCount, setVisibleCount] =
    useState(PRODUCTS_PER_BATCH)

  const loadMoreRef =
    useRef<HTMLDivElement | null>(null)

  const [orderGuides, setOrderGuides] = useState<OrderGuide[]>([])
  const [guidesLoading, setGuidesLoading] = useState(true)
  const [guidePickerProduct, setGuidePickerProduct] =
    useState<Product | null>(null)
  const [addingToGuideId, setAddingToGuideId] =
    useState<string | null>(null)
  const [guideMessage, setGuideMessage] = useState('')

  /* =====================================================
     INITIAL CATEGORY
  ===================================================== */

  useEffect(() => {
    setCategory(initialCategory || 'All')
  }, [initialCategory])

  /* =====================================================
     ORDER GUIDES
  ===================================================== */

  useEffect(() => {
    let active = true

    async function loadOrderGuides() {
      setGuidesLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        setOrderGuides([])
        setGuidesLoading(false)
        return
      }

      const { data: membership, error: membershipError } = await supabase
        .from('customer_members')
        .select('customer_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!active) return

      if (membershipError || !membership?.customer_id) {
        if (membershipError) {
          console.error('Order guide membership error:', membershipError)
        }

        setOrderGuides([])
        setGuidesLoading(false)
        return
      }

      const { data: guides, error: guidesError } = await supabase
        .from('customer_order_guides')
        .select('id, name, description, created_at')
        .eq('customer_id', membership.customer_id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (guidesError) {
        console.error('Order guides query error:', guidesError)
        setOrderGuides([])
      } else {
        setOrderGuides((guides as OrderGuide[]) || [])
      }

      setGuidesLoading(false)
    }

    loadOrderGuides()

    return () => {
      active = false
    }
  }, [])

  function openGuidePicker(product: Product) {
    setGuidePickerProduct(product)
    setGuideMessage('')
  }

  function closeGuidePicker() {
    if (addingToGuideId) return

    setGuidePickerProduct(null)
    setGuideMessage('')
  }

  async function addProductToGuide(guideId: string) {
    if (!guidePickerProduct || addingToGuideId) return

    const product = guidePickerProduct

    setAddingToGuideId(guideId)
    setGuideMessage('')

    const { data: existingItems, error: itemsError } = await supabase
      .from('order_guide_items')
      .select('id, product_id, sort_order')
      .eq('guide_id', guideId)
      .order('sort_order', {
        ascending: false,
        nullsFirst: false,
      })

    if (itemsError) {
      console.error('Guide items query error:', itemsError)
      setGuideMessage('Could not check this order guide.')
      setAddingToGuideId(null)
      return
    }

    const items = (existingItems as GuideItemRow[]) || []

    if (items.some((item) => item.product_id === product.id)) {
      const guide = orderGuides.find((item) => item.id === guideId)

      setGuideMessage(
        `${product.name} is already in ${guide?.name || 'that guide'}.`
      )
      setAddingToGuideId(null)
      return
    }

    const highestSortOrder = items.reduce(
      (highest, item) =>
        Math.max(highest, Number(item.sort_order ?? 0)),
      0
    )

    const { error: insertError } = await supabase
      .from('order_guide_items')
      .insert({
        guide_id: guideId,
        product_id: product.id,
        quantity: 1,
        sort_order: highestSortOrder + 1,
      })

    if (insertError) {
      console.error('Add product to guide error:', insertError)
      setGuideMessage('Could not add this product to the guide.')
      setAddingToGuideId(null)
      return
    }

    const guide = orderGuides.find((item) => item.id === guideId)

    setGuideMessage(
      `Added ${product.name} to ${guide?.name || 'your order guide'}.`
    )
    setAddingToGuideId(null)

    window.setTimeout(() => {
      setGuidePickerProduct(null)
      setGuideMessage('')
    }, 900)
  }

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter(
        (value): value is string =>
          Boolean(value) &&
          value.toLowerCase() !==
            WEEKLY_SPECIAL_CATEGORY.toLowerCase()
      )

    const unique =
      Array.from(new Set(values))

    return [
      'All',
      ...sortCategories(unique),
    ]
  }, [products])

  /* =====================================================
     WEEKLY SPECIALS
  ===================================================== */

  const weeklySpecials = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.category
            ?.trim()
            .toLowerCase() ===
          WEEKLY_SPECIAL_CATEGORY.toLowerCase()
      )
      .sort(recommendedSort)
  }, [products])

  /* =====================================================
     SEARCH + FILTER + SORT
  ===================================================== */

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (category !== 'All') {
      result = result.filter(
        (product) =>
          product.category
            ?.toLowerCase() ===
          category.toLowerCase()
      )
    }

    if (search.trim()) {
      const query =
        search
          .trim()
          .toLowerCase()

      result = result.filter(
        (product) => {
          return (
            product.name
              ?.toLowerCase()
              .includes(query) ||
            product.sku
              ?.toLowerCase()
              .includes(query) ||
            product.category
              ?.toLowerCase()
              .includes(query) ||
            product.supplier
              ?.toLowerCase()
              .includes(query)
          )
        }
      )
    }

    return sortProducts(
      result,
      sort
    )
  }, [
    products,
    category,
    search,
    sort,
  ])

  /* =====================================================
     DEFAULT CATALOGUE HOME
  ===================================================== */

  const isCatalogueHome =
    category === 'All' &&
    search.trim().length === 0 &&
    sort === 'recommended'

  /* =====================================================
     GROUP PRODUCTS BY CATEGORY
  ===================================================== */

  const categorySections =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          Product[]
        >()

      products.forEach(
        (product) => {
          const name =
            product.category?.trim()

          if (!name) return

          /*
          |--------------------------------------------------------------------------
          | WEEKLY SPECIALS ARE HANDLED SEPARATELY
          |--------------------------------------------------------------------------
          */

          if (
            name.toLowerCase() ===
            WEEKLY_SPECIAL_CATEGORY.toLowerCase()
          ) {
            return
          }

          const existing =
            grouped.get(name) || []

          existing.push(product)

          grouped.set(
            name,
            existing
          )
        }
      )

      return sortCategories(
        Array.from(
          grouped.keys()
        )
      ).map((name) => {
        const sectionProducts =
          grouped.get(name) || []

        return {
          name,

          total:
            sectionProducts.length,

          products:
            [...sectionProducts]
              .sort(
                recommendedSort
              )
              .slice(
                0,
                PRODUCTS_PER_SECTION
              ),
        }
      })
    }, [products])

  /* =====================================================
     PROGRESSIVE RENDERING
  ===================================================== */

  const visibleProducts =
    useMemo(() => {
      return filteredProducts.slice(
        0,
        visibleCount
      )
    }, [
      filteredProducts,
      visibleCount,
    ])

  const hasMoreProducts =
    visibleCount <
    filteredProducts.length

  useEffect(() => {
    setVisibleCount(
      PRODUCTS_PER_BATCH
    )
  }, [
    search,
    category,
    sort,
  ])

  useEffect(() => {
    if (
      isCatalogueHome ||
      !hasMoreProducts
    ) {
      return
    }

    const target =
      loadMoreRef.current

    if (!target) return

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            !entry.isIntersecting
          ) {
            return
          }

          setVisibleCount(
            (current) =>
              Math.min(
                current +
                  PRODUCTS_PER_BATCH,
                filteredProducts.length
              )
          )
        },
        {
          rootMargin:
            '800px 0px',
        }
      )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [
    hasMoreProducts,
    filteredProducts.length,
    isCatalogueHome,
  ])

  /* =====================================================
     FILTER STATE
  ===================================================== */

  const hasActiveFilters =
    search.trim().length > 0 ||
    category !== 'All' ||
    sort !== 'recommended'

  function clearFilters() {
    setSearch('')
    setCategory('All')
    setSort('recommended')
    setVisibleCount(
      PRODUCTS_PER_BATCH
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function openCategory(
    categoryName: string
  ) {
    setCategory(categoryName)
    setSort('recommended')
    setVisibleCount(
      PRODUCTS_PER_BATCH
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#181c19]">

      <div
        className="
          mx-auto
          max-w-[1500px]
          px-3
          py-4
          sm:px-6
          sm:py-6
          md:px-8
          lg:px-10
          xl:px-12
        "
      >

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b border-[#d9ddd8] pb-5 sm:pb-7">

          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                Wholesale Catalogue
              </p>

              <h1
                className="
                  mt-2
                  text-[34px]
                  font-semibold
                  leading-[0.98]
                  tracking-[-0.045em]
                  sm:mt-3
                  sm:text-5xl
                "
              >
                {category === 'All'
                  ? 'Products'
                  : category}
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#69716b] sm:mt-3 sm:text-[15px] sm:leading-6">

                {category === 'All'
                  ? 'Browse weekly specials, core foodservice products, regional suppliers, and specialty programs.'
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

        <section
          className="
            sticky
            top-[62px]
            z-20
            -mx-3
            border-b
            border-[#d9ddd8]
            bg-white/94
            px-3
            backdrop-blur-2xl
            backdrop-saturate-150
            sm:top-0
            sm:-mx-6
            sm:px-6
            md:-mx-8
            md:px-8
            lg:-mx-10
            lg:px-10
            xl:-mx-12
            xl:px-12
          "
        >

          <div className="mx-auto grid max-w-[1500px] grid-cols-2 md:grid-cols-[1fr_220px_220px]">

            {/* SEARCH */}

            <div className="relative col-span-2 border-b border-[#e1e4df] md:col-span-1 md:border-b-0 md:border-r">

              <SearchIcon />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search products, supplier, SKU..."
                className="
                  h-14
                  w-full
                  bg-transparent
                  pl-8
                  pr-4
                  text-[14px]
                  font-medium
                  text-[#202621]
                  outline-none
                  placeholder:text-[#929994]
                  sm:h-16
                  sm:pl-7
                "
              />

            </div>

            {/* CATEGORY */}

            <div className="relative border-r border-[#e1e4df]">

              <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:left-5 sm:top-2.5">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="
                  h-14
                  w-full
                  cursor-pointer
                  appearance-none
                  bg-transparent
                  px-4
                  pt-3
                  text-[12px]
                  font-semibold
                  text-[#343b36]
                  outline-none
                  sm:h-16
                  sm:px-5
                  sm:text-[13px]
                "
              >
                {categories.map(
                  (cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  )
                )}
              </select>

              <Chevron />

            </div>

            {/* SORT */}

            <div className="relative">

              <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:left-5 sm:top-2.5">
                Sort
              </label>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value
                  )
                }
                className="
                  h-14
                  w-full
                  cursor-pointer
                  appearance-none
                  bg-transparent
                  px-4
                  pt-3
                  text-[12px]
                  font-semibold
                  text-[#343b36]
                  outline-none
                  sm:h-16
                  sm:px-5
                  sm:text-[13px]
                "
              >
                <option value="recommended">
                  Recommended
                </option>

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

              <Chevron />

            </div>

          </div>

        </section>

        {/* =====================================================
            MOBILE STATUS
        ===================================================== */}

        <div className="flex items-center justify-between border-b border-[#e1e4df] bg-white/70 px-1 py-2.5 text-[10px] text-[#737a74] sm:hidden">

          <span>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? 'product'
              : 'products'}
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
            CATALOGUE HOME
        ===================================================== */}

        {isCatalogueHome ? (
          <div>

            {/* =================================================
                WEEKLY SPECIALS
            ================================================= */}

            {weeklySpecials.length > 0 && (
              <WeeklySpecialsSection
                products={weeklySpecials}
                onAddToGuide={openGuidePicker}
              />
            )}

            {/* =================================================
                NORMAL CATEGORY SECTIONS
            ================================================= */}

            {categorySections.map(
              (section) => (
                <CatalogueSection
                  key={section.name}
                  eyebrow={`${section.total} ${
                    section.total === 1
                      ? 'product'
                      : 'products'
                  }`}
                  title={section.name}
                  products={
                    section.products
                  }
                  onViewAll={() =>
                    openCategory(
                      section.name
                    )
                  }
                  onAddToGuide={openGuidePicker}
                />
              )
            )}

          </div>
        ) : (

          /* =====================================================
             SEARCH / CATEGORY / SORT RESULTS
          ===================================================== */

          <>

            <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 sm:gap-3 sm:py-5">

              <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-[#6f766f] sm:text-[10px]">

                {search.trim()
                  ? 'Search results'
                  : category === 'All'
                    ? 'Full catalogue'
                    : category}

                <span className="ml-2 text-[#9ba19c]">
                  /{' '}
                  {
                    filteredProducts.length
                  }{' '}
                  {filteredProducts.length === 1
                    ? 'product'
                    : 'products'}
                </span>

              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f5a43] transition-opacity hover:opacity-65"
                >
                  Clear filters
                </button>
              )}

            </div>

            {/* EMPTY STATE */}

            {filteredProducts.length === 0 ? (

              <div className="border-y border-[#d9ddd8] bg-white px-5 py-16 text-center sm:py-24">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
                  No results
                </p>

                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                  Nothing matched that search.
                </h2>

                <p className="mt-3 text-sm text-[#737973]">
                  Try another product, supplier, SKU, or category.
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
              <>

                <ProductGrid
                  products={visibleProducts}
                  onAddToGuide={openGuidePicker}
                />

                {hasMoreProducts && (
                  <div
                    ref={loadMoreRef}
                    className="flex h-24 items-center justify-center"
                    aria-hidden="true"
                  >

                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c938d]">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9ddd8] border-t-[#1f5a43]" />

                      Loading more

                    </div>

                  </div>
                )}

              </>
            )}

          </>
        )}

      </div>

      <OrderGuidePicker
        product={guidePickerProduct}
        guides={orderGuides}
        loading={guidesLoading}
        addingToGuideId={addingToGuideId}
        message={guideMessage}
        onClose={closeGuidePicker}
        onAdd={addProductToGuide}
      />

    </div>
  )
}

/* =============================================================
   WEEKLY SPECIALS
============================================================= */

function WeeklySpecialsSection({
  products,
  onAddToGuide,
}: {
  products: Product[]
  onAddToGuide: (product: Product) => void
}) {
  if (
    products.length === 0
  ) {
    return null
  }

  return (
    <section
      className="
        -mx-3
        border-b
        border-[#e8c79e]
        bg-[#fff0dc]
        px-3
        py-7
        sm:-mx-6
        sm:px-6
        sm:py-9
        md:-mx-8
        md:px-8
        lg:-mx-10
        lg:px-10
        xl:-mx-12
        xl:px-12
      "
    >

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-5 sm:mb-7">

          <div className="flex flex-wrap items-center gap-2">

            <span
              className="
                inline-flex
                rounded-full
                bg-[#f4c983]
                px-2.5
                py-1
                text-[8px]
                font-black
                uppercase
                tracking-[0.12em]
                text-[#754512]
              "
            >
              This Week
            </span>

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9a632a]">
              {products.length}{' '}
              {products.length === 1
                ? 'special'
                : 'specials'}
            </p>

          </div>

          <h2
            className="
              mt-3
              text-[28px]
              font-semibold
              leading-none
              tracking-[-0.045em]
              text-[#402b18]
              sm:text-[34px]
            "
          >
            Weekly Specials
          </h2>

          <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#7a6045] sm:text-[13px]">
            Limited-time pricing on selected foodservice products.
          </p>

        </div>

        {/* PRODUCT GRID */}

        <div
          className="
            grid
            grid-cols-2
            gap-px
            overflow-hidden
            border
            border-[#e4c391]
            bg-[#e4c391]
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {products.map(
            (product) => (
              <div
                key={product.id}
                className="
                  group
                  relative
                  min-w-0
                  bg-white
                "
              >
                <ProductTile
                  product={product}
                  onAddToGuide={onAddToGuide}
                />
              </div>
            )
          )}
        </div>

      </div>

    </section>
  )
}

/* =============================================================
   NORMAL CATEGORY SECTION
============================================================= */

function CatalogueSection({
  eyebrow,
  title,
  description,
  products,
  onViewAll,
  onAddToGuide,
}: {
  eyebrow?: string
  title: string
  description?: string
  products: Product[]
  onViewAll?: () => void
  onAddToGuide: (product: Product) => void
}) {
  if (
    products.length === 0
  ) {
    return null
  }

  return (
    <section
      className="
        border-b
        border-[#d9ddd8]
        py-7
        sm:py-10
      "
    >

      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">

        <div>

          {eyebrow && (
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#1f5a43]">
              {eyebrow}
            </p>
          )}

          <h2
            className="
              mt-1.5
              text-2xl
              font-semibold
              tracking-[-0.04em]
              sm:text-[30px]
            "
          >
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#737a74] sm:text-[13px]">
              {description}
            </p>
          )}

        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="
              shrink-0
              text-[9px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-[#1f5a43]
              transition-opacity
              hover:opacity-60
              sm:text-[10px]
            "
          >
            View all →
          </button>
        )}

      </div>

      <ProductGrid
        products={products}
        onAddToGuide={onAddToGuide}
      />

    </section>
  )
}

/* =============================================================
   PRODUCT GRID
============================================================= */

function ProductGrid({
  products,
  onAddToGuide,
}: {
  products: Product[]
  onAddToGuide: (product: Product) => void
}) {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-px
        overflow-hidden
        border
        border-[#d9ddd8]
        bg-[#d9ddd8]
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {products.map(
        (product) => (
          <div
            key={product.id}
            className="
              group
              relative
              min-w-0
              bg-white
            "
          >
            <ProductTile
              product={product}
              onAddToGuide={onAddToGuide}
            />
          </div>
        )
      )}
    </div>
  )
}

/* =============================================================
   PRODUCT TILE + ORDER GUIDE ACTION
============================================================= */

function ProductTile({
  product,
  onAddToGuide,
}: {
  product: Product
  onAddToGuide: (product: Product) => void
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="min-h-0 flex-1">
        <ProductCard product={product} />
      </div>

      <div className="border-t border-[#e7eae6] bg-[#fafbf9] p-2 sm:p-3">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onAddToGuide(product)
          }}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            border
            border-[#cfd6d1]
            bg-white
            px-3
            py-2.5
            text-[9px]
            font-black
            uppercase
            tracking-[0.1em]
            text-[#244f3d]
            transition
            hover:border-[#244f3d]
            hover:bg-[#eef4f0]
            sm:text-[10px]
          "
        >
          <GuidePlusIcon />
          Add to guide
        </button>
      </div>
    </div>
  )
}

/* =============================================================
   ORDER GUIDE PICKER
============================================================= */

function OrderGuidePicker({
  product,
  guides,
  loading,
  addingToGuideId,
  message,
  onClose,
  onAdd,
}: {
  product: Product | null
  guides: OrderGuide[]
  loading: boolean
  addingToGuideId: string | null
  message: string
  onClose: () => void
  onAdd: (guideId: string) => void
}) {
  if (!product) return null

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-end
        justify-center
        bg-[#111713]/45
        p-0
        backdrop-blur-[2px]
        sm:items-center
        sm:p-5
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-guide-picker-title"
        className="
          max-h-[82vh]
          w-full
          overflow-hidden
          rounded-t-[24px]
          border
          border-[#d9ddd8]
          bg-white
          shadow-2xl
          sm:max-w-[520px]
          sm:rounded-[20px]
        "
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e1e4df] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#1f5a43]">
              Add to order guide
            </p>

            <h2
              id="order-guide-picker-title"
              className="mt-1.5 line-clamp-2 text-xl font-semibold tracking-[-0.03em] text-[#181c19]"
            >
              {product.name}
            </h2>

            {product.unit && (
              <p className="mt-1 text-xs text-[#747b75]">
                {product.unit}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(addingToGuideId)}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#d9ddd8]
              text-lg
              text-[#5f6761]
              transition
              hover:border-[#244f3d]
              hover:text-[#244f3d]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Close order guide picker"
          >
            ×
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs font-semibold text-[#747b75]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9ddd8] border-t-[#244f3d]" />
              Loading your guides...
            </div>
          ) : guides.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-base font-semibold text-[#181c19]">
                No order guides yet
              </p>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#747b75]">
                Create an order guide first, then you can add products to it
                directly from the catalogue.
              </p>

              <a
                href="/order-guide"
                className="
                  mt-5
                  inline-flex
                  bg-[#244f3d]
                  px-5
                  py-3
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-white
                  transition
                  hover:bg-[#1d1d1b]
                "
              >
                Go to order guides
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {guides.map((guide) => {
                const isAdding = addingToGuideId === guide.id

                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => onAdd(guide.id)}
                    disabled={Boolean(addingToGuideId)}
                    className="
                      group
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-4
                      border
                      border-[#e1e4df]
                      bg-white
                      px-4
                      py-4
                      text-left
                      transition
                      hover:border-[#244f3d]
                      hover:bg-[#f7faf8]
                      disabled:cursor-wait
                      disabled:opacity-60
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#202621]">
                        {guide.name}
                      </p>

                      {guide.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-[#7a817b]">
                          {guide.description}
                        </p>
                      )}
                    </div>

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#eef4f0]
                        text-[#244f3d]
                        transition
                        group-hover:bg-[#244f3d]
                        group-hover:text-white
                      "
                    >
                      {isAdding ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        '+'
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {message && (
            <div
              className={`
                mt-3
                border
                px-4
                py-3
                text-sm
                font-medium
                ${
                  message.startsWith('Added')
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : message.includes('already')
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                }
              `}
            >
              {message}
            </div>
          )}
        </div>

        {guides.length > 0 && (
          <div className="border-t border-[#e1e4df] bg-[#fafbf9] px-5 py-3 sm:px-6">
            <a
              href="/order-guide"
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#1f5a43] transition-opacity hover:opacity-60"
            >
              Manage order guides →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function GuidePlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M7 5.5h10M7 9.5h7M7 13.5h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17 13v6M14 16h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* =============================================================
   PRODUCT SORTING
============================================================= */

function sortProducts(
  products: Product[],
  sort: string
) {
  const result =
    [...products]

  if (
    sort === 'recommended'
  ) {
    result.sort(
      recommendedSort
    )

    return result
  }

  if (
    sort === 'name'
  ) {
    result.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    )

    return result
  }

  if (
    sort === 'price-low'
  ) {
    result.sort(
      (a, b) =>
        Number(
          a.price ?? 0
        ) -
        Number(
          b.price ?? 0
        )
    )

    return result
  }

  if (
    sort === 'price-high'
  ) {
    result.sort(
      (a, b) =>
        Number(
          b.price ?? 0
        ) -
        Number(
          a.price ?? 0
        )
    )
  }

  return result
}

/* =============================================================
   RECOMMENDED PRODUCT PRIORITY
============================================================= */

function recommendedSort(
  a: Product,
  b: Product
) {
  const scoreDifference =
    getProductPriority(b) -
    getProductPriority(a)

  if (
    scoreDifference !== 0
  ) {
    return scoreDifference
  }

  return a.name.localeCompare(
    b.name
  )
}

function getProductPriority(
  product: Product
) {
  const productAny =
    product as any

  let score = 0

  if (
    productAny.featured
  ) {
    score += 1000
  }

  if (
    productAny.fulfillment_type ===
      'lc_stocked' ||
    productAny
      .producer_delivery_fulfillment_type ===
      'local_connect'
  ) {
    score += 500
  }

  if (
    productAny.in_stock
  ) {
    score += 300
  }

  if (
    productAny.fulfillment_type ===
      'producer_fulfilled' ||
    productAny
      .producer_delivery_fulfillment_type ===
      'self_fulfilled'
  ) {
    score += 100
  }

  if (
    product.price_on_request
  ) {
    score -= 50
  }

  if (
    product.image_url
  ) {
    score += 20
  }

  return score
}

/* =============================================================
   CATEGORY ORDER
============================================================= */

function sortCategories(
  categories: string[]
) {
  return [...categories].sort(
    (a, b) => {
      const indexA =
        CATEGORY_ORDER.findIndex(
          (value) =>
            value.toLowerCase() ===
            a.toLowerCase()
        )

      const indexB =
        CATEGORY_ORDER.findIndex(
          (value) =>
            value.toLowerCase() ===
            b.toLowerCase()
        )

      const priorityA =
        indexA === -1
          ? 9999
          : indexA

      const priorityB =
        indexB === -1
          ? 9999
          : indexB

      if (
        priorityA !== priorityB
      ) {
        return (
          priorityA -
          priorityB
        )
      }

      return a.localeCompare(b)
    }
  )
}

/* =============================================================
   ICONS
============================================================= */

function SearchIcon() {
  return (
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
  )
}

function Chevron() {
  return (
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
  )
}