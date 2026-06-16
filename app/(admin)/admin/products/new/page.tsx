'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createProduct } from '@/lib/products'

export default function NewProductPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

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
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const margin = priceOnRequest ? 0 : Number(price || 0) - Number(costPrice || 0)
  const marginPercent =
    !priceOnRequest && Number(price) > 0 ? (margin / Number(price)) * 100 : 0

  useEffect(() => {
    loadCategories()
  }, [])

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

  async function addCategory() {
    const cleaned = newCategory.trim()

    if (!cleaned) return

    const existingCategory = categories.find(
      (item) => item.toLowerCase() === cleaned.toLowerCase()
    )

    if (existingCategory) {
      setCategory(existingCategory)
      setNewCategory('')
      return
    }

    setAddingCategory(true)
    setMessage('')

    const { error } = await supabase
      .from('product_categories')
      .insert({ name: cleaned })

    if (error) {
      setMessage(error.message)
      setAddingCategory(false)
      return
    }

    setCategories((current) => [...current, cleaned].sort())
    setCategory(cleaned)
    setNewCategory('')
    setAddingCategory(false)
  }

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const uploadedImageUrl = await uploadImage()

      await createProduct({
        sku,
        name,
        category,
        supplier,
        unit,
        price: priceOnRequest ? null : Number(price),
        cost_price: costPrice ? Number(costPrice) : null,
        description,
        image_url: uploadedImageUrl || imageUrl,
        is_active: isActive,
        price_on_request: priceOnRequest,
      })

      router.push('/admin/products')
    } catch (error: any) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl

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
          Add Product
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Create a wholesale catalog item with buyer-facing details, supplier
          information, internal cost, margin visibility, and product media.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="space-y-6">
          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Buyer-Facing Details</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  SKU
                </label>
                <input
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PRO-ROMA-25LB"
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Category
                </label>

                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category..."
                    className="flex-1 border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                  />

                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={addingCategory}
                    className="border border-[#244f3d] px-4 py-3 text-sm font-bold text-[#244f3d] hover:bg-[#244f3d] hover:text-white disabled:opacity-50"
                  >
                    {addingCategory ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Product Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Roma Tomatoes 25lb"
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Unit
                </label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="case, lb, each"
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Sell Price
                </label>
                <input
                  required={!priceOnRequest}
                  disabled={priceOnRequest}
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={priceOnRequest ? 'Price hidden' : '42.00'}
                  className={`w-full border border-[#d6cec0] px-4 py-3 text-sm outline-none focus:border-[#244f3d] ${
                    priceOnRequest
                      ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                      : 'bg-[#f4f1ea]'
                  }`}
                />

                <label className="mt-3 flex items-center justify-between border border-[#d6cec0] bg-[#f4f1ea] p-3">
                  <span>
                    <span className="block text-sm font-bold">
                      Price on Request
                    </span>
                    <span className="text-xs text-[#6f675c]">
                      Show product, hide price, and disable add to cart.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={priceOnRequest}
                    onChange={(e) => setPriceOnRequest(e.target.checked)}
                    className="h-5 w-5"
                  />
                </label>

                {priceOnRequest && (
                  <p className="mt-2 text-xs font-semibold text-[#b45309]">
                    This item will appear as “Price on Request” and cannot be
                    ordered directly.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product notes, pack size, origin, handling details, or ordering notes."
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>
            </div>
          </div>

          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Supplier</h2>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Supplier Name
              </label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Specialty Bakery, Colonial Farms, R3 Redistribution..."
                className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
              />
            </div>
          </div>

          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Internal Pricing</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="30.00"
                  className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
                />
              </div>

              <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Margin
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#244f3d]">
                  {priceOnRequest ? '—' : `$${margin.toFixed(2)}`}
                </p>
              </div>

              <div className="border border-[#d6cec0] bg-[#f4f1ea] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                  Margin %
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#244f3d]">
                  {priceOnRequest ? '—' : `${marginPercent.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-[#d6cec0] bg-white p-6">
            <h2 className="text-xl font-semibold">Product Image</h2>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Upload Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6f675c]">
                Or Paste Image URL
              </label>

              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-[#d6cec0] bg-[#f4f1ea] px-4 py-3 text-sm outline-none focus:border-[#244f3d]"
              />
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
              disabled={loading}
              className="mt-6 w-full bg-[#244f3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#2f5d46] disabled:opacity-60"
            >
              {loading ? 'Creating Product...' : 'Create Product'}
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