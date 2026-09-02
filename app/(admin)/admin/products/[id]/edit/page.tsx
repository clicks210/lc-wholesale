'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useParams,
  useRouter,
} from 'next/navigation'

import { supabase } from '@/lib/supabase'
import {
  getProductById,
  updateProduct,
} from '@/lib/products'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()

  const productId =
    params.id as string

  /* =====================================================
     FORM STATE
  ===================================================== */

  const [sku, setSku] =
    useState('')

  const [name, setName] =
    useState('')

  const [
    category,
    setCategory,
  ] = useState('')

  const [
    supplier,
    setSupplier,
  ] = useState('')

  const [unit, setUnit] =
    useState('')

  const [price, setPrice] =
    useState('')

  const [
    costPrice,
    setCostPrice,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    imageUrl,
    setImageUrl,
  ] = useState('')

  const [
    imageFile,
    setImageFile,
  ] =
    useState<File | null>(
      null
    )

  const [
    isActive,
    setIsActive,
  ] = useState(true)

  const [
    priceOnRequest,
    setPriceOnRequest,
  ] = useState(false)

  /* =====================================================
     CATEGORY STATE
  ===================================================== */

  const [
    categories,
    setCategories,
  ] = useState<string[]>([])

  const [
    newCategory,
    setNewCategory,
  ] = useState('')

  const [
    addingCategory,
    setAddingCategory,
  ] = useState(false)

  /* =====================================================
     PAGE STATE
  ===================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  /* =====================================================
     PRICING
  ===================================================== */

  const numericPrice =
    useMemo(
      () =>
        price
          ? Number(price)
          : null,
      [price]
    )

  const numericCostPrice =
    useMemo(
      () =>
        costPrice
          ? Number(
              costPrice
            )
          : null,
      [costPrice]
    )

  const margin =
    useMemo(() => {
      if (
        priceOnRequest ||
        numericPrice ===
          null
      ) {
        return null
      }

      return (
        numericPrice -
        Number(
          numericCostPrice ||
            0
        )
      )
    }, [
      priceOnRequest,
      numericPrice,
      numericCostPrice,
    ])

  const marginPercent =
    useMemo(() => {
      if (
        priceOnRequest ||
        numericPrice ===
          null ||
        numericPrice <= 0 ||
        margin === null
      ) {
        return null
      }

      return (
        (margin /
          numericPrice) *
        100
      )
    }, [
      priceOnRequest,
      numericPrice,
      margin,
    ])

  /* =====================================================
     LOAD PRODUCT + CATEGORIES
  ===================================================== */

  useEffect(() => {
    if (!productId) {
      return
    }

    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setMessage('')

      try {
        /*
        |--------------------------------------------------------------------------
        | LOAD BOTH AT ONCE
        |--------------------------------------------------------------------------
        */

        const [
          product,
          categoryResult,
        ] =
          await Promise.all([
            getProductById(
              productId
            ),

            supabase
              .from(
                'product_categories'
              )
              .select('name')
              .order('name', {
                ascending:
                  true,
              }),
          ])

        if (cancelled) {
          return
        }

        /* PRODUCT */

        const productPriceOnRequest =
          Boolean(
            product.price_on_request
          )

        setSku(
          product.sku || ''
        )

        setName(
          product.name || ''
        )

        setCategory(
          product.category ||
            ''
        )

        setSupplier(
          product.supplier ||
            ''
        )

        setUnit(
          product.unit || ''
        )

        setPrice(
          productPriceOnRequest
            ? ''
            : String(
                product.price ??
                  ''
              )
        )

        setCostPrice(
          String(
            product.cost_price ??
              ''
          )
        )

        setDescription(
          product.description ||
            ''
        )

        setImageUrl(
          product.image_url ||
            ''
        )

        setIsActive(
          Boolean(
            product.is_active
          )
        )

        setPriceOnRequest(
          productPriceOnRequest
        )

        /* CATEGORIES */

        if (
          categoryResult.error
        ) {
          console.error(
            'Category load error:',
            categoryResult.error
          )
        } else {
          const loadedCategories =
            categoryResult.data?.map(
              (item) =>
                item.name
            ) || []

          /*
          |--------------------------------------------------------------------------
          | PRESERVE OLD CATEGORY
          |--------------------------------------------------------------------------
          |
          | If an older product uses a category that is somehow not in the
          | category table anymore, still show it in the selector.
          |
          */

          if (
            product.category &&
            !loadedCategories.includes(
              product.category
            )
          ) {
            loadedCategories.push(
              product.category
            )

            loadedCategories.sort(
              (a, b) =>
                a.localeCompare(
                  b
                )
            )
          }

          setCategories(
            loadedCategories
          )
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          'Product load error:',
          error
        )

        setMessage(
          error instanceof
            Error
            ? error.message
            : 'Could not load product.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [productId])

  /* =====================================================
     ADD CATEGORY
  ===================================================== */

  async function addCategory() {
    const cleaned =
      newCategory.trim()

    if (!cleaned) {
      return
    }

    const existing =
      categories.find(
        (item) =>
          item.toLowerCase() ===
          cleaned.toLowerCase()
      )

    if (existing) {
      setCategory(existing)
      setNewCategory('')
      return
    }

    setAddingCategory(true)
    setMessage('')

    try {
      const { error } =
        await supabase
          .from(
            'product_categories'
          )
          .insert({
            name: cleaned,
          })

      if (error) {
        throw error
      }

      setCategories(
        (current) =>
          [
            ...current,
            cleaned,
          ].sort((a, b) =>
            a.localeCompare(b)
          )
      )

      setCategory(cleaned)
      setNewCategory('')
    } catch (error) {
      console.error(
        'Add category error:',
        error
      )

      setMessage(
        error instanceof
          Error
          ? error.message
          : 'Could not add category.'
      )
    } finally {
      setAddingCategory(
        false
      )
    }
  }

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  async function uploadImage(): Promise<string> {
    if (!imageFile) {
      return ''
    }

    const fileExt =
      imageFile.name
        .split('.')
        .pop()

    const safeSku =
      sku
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]/g,
          '-'
        ) || 'product'

    const fileName =
      `${Date.now()}-${safeSku}.${fileExt}`

    const filePath =
      `products/${fileName}`

    const { error } =
      await supabase.storage
        .from(
          'product-images'
        )
        .upload(
          filePath,
          imageFile,
          {
            cacheControl:
              '31536000',
            upsert: false,
          }
        )

    if (error) {
      throw error
    }

    const { data } =
      supabase.storage
        .from(
          'product-images'
        )
        .getPublicUrl(
          filePath
        )

    return data.publicUrl
  }

  /* =====================================================
     UPDATE PRODUCT
  ===================================================== */

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (saving) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const uploadedImageUrl =
        await uploadImage()

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | image_url is kept as a string here rather than null.
      | This avoids the string | null TypeScript issue from the create page.
      |
      */

      await updateProduct(
        productId,
        {
          sku: sku.trim(),

          name:
            name.trim(),

          category,

          supplier:
            supplier.trim(),

          unit:
            unit.trim(),

          price:
            priceOnRequest
              ? null
              : numericPrice,

          cost_price:
            numericCostPrice,

          description:
            description.trim(),

          image_url:
            uploadedImageUrl ||
            imageUrl.trim(),

          is_active:
            isActive,

          price_on_request:
            priceOnRequest,
        }
      )

      router.push(
        '/admin/products'
      )
    } catch (error) {
      console.error(
        'Product update error:',
        error
      )

      setMessage(
        error instanceof
          Error
          ? error.message
          : 'Could not update product.'
      )
    } finally {
      setSaving(false)
    }
  }

  /* =====================================================
     IMAGE PREVIEW
  ===================================================== */

  const previewUrl =
    useMemo(() => {
      if (imageFile) {
        return URL.createObjectURL(
          imageFile
        )
      }

      return imageUrl
    }, [
      imageFile,
      imageUrl,
    ])

  useEffect(() => {
    if (!imageFile) {
      return
    }

    return () => {
      if (
        previewUrl.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        )
      }
    }
  }, [
    imageFile,
    previewUrl,
  ])

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">

          <div className="border border-[#aeb6ae] bg-white">

            <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] p-6">

              <div className="h-3 w-32 animate-pulse bg-[#dfe3df]" />

              <div className="mt-4 h-10 w-64 animate-pulse bg-[#dfe3df]" />

              <div className="mt-3 h-3 w-96 max-w-full animate-pulse bg-[#e7eae7]" />

            </div>

            <div className="grid gap-8 p-6 lg:grid-cols-2">

              <div className="space-y-5">

                {Array.from({
                  length: 5,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                    >
                      <div className="h-2.5 w-24 animate-pulse bg-[#dfe3df]" />

                      <div className="mt-2 h-12 w-full animate-pulse bg-[#eceeeb]" />
                    </div>
                  )
                )}

              </div>

              <div className="aspect-square animate-pulse bg-[#eceeeb]" />

            </div>

          </div>

        </div>

      </main>
    )
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#1f5a43] transition-opacity hover:opacity-60"
          >
            ← Products
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Catalog Management
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
                Edit Product
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
                Update buyer-facing information, supplier details, internal pricing, product imagery, and catalogue availability.
              </p>

            </div>

            <div className="flex items-center gap-2 border border-[#9fb0a4] bg-[#e9f0eb] px-3 py-2.5">

              <span
                className={`
                  h-2
                  w-2

                  ${
                    isActive
                      ? 'bg-[#1f5a43]'
                      : 'bg-[#858c86]'
                  }
                `}
              />

              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#1f5a43]">
                {isActive
                  ? 'Active Listing'
                  : 'Inactive Listing'}
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {message && (
          <div className="mt-6 border border-[#c79189] bg-[#fff0ed] p-4">

            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#944d44]">
              Product Notice
            </p>

            <p className="mt-2 text-[12px] font-semibold leading-5 text-[#774a44]">
              {message}
            </p>

          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleUpdate
          }
          className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)] lg:gap-10"
        >

          {/* ===============================================
              LEFT
          =============================================== */}

          <div className="space-y-8">

            {/* BUYER DETAILS */}

            <FormSection
              number="01"
              title="Buyer-Facing Details"
              description="Core product information shown throughout the wholesale catalogue."
            >

              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="SKU"
                  hint="Product reference"
                >
                  <input
                    required
                    value={sku}
                    onChange={(
                      event
                    ) =>
                      setSku(
                        event
                          .target
                          .value
                      )
                    }
                    className={`${inputClass} font-mono`}
                  />
                </Field>

                {/* CATEGORY */}

                <Field
                  label="Category"
                  hint="Buyer browsing category"
                >

                  <div className="relative">

                    <select
                      required
                      value={
                        category
                      }
                      onChange={(
                        event
                      ) =>
                        setCategory(
                          event
                            .target
                            .value
                        )
                      }
                      className={`${inputClass} appearance-none pr-10`}
                    >

                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (cat) => (
                          <option
                            key={
                              cat
                            }
                            value={
                              cat
                            }
                          >
                            {cat}
                          </option>
                        )
                      )}

                    </select>

                    <Chevron />

                  </div>

                  {/* ADD CATEGORY */}

                  <div className="mt-3 border border-[#aeb6ae] bg-[#f7f8f5] p-3">

                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#596159]">
                      Add Category
                    </p>

                    <div className="mt-2 flex gap-2">

                      <input
                        value={
                          newCategory
                        }
                        onChange={(
                          event
                        ) =>
                          setNewCategory(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            'Enter'
                          ) {
                            event.preventDefault()

                            addCategory()
                          }
                        }}
                        placeholder="New category..."
                        className={`${inputClass} min-h-10 flex-1`}
                      />

                      <button
                        type="button"
                        onClick={
                          addCategory
                        }
                        disabled={
                          addingCategory ||
                          !newCategory.trim()
                        }
                        className="min-h-10 border border-[#1f5a43] bg-white px-4 text-[9px] font-black uppercase tracking-[0.08em] text-[#1f5a43] transition-colors hover:bg-[#1f5a43] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {addingCategory
                          ? 'Adding'
                          : 'Add'}
                      </button>

                    </div>

                  </div>

                </Field>

                {/* NAME */}

                <Field
                  label="Product Name"
                  hint="What buyers see"
                  className="md:col-span-2"
                >
                  <input
                    required
                    value={name}
                    onChange={(
                      event
                    ) =>
                      setName(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* UNIT */}

                <Field
                  label="Unit"
                  hint="Case, lb, each, pack size"
                >
                  <input
                    value={unit}
                    onChange={(
                      event
                    ) =>
                      setUnit(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="case, lb, each"
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* SELL PRICE */}

                <Field
                  label="Sell Price"
                  hint={
                    priceOnRequest
                      ? 'Public price hidden'
                      : 'Buyer-facing price'
                  }
                >

                  <div className="relative">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5f675f]">
                      $
                    </span>

                    <input
                      required={
                        !priceOnRequest
                      }
                      disabled={
                        priceOnRequest
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(
                        event
                      ) =>
                        setPrice(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder={
                        priceOnRequest
                          ? 'Price hidden'
                          : '42.00'
                      }
                      className={`
                        ${inputClass}
                        pl-8

                        ${
                          priceOnRequest
                            ? 'cursor-not-allowed bg-[#e9ece8] text-[#858c86]'
                            : ''
                        }
                      `}
                    />

                  </div>

                  <ToggleRow
                    label="Price on Request"
                    description="Show the listing while hiding pricing and disabling direct ordering."
                    checked={
                      priceOnRequest
                    }
                    onChange={(
                      checked
                    ) => {
                      setPriceOnRequest(
                        checked
                      )

                      if (
                        checked
                      ) {
                        setPrice(
                          ''
                        )
                      }
                    }}
                  />

                </Field>

                {/* DESCRIPTION */}

                <Field
                  label="Description"
                  hint="Pack, origin, handling, ordering notes"
                  className="md:col-span-2"
                >

                  <textarea
                    rows={6}
                    value={
                      description
                    }
                    onChange={(
                      event
                    ) =>
                      setDescription(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Product notes, pack size, origin, handling details, or ordering notes."
                    className={`${inputClass} min-h-[150px] resize-y py-3`}
                  />

                </Field>

              </div>

            </FormSection>

            {/* SUPPLIER */}

            <FormSection
              number="02"
              title="Supplier"
              description="Supplier or source associated with this catalogue item."
            >

              <Field
                label="Supplier Name"
                hint="Internal sourcing reference"
              >

                <input
                  value={
                    supplier
                  }
                  onChange={(
                    event
                  ) =>
                    setSupplier(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Supplier name"
                  className={
                    inputClass
                  }
                />

              </Field>

            </FormSection>

            {/* PRICING */}

            <FormSection
              number="03"
              title="Internal Pricing"
              description="Review cost and gross margin before saving."
            >

              <div className="grid gap-px border border-[#aeb6ae] bg-[#aeb6ae] md:grid-cols-3">

                <div className="bg-white p-4">

                  <Field
                    label="Cost Price"
                    hint="Internal only"
                  >

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5f675f]">
                        $
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          costPrice
                        }
                        onChange={(
                          event
                        ) =>
                          setCostPrice(
                            event
                              .target
                              .value
                          )
                        }
                        className={`${inputClass} pl-8`}
                      />

                    </div>

                  </Field>

                </div>

                <PricingStat
                  label="Margin"
                  value={
                    margin ===
                    null
                      ? '—'
                      : formatMoney(
                          margin
                        )
                  }
                />

                <PricingStat
                  label="Margin %"
                  value={
                    marginPercent ===
                    null
                      ? '—'
                      : `${marginPercent.toFixed(
                          1
                        )}%`
                  }
                />

              </div>

              <p className="mt-4 text-[11px] font-medium leading-5 text-[#5f675f]">
                Cost and margin are internal only and are never shown in the buyer catalogue.
              </p>

            </FormSection>

          </div>

          {/* ===============================================
              RIGHT
          =============================================== */}

          <aside className="space-y-8">

            {/* IMAGE */}

            <FormSection
              number="04"
              title="Product Image"
              description="Replace the current image or update its source URL."
            >

              <div className="space-y-5">

                <Field
                  label="Upload New Image"
                  hint="Replaces existing image"
                >

                  <label className="flex min-h-14 cursor-pointer items-center justify-between border border-[#aeb6ae] bg-white px-4 transition-colors hover:border-[#1f5a43]">

                    <span className="min-w-0">

                      <span className="block truncate text-[11px] font-bold text-[#3f4740]">
                        {imageFile
                          ? imageFile.name
                          : 'Choose replacement image'}
                      </span>

                      <span className="mt-0.5 block text-[9px] font-medium text-[#737b74]">
                        JPG, PNG or WEBP
                      </span>

                    </span>

                    <span className="ml-3 bg-[#1f5a43] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                      Browse
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(
                        event
                      ) =>
                        setImageFile(
                          event
                            .target
                            .files?.[0] ??
                            null
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </Field>

                <Field
                  label="Image URL"
                  hint="Current or external image"
                >

                  <input
                    value={
                      imageUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setImageUrl(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="https://..."
                    className={
                      inputClass
                    }
                  />

                </Field>

                {/* PREVIEW */}

                <div className="flex aspect-square w-full items-center justify-center overflow-hidden border border-[#aeb6ae] bg-white p-5">

                  {previewUrl ? (
                    <img
                      src={
                        previewUrl
                      }
                      alt={
                        name ||
                        'Product preview'
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">

                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#aeb6ae] text-[#7d857e]">
                        <ImageIcon />
                      </div>

                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#596159]">
                        No Product Image
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-[#737b74]">
                        Upload an image or paste a URL.
                      </p>

                    </div>
                  )}

                </div>

                {imageFile && (
                  <button
                    type="button"
                    onClick={() =>
                      setImageFile(
                        null
                      )
                    }
                    className="text-[9px] font-black uppercase tracking-[0.09em] text-[#944d44] underline underline-offset-2"
                  >
                    Remove New Image
                  </button>
                )}

              </div>

            </FormSection>

            {/* PUBLICATION */}

            <section className="sticky top-20 border border-[#aeb6ae] bg-white">

              <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#596159]">
                  Publication
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#202621]">
                  Availability
                </h2>

                <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#5f675f]">
                  Control whether buyers can currently see and order this product.
                </p>

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                <ToggleRow
                  label="Active Product"
                  description="Active products are visible to approved buyers."
                  checked={
                    isActive
                  }
                  onChange={
                    setIsActive
                  }
                />

                {/* SUMMARY */}

                <div className="grid grid-cols-2 gap-px border border-[#aeb6ae] bg-[#aeb6ae]">

                  <SummaryItem
                    label="Status"
                    value={
                      isActive
                        ? 'Active'
                        : 'Inactive'
                    }
                  />

                  <SummaryItem
                    label="Category"
                    value={
                      category ||
                      '—'
                    }
                  />

                  <SummaryItem
                    label="Sell Price"
                    value={
                      priceOnRequest
                        ? 'On Request'
                        : numericPrice !==
                            null
                          ? formatMoney(
                              numericPrice
                            )
                          : '—'
                    }
                  />

                  <SummaryItem
                    label="Margin"
                    value={
                      marginPercent ===
                      null
                        ? '—'
                        : `${marginPercent.toFixed(
                            1
                          )}%`
                    }
                  />

                </div>

                {priceOnRequest && (
                  <div className="border border-[#d4a867] bg-[#fff0dc] p-4">

                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#754512]">
                      Price on Request
                    </p>

                    <p className="mt-2 text-[11px] font-medium leading-5 text-[#654e36]">
                      Buyers can view this product, but pricing is hidden and it cannot be ordered directly.
                    </p>

                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex min-h-14 w-full items-center justify-center bg-[#1f5a43] px-5 text-[11px] font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#163f30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving Changes...'
                    : 'Save Changes'}
                </button>

                <Link
                  href="/admin/products"
                  className="flex min-h-11 w-full items-center justify-center border border-[#aeb6ae] bg-white px-5 text-[9px] font-black uppercase tracking-[0.09em] text-[#596159] transition-colors hover:border-[#1f5a43] hover:text-[#1f5a43]"
                >
                  Cancel
                </Link>

              </div>

            </section>

          </aside>

        </form>

      </div>

    </main>
  )
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-[#aeb6ae] bg-white">

      <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

        <div className="flex items-start gap-4">

          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#dfe9e3] text-[10px] font-black text-[#1f5a43]">
            {number}
          </span>

          <div>

            <h2 className="text-xl font-bold tracking-[-0.025em] text-[#202621]">
              {title}
            </h2>

            {description && (
              <p className="mt-1.5 max-w-2xl text-[12px] font-medium leading-5 text-[#5f675f]">
                {description}
              </p>
            )}

          </div>

        </div>

      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>

    </section>
  )
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      className={`block ${className}`}
    >

      <div className="mb-2 flex items-end justify-between gap-3">

        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3f4740]">
          {label}
        </span>

        {hint && (
          <span className="text-right text-[10px] font-medium text-[#737b74]">
            {hint}
          </span>
        )}

      </div>

      {children}

    </label>
  )
}

/* =========================================================
   TOGGLE
========================================================= */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (
    checked: boolean
  ) => void
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="mt-3 flex w-full items-center justify-between gap-4 border border-[#aeb6ae] bg-[#f7f8f5] p-4 text-left transition-colors hover:bg-[#edf1ed]"
    >

      <span>

        <span className="block text-[12px] font-bold text-[#252b27]">
          {label}
        </span>

        <span className="mt-1 block text-[10px] font-medium leading-4 text-[#5f675f]">
          {description}
        </span>

      </span>

      <span
        className={`
          relative
          h-6
          w-11
          shrink-0
          transition-colors

          ${
            checked
              ? 'bg-[#1f5a43]'
              : 'bg-[#aeb6ae]'
          }
        `}
      >
        <span
          className={`
            absolute
            top-1
            h-4
            w-4
            bg-white
            transition-transform

            ${
              checked
                ? 'translate-x-6'
                : 'translate-x-1'
            }
          `}
        />
      </span>

    </button>
  )
}

/* =========================================================
   PRICING
========================================================= */

function PricingStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col justify-center bg-[#f7f8f5] p-4">

      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#596159]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#1f5a43]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-white p-3">

      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-bold text-[#303732]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   INPUT
========================================================= */

const inputClass = `
  min-h-12
  w-full
  border
  border-[#aeb6ae]
  bg-white
  px-4
  text-[13px]
  font-semibold
  text-[#202621]
  outline-none
  transition-colors
  placeholder:font-medium
  placeholder:text-[#929994]
  hover:border-[#8f9990]
  focus:border-[#1f5a43]
  focus:ring-1
  focus:ring-[#1f5a43]/20
`

/* =========================================================
   ICONS
========================================================= */

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

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="9"
        cy="10"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m6 17 4-4 3 3 2-2 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
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
  value: number
) {
  return new Intl.NumberFormat(
    'en-CA',
    {
      style: 'currency',
      currency: 'CAD',
    }
  ).format(value)
}