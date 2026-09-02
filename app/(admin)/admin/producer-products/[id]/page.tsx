'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProducerProductReviewPage() {
  const params = useParams()
  const router = useRouter()

  const submissionId =
    params.id as string

  const [product, setProduct] =
    useState<any>(null)

  const [sku, setSku] =
    useState('')

  const [
    adminNotes,
    setAdminNotes,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  /* =====================================================
     LOAD PRODUCT
  ===================================================== */

  async function loadProduct() {
    setLoading(true)
    setMessage('')

    const {
      data,
      error,
    } = await supabase
      .from('producer_products')
      .select(`
        *,
        customers:producer_customer_id (
          business_name,
          contact_name,
          email
        )
      `)
      .eq(
        'id',
        submissionId
      )
      .single()

    if (
      error ||
      !data
    ) {
      setMessage(
        error?.message ||
          'Could not load product.'
      )

      setLoading(false)
      return
    }

    setProduct(data)

    setSku(
      data.sku || ''
    )

    setAdminNotes(
      data.admin_notes || ''
    )

    setLoading(false)
  }

  useEffect(() => {
    if (submissionId) {
      loadProduct()
    }
  }, [submissionId])

  /* =====================================================
     APPROVE
  ===================================================== */

  async function approveProduct() {
    if (!product) return

    if (!sku.trim()) {
      setMessage(
        'SKU is required before approving and publishing.'
      )
      return
    }

    setSaving(true)
    setMessage('')

    try {
      let liveProductId =
        product.product_id

      const productPayload = {
        sku:
          sku
            .trim()
            .toUpperCase(),

        name:
          product.name,

        category:
          product.category,

        supplier:
          product.supplier,

        unit:
          product.unit,

        price:
          product.price,

        cost_price:
          product.cost_price,

        description:
          product.description,

        image_url:
          product.image_url,

        is_active:
          true,

        price_on_request:
          product.price_on_request,

        pricing_type:
          product.pricing_type ||
          'fixed',

        in_stock:
          product.in_stock,

        special_order:
          product.special_order ||
          false,

        override_minimum:
          product.override_minimum,

        override_lead_time_days:
          product.override_lead_time_days,

        producer_customer_id:
          product.producer_customer_id,

        source_type:
          'producer',

        fulfillment_type:
          'producer_fulfilled',
      }

      /* ===============================================
         UPDATE EXISTING PRODUCT
      =============================================== */

      if (liveProductId) {
        const {
          error: updateError,
        } = await supabase
          .from('products')
          .update(
            productPayload
          )
          .eq(
            'id',
            liveProductId
          )

        if (updateError) {
          throw updateError
        }
      }

      /* ===============================================
         CREATE LIVE PRODUCT
      =============================================== */

      else {
        const {
          data:
            createdProduct,

          error:
            insertError,
        } = await supabase
          .from('products')
          .insert(
            productPayload
          )
          .select('id')
          .single()

        if (
          insertError ||
          !createdProduct
        ) {
          throw insertError
        }

        liveProductId =
          createdProduct.id
      }

      /* ===============================================
         UPDATE SUBMISSION
      =============================================== */

      const {
        error:
          reviewError,
      } = await supabase
        .from(
          'producer_products'
        )
        .update({
          sku:
            sku
              .trim()
              .toUpperCase(),

          product_id:
            liveProductId,

          status:
            'approved',

          admin_notes:
            adminNotes ||
            null,

          reviewed_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          submissionId
        )

      if (reviewError) {
        throw reviewError
      }

      router.push(
        '/admin/producer-products'
      )
    } catch (
      error: any
    ) {
      setMessage(
        error.message ||
          'Could not approve product.'
      )

      setSaving(false)
    }
  }

  /* =====================================================
     REJECT / REQUEST CHANGES
  ===================================================== */

  async function updateStatus(
    status:
      | 'rejected'
      | 'changes_requested'
  ) {
    if (
      status ===
        'changes_requested' &&
      !adminNotes.trim()
    ) {
      setMessage(
        'Add review notes before requesting changes.'
      )

      return
    }

    setSaving(true)
    setMessage('')

    const {
      error,
    } = await supabase
      .from('producer_products')
      .update({
        status,

        admin_notes:
          adminNotes ||
          null,

        reviewed_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        submissionId
      )

    if (error) {
      setMessage(
        error.message
      )

      setSaving(false)
      return
    }

    router.push(
      '/admin/producer-products'
    )
  }

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const margin =
    useMemo(() => {
      if (!product) {
        return null
      }

      const price =
        Number(
          product.price || 0
        )

      const cost =
        Number(
          product.cost_price ||
            0
        )

      if (
        product.price_on_request ||
        price <= 0
      ) {
        return null
      }

      return price - cost
    }, [product])

  const marginPercent =
    useMemo(() => {
      if (
        !product ||
        margin === null
      ) {
        return null
      }

      const price =
        Number(
          product.price || 0
        )

      if (price <= 0) {
        return null
      }

      return (
        margin /
        price
      ) * 100
    }, [
      product,
      margin,
    ])

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

          <div className="border border-[#aeb6ae] bg-white">

            <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] p-5">

              <div className="h-3 w-40 animate-pulse bg-[#dfe3df]" />

              <div className="mt-4 h-10 w-72 max-w-full animate-pulse bg-[#dfe3df]" />

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

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

          <section className="border border-[#aeb6ae] bg-white px-5 py-16 text-center">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1f5a43]">
              Product Review
            </p>

            <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em]">
              Submission not found.
            </h1>

            <p className="mt-2 text-[12px] font-medium text-[#5f675f]">
              {message ||
                'This producer submission could not be loaded.'}
            </p>

            <Link
              href="/admin/producer-products"
              className="
                mt-6
                inline-flex
                min-h-11
                items-center
                bg-[#1f5a43]
                px-5
                text-[10px]
                font-black
                uppercase
                tracking-[0.1em]
                text-white
              "
            >
              Back to Reviews
            </Link>

          </section>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <Link
            href="/admin/producer-products"
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
            ← Producer Products
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
                Marketplace Review
              </p>

              <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl">
                Review Product
              </h1>

              <p className="mt-3 text-[13px] font-medium text-[#5f675f]">

                Submitted by{' '}

                <span className="font-bold text-[#303732]">
                  {product.customers
                    ?.business_name ||
                    'Unknown producer'}
                </span>

              </p>

            </div>

            <StatusBadge
              status={
                product.status
              }
            />

          </div>

        </section>

        {/* =====================================================
            REVIEW GRID
        ===================================================== */}

        <div
          className="
            grid
            gap-8
            py-7
            lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]
            lg:gap-10
          "
        >

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-8">

            {/* PRODUCT INFO */}

            <ReviewSection
              eyebrow="01"
              title="Product Submission"
              description="Review the producer-facing submission before publishing."
            >

              <div className="border border-[#aeb6ae]">

                {/* PRODUCT TITLE */}

                <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5">

                  <h2 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#202621]">
                    {product.name}
                  </h2>

                  <p className="mt-1 font-mono text-[10px] font-semibold text-[#687068]">
                    {product.sku ||
                      'No SKU assigned'}
                  </p>

                </div>

                {/* DETAILS */}

                <div className="grid grid-cols-2 gap-px bg-[#aeb6ae] md:grid-cols-4">

                  <Detail
                    label="Category"
                    value={
                      product.category ||
                      '—'
                    }
                  />

                  <Detail
                    label="Unit"
                    value={
                      product.unit ||
                      '—'
                    }
                  />

                  <Detail
                    label="Price"
                    value={
                      product.price_on_request
                        ? 'On Request'
                        : formatMoney(
                            product.price
                          )
                    }
                  />

                  <Detail
                    label="Stock"
                    value={
                      product.in_stock
                        ? 'In Stock'
                        : 'Out of Stock'
                    }
                  />

                  <Detail
                    label="Cost"
                    value={
                      formatMoney(
                        product.cost_price
                      )
                    }
                  />

                  <Detail
                    label="Margin"
                    value={
                      margin === null
                        ? '—'
                        : `$${margin.toFixed(
                            2
                          )}`
                    }
                  />

                  <Detail
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

                  <Detail
                    label="Supplier"
                    value={
                      product.supplier ||
                      '—'
                    }
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="mt-5">

                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3f4740]">
                  Description
                </p>

                <div className="mt-2 border border-[#aeb6ae] bg-[#f7f8f5] p-4">

                  <p className="whitespace-pre-wrap text-[12px] font-medium leading-6 text-[#4f5750]">
                    {product.description ||
                      'No description provided.'}
                  </p>

                </div>

              </div>

            </ReviewSection>

            {/* OFFICIAL SKU */}

            <ReviewSection
              eyebrow="02"
              title="Official SKU"
              description="Assign the final Local Connect SKU before publishing."
            >

              <Field
                label="Local Connect SKU"
                hint="Required for approval"
              >
                <input
                  required
                  value={sku}
                  onChange={(e) =>
                    setSku(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="PRO-ROMA-25LB"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>

            </ReviewSection>

            {/* ADMIN NOTES */}

            <ReviewSection
              eyebrow="03"
              title="Review Notes"
              description="Notes are visible to the producer when requesting changes or rejecting a submission."
            >

              <Field
                label="Admin Notes"
                hint="Recommended for all review decisions"
              >
                <textarea
                  rows={7}
                  value={
                    adminNotes
                  }
                  onChange={(e) =>
                    setAdminNotes(
                      e.target.value
                    )
                  }
                  placeholder="Add review notes for the producer..."
                  className={`${inputClass} min-h-[170px] resize-y py-3`}
                />
              </Field>

            </ReviewSection>

            {/* PRODUCER CONTACT */}

            <ReviewSection
              eyebrow="04"
              title="Producer"
              description="Submission account information."
            >

              <div className="grid gap-px border border-[#aeb6ae] bg-[#aeb6ae] md:grid-cols-3">

                <Detail
                  label="Business"
                  value={
                    product.customers
                      ?.business_name ||
                    '—'
                  }
                />

                <Detail
                  label="Contact"
                  value={
                    product.customers
                      ?.contact_name ||
                    '—'
                  }
                />

                <Detail
                  label="Email"
                  value={
                    product.customers
                      ?.email ||
                    '—'
                  }
                />

              </div>

            </ReviewSection>

          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <aside className="space-y-8">

            {/* IMAGE */}

            <ReviewSection
              eyebrow="05"
              title="Product Image"
              description="Preview the image that will appear in the buyer catalogue."
            >

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

                {product.image_url ? (
                  <img
                    src={
                      product.image_url
                    }
                    alt={
                      product.name
                    }
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#aeb6ae] text-[#7d857e]">
                      <ImagePlaceholderIcon />
                    </div>

                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#596159]">
                      No Image
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-[#7d857e]">
                      No product image was provided.
                    </p>

                  </div>
                )}

              </div>

            </ReviewSection>

            {/* REVIEW ACTIONS */}

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
                  Review Decision
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#202621]">
                  Publish or Return
                </h2>

                <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#5f675f]">
                  Approve the listing for the buyer catalogue, request revisions, or reject the submission.
                </p>

              </div>

              <div className="space-y-4 p-5 sm:p-6">

                {/* SUMMARY */}

                <div className="grid grid-cols-2 gap-px border border-[#aeb6ae] bg-[#aeb6ae]">

                  <SummaryItem
                    label="Submission"
                    value={
                      product.status ||
                      'draft'
                    }
                  />

                  <SummaryItem
                    label="SKU"
                    value={
                      sku.trim() ||
                      'Missing'
                    }
                  />

                  <SummaryItem
                    label="Stock"
                    value={
                      product.in_stock
                        ? 'In Stock'
                        : 'Out'
                    }
                  />

                  <SummaryItem
                    label="Pricing"
                    value={
                      product.price_on_request
                        ? 'On Request'
                        : formatMoney(
                            product.price
                          )
                    }
                  />

                </div>

                {/* APPROVE */}

                <button
                  type="button"
                  onClick={
                    approveProduct
                  }
                  disabled={saving}
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
                    ? 'Processing...'
                    : 'Approve & Publish'}
                </button>

                {/* REQUEST CHANGES */}

                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      'changes_requested'
                    )
                  }
                  disabled={saving}
                  className="
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-center
                    border
                    border-[#d4a867]
                    bg-[#fff0dc]
                    px-5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-[#754512]
                    transition-colors
                    hover:bg-[#f7dfbd]
                    disabled:opacity-60
                  "
                >
                  Request Changes
                </button>

                {/* REJECT */}

                <button
                  type="button"
                  onClick={() =>
                    updateStatus(
                      'rejected'
                    )
                  }
                  disabled={saving}
                  className="
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-center
                    border
                    border-[#c79189]
                    bg-white
                    px-5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-[#944d44]
                    transition-colors
                    hover:bg-[#fff0ed]
                    disabled:opacity-60
                  "
                >
                  Reject Submission
                </button>

                {message && (
                  <div
                    className="
                      border
                      border-[#d59c94]
                      bg-[#fff0ed]
                      p-3
                      text-[11px]
                      font-semibold
                      leading-5
                      text-[#8f4b43]
                    "
                  >
                    {message}
                  </div>
                )}

              </div>

            </section>

          </aside>

        </div>

      </div>

    </main>
  )
}

/* =========================================================
   REVIEW SECTION
========================================================= */

function ReviewSection({
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
   DETAIL CELL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 bg-white p-4">

      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-[11px] font-bold leading-5 text-[#303732]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children:
    React.ReactNode
}) {
  return (
    <label className="block">

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
    status ===
    'pending_review'
      ? 'Pending Review'
      : status ===
          'changes_requested'
        ? 'Changes Requested'
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
   IMAGE ICON
========================================================= */

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