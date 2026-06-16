'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProducerProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

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
  const [status, setStatus] = useState('draft')
  const [adminNotes, setAdminNotes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const numericPrice = price ? Number(price) : null
  const numericCostPrice = costPrice ? Number(costPrice) : null

  const margin = useMemo(() => {
    if (priceOnRequest || numericPrice === null) return null
    return numericPrice - Number(numericCostPrice || 0)
  }, [priceOnRequest, numericPrice, numericCostPrice])

  const marginPercent = useMemo(() => {
    if (
      priceOnRequest ||
      numericPrice === null ||
      numericPrice <= 0 ||
      margin === null
    ) {
      return null
    }

    return (margin / numericPrice) * 100
  }, [priceOnRequest, numericPrice, margin])

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name')
        .order('name', { ascending: true })

      if (error) {
        setMessage(error.message)
        return
      }

      setCategories(data?.map((item) => item.name) || [])
    }

    async function loadProduct() {
      try {
        setLoading(true)

        const { data: userData, error: userError } =
          await supabase.auth.getUser()

        if (userError || !userData.user) {
          throw new Error('You must be signed in.')
        }

        const { data: memberships, error: membershipError } = await supabase
          .from('customer_members')
          .select('customer_id')
          .eq('user_id', userData.user.id)

        if (membershipError || !memberships || memberships.length === 0) {
          throw new Error('Producer account could not be found.')
        }

        const customerIds = memberships.map(
          (membership) => membership.customer_id
        )

        const { data: product, error: productError } = await supabase
          .from('producer_products')
          .select('*')
          .eq('id', productId)
          .in('producer_customer_id', customerIds)
          .single()

        if (productError || !product) {
          throw new Error('Could not load product.')
        }

        const productPriceOnRequest = Boolean(product.price_on_request)

        setSku(product.sku || '')
        setName(product.name || '')
        setCategory(product.category || '')
        setSupplier(product.supplier || '')
        setUnit(product.unit || '')
        setPrice(productPriceOnRequest ? '' : String(product.price ?? ''))
        setCostPrice(String(product.cost_price ?? ''))
        setDescription(product.description || '')
        setImageUrl(product.image_url || '')
        setInStock(Boolean(product.in_stock))
        setPriceOnRequest(productPriceOnRequest)
        setStatus(product.status || 'draft')
        setAdminNotes(product.admin_notes || '')
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Could not load product.'

        setMessage(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
    if (productId) loadProduct()
  }, [productId])

  async function uploadImage(): Promise<string> {
    if (!imageFile) return ''

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${sku || 'producer-product'}.${fileExt}`
    const filePath = `producer-products/${fileName}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile)

    if (error) throw error

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const uploadedImageUrl = await uploadImage()

      const nextStatus =
        status === 'approved' ? 'pending_review' : status || 'pending_review'

      const { error } = await supabase
        .from('producer_products')
        .update({
          sku: sku || null,
          name,
          category,
          unit: unit || null,
          price: priceOnRequest ? null : numericPrice,
          cost_price: numericCostPrice,
          description: description || null,
          image_url: uploadedImageUrl || imageUrl || null,
          in_stock: inStock,
          price_on_request: priceOnRequest,
          pricing_type: 'fixed',
          status: nextStatus,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) throw error

      router.push('/producer/products')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Could not update product.'

      setMessage(errorMessage)
      setSaving(false)
    }
  }

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl

  if (loading) {
    return (
      <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
        <div className="lc-card rounded-3xl p-6 text-sm text-lc-muted shadow-sm">
          Loading product...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="lc-card rounded-3xl p-6 shadow-sm">
          <Link
            href="/producer/products"
            className="text-sm font-black text-lc-green transition hover:opacity-80"
          >
            ← Back to my products
          </Link>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-lc-green">
            Producer Catalog
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Edit Product
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-lc-muted">
            Update your product submission. Changes will be sent back to Local
            Connect for review before appearing in the buyer catalog.
          </p>

          <div className="mt-5">
            <StatusBadge status={status} />
          </div>

          {adminNotes && (
            <div className="mt-5 rounded-2xl border border-yellow-700 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
              <p className="font-black">Admin notes</p>
              <p className="mt-1">{adminNotes}</p>
            </div>
          )}
        </header>

        <form
          onSubmit={handleUpdate}
          className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="space-y-6">
            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Product Details</h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="SKU">
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Field label="Category">
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input rounded-2xl bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {categories.length === 0 && (
                    <p className="mt-2 text-xs font-semibold text-yellow-700">
                      No categories found. Ask Local Connect to add categories.
                    </p>
                  )}
                </Field>

                <Field label="Product Name" className="md:col-span-2">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Field label="Unit">
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Field label="Sell Price">
                  <input
                    required={!priceOnRequest}
                    disabled={priceOnRequest}
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={priceOnRequest ? 'Price hidden' : '42.00'}
                    className={
                      priceOnRequest
                        ? 'input cursor-not-allowed rounded-2xl bg-gray-200 text-gray-500'
                        : 'input rounded-2xl bg-white'
                    }
                  />

                  <label className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-lc-border bg-lc-bg p-4">
                    <span>
                      <span className="block text-sm font-black">
                        Price on Request
                      </span>
                      <span className="text-xs text-lc-muted">
                        Submit this item without a public price.
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={priceOnRequest}
                      onChange={(e) => {
                        setPriceOnRequest(e.target.checked)
                        if (e.target.checked) setPrice('')
                      }}
                      className="h-5 w-5 accent-lc-green"
                    />
                  </label>
                </Field>

                <Field label="Description" className="md:col-span-2">
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>
              </div>
            </section>

            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Supplier</h2>

              <div className="mt-6">
                <Field label="Supplier Name">
                  <input
                    value={supplier}
                    readOnly
                    className="input cursor-not-allowed rounded-2xl bg-lc-bg font-semibold text-lc-muted"
                  />

                  <p className="mt-2 text-xs text-lc-muted">
                    Supplier name is managed through your producer account.
                  </p>
                </Field>
              </div>
            </section>

            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Pricing Notes</h2>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <Field label="Cost Price">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Stat
                  label="Margin"
                  value={margin === null ? '—' : `$${margin.toFixed(2)}`}
                />

                <Stat
                  label="Margin %"
                  value={
                    marginPercent === null
                      ? '—'
                      : `${marginPercent.toFixed(1)}%`
                  }
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-lc-muted">
                Pricing changes are reviewed by Local Connect before
                publishing.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Product Image</h2>

              <div className="mt-6 space-y-5">
                <Field label="Upload New Image">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="input rounded-2xl bg-white file:mr-4 file:rounded-xl file:border-0 file:bg-lc-green file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                  />
                </Field>

                <Field label="Or Paste Image URL">
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <div className="overflow-hidden rounded-3xl border border-lc-border bg-lc-bg p-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={name || 'Product preview'}
                      className="h-64 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-lc-border text-sm text-lc-muted">
                      Image preview will appear here
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="lc-card sticky top-4 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Availability</h2>

              <label className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-lc-border bg-lc-bg p-4">
                <span>
                  <span className="block text-sm font-black">
                    Currently In Stock
                  </span>
                  <span className="text-xs text-lc-muted">
                    This can be changed later after approval.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-5 w-5 accent-lc-green"
                />
              </label>

              <div className="mt-5 rounded-2xl border border-yellow-700 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
                Saving changes will resubmit this product for{' '}
                <strong>Local Connect review</strong>.
              </div>

              <button
                type="submit"
                disabled={saving}
                className="lc-button-primary mt-6 w-full rounded-2xl text-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Submitting Changes...' : 'Submit Changes for Review'}
              </button>

              {message && (
                <p className="mt-4 rounded-2xl border border-lc-border bg-lc-bg p-3 text-sm font-semibold text-lc-muted">
                  {message}
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-lc-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-lc-border bg-lc-bg p-4">
      <p className="text-xs font-black uppercase tracking-wide text-lc-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-lc-green">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'pending_review'
      ? 'Pending Review'
      : status === 'changes_requested'
        ? 'Changes Requested'
        : status || 'Draft'

  const className =
    status === 'approved'
      ? 'border-green-700 bg-green-50 text-green-700'
      : status === 'pending_review'
        ? 'border-yellow-700 bg-yellow-50 text-yellow-800'
        : status === 'rejected'
          ? 'border-red-700 bg-red-50 text-red-700'
          : 'border-lc-border bg-lc-bg text-lc-muted'

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase ${className}`}
    >
      {label}
    </span>
  )
}