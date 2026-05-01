export default function AdminSidebar() {
  return (
    <aside className="min-h-screen w-64 border-r bg-white p-6">
      <h2 className="mb-6 text-xl font-bold">LC Admin</h2>
      <nav className="space-y-3 text-sm">
        <a className="block" href="/admin/dashboard">Dashboard</a>
        <a className="block" href="/admin/orders">Orders</a>
        <a className="block" href="/admin/products">Products</a>
        <a className="block" href="/admin/customers">Customers</a>
      </nav>
    </aside>
  )
}
