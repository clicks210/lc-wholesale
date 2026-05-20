"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type Props = {
  groupedProducts: Record<string, any[]>
  categoryRules: Record<string, any>
}

export default function CategoryProductsClient({
  groupedProducts,
  categoryRules,
}: Props) {
  const [productsByCategory, setProductsByCategory] = useState(groupedProducts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  function isSelected(productId: string) {
    return selectedIds.includes(productId)
  }

  function toggleSelected(productId: string) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  function toggleCategorySelected(products: any[]) {
    const categoryIds = products.map((product) => product.id)
    const allSelected = categoryIds.every((id) => selectedIds.includes(id))

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !categoryIds.includes(id))
        : Array.from(new Set([...current, ...categoryIds]))
    )
  }

  async function updateProductsInStock(productIds: string[], inStock: boolean) {
    if (productIds.length === 0) return

    setBulkSaving(true)

    const { error } = await supabase
      .from("products")
      .update({ in_stock: inStock })
      .in("id", productIds)

    if (error) {
      alert(error.message)
      setBulkSaving(false)
      return
    }

    setProductsByCategory((current) => {
      const updated: Record<string, any[]> = {}

      for (const [category, products] of Object.entries(current)) {
        updated[category] = products.map((product) =>
          productIds.includes(product.id)
            ? { ...product, in_stock: inStock }
            : product
        )
      }

      return updated
    })

    setSelectedIds([])
    setBulkSaving(false)
  }

  async function toggleInStock(
    productId: string,
    category: string,
    currentValue: boolean
  ) {
    setSavingId(productId)

    const nextValue = !currentValue

    const { error } = await supabase
      .from("products")
      .update({ in_stock: nextValue })
      .eq("id", productId)

    if (error) {
      alert(error.message)
      setSavingId(null)
      return
    }

    setProductsByCategory((current) => ({
      ...current,
      [category]: current[category].map((product) =>
        product.id === productId
          ? { ...product, in_stock: nextValue }
          : product
      ),
    }))

    setSavingId(null)
  }

  return (
    <div className="space-y-8">
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-lg">
          <div className="text-sm font-medium">
            {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""} selected
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => updateProductsInStock(selectedIds, true)}
              disabled={bulkSaving}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Mark In Stock
            </button>

            <button
              onClick={() => updateProductsInStock(selectedIds, false)}
              disabled={bulkSaving}
              className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Mark Special Order
            </button>

            <button
              onClick={() => setSelectedIds([])}
              disabled={bulkSaving}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {Object.entries(productsByCategory).map(([category, products]) => {
        const rule = categoryRules[category]
        const categoryIds = products.map((product) => product.id)
        const allCategorySelected = categoryIds.every((id) =>
          selectedIds.includes(id)
        )

        return (
          <section
            key={category}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b bg-gray-50 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{category}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {products.length} product{products.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {rule && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <RuleBox label="Minimum" value={`$${rule.minimum}`} />
                    <RuleBox label="Lead Time" value={`${rule.leadTimeDays} days`} />
                    <RuleBox label="Delivery" value={rule.deliveryDays.join(" / ")} />
                    <RuleBox
                      label="Cutoff"
                      value={
                        rule.cutoffDaysBefore
                          ? `${rule.cutoffDaysBefore} days prior`
                          : "Lead time"
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-b bg-white px-4 py-3">
              <button
                onClick={() => toggleCategorySelected(products)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold"
              >
                {allCategorySelected ? "Unselect Category" : "Select Category"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-white text-left text-gray-500">
                  <tr>
                    <th className="p-4 font-medium">Select</th>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Unit</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Supplier</th>
                    <th className="p-4 font-medium">Stock Status</th>
                    <th className="p-4 font-medium">Applied Rule</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const inStock = Boolean(product.in_stock)

                    return (
                      <tr key={product.id} className="border-b last:border-b-0">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected(product.id)}
                            onChange={() => toggleSelected(product.id)}
                            className="h-4 w-4"
                          />
                        </td>

                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-gray-500">{product.sku || "—"}</td>
                        <td className="p-4 text-gray-500">{product.unit || "—"}</td>
                        <td className="p-4">
                          ${Number(product.price || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-gray-500">
                          {product.supplier || "—"}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() =>
                              toggleInStock(product.id, category, inStock)
                            }
                            disabled={savingId === product.id || bulkSaving}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              inStock
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            } disabled:opacity-50`}
                          >
                            {savingId === product.id
                              ? "Saving..."
                              : inStock
                              ? "In Stock"
                              : "Special Order"}
                          </button>
                        </td>

                        <td className="p-4">
                          {inStock ? (
                            <span className="text-green-700">
                              Standard Tuesday / Friday delivery
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              Category minimum + lead time
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function RuleBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-semibold capitalize">{value}</div>
    </div>
  )
}