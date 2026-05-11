'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const APP_VERSION = 'v0.9.5'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Produce Planner', href: '/admin/produce-planner' },
  { label: 'Order Guides', href: '/admin/order-guides' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1e1e1e]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-[#d6cec0] bg-[#244f3d] text-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                Local Connect
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Admin</h1>

                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black tracking-wide text-white/70">
                  {APP_VERSION}
                </span>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
              {navItems.map((item) => {
                const active = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block border px-4 py-3 text-sm font-bold transition ${
                      active
                        ? 'border-white bg-white text-[#244f3d]'
                        : 'border-transparent text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                  System
                </p>

                <span className="text-[10px] font-black tracking-wide text-white/50">
                  Stable Build
                </span>
              </div>

              <Link
                href="/products"
                className="mb-3 block border border-white/20 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
              >
                View Buyer Site
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full border border-white/20 px-4 py-3 text-left text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
          {/* TOP BAR */}
          <header className="sticky top-0 z-30 border-b border-[#d6cec0] bg-white">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#244f3d] sm:text-xs">
                    Wholesale Operations
                  </p>
                </div>

                <span className="rounded-full border border-[#d6cec0] bg-[#f4f1ea] px-2 py-1 text-[10px] font-black tracking-wide text-[#6f675c]">
                  {APP_VERSION}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/admin/orders"
                  className="hidden border border-[#d6cec0] px-4 py-2 text-sm font-bold text-[#1e1e1e] hover:border-[#244f3d] md:block"
                >
                  Orders
                </Link>

                <Link
                  href="/admin/products"
                  className="hidden border border-[#d6cec0] px-4 py-2 text-sm font-bold text-[#1e1e1e] hover:border-[#244f3d] md:block"
                >
                  Products
                </Link>

                <button
                  onClick={handleSignOut}
                  className="bg-[#244f3d] px-3 py-2 text-xs font-bold text-white hover:bg-[#2f5d46] sm:px-4 sm:text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* MOBILE NAV */}
            <div className="flex gap-2 overflow-x-auto border-t border-[#eee7da] px-3 py-3 lg:hidden">
              {navItems.map((item) => {
                const active = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 border px-3 py-2 text-xs font-black transition ${
                      active
                        ? 'border-[#244f3d] bg-[#244f3d] text-white'
                        : 'border-[#d6cec0] bg-white text-[#244f3d]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <section className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </section>
        </div>
      </div>
    </main>
  )
}