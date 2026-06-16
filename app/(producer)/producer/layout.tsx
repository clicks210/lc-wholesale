'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const APP_VERSION = 'v1.9.5'

const navItems = [
  { label: 'Products', href: '/producer/products' },
  { label: 'Delivery', href: '/producer/delivery' },
  { label: 'Orders', href: '/producer/orders' },
  { label: 'Account', href: '/producer/account' },
]

export default function ProducerLayout({
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
    <main className="min-h-dvh bg-[#f4f1ea] text-[#1e1e1e]">
      <aside className="fixed left-5 top-5 z-40 hidden h-[calc(100dvh-2.5rem)] w-72 flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/45 shadow-2xl backdrop-blur-2xl lg:flex">
        <div className="border-b border-white/60 bg-white/40 p-6">
          <Link href="/" className="inline-flex">
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#244f3d]">
              Producer Portal
            </p>

            <span className="rounded-full border border-[#d6cec0] bg-white/60 px-2 py-1 text-[10px] font-black tracking-wide text-[#6f675c]">
              {APP_VERSION}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#6f675c]">
  Manage your products, delivery settings, orders, and marketplace account.
</p>

<div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3">
  <p className="text-[11px] font-black uppercase tracking-wide text-amber-900">
    Beta Notice
  </p>

  <p className="mt-1 text-xs leading-5 text-amber-800">
    This portal is currently in beta. If you encounter any issues, please call{' '}
    <a
      href="tel:17782207817"
      className="font-black underline"
    >
      (778) 220-7817
    </a>{' '}
    or email{' '}
    <a
      href="mailto:lmilovick@gmail.com"
      className="font-black underline"
    >
      lmilovick@gmail.com
    </a>.
  </p>
</div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href

              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={active}
                />
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/60 bg-white/35 p-5">
          <Link
            href="/products"
            className="mb-3 block rounded-2xl border border-[#d6cec0] bg-white/60 px-4 py-3 text-sm font-bold text-[#6f675c] transition hover:border-[#244f3d] hover:text-[#244f3d]"
          >
            View Buyer Site
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-2xl border border-[#d6cec0] bg-white/60 px-4 py-3 text-left text-sm font-bold text-[#6f675c] transition hover:border-[#244f3d] hover:text-[#244f3d]"
          >
            Sign Out
          </button>

          <p className="mt-4 text-xs leading-5 text-[#6f675c]">
            Marketplace Tools · {APP_VERSION}
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-[19rem]">
        <header className="sticky top-0 z-30 border-b border-[#d6cec0] bg-white/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Local Connect"
                className="h-11 w-auto object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="bg-[#244f3d] px-3 py-2 text-sm font-bold text-white"
            >
              Sign Out
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[#eee7da] bg-white px-4 py-3">
            {navItems.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 border px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] ${
                    active
                      ? 'border-[#244f3d] bg-[#244f3d] text-white'
                      : 'border-[#d6cec0] bg-[#f4f1ea] text-[#6f675c]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </header>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  )
}

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-[#244f3d] text-white shadow-lg'
          : 'text-[#6f675c] hover:bg-white/70 hover:text-[#244f3d]'
      }`}
    >
      {label}
    </Link>
  )
}