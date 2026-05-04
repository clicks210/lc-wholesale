'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProductById, updateProduct } from '@/lib/products'

const categories = ['Produce', 'Bread', 'Poultry', 'Paper']

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

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
  const [isActive, setIsActive] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const margin = Number(price || 0) - Number(costPrice || 0)
  const marginPercent = Number(price) > 0 ? (margin / Number(price)) * 100 : 0

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true)
        const product = await getProductById(productId)

        setSku(product.sku || '')
        setName(product.name || '')
        setCategory(product.category || '')
        setSupplier(product.supplier || '')
        setUnit(product.unit || '')
        setPrice(String(product.price ?? ''))
        setCostPrice(String(product.cost_price ?? ''))
        setDescription(product.description || '')
        setImageUrl(product.image_url || '')
        setIsActive(Boolean(product.is_active))
      } catch (error: any) {
        setMessage(error.message || 'Could not load product.')
      } finally {
        setLoading(false)
      }
    }

    if (productId) loadProduct()
  }, [productId])

  async function uploadImage() {
    if (!imageFile) return ''

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${sku || 'product'}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile)

    if (error) throw error

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const uploadedImageUrl = await uploadImage()

      await updateProduct(productId, {
        sku,
        name,
        category,
        supplier,
        unit,
        price: Number(price),
        cost_price: costPrice ? Number(costPrice) : null,
        description,
        image_url: uploadedImageUrl || imageUrl,
        is_active: isActive,
      })

      router.push('/admin/products')
    } catch (error: any) {
      setMessage(error.message || 'Could not update product.')
      setSaving(false)
    }
  }

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl

  if (loading) {
    return (
      <div className="border border-[#d6cec0] bg-white p-6 text-sm text-[#6f675c]">
        Loading product...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 border-b border-[#d6cec0] pb-6">
        <Link href="/admin/products" className="text-sm font-bold text-[#244f3d]">
          ← Back to products
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Catalog Management
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Edit Product
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Update buyer-facing details, supplier info, pricing, margin, image, and
          availability.
        </p>
      </div>

      <form
        onSubmit={handleUpdate}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="space-y-6">
          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Buyer-Facing Details</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="SKU">
                <input
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Category">
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Product Name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Unit">
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Sell Price">
                <input
                  required
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Supplier</h2>

            <div className="mt-6">
              <Field label="Supplier Name">
                <input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </div>

          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Internal Pricing</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Field label="Cost Price">
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="input"
                />
              </Field>

              <Stat label="Margin" value={`$${margin.toFixed(2)}`} />
              <Stat label="Margin %" value={`${marginPercent.toFixed(1)}%`} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Product Image</h2>

            <div className="mt-6">
              <Field label="Upload New Image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Or Paste Image URL">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5 border border-[#d6cec0] bg-[#f4f1ea] p-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={name || 'Product preview'}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#6f675c]">
                  Image preview will appear here
                </div>
              )}
            </div>
          </div>

          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Availability</h2>

            <label className="mt-6 flex items-center justify-between border border-[#d6cec0] bg-[#f4f1ea] p-4">
              <span>
                <span className="block text-sm font-bold">Active Product</span>
                <span className="text-xs text-[#6f675c]">
                  Visible to approved buyers
                </span>
              </span>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46] disabled:opacity-60"
            >
              {saving ? 'Saving Product...' : 'Save Product'}
            </button>

            {message && (
              <p className="mt-4 border border-[#d6cec0] bg-[#f4f1ea] p-3 text-sm text-[#6f675c]">
                {message}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </span>
      {children}
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#244f3d]">{value}</p>
    </div>
  )
}