export default function ProducerDashboardPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#244f3d]">
        Producer Dashboard
      </p>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Welcome to your producer portal.
      </h1>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f675c]">
        Manage your products, update availability, and review incoming orders
        from Local Connect buyers.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="border border-[#d6cec0] bg-white p-6">
          <p className="text-sm font-bold text-[#244f3d]">Products</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
          <p className="mt-2 text-sm text-[#6f675c]">Active listings</p>
        </div>

        <div className="border border-[#d6cec0] bg-white p-6">
          <p className="text-sm font-bold text-[#244f3d]">Orders</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
          <p className="mt-2 text-sm text-[#6f675c]">Pending this week</p>
        </div>

        <div className="border border-[#d6cec0] bg-white p-6">
          <p className="text-sm font-bold text-[#244f3d]">Status</p>
          <p className="mt-2 text-3xl font-semibold">Review</p>
          <p className="mt-2 text-sm text-[#6f675c]">
            Account approval status
          </p>
        </div>
      </div>
    </div>
  )
}