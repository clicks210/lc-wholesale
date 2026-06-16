'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProducerProductReviewPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [sku, setSku] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadProduct() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('producer_products')
      .select(`
        *,
        customers:producer_customer_id (
          business_name,
          contact_name,
          email
        )
      `)
      .eq('id', submissionId)
      .single()

    if (error || !data) {
      setMessage(error?.message || 'Could not load product.')
      setLoading(false)
      return
    }

    setProduct(data)
    setSku(data.sku || '')
    setAdminNotes(data.admin_notes || '')
    setLoading(false)
  }

  useEffect(() => {
    if (submissionId) loadProduct()
  }, [submissionId])

  async function approveProduct() {
    if (!product) return

    if (!sku.trim()) {
      setMessage('SKU is required before approving and publishing.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      let liveProductId = product.product_id

      const productPayload = {
        sku: sku.trim().toUpperCase(),
        name: product.name,
        category: product.category,
        supplier: product.supplier,
        unit: product.unit,
        price: product.price,
        cost_price: product.cost_price,
        description: product.description,
        image_url: product.image_url,
        is_active: true,
        price_on_request: product.price_on_request,
        pricing_type: product.pricing_type || 'fixed',
        in_stock: product.in_stock,
        special_order: product.special_order || false,
        override_minimum: product.override_minimum,
        override_lead_time_days: product.override_lead_time_days,
        producer_customer_id: product.producer_customer_id,
        source_type: 'producer',
        fulfillment_type: 'producer_fulfilled',
      }

      if (liveProductId) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', liveProductId)

        if (updateError) throw updateError
      } else {
        const { data: createdProduct, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single()

        if (insertError || !createdProduct) throw insertError

        liveProductId = createdProduct.id
      }

      const { error: reviewError } = await supabase
        .from('producer_products')
        .update({
          sku: sku.trim().toUpperCase(),
          product_id: liveProductId,
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (reviewError) throw reviewError

      router.push('/admin/producer-products')
    } catch (error: any) {
      setMessage(error.message || 'Could not approve product.')
      setSaving(false)
    }
  }

  async function updateStatus(status: 'rejected' | 'changes_requested') {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('producer_products')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    router.push('/admin/producer-products')
  }

  if (loading) {
    return (
      <div className="border border-[#d6cec0] bg-white p-6 text-sm text-[#6f675c]">
        Loading submission...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="border border-[#d6cec0] bg-white p-6 text-sm text-[#6f675c]">
        {message || 'Submission not found.'}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 border-b border-[#d6cec0] pb-6">
        <Link
          href="/admin/producer-products"
          className="text-sm font-bold text-[#244f3d]"
        >
          ← Back to producer products
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Marketplace Review
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Review Product
        </h1>

        <p className="mt-3 text-sm text-[#6f675c]">
          Submitted by{' '}
          <strong>
            {product.customers?.business_name || 'Unknown producer'}
          </strong>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">{product.name}</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Detail label="Current SKU" value={product.sku || 'Not assigned'} />
              <Detail label="Category" value={product.category || '—'} />
              <Detail label="Unit" value={product.unit || '—'} />
              <Detail
                label="Price"
                value={
                  product.price_on_request
                    ? 'Price on Request'
                    : formatMoney(product.price)
                }
              />
              <Detail label="Cost" value={formatMoney(product.cost_price)} />
              <Detail
                label="Stock"
                value={product.in_stock ? 'In Stock' : 'Out of Stock'}
              />
              <Detail label="Supplier" value={product.supplier || '—'} />
              <Detail label="Status" value={product.status || 'draft'} />
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1e1e1e]">
                {product.description || 'No description provided.'}
              </p>
            </div>
          </section>

          <section className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Admin SKU</h2>

            <p className="mt-2 text-sm leading-6 text-[#6f675c]">
              Assign the official Local Connect SKU before publishing this
              product to the buyer catalog.
            </p>

            <input
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="PRO-ROMA-25LB"
              className="mt-5 w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 font-mono text-sm uppercase outline-none focus:border-[#244f3d]"
            />
          </section>

          <section className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Admin Notes</h2>

            <textarea
              rows={6}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes for the producer. Required if requesting changes."
              className="mt-5 w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Product Image</h2>

            <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#6f675c]">
                  No image provided
                </div>
              )}
            </div>
          </section>

          <section className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Review Actions</h2>

            <button
              onClick={approveProduct}
              disabled={saving}
              className="mt-6 w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46] disabled:opacity-60"
            >
              {saving ? 'Approving...' : 'Approve & Publish'}
            </button>

            <button
              onClick={() => updateStatus('rejected')}
              disabled={saving}
              className="mt-3 w-full border border-red-700 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-60"
            >
              Reject
            </button>

            {message && (
              <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  )
}

function formatMoney(value: any) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(number)
}