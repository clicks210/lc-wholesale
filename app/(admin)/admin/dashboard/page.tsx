import Link from 'next/link'

const cards = [
  {
    title: 'Orders',
    description: 'Review incoming wholesale orders and fulfillment status.',
    href: '/admin/orders',
    metric: 'View',
  },
  {
    title: 'Products',
    description: 'Manage catalog items, pricing, units, and availability.',
    href: '/admin/products',
    metric: 'Manage',
  },
  {
    title: 'Customers',
    description: 'Approve buyers and manage wholesale customer accounts.',
    href: '/admin/customers',
    metric: 'Approve',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] p-8 text-[#1e1e1e]">
      <div className="mb-10 border-b border-[#d6cec0] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
          Local Connect Admin
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Operations Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675c]">
          Manage wholesale ordering, buyer approvals, product availability, and
          fulfillment from one internal dashboard.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="border border-[#d6cec0] bg-white p-6 transition hover:border-[#244f3d]"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <span className="bg-[#244f3d] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {card.metric}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#6f675c]">
              {card.description}
            </p>

            <p className="mt-8 text-sm font-bold text-[#244f3d]">
              Open {card.title} →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}