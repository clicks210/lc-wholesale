'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProducerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  async function loadProducts() {
    setLoading(true)
    setMessage('')

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setMessage('You must be signed in.')
      setLoading(false)
      return
    }

    const userId = userData.user.id

    const {
      data: memberships,
      error: membershipError,
    } = await supabase
      .from('customer_members')
      .select('customer_id')
      .eq('user_id', userId)

    if (
      membershipError ||
      !memberships ||
      memberships.length === 0
    ) {
      setMessage('Producer account could not be found.')
      setLoading(false)
      return
    }

    const customerIds = memberships.map(
      (membership) => membership.customer_id
    )

    const {
      data,
      error,
    } = await supabase
      .from('producer_products')
      .select('*')
      .in('producer_customer_id', customerIds)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      setMessage('Could not load producer products.')
      setProducts([])
      setLoading(false)
      return
    }

    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  /* =====================================================
     ENABLE / DISABLE PRODUCT
  ===================================================== */

  async function toggleProductActive(product: any) {
    setUpdatingId(product.id)
    setMessage('')

    const currentActive =
      product.is_active !== false

    const nextActive =
      !currentActive

    const {
      data,
      error,
    } = await supabase
      .from('producer_products')
      .update({
        is_active: nextActive,
      })
      .eq('id', product.id)
      .select()
      .single()

    if (error) {
      console.error(
        'Toggle product active error:',
        error
      )

      setMessage(
        error.message ||
          'Could not update product activity.'
      )

      setUpdatingId(null)
      return
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              ...data,
            }
          : item
      )
    )

    setMessage(
      nextActive
        ? 'Product enabled.'
        : 'Product disabled.'
    )

    setUpdatingId(null)
  }

  /* =====================================================
     FILTER OPTIONS
  ===================================================== */

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean)
          .sort()
      ),
    ]
  }, [products])

  const filteredProducts = useMemo(() => {
    const query =
      searchQuery
        .toLowerCase()
        .trim()

    return products.filter(
      (product) => {
        const currentActive =
          product.is_active !==
          false

        const matchesSearch =
          !query ||
          product.name
            ?.toLowerCase()
            .includes(query) ||
          product.sku
            ?.toLowerCase()
            .includes(query) ||
          product.supplier
            ?.toLowerCase()
            .includes(query) ||
          product.category
            ?.toLowerCase()
            .includes(query)

        const matchesCategory =
          categoryFilter ===
            'all' ||
          product.category ===
            categoryFilter

        const matchesStatus =
          statusFilter ===
            'all' ||
          (statusFilter ===
            'active' &&
            currentActive) ||
          (statusFilter ===
            'inactive' &&
            !currentActive) ||
          product.status ===
            statusFilter

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        )
      }
    )
  }, [
    products,
    searchQuery,
    categoryFilter,
    statusFilter,
  ])

  const activeCount =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.is_active !==
          false
      ).length
    }, [products])

  const pendingCount =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.status ===
          'pending_review'
      ).length
    }, [products])

  const approvedCount =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.status ===
          'approved'
      ).length
    }, [products])

  const hasActiveFilters =
    searchQuery.trim().length >
      0 ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all'

  function clearFilters() {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b border-[#d9ddd8] pb-6 sm:pb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f5a43]">
                Producer Catalog
              </p>

              <h1 className="mt-2 text-[34px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl">
                My Products
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] leading-5 text-[#69716b] sm:text-[15px] sm:leading-6">
                Manage your product listings, marketplace status,
                pricing, and availability from one place.
              </p>

            </div>

            <Link
              href="/producer/products/new"
              className="
                inline-flex
                min-h-12
                items-center
                justify-center
                gap-2
                bg-[#1f5a43]
                px-5
                text-[11px]
                font-bold
                uppercase
                tracking-[0.1em]
                text-white
                transition-colors
                hover:bg-[#163f30]
              "
            >
              <span className="text-lg font-normal leading-none">
                +
              </span>

              Add Product
            </Link>

          </div>

        </section>

        {/* =====================================================
            METRICS
        ===================================================== */}

        <section className="grid grid-cols-2 border-b border-[#d9ddd8] sm:grid-cols-4">

          <Metric
            label="Total Products"
            value={products.length}
          />

          <Metric
            label="Active"
            value={activeCount}
          />

          <Metric
            label="Approved"
            value={approvedCount}
          />

          <Metric
            label="Pending"
            value={pendingCount}
          />

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
            sm:-mx-6
            sm:px-6
            lg:top-0
            lg:-mx-8
            lg:px-8
            xl:-mx-10
            xl:px-10
          "
        >

          <div className="mx-auto grid max-w-[1500px] grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">

            {/* SEARCH */}

            <div className="relative col-span-2 border-b border-[#e1e4df] lg:col-span-1 lg:border-b-0 lg:border-r">

              <SearchIcon />

              <input
                type="text"
                value={searchQuery}
                placeholder="Search products, SKU, supplier..."
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="
                  h-14
                  w-full
                  bg-transparent
                  pl-8
                  pr-4
                  text-[13px]
                  font-medium
                  text-[#202621]
                  outline-none
                  placeholder:text-[#929994]
                  sm:h-16
                "
              />

            </div>

            {/* CATEGORY */}

            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={
                setCategoryFilter
              }
            >
              <option value="all">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </FilterSelect>

            {/* STATUS */}

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={
                setStatusFilter
              }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Disabled
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="pending_review">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="changes_requested">
                Changes Requested
              </option>

              <option value="rejected">
                Rejected
              </option>
            </FilterSelect>

            {/* CLEAR */}

            <div className="col-span-2 flex items-center justify-between border-t border-[#e1e4df] py-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:px-4">

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999f9a] lg:hidden">
                {filteredProducts.length} results
              </span>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-[#1f5a43]
                  transition-opacity
                  hover:opacity-60
                  disabled:cursor-default
                  disabled:opacity-30
                "
              >
                Clear
              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            STATUS / MESSAGE
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">

          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#737a74] sm:text-[10px]">
            Showing{' '}
            <span className="text-[#1f5a43]">
              {filteredProducts.length}
            </span>{' '}
            of {products.length} products
          </p>

          {message && (
            <p className="text-xs font-medium text-[#1f5a43]">
              {message}
            </p>
          )}

        </div>

        {/* =====================================================
            PRODUCT LIST
        ===================================================== */}

        <section className="border border-[#d9ddd8] bg-white">

          {/* DESKTOP HEADER */}

          <div
            className="
              hidden
              grid-cols-[84px_0.85fr_1.7fr_1fr_0.8fr_1fr_1.15fr]
              border-b
              border-[#d9ddd8]
              bg-[#fafbf9]
              px-4
              py-3
              text-[9px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-[#8b918c]
              lg:grid
            "
          >
            <div>
              Image
            </div>

            <div>
              SKU
            </div>

            <div>
              Product
            </div>

            <div>
              Category
            </div>

            <div>
              Price
            </div>

            <div>
              Status
            </div>

            <div>
              Actions
            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <ProductListSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              filtered={
                hasActiveFilters
              }
              onClear={
                clearFilters
              }
            />
          ) : (
            <div className="divide-y divide-[#e1e4df]">

              {filteredProducts.map(
                (product) => {
                  const currentActive =
                    product.is_active !==
                    false

                  return (
                    <article
                      key={product.id}
                      className="
                        group
                        grid
                        gap-4
                        p-4
                        transition-colors
                        hover:bg-[#fafbf9]
                        sm:p-5
                        lg:grid-cols-[84px_0.85fr_1.7fr_1fr_0.8fr_1fr_1.15fr]
                        lg:items-center
                        lg:px-4
                        lg:py-3
                      "
                    >

                      {/* IMAGE + MOBILE NAME */}

                      <div className="flex items-center gap-4 lg:block">

                        <ProductImage
                          product={product}
                        />

                        <div className="min-w-0 lg:hidden">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="line-clamp-2 text-[15px] font-semibold leading-tight">
                              {product.name}
                            </p>

                            {!currentActive && (
                              <span className="bg-[#eceeed] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#777e78]">
                                Disabled
                              </span>
                            )}

                          </div>

                          <p className="mt-1 text-[11px] text-[#747b75]">
                            {product.unit ||
                              '—'}
                            {' · '}
                            {product.supplier ||
                              'No supplier'}
                          </p>

                        </div>

                      </div>

                      {/* SKU */}

                      <div className="hidden font-mono text-[10px] text-[#747b75] lg:block">
                        {product.sku ||
                          '—'}
                      </div>

                      {/* PRODUCT */}

                      <div className="hidden min-w-0 lg:block">

                        <p className="truncate text-[13px] font-semibold text-[#202621]">
                          {product.name}
                        </p>

                        <p className="mt-1 truncate text-[10px] text-[#858c86]">
                          {product.unit ||
                            '—'}
                          {' · '}
                          {product.supplier ||
                            'No supplier'}
                        </p>

                      </div>

                      {/* MOBILE DETAILS */}

                      <div className="grid grid-cols-2 gap-px border border-[#e1e4df] bg-[#e1e4df] lg:hidden">

                        <MobileDetail
                          label="SKU"
                          value={
                            product.sku ||
                            '—'
                          }
                        />

                        <MobileDetail
                          label="Category"
                          value={
                            product.category ||
                            '—'
                          }
                        />

                        <MobileDetail
                          label="Price"
                          value={
                            formatMoney(
                              product.price
                            )
                          }
                        />

                        <div className="bg-white p-3">

                          <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#999f9a]">
                            Status
                          </p>

                          <StatusBadge
                            status={
                              product.status
                            }
                          />

                        </div>

                      </div>

                      {/* CATEGORY */}

                      <div className="hidden text-[11px] font-medium text-[#666e68] lg:block">
                        {product.category ||
                          '—'}
                      </div>

                      {/* PRICE */}

                      <div className="hidden text-[12px] font-semibold text-[#202621] lg:block">
                        {formatMoney(
                          product.price
                        )}
                      </div>

                      {/* STATUS */}

                      <div className="hidden lg:block">
                        <StatusBadge
                          status={
                            product.status
                          }
                        />
                      </div>

                      {/* ACTIONS */}

                      <div className="flex items-center gap-2">

                        <Link
                          href={`/producer/products/${product.id}/edit`}
                          className="
                            flex
                            min-h-10
                            flex-1
                            items-center
                            justify-center
                            border
                            border-[#cfd2cc]
                            px-3
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.09em]
                            text-[#1f5a43]
                            transition-colors
                            hover:border-[#1f5a43]
                            hover:bg-[#f1f5f2]
                            lg:flex-none
                          "
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            product.id
                          }
                          onClick={() =>
                            toggleProductActive(
                              product
                            )
                          }
                          className={`
                            flex
                            min-h-10
                            flex-1
                            items-center
                            justify-center
                            border
                            px-3
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.09em]
                            transition-colors
                            disabled:opacity-50
                            lg:flex-none

                            ${
                              currentActive
                                ? 'border-[#d6b9b4] text-[#995047] hover:border-[#995047] hover:bg-[#fff2ef]'
                                : 'border-[#b8d0c4] text-[#1f5a43] hover:border-[#1f5a43] hover:bg-[#f1f5f2]'
                            }
                          `}
                        >
                          {updatingId ===
                          product.id
                            ? 'Saving'
                            : currentActive
                              ? 'Disable'
                              : 'Enable'}
                        </button>

                      </div>

                    </article>
                  )
                }
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  )
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div
      className="
        border-r
        border-[#d9ddd8]
        px-3
        py-4
        last:border-r-0
        sm:px-5
        sm:py-5
      "
    >

      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:text-[9px]">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1f5a43] sm:text-2xl">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
  children:
    React.ReactNode
}) {
  return (
    <div className="relative border-r border-[#e1e4df]">

      <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#969c97] sm:left-5 sm:top-2.5">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
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
          text-[11px]
          font-semibold
          text-[#343b36]
          outline-none
          sm:h-16
          sm:px-5
          sm:text-[12px]
        "
      >
        {children}
      </select>

      <Chevron />

    </div>
  )
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function ProductImage({
  product,
}: {
  product: any
}) {
  if (!product.image_url) {
    return (
      <div
        className="
          flex
          h-20
          w-20
          shrink-0
          items-center
          justify-center
          border
          border-[#d9ddd8]
          bg-[#f7f8f5]
          text-center
          text-[8px]
          font-bold
          uppercase
          tracking-[0.1em]
          text-[#999f9a]
          lg:h-16
          lg:w-16
        "
      >
        No Image
      </div>
    )
  }

  return (
    <div
      className="
        relative
        h-20
        w-20
        shrink-0
        overflow-hidden
        border
        border-[#d9ddd8]
        bg-white
        lg:h-16
        lg:w-16
      "
    >

      <Image
        src={product.image_url}
        alt={
          product.name ||
          'Product image'
        }
        fill
        className="object-contain p-1"
        sizes="80px"
      />

    </div>
  )
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string
}) {
  const label =
    status ===
    'pending_review'
      ? 'Pending'
      : status ===
          'changes_requested'
        ? 'Changes'
        : status ===
            'approved'
          ? 'Approved'
          : status ===
              'rejected'
            ? 'Rejected'
            : status ||
              'Draft'

  const className =
    status === 'approved'
      ? 'bg-[#eaf4ee] text-[#26734f]'
      : status ===
          'pending_review'
        ? 'bg-[#fff1d6] text-[#8b5a16]'
        : status ===
            'rejected'
          ? 'bg-[#fff0ed] text-[#a34e43]'
          : status ===
              'changes_requested'
            ? 'bg-[#fff1df] text-[#985d1d]'
            : 'bg-[#eef0ed] text-[#707771]'

  return (
    <span
      className={`
        inline-flex
        px-2.5
        py-1.5
        text-[8px]
        font-bold
        uppercase
        tracking-[0.08em]
        ${className}
      `}
    >
      {label}
    </span>
  )
}

/* =========================================================
   MOBILE DETAIL
========================================================= */

function MobileDetail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-white p-3">

      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#999f9a]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-semibold text-[#343b36]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean
  onClear: () => void
}) {
  return (
    <div className="px-5 py-16 text-center sm:py-24">

      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#1f5a43]">
        No Products
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {filtered
          ? 'Nothing matches those filters.'
          : 'Your catalogue is empty.'}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#737973]">
        {filtered
          ? 'Try changing your search, category, or status filters.'
          : 'Add your first product to begin building your Local Connect marketplace catalogue.'}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="
            mt-6
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
          Clear Filters
        </button>
      ) : (
        <Link
          href="/producer/products/new"
          className="
            mt-6
            inline-flex
            bg-[#1f5a43]
            px-5
            py-3
            text-[10px]
            font-bold
            uppercase
            tracking-[0.1em]
            text-white
          "
        >
          Add Product
        </Link>
      )}

    </div>
  )
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function ProductListSkeleton() {
  return (
    <div className="divide-y divide-[#e1e4df]">

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="
            flex
            items-center
            gap-4
            p-4
            sm:p-5
          "
        >

          <div className="h-16 w-16 shrink-0 animate-pulse bg-[#eceeeb]" />

          <div className="flex-1">

            <div className="h-3 w-1/3 animate-pulse bg-[#eceeeb]" />

            <div className="mt-3 h-2.5 w-1/2 animate-pulse bg-[#eceeeb]" />

          </div>

        </div>
      ))}

    </div>
  )
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777e78]"
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
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737973]"
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

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: any
) {
  const number =
    Number(value || 0)

  return new Intl.NumberFormat(
    'en-CA',
    {
      style: 'currency',
      currency: 'CAD',
    }
  ).format(number)
}