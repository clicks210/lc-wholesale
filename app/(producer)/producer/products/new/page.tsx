'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

  const margin = priceOnRequest ? 0 : Number(price || 0) - Number(costPrice || 0)
  const marginPercent =
    !priceOnRequest && Number(price) > 0 ? (margin / Number(price)) * 100 : 0

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

    async function loadProducer() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) return

      const { data: membership } = await supabase
        .from('customer_members')
        .select('customer_id')
        .eq('user_id', userData.user.id)
        .single()

      if (!membership?.customer_id) return

      setCustomerId(membership.customer_id)

      const { data: customer } = await supabase
        .from('customers')
        .select('business_name')
        .eq('id', membership.customer_id)
        .single()

      if (customer?.business_name) {
        setSupplier(customer.business_name)
      }
    }

    loadCategories()
    loadProducer()
  }, [])

  async function uploadImage() {
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('You must be signed in.')
      }

      const uploadedImageUrl = await uploadImage()

      const res = await fetch('/api/producer/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user.id,
          sku,
          name,
          category,
          supplier,
          unit,
          price: priceOnRequest ? null : Number(price),
          cost_price: costPrice ? Number(costPrice) : null,
          description,
          image_url: uploadedImageUrl || imageUrl || null,
          in_stock: inStock,
          price_on_request: priceOnRequest,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Could not submit product.')
      }

      router.push('/producer/products')
    } catch (error: any) {
      setMessage(error.message || 'Could not submit product.')
      setLoading(false)
    }
  }

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl

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
            Add Product
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-lc-muted">
            Submit a product for Local Connect review. Once approved, it can be
            published to the live buyer catalog.
          </p>
        </header>

        <form
          onSubmit={handleCreate}
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
                    placeholder="PRO-ROMA-25LB"
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
                    placeholder="Roma Tomatoes 25lb"
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Field label="Unit">
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="case, lb, each"
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <Field label="Sell Price">
                  <input
                    required={!priceOnRequest}
                    disabled={priceOnRequest}
                    type="number"
                    step="0.01"
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
                      onChange={(e) => setPriceOnRequest(e.target.checked)}
                      className="h-5 w-5 accent-lc-green"
                    />
                  </label>
                </Field>

                <Field label="Description" className="md:col-span-2">
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product notes, pack size, origin, handling details, or ordering notes."
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
                    className="input cursor-not-allowed rounded-2xl bg-lc-bg font-semibold text-lc-ink"
                  />
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
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="30.00"
                    className="input rounded-2xl bg-white"
                  />
                </Field>

                <MetricCard
                  label="Margin"
                  value={priceOnRequest ? '—' : `$${margin.toFixed(2)}`}
                />

                <MetricCard
                  label="Margin %"
                  value={priceOnRequest ? '—' : `${marginPercent.toFixed(1)}%`}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-lc-muted">
                This helps Local Connect review pricing before publishing.
                Buyers will only see approved catalog information.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Product Image</h2>

              <div className="mt-6 space-y-5">
                <Field label="Upload Image">
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
                    placeholder="https://..."
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
                This product will be submitted as{' '}
                <strong>Pending Review</strong>. Local Connect must approve it
                before it appears in the buyer catalog.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="lc-button-primary mt-6 w-full rounded-2xl text-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Submitting Product...' : 'Submit for Review'}
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-lc-border bg-lc-bg p-4">
      <p className="text-xs font-black uppercase tracking-wide text-lc-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-lc-green">{value}</p>
    </div>
  )
}