'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  business_name: string
}

type Order = {
  id: string
  customer_id: string | null
  subtotal: number | null
  created_at: string
}

type SalesTarget = {
  id?: string
  customer_id: string
  month: string
  target_amount: number
}

type SalesAdjustment = {
  id?: string
  customer_id: string
  month: string
  amount: number
  reason?: string | null
  notes?: string | null
}

export default function AdminFinancialsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [targets, setTargets] = useState<SalesTarget[]>([])
  const [adjustments, setAdjustments] = useState<SalesAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingTarget, setSavingTarget] = useState<string | null>(null)
  const [savingAdjustment, setSavingAdjustment] = useState<string | null>(null)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthDate = startOfMonth.toISOString().split('T')[0]

  const monthLabel = now.toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    const customersRes = await supabase
      .from('customers')
      .select('id, business_name')
      .order('business_name')

    const ordersRes = await supabase
      .from('orders')
      .select('id, customer_id, subtotal, created_at')

    const targetsRes = await supabase
      .from('customer_sales_targets')
      .select('*')

    const adjustmentsRes = await supabase
      .from('customer_sales_adjustments')
      .select('*')

    const queryError =
      customersRes.error?.message ||
      ordersRes.error?.message ||
      targetsRes.error?.message ||
      adjustmentsRes.error?.message ||
      null

    if (queryError) setError(queryError)

    setCustomers(customersRes.data || [])
    setOrders(ordersRes.data || [])
    setTargets(targetsRes.data || [])
    setAdjustments(adjustmentsRes.data || [])
    setLoading(false)
  }

  async function saveTarget(customerId: string, targetAmount: number) {
    setSavingTarget(customerId)
    setError(null)

    const { error } = await supabase
      .from('customer_sales_targets')
      .upsert(
        {
          customer_id: customerId,
          month: monthDate,
          target_amount: targetAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id,month' }
      )

    if (error) setError(error.message)
    else await loadData()

    setSavingTarget(null)
  }

  async function addAdjustment(customerId: string, amount: number) {
    if (!amount) return

    setSavingAdjustment(customerId)
    setError(null)

    const { error } = await supabase.from('customer_sales_adjustments').insert({
      customer_id: customerId,
      month: monthDate,
      amount,
      reason: 'Manual admin adjustment',
    })

    if (error) setError(error.message)
    else await loadData()

    setSavingAdjustment(null)
  }

  const rows = useMemo(() => {
    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startOfMonth && orderDate < endOfMonth
    })

    const monthTargets = targets.filter((target) =>
      target.month?.startsWith(monthDate)
    )

    const monthAdjustments = adjustments.filter((adjustment) =>
      adjustment.month?.startsWith(monthDate)
    )

    return customers.map((customer) => {
      const customerOrders = monthOrders.filter(
        (order) => order.customer_id === customer.id
      )

      const customerTarget = monthTargets.find(
        (target) => target.customer_id === customer.id
      )

      const customerAdjustments = monthAdjustments.filter(
        (adjustment) => adjustment.customer_id === customer.id
      )

      const orderSales = customerOrders.reduce(
        (sum, order) => sum + Number(order.subtotal || 0),
        0
      )

      const adjustmentTotal = customerAdjustments.reduce(
        (sum, adjustment) => sum + Number(adjustment.amount || 0),
        0
      )

      const targetAmount = Number(customerTarget?.target_amount || 0)
      const actualSales = orderSales + adjustmentTotal
      const remaining = Math.max(targetAmount - actualSales, 0)

      const progress =
        targetAmount > 0
          ? Math.min((actualSales / targetAmount) * 100, 100)
          : 0

      return {
        id: customer.id,
        business_name: customer.business_name,
        orderCount: customerOrders.length,
        targetAmount,
        orderSales,
        adjustmentTotal,
        actualSales,
        remaining,
        progress,
      }
    })
  }, [orders, customers, targets, adjustments])

  const totalRevenue = rows.reduce((sum, row) => sum + row.actualSales, 0)
  const totalTarget = rows.reduce((sum, row) => sum + row.targetAmount, 0)
  const totalRemaining = Math.max(totalTarget - totalRevenue, 0)
  const totalOrders = rows.reduce((sum, row) => sum + row.orderCount, 0)

  const totalProgress =
    totalTarget > 0 ? Math.min((totalRevenue / totalTarget) * 100, 100) : 0

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#244f3d]">
            LC Wholesale Admin
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#1f2f27]">
            Financials
          </h1>

          <p className="mt-2 text-sm font-bold text-[#5f6f66]">
            Tracking Month: {monthLabel}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Metric title="Monthly Revenue" value={formatMoney(totalRevenue)} />
          <Metric title="Monthly Target" value={formatMoney(totalTarget)} />
          <Metric title="Remaining" value={formatMoney(totalRemaining)} />
          <Metric title="Total Orders" value={String(totalOrders)} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#d8cfc0] bg-white shadow-sm">
          <div className="border-b border-[#eee6da] p-5">
            <h2 className="text-xl font-black text-[#1f2f27]">
              Customer Sales Targets
            </h2>

            <p className="mt-1 text-sm font-bold text-[#5f6f66]">
              {monthLabel} · {totalProgress.toFixed(1)}% to target
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-[#244f3d] text-white">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Order Sales</th>
                  <th className="p-4">Adjustments</th>
                  <th className="p-4">Actual</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Add Adjustment</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center font-bold">
                      Loading financials...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center font-bold">
                      No customer accounts found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#eee6da]">
                      <td className="p-4 font-black text-[#1f2f27]">
                        {row.business_name}
                      </td>

                      <td className="p-4">{row.orderCount}</td>
                      <td className="p-4">{formatMoney(row.orderSales)}</td>
                      <td className="p-4">{formatMoney(row.adjustmentTotal)}</td>

                      <td className="p-4 font-black text-[#244f3d]">
                        {formatMoney(row.actualSales)}
                      </td>

                      <td className="p-4">
                        <input
                          type="number"
                          defaultValue={row.targetAmount}
                          className="w-28 rounded-lg border border-[#d8cfc0] px-3 py-2 font-bold outline-none focus:border-[#244f3d]"
                          onBlur={(event) =>
                            saveTarget(row.id, Number(event.target.value || 0))
                          }
                        />

                        {savingTarget === row.id && (
                          <p className="mt-1 text-xs font-bold text-[#6b6b6b]">
                            Saving...
                          </p>
                        )}
                      </td>

                      <td className="p-4">{formatMoney(row.remaining)}</td>

                      <td className="p-4">
                        <div className="h-3 w-36 overflow-hidden rounded-full bg-[#e7dfd2]">
                          <div
                            className="h-full rounded-full bg-[#244f3d]"
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>

                        <span className="mt-1 block text-xs font-black text-[#244f3d]">
                          {row.progress.toFixed(1)}%
                        </span>
                      </td>

                      <td className="p-4">
                        <AdjustmentInput
                          disabled={savingAdjustment === row.id}
                          onSave={(amount) => addAdjustment(row.id, amount)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function AdjustmentInput({
  onSave,
  disabled,
}: {
  onSave: (amount: number) => void
  disabled: boolean
}) {
  const [amount, setAmount] = useState('')

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={amount}
        disabled={disabled}
        placeholder="$"
        className="w-24 rounded-lg border border-[#d8cfc0] px-3 py-2 font-bold outline-none focus:border-[#244f3d]"
        onChange={(event) => setAmount(event.target.value)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onSave(Number(amount || 0))
          setAmount('')
        }}
        className="rounded-lg bg-[#244f3d] px-3 py-2 text-xs font-black uppercase tracking-wide text-white disabled:opacity-50"
      >
        {disabled ? 'Saving' : 'Add'}
      </button>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cfc0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#6b6b6b]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black text-[#244f3d]">{value}</p>
    </div>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value || 0)
}