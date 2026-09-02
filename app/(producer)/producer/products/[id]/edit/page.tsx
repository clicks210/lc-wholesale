'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProducerProductPage() {
  const router = useRouter()
  const params = useParams()

  const productId =
    params.id as string

  const [categories, setCategories] =
    useState<string[]>([])

  const [sku, setSku] =
    useState('')

  const [name, setName] =
    useState('')

  const [category, setCategory] =
    useState('')

  const [supplier, setSupplier] =
    useState('')

  const [unit, setUnit] =
    useState('')

  const [price, setPrice] =
    useState('')

  const [costPrice, setCostPrice] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [imageUrl, setImageUrl] =
    useState('')

  const [imageFile, setImageFile] =
    useState<File | null>(null)

  const [inStock, setInStock] =
    useState(true)

  const [
    priceOnRequest,
    setPriceOnRequest,
  ] = useState(false)

  const [status, setStatus] =
    useState('draft')

  const [
    adminNotes,
    setAdminNotes,
  ] = useState('')

  const [message, setMessage] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  /* =====================================================
     PRICING
  ===================================================== */

  const numericPrice =
    price
      ? Number(price)
      : null

  const numericCostPrice =
    costPrice
      ? Number(costPrice)
      : null

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
        margin /
        numericPrice
      ) * 100
    }, [
      priceOnRequest,
      numericPrice,
      margin,
    ])

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    async function loadCategories() {
      const {
        data,
        error,
      } = await supabase
        .from(
          'product_categories'
        )
        .select('name')
        .order(
          'name',
          {
            ascending:
              true,
          }
        )

      if (error) {
        setMessage(
          error.message
        )

        return
      }

      setCategories(
        data?.map(
          (item) =>
            item.name
        ) || []
      )
    }

    async function loadProduct() {
      try {
        setLoading(true)

        const {
          data: userData,
          error:
            userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !userData.user
        ) {
          throw new Error(
            'You must be signed in.'
          )
        }

        const {
          data:
            memberships,
          error:
            membershipError,
        } = await supabase
          .from(
            'customer_members'
          )
          .select(
            'customer_id'
          )
          .eq(
            'user_id',
            userData.user.id
          )

        if (
          membershipError ||
          !memberships ||
          memberships.length ===
            0
        ) {
          throw new Error(
            'Producer account could not be found.'
          )
        }

        const customerIds =
          memberships.map(
            (
              membership
            ) =>
              membership.customer_id
          )

        const {
          data: product,
          error:
            productError,
        } = await supabase
          .from(
            'producer_products'
          )
          .select('*')
          .eq(
            'id',
            productId
          )
          .in(
            'producer_customer_id',
            customerIds
          )
          .single()

        if (
          productError ||
          !product
        ) {
          throw new Error(
            'Could not load product.'
          )
        }

        const productPriceOnRequest =
          Boolean(
            product.price_on_request
          )

        setSku(
          product.sku ||
            ''
        )

        setName(
          product.name ||
            ''
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
          product.unit ||
            ''
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

        setInStock(
          Boolean(
            product.in_stock
          )
        )

        setPriceOnRequest(
          productPriceOnRequest
        )

        setStatus(
          product.status ||
            'draft'
        )

        setAdminNotes(
          product.admin_notes ||
            ''
        )
      } catch (
        error
      ) {
        const errorMessage =
          error instanceof
          Error
            ? error.message
            : 'Could not load product.'

        setMessage(
          errorMessage
        )
      } finally {
        setLoading(false)
      }
    }

    loadCategories()

    if (productId) {
      loadProduct()
    }
  }, [productId])

  /* =====================================================
     IMAGE
  ===================================================== */

  async function uploadImage(): Promise<string> {
    if (!imageFile) {
      return ''
    }

    const fileExt =
      imageFile.name
        .split('.')
        .pop()

    const fileName =
      `${Date.now()}-${sku || 'producer-product'}.${fileExt}`

    const filePath =
      `producer-products/${fileName}`

    const {
      error,
    } = await supabase.storage
      .from(
        'product-images'
      )
      .upload(
        filePath,
        imageFile
      )

    if (error) {
      throw error
    }

    const {
      data,
    } =
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
     UPDATE
  ===================================================== */

  async function handleUpdate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    try {
      const uploadedImageUrl =
        await uploadImage()

      const nextStatus =
        status ===
        'approved'
          ? 'pending_review'
          : status ||
            'pending_review'

      const {
        error,
      } = await supabase
        .from(
          'producer_products'
        )
        .update({
          sku:
            sku ||
            null,

          name,
          category,

          unit:
            unit ||
            null,

          price:
            priceOnRequest
              ? null
              : numericPrice,

          cost_price:
            numericCostPrice,

          description:
            description ||
            null,

          image_url:
            uploadedImageUrl ||
            imageUrl ||
            null,

          in_stock:
            inStock,

          price_on_request:
            priceOnRequest,

          pricing_type:
            'fixed',

          status:
            nextStatus,

          submitted_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          productId
        )

      if (error) {
        throw error
      }

      router.push(
        '/producer/products'
      )
    } catch (
      error
    ) {
      const errorMessage =
        error instanceof
        Error
          ? error.message
          : 'Could not update product.'

      setMessage(
        errorMessage
      )

      setSaving(false)
    }
  }

  const previewUrl =
    imageFile
      ? URL.createObjectURL(
          imageFile
        )
      : imageUrl

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

          <div className="border border-[#aeb6ae] bg-white">

            <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] p-5">

              <div className="h-3 w-32 animate-pulse bg-[#dfe3df]" />

              <div className="mt-4 h-10 w-72 animate-pulse bg-[#dfe3df]" />

            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">

              <div className="h-64 animate-pulse bg-[#eceeeb]" />

              <div className="space-y-3">

                <div className="h-12 animate-pulse bg-[#eceeeb]" />

                <div className="h-12 animate-pulse bg-[#eceeeb]" />

                <div className="h-12 animate-pulse bg-[#eceeeb]" />

              </div>

            </div>

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <Link
            href="/producer/products"
            className="
              inline-flex
              items-center
              gap-2
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.1em]
              text-[#1f5a43]
              transition-opacity
              hover:opacity-60
            "
          >
            ← My Products
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Producer Catalog
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl">
                Edit Product
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
                Update your marketplace listing. Changes may require Local Connect review before going live.
              </p>

            </div>

            <StatusBadge
              status={
                status
              }
            />

          </div>

          {/* ADMIN NOTES */}

          {adminNotes && (
            <div className="mt-6 border border-[#d4a867] bg-[#fff0dc] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#754512]">
                Local Connect Review Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-[12px] font-semibold leading-6 text-[#654e36]">
                {adminNotes}
              </p>

            </div>
          )}

        </section>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={
            handleUpdate
          }
          className="
            grid
            gap-8
            py-7
            lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]
            lg:gap-10
          "
        >

          {/* LEFT */}

          <div className="space-y-8">

            {/* PRODUCT DETAILS */}

            <FormSection
              eyebrow="01"
              title="Product Details"
              description="Update the buyer-facing product information."
            >

              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="SKU"
                  hint="Product reference"
                >
                  <input
                    value={
                      sku
                    }
                    onChange={(e) =>
                      setSku(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

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
                      onChange={(e) =>
                        setCategory(
                          e.target.value
                        )
                      }
                      className={`${inputClass} appearance-none pr-10`}
                    >

                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (
                          cat
                        ) => (
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

                  {categories.length ===
                    0 && (
                    <p className="mt-2 text-[11px] font-bold text-[#8b5a16]">
                      No categories found. Ask Local Connect to add categories.
                    </p>
                  )}

                </Field>

                <Field
                  label="Product Name"
                  hint="What buyers will see"
                  className="md:col-span-2"
                >
                  <input
                    required
                    value={
                      name
                    }
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Unit"
                  hint="Case, lb, each, pack size"
                >
                  <input
                    value={
                      unit
                    }
                    onChange={(e) =>
                      setUnit(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Sell Price"
                  hint={
                    priceOnRequest
                      ? 'Public price hidden'
                      : 'Buyer-facing sell price'
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
                      step="0.01"
                      min="0"
                      value={
                        price
                      }
                      onChange={(e) =>
                        setPrice(
                          e.target.value
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
                    description="Hide the public price and use custom or contract pricing."
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

                <Field
                  label="Description"
                  hint="Pack size, origin, handling, ordering notes"
                  className="md:col-span-2"
                >
                  <textarea
                    rows={6}
                    value={
                      description
                    }
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    className={`${inputClass} min-h-[150px] resize-y py-3`}
                  />
                </Field>

              </div>

            </FormSection>

            {/* SUPPLIER */}

            <FormSection
              eyebrow="02"
              title="Supplier"
              description="This listing remains attached to your producer account."
            >

              <Field
                label="Supplier Name"
                hint="Managed from account settings"
              >
                <input
                  value={
                    supplier
                  }
                  readOnly
                  className={`
                    ${inputClass}
                    cursor-not-allowed
                    bg-[#e9ece8]
                    font-bold
                    text-[#3f4740]
                  `}
                />
              </Field>

            </FormSection>

            {/* PRICING */}

            <FormSection
              eyebrow="03"
              title="Pricing Review"
              description="Pricing changes are reviewed before publication."
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
                        step="0.01"
                        min="0"
                        value={
                          costPrice
                        }
                        onChange={(e) =>
                          setCostPrice(
                            e.target.value
                          )
                        }
                        className={`${inputClass} pl-8`}
                      />

                    </div>

                  </Field>

                </div>

                <Stat
                  label="Margin"
                  value={
                    margin ===
                    null
                      ? '—'
                      : `$${margin.toFixed(
                          2
                        )}`
                  }
                />

                <Stat
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
                Cost and margin values are used internally by Local Connect and are not shown to buyers.
              </p>

            </FormSection>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside className="space-y-8">

            {/* IMAGE */}

            <FormSection
              eyebrow="04"
              title="Product Image"
              description="Replace the image or keep the current one."
            >

              <div className="space-y-5">

                <Field
                  label="Upload New Image"
                  hint="JPG, PNG, WEBP"
                >

                  <label
                    className="
                      flex
                      min-h-14
                      cursor-pointer
                      items-center
                      justify-between
                      border
                      border-[#aeb6ae]
                      bg-white
                      px-4
                      transition-colors
                      hover:border-[#1f5a43]
                    "
                  >

                    <span className="min-w-0">

                      <span className="block truncate text-[11px] font-bold text-[#3f4740]">
                        {imageFile
                          ? imageFile.name
                          : 'Choose new image'}
                      </span>

                      <span className="mt-0.5 block text-[9px] font-medium text-[#737b74]">
                        Existing image remains if no replacement is uploaded
                      </span>

                    </span>

                    <span className="ml-3 bg-[#1f5a43] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                      Browse
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(
                          e.target.files?.[0] ??
                            null
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </Field>

                <Field
                  label="Image URL"
                  hint="Optional alternative"
                >
                  <input
                    value={
                      imageUrl
                    }
                    onChange={(e) =>
                      setImageUrl(
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <div
                  className="
                    flex
                    aspect-square
                    w-full
                    items-center
                    justify-center
                    overflow-hidden
                    border
                    border-[#aeb6ae]
                    bg-white
                    p-4
                  "
                >

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
                        <ImagePlaceholderIcon />
                      </div>

                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#596159]">
                        Image Preview
                      </p>

                    </div>
                  )}

                </div>

              </div>

            </FormSection>

            {/* SUBMISSION */}

            <section
              className="
                sticky
                top-5
                border
                border-[#aeb6ae]
                bg-white
              "
            >

              <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#596159]">
                  Publication
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#202621]">
                  Availability & Review
                </h2>

                <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#5f675f]">
                  Review the listing status before resubmitting your changes.
                </p>

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                <ToggleRow
                  label="Currently In Stock"
                  description="Show this item as available once the update is approved."
                  checked={
                    inStock
                  }
                  onChange={
                    setInStock
                  }
                />

                {/* CURRENT STATUS */}

                <div className="grid grid-cols-2 gap-px border border-[#aeb6ae] bg-[#aeb6ae]">

                  <SummaryItem
                    label="Current Status"
                    value={
                      formatStatus(
                        status
                      )
                    }
                  />

                  <SummaryItem
                    label="Next Status"
                    value={
                      status ===
                      'approved'
                        ? 'Pending Review'
                        : formatStatus(
                            status ||
                              'pending_review'
                          )
                    }
                  />

                  <SummaryItem
                    label="Stock"
                    value={
                      inStock
                        ? 'In Stock'
                        : 'Unavailable'
                    }
                  />

                  <SummaryItem
                    label="Pricing"
                    value={
                      priceOnRequest
                        ? 'On Request'
                        : price
                          ? `$${Number(
                              price
                            ).toFixed(
                              2
                            )}`
                          : '—'
                    }
                  />

                </div>

                {/* REVIEW NOTICE */}

                <div className="border border-[#d4a867] bg-[#fff0dc] p-4">

                  <div className="flex items-start gap-3">

                    <span className="mt-1 h-2 w-2 shrink-0 bg-[#d98a3a]" />

                    <div>

                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#754512]">
                        Review Required
                      </p>

                      <p className="mt-2 text-[11px] font-medium leading-5 text-[#654e36]">
                        Saving these changes will resubmit the product to Local Connect for marketplace review.
                      </p>

                    </div>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    flex
                    min-h-14
                    w-full
                    items-center
                    justify-center
                    bg-[#1f5a43]
                    px-5
                    text-[11px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-white
                    transition-colors
                    hover:bg-[#163f30]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving
                    ? 'Submitting Changes...'
                    : 'Submit Changes for Review'}
                </button>

                {message && (
                  <div className="border border-[#aeb6ae] bg-[#f7f8f5] p-3 text-[11px] font-semibold leading-5 text-[#4f5750]">
                    {message}
                  </div>
                )}

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
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children:
    React.ReactNode
}) {
  return (
    <section className="border border-[#aeb6ae] bg-white">

      <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

        <div className="flex items-start gap-4">

          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              bg-[#dfe9e3]
              text-[10px]
              font-black
              text-[#1f5a43]
            "
          >
            {eyebrow}
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
  children:
    React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>

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
  onChange:
    (checked: boolean) =>
      void
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      className="
        mt-3
        flex
        w-full
        items-center
        justify-between
        gap-4
        border
        border-[#aeb6ae]
        bg-[#f7f8f5]
        p-4
        text-left
        transition-colors
        hover:bg-[#edf1ed]
      "
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
   STAT
========================================================= */

function Stat({
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
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string
}) {
  const label =
    formatStatus(status)

  const className =
    status ===
    'approved'
      ? 'bg-[#eaf4ee] text-[#26734f]'
      : status ===
          'pending_review'
        ? 'bg-[#fff0dc] text-[#875521]'
        : status ===
            'changes_requested'
          ? 'bg-[#fff0dc] text-[#875521]'
          : status ===
              'rejected'
            ? 'bg-[#fff0ed] text-[#9a4e43]'
            : 'bg-[#e9ece8] text-[#596159]'

  return (
    <span
      className={`
        inline-flex
        px-3
        py-2
        text-[9px]
        font-black
        uppercase
        tracking-[0.1em]
        ${className}
      `}
    >
      {label}
    </span>
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

function ImagePlaceholderIcon() {
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
   HELPERS
========================================================= */

function formatStatus(
  status: string
) {
  if (
    status ===
    'pending_review'
  ) {
    return 'Pending Review'
  }

  if (
    status ===
    'changes_requested'
  ) {
    return 'Changes Requested'
  }

  if (
    status ===
    'approved'
  ) {
    return 'Approved'
  }

  if (
    status ===
    'rejected'
  ) {
    return 'Rejected'
  }

  return status ||
    'Draft'
}