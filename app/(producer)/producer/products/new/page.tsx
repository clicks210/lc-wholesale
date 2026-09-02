'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NewProducerProductPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<string[]>([])

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [inStock, setInStock] = useState(true)
  const [priceOnRequest, setPriceOnRequest] = useState(false)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')

  /* =====================================================
     PRICING CALCULATIONS
  ===================================================== */

  const margin = useMemo(() => {
    if (priceOnRequest) return 0

    return Number(price || 0) - Number(costPrice || 0)
  }, [price, costPrice, priceOnRequest])

  const marginPercent = useMemo(() => {
    if (priceOnRequest || Number(price) <= 0) {
      return 0
    }

    return (margin / Number(price)) * 100
  }, [price, margin, priceOnRequest])

  /* =====================================================
     LOAD INITIAL DATA
  ===================================================== */

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name')
        .order('name', {
          ascending: true,
        })

      if (error) {
        setMessage(error.message)
        return
      }

      setCategories(
        data?.map((item) => item.name) || []
      )
    }

    async function loadProducer() {
      const {
        data: userData,
      } = await supabase.auth.getUser()

      if (!userData.user) return

      const {
        data: membership,
      } = await supabase
        .from('customer_members')
        .select('customer_id')
        .eq(
          'user_id',
          userData.user.id
        )
        .single()

      if (!membership?.customer_id) {
        return
      }

      setCustomerId(
        membership.customer_id
      )

      const {
        data: customer,
      } = await supabase
        .from('customers')
        .select('business_name')
        .eq(
          'id',
          membership.customer_id
        )
        .single()

      if (customer?.business_name) {
        setSupplier(
          customer.business_name
        )
      }
    }

    loadCategories()
    loadProducer()
  }, [])

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  async function uploadImage() {
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

    const { error } =
      await supabase.storage
        .from('product-images')
        .upload(
          filePath,
          imageFile
        )

    if (error) {
      throw error
    }

    const { data } =
      supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

    return data.publicUrl
  }

  /* =====================================================
     CREATE PRODUCT
  ===================================================== */

  async function handleCreate(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const {
        data: userData,
        error: userError,
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

      const uploadedImageUrl =
        await uploadImage()

      const res = await fetch(
        '/api/producer/products',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            userId:
              userData.user.id,

            sku,
            name,
            category,
            supplier,
            unit,

            price:
              priceOnRequest
                ? null
                : Number(price),

            cost_price:
              costPrice
                ? Number(
                    costPrice
                  )
                : null,

            description,

            image_url:
              uploadedImageUrl ||
              imageUrl ||
              null,

            in_stock:
              inStock,

            price_on_request:
              priceOnRequest,

            customer_id:
              customerId || null,
          }),
        }
      )

      const result =
        await res.json()

      if (!res.ok) {
        throw new Error(
          result.error ||
            'Could not submit product.'
        )
      }

      router.push(
        '/producer/products'
      )
    } catch (
      error: any
    ) {
      setMessage(
        error.message ||
          'Could not submit product.'
      )

      setLoading(false)
    }
  }

  const previewUrl =
    imageFile
      ? URL.createObjectURL(
          imageFile
        )
      : imageUrl

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            PAGE HEADER
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
              tracking-[0.11em]
              text-[#1f5a43]
              transition-opacity
              hover:opacity-60
            "
          >
            ← My Products
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Producer Catalog
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
                Add Product
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
                Create a marketplace listing and submit it to Local Connect for review.
              </p>

            </div>

            <div
              className="
                flex
                items-center
                gap-2
                border
                border-[#d4a867]
                bg-[#fff0dc]
                px-3
                py-2.5
              "
            >
              <span className="h-2 w-2 bg-[#d98a3a]" />

              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#754512]">
                Pending review after submission
              </span>
            </div>

          </div>

        </section>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleCreate}
          className="
            grid
            gap-8
            py-7
            lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]
            lg:gap-10
          "
        >

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="space-y-8">

            {/* PRODUCT DETAILS */}

            <FormSection
              eyebrow="01"
              title="Product Details"
              description="Basic buyer-facing information used throughout the marketplace."
            >

              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="SKU"
                  hint="Internal or supplier reference"
                >
                  <input
                    value={sku}
                    onChange={(e) =>
                      setSku(
                        e.target.value
                      )
                    }
                    placeholder="PRO-ROMA-25LB"
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
                      value={category}
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
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    placeholder="Roma Tomatoes 25lb"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Unit"
                  hint="Case, lb, each, pack size"
                >
                  <input
                    value={unit}
                    onChange={(e) =>
                      setUnit(
                        e.target.value
                      )
                    }
                    placeholder="case, lb, each"
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
                      required={!priceOnRequest}
                      disabled={priceOnRequest}
                      type="number"
                      step="0.01"
                      value={price}
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
                    checked={priceOnRequest}
                    onChange={setPriceOnRequest}
                  />

                </Field>

                <Field
                  label="Description"
                  hint="Pack size, origin, handling, ordering notes"
                  className="md:col-span-2"
                >
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
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
              eyebrow="02"
              title="Supplier"
              description="This listing will be associated with your producer account."
            >

              <Field
                label="Supplier Name"
                hint="Managed from your producer account"
              >
                <input
                  value={supplier}
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
              description="Internal pricing information used by Local Connect during review."
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
                        value={costPrice}
                        onChange={(e) =>
                          setCostPrice(
                            e.target.value
                          )
                        }
                        placeholder="30.00"
                        className={`${inputClass} pl-8`}
                      />

                    </div>
                  </Field>

                </div>

                <MetricCard
                  label="Margin"
                  value={
                    priceOnRequest
                      ? '—'
                      : `$${margin.toFixed(2)}`
                  }
                />

                <MetricCard
                  label="Margin %"
                  value={
                    priceOnRequest
                      ? '—'
                      : `${marginPercent.toFixed(1)}%`
                  }
                />

              </div>

              <p className="mt-4 text-[11px] font-medium leading-5 text-[#5f675f]">
                Cost and margin information is used internally. Buyers only see approved marketplace information.
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
              description="Use a clean, well-lit product image whenever possible."
            >

              <div className="space-y-5">

                <Field
                  label="Upload Image"
                  hint="JPG, PNG, WEBP"
                >
                  <label
                    className="
                      group
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
                          : 'Choose image'}
                      </span>

                      <span className="mt-0.5 block text-[9px] font-medium text-[#7d857e]">
                        Upload from your device
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
                    value={imageUrl}
                    onChange={(e) =>
                      setImageUrl(
                        e.target.value
                      )
                    }
                    placeholder="https://..."
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
                      src={previewUrl}
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

                      <p className="mt-1 text-[11px] font-medium text-[#7d857e]">
                        Your product image will appear here.
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

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                <ToggleRow
                  label="Currently In Stock"
                  description="Show the item as available once approved."
                  checked={inStock}
                  onChange={setInStock}
                />

                <div
                  className="
                    border
                    border-[#d4a867]
                    bg-[#fff0dc]
                    p-4
                  "
                >

                  <div className="flex items-start gap-3">

                    <span className="mt-1 h-2 w-2 shrink-0 bg-[#d98a3a]" />

                    <div>

                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#754512]">
                        Review Required
                      </p>

                      <p className="mt-2 text-[11px] font-medium leading-5 text-[#664f38]">
                        This product will be submitted as Pending Review. Local Connect must approve it before it appears in the buyer catalogue.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-px border border-[#aeb6ae] bg-[#aeb6ae]">

                  <SummaryItem
                    label="Status"
                    value="Pending"
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
                            ).toFixed(2)}`
                          : '—'
                    }
                  />

                  <SummaryItem
                    label="Category"
                    value={
                      category ||
                      '—'
                    }
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
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
                  {loading
                    ? 'Submitting Product...'
                    : 'Submit for Review'}
                </button>

                {message && (
                  <div
                    className="
                      border
                      border-[#aeb6ae]
                      bg-[#f7f8f5]
                      p-3
                      text-[11px]
                      font-semibold
                      leading-5
                      text-[#4f5750]
                    "
                  >
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
  children: React.ReactNode
}) {
  return (
    <section
      className="
        border
        border-[#aeb6ae]
        bg-white
      "
    >

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
  onChange:
    (checked: boolean) =>
      void
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
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
   METRIC
========================================================= */

function MetricCard({
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

      <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-bold text-[#303732]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   INPUT STYLE
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