'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  groupedProducts: Record<string, any[]>
  categoryRules?: Record<string, any>
}

type ScheduleItem = {
  delivery_day: string
  cutoff_day: string
  cutoff_time: string
}

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const colors = [
  'bg-green-100 border-green-700 text-green-900',
  'bg-yellow-100 border-yellow-700 text-yellow-900',
  'bg-blue-100 border-blue-700 text-blue-900',
  'bg-purple-100 border-purple-700 text-purple-900',
  'bg-orange-100 border-orange-700 text-orange-900',
  'bg-pink-100 border-pink-700 text-pink-900',
  'bg-red-100 border-red-700 text-red-900',
]

export default function CategoryProductsClient({ groupedProducts }: Props) {
  const initialLcGroupedProducts = useMemo(() => {
    return Object.fromEntries(
      Object.entries(groupedProducts).map(([category, products]) => [
        category,
        products.filter((product) => !product.producer_customer_id),
      ])
    )
  }, [groupedProducts])

  const [productsByCategory, setProductsByCategory] = useState(
    initialLcGroupedProducts
  )
  const [rulesByCategory, setRulesByCategory] = useState<Record<string, any>>({})
  const [savingRuleCategory, setSavingRuleCategory] = useState<string | null>(
    null
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    loadCategoryRules()
  }, [])

  async function loadCategoryRules() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('name, minimum, delivery_schedule')
      .order('name')

    if (error) {
      alert(error.message)
      return
    }

    const mapped = Object.fromEntries(
      (data || []).map((category) => [
        category.name,
        {
          minimum: category.minimum || 0,
          deliverySchedule: Array.isArray(category.delivery_schedule)
            ? category.delivery_schedule
            : [],
        },
      ])
    )

    setRulesByCategory(mapped)
  }

  const categoriesWithProducts = Object.entries(productsByCategory).filter(
    ([, products]) => products.length > 0
  )

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

  function updateCategoryMinimum(category: string, value: string) {
    setRulesByCategory((current) => ({
      ...current,
      [category]: {
        ...(current[category] || {}),
        minimum: value,
      },
    }))
  }

  function addScheduleItem(category: string) {
    const currentSchedule = rulesByCategory[category]?.deliverySchedule || []

    const nextItem: ScheduleItem = {
      delivery_day: 'Friday',
      cutoff_day: 'Wednesday',
      cutoff_time: '17:00',
    }

    setRulesByCategory((current) => ({
      ...current,
      [category]: {
        ...(current[category] || {}),
        deliverySchedule: [...currentSchedule, nextItem],
      },
    }))
  }

  function removeScheduleItem(category: string, index: number) {
    const currentSchedule = rulesByCategory[category]?.deliverySchedule || []

    setRulesByCategory((current) => ({
      ...current,
      [category]: {
        ...(current[category] || {}),
        deliverySchedule: currentSchedule.filter((_: any, i: number) => i !== index),
      },
    }))
  }

  function updateScheduleItem(
    category: string,
    index: number,
    field: keyof ScheduleItem,
    value: string
  ) {
    const currentSchedule = rulesByCategory[category]?.deliverySchedule || []

    setRulesByCategory((current) => ({
      ...current,
      [category]: {
        ...(current[category] || {}),
        deliverySchedule: currentSchedule.map((item: ScheduleItem, i: number) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }))
  }

  async function saveCategoryRule(category: string) {
    const rule = rulesByCategory[category] || {}

    setSavingRuleCategory(category)

    const { error } = await supabase
      .from('product_categories')
      .update({
        minimum: Number(rule.minimum || 0),
        delivery_schedule: rule.deliverySchedule || [],
      })
      .eq('name', category)

    if (error) {
      alert(error.message)
    }

    setSavingRuleCategory(null)
  }

  async function updateProductsInStock(productIds: string[], inStock: boolean) {
    if (productIds.length === 0) return

    setBulkSaving(true)

    const { error } = await supabase
      .from('products')
      .update({ in_stock: inStock })
      .in('id', productIds)
      .is('producer_customer_id', null)

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
      .from('products')
      .update({ in_stock: nextValue })
      .eq('id', productId)
      .is('producer_customer_id', null)

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
            {selectedIds.length} product
            {selectedIds.length !== 1 ? 's' : ''} selected
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

      {categoriesWithProducts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No Local Connect inventory products found.
        </div>
      ) : (
        categoriesWithProducts.map(([category, products]) => {
          const rule = rulesByCategory[category] || {
            minimum: 0,
            deliverySchedule: [],
          }

          const schedule: ScheduleItem[] = rule.deliverySchedule || []
          const categoryIds = products.map((product) => product.id)
          const allCategorySelected =
            categoryIds.length > 0 &&
            categoryIds.every((id) => selectedIds.includes(id))

          return (
            <section
              key={category}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b bg-gray-50 p-6">
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {products.length} Local Connect product
                      {products.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-start">
                      <label>
                        <span className="mb-2 block text-xs font-bold uppercase text-gray-500">
                          Category Minimum
                        </span>
                        <input
                          type="number"
                          value={rule.minimum || 0}
                          onChange={(e) =>
                            updateCategoryMinimum(category, e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none"
                        />
                      </label>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase text-gray-500">
                            Delivery Schedule
                          </p>

                          <button
                            type="button"
                            onClick={() => addScheduleItem(category)}
                            className="rounded-xl border px-3 py-2 text-xs font-semibold"
                          >
                            Add Delivery Day
                          </button>
                        </div>

                        <div className="space-y-3">
                          {schedule.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                              No delivery schedule set.
                            </div>
                          ) : (
                            schedule.map((item, index) => (
                              <div
                                key={`${category}-${index}`}
                                className={`border p-4 ${
                                  colors[index % colors.length]
                                }`}
                              >
                                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                                  <label>
                                    <span className="mb-1 block text-xs font-bold uppercase">
                                      Delivery Day
                                    </span>
                                    <select
                                      value={item.delivery_day}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          category,
                                          index,
                                          'delivery_day',
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-current bg-white px-3 py-2 text-sm outline-none"
                                    >
                                      {weekDays.map((day) => (
                                        <option key={day} value={day}>
                                          {day}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label>
                                    <span className="mb-1 block text-xs font-bold uppercase">
                                      Cutoff Day
                                    </span>
                                    <select
                                      value={item.cutoff_day}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          category,
                                          index,
                                          'cutoff_day',
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-current bg-white px-3 py-2 text-sm outline-none"
                                    >
                                      {weekDays.map((day) => (
                                        <option key={day} value={day}>
                                          {day}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label>
                                    <span className="mb-1 block text-xs font-bold uppercase">
                                      Cutoff Time
                                    </span>
                                    <input
                                      type="time"
                                      value={item.cutoff_time}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          category,
                                          index,
                                          'cutoff_time',
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-current bg-white px-3 py-2 text-sm outline-none"
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeScheduleItem(category, index)
                                    }
                                    className="self-end border border-current bg-white px-3 py-2 text-xs font-bold uppercase"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveCategoryRule(category)}
                        disabled={savingRuleCategory === category}
                        className="rounded-xl bg-[#244f3d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {savingRuleCategory === category
                          ? 'Saving...'
                          : 'Save Rule'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b bg-white px-4 py-3">
                <button
                  onClick={() => toggleCategorySelected(products)}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold"
                >
                  {allCategorySelected
                    ? 'Unselect Category'
                    : 'Select Category'}
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
                        <tr
                          key={product.id}
                          className="border-b last:border-b-0"
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected(product.id)}
                              onChange={() => toggleSelected(product.id)}
                              className="h-4 w-4"
                            />
                          </td>

                          <td className="p-4 font-medium">{product.name}</td>

                          <td className="p-4 text-gray-500">
                            {product.sku || '—'}
                          </td>

                          <td className="p-4 text-gray-500">
                            {product.unit || '—'}
                          </td>

                          <td className="p-4">
                            ${Number(product.price || 0).toFixed(2)}
                          </td>

                          <td className="p-4 text-gray-500">
                            {product.supplier || '—'}
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() =>
                                toggleInStock(product.id, category, inStock)
                              }
                              disabled={savingId === product.id || bulkSaving}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                inStock
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              } disabled:opacity-50`}
                            >
                              {savingId === product.id
                                ? 'Saving...'
                                : inStock
                                  ? 'In Stock'
                                  : 'Special Order'}
                            </button>
                          </td>

                          <td className="p-4">
                            {inStock ? (
                              <span className="text-green-700">
                                Standard delivery
                              </span>
                            ) : (
                              <span className="text-gray-600">
                                ${Number(rule.minimum || 0).toFixed(2)} minimum ·{' '}
                                {formatScheduleSummary(schedule)}
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
        })
      )}
    </div>
  )
}

function formatScheduleSummary(schedule: ScheduleItem[]) {
  if (!schedule || schedule.length === 0) return 'No schedule set'

  return schedule
    .map(
      (item) =>
        `${item.delivery_day}, cutoff ${item.cutoff_day} ${formatTime(
          item.cutoff_time
        )}`
    )
    .join(' / ')
}

function formatTime(time: string) {
  if (!time) return 'No time set'

  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}