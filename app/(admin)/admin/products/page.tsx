'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getProducts,
  toggleProductActive,
  deleteProduct,
  deleteProducts,
} from '@/lib/products'

const PRODUCTS_PER_BATCH = 50
const LOAD_TIMEOUT_MS = 15000

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const [togglingId, setTogglingId] =
    useState<string | null>(null)

  const [selectedIds, setSelectedIds] =
    useState<string[]>([])

  const [bulkDeleting, setBulkDeleting] =
    useState(false)

  const [searchQuery, setSearchQuery] =
    useState('')

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(
    PRODUCTS_PER_BATCH
  )

  const loadMoreRef =
    useRef<HTMLDivElement | null>(
      null
    )

  const loadRequestRef =
    useRef(0)

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  async function loadProducts() {
    const requestId =
      ++loadRequestRef.current

    setLoading(true)
    setLoadError('')

    try {
      const timeoutPromise =
        new Promise<never>(
          (_, reject) => {
            window.setTimeout(
              () => {
                reject(
                  new Error(
                    'Product loading timed out.'
                  )
                )
              },
              LOAD_TIMEOUT_MS
            )
          }
        )

      const data =
        await Promise.race([
          getProducts(),
          timeoutPromise,
        ])

      /*
      |--------------------------------------------------------------------------
      | IGNORE OLD REQUESTS
      |--------------------------------------------------------------------------
      |
      | If Retry is clicked while an old request is still resolving, only
      | the newest request is allowed to update state.
      |
      */

      if (
        requestId !==
        loadRequestRef.current
      ) {
        return
      }

      setProducts(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      if (
        requestId !==
        loadRequestRef.current
      ) {
        return
      }

      console.error(
        'Product load error:',
        error
      )

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Could not load products.'
      )
    } finally {
      if (
        requestId ===
        loadRequestRef.current
      ) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories =
    useMemo(() => {
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

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  const filteredProducts =
    useMemo(() => {
      const query =
        searchQuery
          .toLowerCase()
          .trim()

      return products.filter(
        (product) => {
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
              Boolean(
                product.is_active
              )) ||
            (statusFilter ===
              'inactive' &&
              !Boolean(
                product.is_active
              ))

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

  /* =====================================================
     STATS
  ===================================================== */

  const stats =
    useMemo(() => {
      const active =
        products.filter(
          (product) =>
            Boolean(
              product.is_active
            )
        ).length

      const inactive =
        products.length -
        active

      const priced =
        products.filter(
          (product) =>
            !product.price_on_request &&
            Number(
              product.price
            ) > 0
        ).length

      return {
        total:
          products.length,

        active,

        inactive,

        priced,
      }
    }, [products])

  /* =====================================================
     PROGRESSIVE RENDERING
  ===================================================== */

  const visibleProducts =
    useMemo(
      () =>
        filteredProducts.slice(
          0,
          visibleCount
        ),
      [
        filteredProducts,
        visibleCount,
      ]
    )

  const hasMoreProducts =
    visibleCount <
    filteredProducts.length

  useEffect(() => {
    setVisibleCount(
      PRODUCTS_PER_BATCH
    )
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
  ])

  useEffect(() => {
    if (!hasMoreProducts) {
      return
    }

    const target =
      loadMoreRef.current

    if (!target) {
      return
    }

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
            '700px 0px',
        }
      )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [
    hasMoreProducts,
    filteredProducts.length,
  ])

  /* =====================================================
     TOGGLE ACTIVE
  ===================================================== */

  async function handleToggle(
    product: any
  ) {
    if (
      togglingId ||
      deletingId
    ) {
      return
    }

    const previousActive =
      Boolean(
        product.is_active
      )

    const nextActive =
      !previousActive

    setTogglingId(
      product.id
    )

    /*
    |--------------------------------------------------------------------------
    | OPTIMISTIC UPDATE
    |--------------------------------------------------------------------------
    */

    setProducts(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  is_active:
                    nextActive,
                }
              : item
        )
    )

    try {
      await toggleProductActive(
        product.id,
        nextActive
      )
    } catch (error) {
      console.error(
        'Product toggle error:',
        error
      )

      /*
      |--------------------------------------------------------------------------
      | ROLLBACK
      |--------------------------------------------------------------------------
      */

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    is_active:
                      previousActive,
                  }
                : item
          )
      )

      window.alert(
        'Could not update product status.'
      )
    } finally {
      setTogglingId(null)
    }
  }

  /* =====================================================
     SELECT PRODUCTS
  ===================================================== */

  function toggleSelected(
    id: string
  ) {
    setSelectedIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    )
  }

  const visibleIds =
    useMemo(
      () =>
        filteredProducts.map(
          (product) =>
            product.id
        ),
      [filteredProducts]
    )

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every(
      (id) =>
        selectedIds.includes(
          id
        )
    )

  function toggleSelectAll() {
    if (
      allVisibleSelected
    ) {
      setSelectedIds(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.includes(
                id
              )
          )
      )

      return
    }

    setSelectedIds(
      (current) => [
        ...new Set([
          ...current,
          ...visibleIds,
        ]),
      ]
    )
  }

  /* =====================================================
     FILTERS
  ===================================================== */

  const hasActiveFilters =
    searchQuery.trim().length >
      0 ||
    categoryFilter !==
      'all' ||
    statusFilter !== 'all'

  function clearFilters() {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setVisibleCount(
      PRODUCTS_PER_BATCH
    )
  }

  /* =====================================================
     DELETE SINGLE PRODUCT
  ===================================================== */

  async function handleDelete(
    product: any
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(
        product.id
      )

      await deleteProduct(
        product.id
      )

      /*
      |--------------------------------------------------------------------------
      | REMOVE LOCALLY — NO FULL RELOAD
      |--------------------------------------------------------------------------
      */

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              product.id
          )
      )

      setSelectedIds(
        (current) =>
          current.filter(
            (id) =>
              id !==
              product.id
          )
      )
    } catch (error) {
      console.error(
        'Delete product error:',
        error
      )

      window.alert(
        'Could not delete product.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  /* =====================================================
     BULK DELETE
  ===================================================== */

  async function handleBulkDelete() {
    if (
      selectedIds.length ===
      0
    ) {
      return
    }

    const selectedCount =
      selectedIds.length

    const confirmed =
      window.confirm(
        `Delete ${selectedCount} selected product${
          selectedCount === 1
            ? ''
            : 's'
        }? This cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    /*
    |--------------------------------------------------------------------------
    | TAKE A SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const idsToDelete = [
      ...selectedIds,
    ]

    try {
      setBulkDeleting(true)

      await deleteProducts(
        idsToDelete
      )

      /*
      |--------------------------------------------------------------------------
      | REMOVE LOCALLY — NO FULL CATALOG RELOAD
      |--------------------------------------------------------------------------
      */

      const idSet =
        new Set(
          idsToDelete
        )

      setProducts(
        (current) =>
          current.filter(
            (product) =>
              !idSet.has(
                product.id
              )
          )
      )

      setSelectedIds([])
    } catch (error) {
      console.error(
        'Bulk delete error:',
        error
      )

      window.alert(
        'Could not delete selected products.'
      )
    } finally {
      setBulkDeleting(false)
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Catalog Management
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
                Products
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
                Manage catalog availability, pricing, supplier information, and wholesale product status.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              {selectedIds.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    handleBulkDelete
                  }
                  disabled={
                    bulkDeleting
                  }
                  className="
                    flex
                    min-h-12
                    items-center
                    justify-center
                    border
                    border-[#c79189]
                    bg-white
                    px-5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.09em]
                    text-[#944d44]
                    transition-colors
                    hover:bg-[#fff0ed]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {bulkDeleting
                    ? 'Deleting...'
                    : `Delete Selected (${selectedIds.length})`}
                </button>
              )}

              <Link
                href="/admin/products/new"
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  bg-[#1f5a43]
                  px-5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-white
                  transition-colors
                  hover:bg-[#163f30]
                "
              >
                <span className="text-base leading-none">
                  +
                </span>

                Add Product
              </Link>

            </div>

          </div>

        </section>

        {/* =====================================================
            METRICS
        ===================================================== */}

        <section className="grid grid-cols-2 border-b border-[#aeb6ae] sm:grid-cols-4">

          <Metric
            label="Total Products"
            value={
              stats.total
            }
          />

          <Metric
            label="Active"
            value={
              stats.active
            }
          />

          <Metric
            label="Inactive"
            value={
              stats.inactive
            }
          />

          <Metric
            label="Priced"
            value={
              stats.priced
            }
          />

        </section>

        {/* =====================================================
            FILTER BAR
        ===================================================== */}

        <section
          className="
            sticky
            top-[62px]
            z-20
            -mx-3
            border-b
            border-[#aeb6ae]
            bg-white/95
            px-3
            backdrop-blur-2xl
            sm:-mx-6
            sm:px-6
            lg:top-16
            lg:-mx-8
            lg:px-8
            xl:-mx-10
            xl:px-10
          "
        >

          <div className="mx-auto grid max-w-[1600px] grid-cols-2 lg:grid-cols-[minmax(0,1fr)_230px_190px_auto]">

            {/* SEARCH */}

            <div className="relative col-span-2 border-b border-[#c5cbc5] lg:col-span-1 lg:border-b-0 lg:border-r">

              <SearchIcon />

              <input
                type="text"
                value={
                  searchQuery
                }
                placeholder="Search product, SKU, supplier, category..."
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="
                  h-14
                  w-full
                  bg-transparent
                  pl-9
                  pr-4
                  text-[13px]
                  font-semibold
                  text-[#202621]
                  outline-none
                  placeholder:font-medium
                  placeholder:text-[#929994]
                  sm:h-16
                "
              />

            </div>

            {/* CATEGORY */}

            <FilterSelect
              label="Category"
              value={
                categoryFilter
              }
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
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}

            </FilterSelect>

            {/* STATUS */}

            <FilterSelect
              label="Status"
              value={
                statusFilter
              }
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
                Inactive
              </option>

            </FilterSelect>

            {/* CLEAR */}

            <div className="col-span-2 flex min-h-12 items-center justify-between border-t border-[#c5cbc5] py-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:px-4">

              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#737b74] lg:hidden">
                {filteredProducts.length}{' '}
                results
              </span>

              <button
                type="button"
                disabled={
                  !hasActiveFilters
                }
                onClick={
                  clearFilters
                }
                className="
                  text-[9px]
                  font-black
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
            RESULT STATUS
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">

          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#596159]">

            Showing{' '}

            <span className="text-[#1f5a43]">
              {filteredProducts.length}
            </span>

            {' '}of{' '}

            {products.length}

          </p>

          {selectedIds.length >
            0 && (
            <div className="flex items-center gap-3">

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#1f5a43]">
                {selectedIds.length}{' '}
                selected
              </p>

              <button
                type="button"
                onClick={() =>
                  setSelectedIds(
                    []
                  )
                }
                className="text-[9px] font-black uppercase tracking-[0.09em] text-[#737b74] underline underline-offset-2"
              >
                Clear Selection
              </button>

            </div>
          )}

        </div>

        {/* =====================================================
            LOAD ERROR
        ===================================================== */}

        {loadError && (
          <section className="mb-5 border border-[#c79189] bg-[#fff0ed] p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#944d44]">
                  Products Could Not Load
                </p>

                <p className="mt-2 text-[12px] font-semibold text-[#774a44]">
                  {loadError}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  loadProducts
                }
                disabled={
                  loading
                }
                className="
                  min-h-11
                  border
                  border-[#944d44]
                  bg-white
                  px-4
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-[#944d44]
                  transition-colors
                  hover:bg-[#944d44]
                  hover:text-white
                  disabled:opacity-50
                "
              >
                {loading
                  ? 'Retrying'
                  : 'Retry Load'}
              </button>

            </div>

          </section>
        )}

        {/* =====================================================
            PRODUCT TABLE / LIST
        ===================================================== */}

        <section className="border border-[#aeb6ae] bg-white">

          {/* DESKTOP HEADER */}

          <div
            className="
              hidden
              grid-cols-[44px_76px_0.9fr_1.65fr_0.9fr_0.75fr_0.75fr_0.9fr_1.25fr]
              border-b
              border-[#aeb6ae]
              bg-[#f7f8f5]
              px-4
              py-3
              text-[8px]
              font-black
              uppercase
              tracking-[0.12em]
              text-[#596159]
              xl:grid
            "
          >

            <div>
              <input
                type="checkbox"
                checked={
                  allVisibleSelected
                }
                onChange={
                  toggleSelectAll
                }
                aria-label="Select all visible products"
                className="h-4 w-4 accent-[#1f5a43]"
              />
            </div>

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
              Cost
            </div>

            <div>
              Status
            </div>

            <div>
              Actions
            </div>

          </div>

          {/* LOADING */}

          {loading &&
          products.length ===
            0 ? (
            <ProductSkeleton />
          ) : filteredProducts.length ===
            0 ? (
            <EmptyState
              hasFilters={
                hasActiveFilters
              }
              onClear={
                clearFilters
              }
            />
          ) : (
            <div className="divide-y divide-[#c5cbc5]">

              {visibleProducts.map(
                (product) => {
                  const active =
                    Boolean(
                      product.is_active
                    )

                  const selected =
                    selectedIds.includes(
                      product.id
                    )

                  return (
                    <article
                      key={
                        product.id
                      }
                      className={`
                        grid
                        gap-4
                        p-4
                        transition-colors
                        sm:p-5
                        xl:grid-cols-[44px_76px_0.9fr_1.65fr_0.9fr_0.75fr_0.75fr_0.9fr_1.25fr]
                        xl:items-center
                        xl:px-4
                        xl:py-3

                        ${
                          selected
                            ? 'bg-[#edf2ee]'
                            : 'bg-white hover:bg-[#fafbf9]'
                        }
                      `}
                    >

                      {/* CHECKBOX */}

                      <div className="absolute right-4 top-4 xl:static">

                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          onChange={() =>
                            toggleSelected(
                              product.id
                            )
                          }
                          aria-label={`Select ${product.name}`}
                          className="h-4 w-4 accent-[#1f5a43]"
                        />

                      </div>

                      {/* IMAGE */}

                      <ProductImage
                        product={
                          product
                        }
                      />

                      {/* SKU */}

                      <div className="hidden font-mono text-[10px] font-semibold text-[#687068] xl:block">

                        {product.sku ||
                          '—'}

                      </div>

                      {/* PRODUCT */}

                      <div className="min-w-0">

                        <div className="flex items-start gap-2 pr-8 xl:pr-0">

                          <div className="min-w-0">

                            <p className="line-clamp-2 text-[14px] font-bold leading-snug text-[#202621]">
                              {product.name}
                            </p>

                            <p className="mt-1 text-[10px] font-semibold text-[#687068]">
                              {product.unit ||
                                '—'}
                              {' · '}
                              {product.supplier ||
                                'No supplier'}
                            </p>

                          </div>

                        </div>

                        {/* MOBILE SKU */}

                        <p className="mt-2 font-mono text-[9px] font-semibold text-[#737b74] xl:hidden">
                          {product.sku ||
                            'No SKU'}
                        </p>

                      </div>

                      {/* MOBILE DETAILS */}

                      <div className="grid grid-cols-2 gap-px border border-[#c5cbc5] bg-[#c5cbc5] xl:contents">

                        <ProductDetail
                          label="Category"
                          value={
                            product.category ||
                            '—'
                          }
                          desktop
                        />

                        <ProductDetail
                          label="Price"
                          value={
                            product.price_on_request
                              ? 'On Request'
                              : formatMoney(
                                  product.price
                                )
                          }
                          desktop
                        />

                        <ProductDetail
                          label="Cost"
                          value={
                            formatMoney(
                              product.cost_price
                            )
                          }
                          desktop
                        />

                        {/* STATUS */}

                        <div className="bg-white p-3 xl:bg-transparent xl:p-0">

                          <p className="mb-2 text-[8px] font-black uppercase tracking-[0.1em] text-[#596159] xl:hidden">
                            Status
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggle(
                                product
                              )
                            }
                            disabled={
                              togglingId ===
                              product.id
                            }
                            className={`
                              min-h-9
                              border
                              px-3
                              text-[8px]
                              font-black
                              uppercase
                              tracking-[0.08em]
                              transition-colors
                              disabled:cursor-wait
                              disabled:opacity-50

                              ${
                                active
                                  ? 'border-[#8eb09d] bg-[#eaf4ee] text-[#26734f] hover:border-[#26734f]'
                                  : 'border-[#b8bdb8] bg-[#eef0ed] text-[#626a63] hover:border-[#737b74]'
                              }
                            `}
                          >
                            {togglingId ===
                            product.id
                              ? 'Saving'
                              : active
                                ? 'Active'
                                : 'Inactive'}
                          </button>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex items-center gap-2">

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="
                            flex
                            min-h-10
                            flex-1
                            items-center
                            justify-center
                            border
                            border-[#8eb09d]
                            bg-white
                            px-3
                            text-[8px]
                            font-black
                            uppercase
                            tracking-[0.08em]
                            text-[#1f5a43]
                            transition-colors
                            hover:bg-[#edf2ee]
                          "
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              product
                            )
                          }
                          disabled={
                            deletingId ===
                            product.id
                          }
                          className="
                            flex
                            min-h-10
                            flex-1
                            items-center
                            justify-center
                            border
                            border-[#c79189]
                            bg-white
                            px-3
                            text-[8px]
                            font-black
                            uppercase
                            tracking-[0.08em]
                            text-[#944d44]
                            transition-colors
                            hover:bg-[#fff0ed]
                            disabled:cursor-wait
                            disabled:opacity-50
                          "
                        >
                          {deletingId ===
                          product.id
                            ? 'Deleting'
                            : 'Delete'}
                        </button>

                      </div>

                    </article>
                  )
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            PROGRESSIVE LOAD
        ===================================================== */}

        {hasMoreProducts && (
          <div
            ref={
              loadMoreRef
            }
            className="flex h-24 items-center justify-center"
          >

            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.11em] text-[#737b74]">

              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c5cbc5] border-t-[#1f5a43]" />

              Loading More

            </div>

          </div>
        )}

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
  value:
    | string
    | number
}) {
  return (
    <div className="border-r border-[#aeb6ae] px-3 py-4 last:border-r-0 sm:px-5 sm:py-5">

      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#1f5a43] sm:text-2xl">
        {value}
      </p>

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
  if (
    !product.image_url
  ) {
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
          border-[#aeb6ae]
          bg-[#f4f5f2]
          px-2
          text-center
          text-[8px]
          font-black
          uppercase
          tracking-[0.08em]
          text-[#7d857e]
          xl:h-14
          xl:w-14
        "
      >
        No Image
      </div>
    )
  }

  return (
    <div
      className="
        h-20
        w-20
        shrink-0
        overflow-hidden
        border
        border-[#aeb6ae]
        bg-white
        xl:h-14
        xl:w-14
      "
    >

      <img
        src={
          product.image_url
        }
        alt={
          product.name ||
          'Product'
        }
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="h-full w-full object-contain p-1"
      />

    </div>
  )
}

/* =========================================================
   PRODUCT DETAIL
========================================================= */

function ProductDetail({
  label,
  value,
}: {
  label: string
  value: string
  desktop?: boolean
}) {
  return (
    <div className="min-w-0 bg-white p-3 xl:bg-transparent xl:p-0">

      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#596159] xl:hidden">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-bold text-[#303732] xl:mt-0">
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
  onChange:
    (value: string) =>
      void
  children:
    React.ReactNode
}) {
  return (
    <div className="relative border-r border-[#c5cbc5]">

      <label className="pointer-events-none absolute left-4 top-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#737b74] sm:left-5 sm:top-2.5">
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event
        ) =>
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
          font-bold
          text-[#303732]
          outline-none
          sm:h-16
          sm:px-5
        "
      >
        {children}
      </select>

      <Chevron />

    </div>
  )
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="divide-y divide-[#c5cbc5]">

      {Array.from({
        length: 8,
      }).map(
        (_, index) => (
          <div
            key={
              index
            }
            className="flex items-center gap-4 p-4 sm:p-5"
          >

            <div className="h-16 w-16 shrink-0 animate-pulse bg-[#e2e5e2]" />

            <div className="flex-1">

              <div className="h-3 w-1/3 animate-pulse bg-[#dfe3df]" />

              <div className="mt-3 h-2.5 w-1/2 animate-pulse bg-[#eceeeb]" />

            </div>

          </div>
        )
      )}

    </div>
  )
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="px-5 py-16 text-center sm:py-24">

      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1f5a43]">
        No Products
      </p>

      <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#202621]">

        {hasFilters
          ? 'Nothing matches those filters.'
          : 'The catalogue is empty.'}

      </h2>

      <p className="mx-auto mt-3 max-w-md text-[12px] font-medium leading-6 text-[#5f675f]">

        {hasFilters
          ? 'Try another search, category, or status.'
          : 'Add a product to start building the wholesale catalogue.'}

      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={
            onClear
          }
          className="
            mt-6
            border
            border-[#1f5a43]
            px-5
            py-3
            text-[9px]
            font-black
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
          href="/admin/products/new"
          className="
            mt-6
            inline-flex
            bg-[#1f5a43]
            px-5
            py-3
            text-[9px]
            font-black
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
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596159]"
    >
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
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
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596159]"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.9"
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