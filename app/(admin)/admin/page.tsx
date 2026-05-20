// app/admin/financials/page.tsx

import { supabase } from '@/lib/supabase'

export default async function AdminFinancialsPage() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthIso = startOfMonth.toISOString()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, business_name')
    .order('business_name')

  const { data: targets } = await supabase
    .from('customer_sales_targets')
    .select('*')
    .gte('month', monthIso)

  const { data: orders } = await supabase
    .from('orders')
    .select('customer_id, total_amount, created_at')
    .gte('created_at', monthIso)

  const { data: adjustments } = await supabase
    .from('customer_sales_adjustments')
    .select('*')
    .gte('month', monthIso)

  const rows = (customers || []).map((customer) => {
    const target = targets?.find((t) => t.customer_id === customer.id)

    const customerOrders =
      orders?.filter((o) => o.customer_id === customer.id) || []

    const customerAdjustments =
      adjustments?.filter((a) => a.customer_id === customer.id) || []

    const orderSales = customerOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    )

    const adjustmentTotal = customerAdjustments.reduce(
      (sum, adjustment) => sum + Number(adjustment.amount || 0),
      0
    )

    const targetAmount = Number(target?.target_amount || 0)
    const actualSales = orderSales + adjustmentTotal
    const remaining = Math.max(targetAmount - actualSales, 0)
    const progress =
      targetAmount > 0 ? Math.min((actualSales / targetAmount) * 100, 100) : 0

    return {
      id: customer.id,
      business_name: customer.business_name,
      targetAmount,
      orderSales,
      adjustmentTotal,
      actualSales,
      remaining,
      progress,
    }
  })

  const totalTarget = rows.reduce((sum, row) => sum + row.targetAmount, 0)
  const totalActual = rows.reduce((sum, row) => sum + row.actualSales, 0)
  const totalRemaining = Math.max(totalTarget - totalActual, 0)
  const totalProgress =
    totalTarget > 0 ? Math.min((totalActual / totalTarget) * 100, 100) : 0

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

          <p className="mt-2 max-w-2xl text-sm text-[#5f6f66]">
            Track monthly customer sales targets, online order revenue, and
            manual off-platform adjustments.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric title="Monthly Revenue" value={formatMoney(totalActual)} />
          <Metric title="Monthly Target" value={formatMoney(totalTarget)} />
          <Metric title="Remaining" value={formatMoney(totalRemaining)} />
          <Metric title="Progress" value={`${totalProgress.toFixed(1)}%`} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#d8cfc0] bg-white shadow-sm">
          <div className="border-b border-[#eee6da] p-5">
            <h2 className="text-xl font-black text-[#1f2f27]">
              Customer Monthly Targets
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#244f3d] text-white">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Adjustments</th>
                  <th className="p-4">Actual</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Progress</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-sm font-bold text-[#6b6b6b]"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#eee6da]">
                      <td className="p-4 font-black text-[#1f2f27]">
                        {row.business_name}
                      </td>

                      <td className="p-4 font-bold">
                        {formatMoney(row.targetAmount)}
                      </td>

                      <td className="p-4">
                        {formatMoney(row.orderSales)}
                      </td>

                      <td className="p-4">
                        {formatMoney(row.adjustmentTotal)}
                      </td>

                      <td className="p-4 font-black text-[#244f3d]">
                        {formatMoney(row.actualSales)}
                      </td>

                      <td className="p-4">
                        {formatMoney(row.remaining)}
                      </td>

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

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cfc0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-[#6b6b6b]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black text-[#244f3d]">
        {value}
      </p>
    </div>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value || 0)
}