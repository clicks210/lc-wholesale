'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const categories = [
  { label: 'All Products', href: '/products', value: null },
  { label: 'Produce', href: '/products?category=Produce', value: 'Produce' },
  { label: 'Bread', href: '/products?category=Bread', value: 'Bread' },
  { label: 'Poultry', href: '/products?category=Poultry', value: 'Poultry' },
  { label: 'Paper', href: '/products?category=Paper', value: 'Paper' },
]

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  const orderGuideActive = pathname.startsWith('/order-guide')
  const accountActive = pathname.startsWith('/account')
  const cartActive = pathname.startsWith('/cart')

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1e1e1e]">
      <header className="sticky top-0 z-40 border-b border-[#d6cec0] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
  <img
    src="/images/logo.png"
    alt="Local Connect"
    className="h-12 w-auto object-contain"
  />
</Link>

          <nav className="hidden items-center gap-2 md:flex">
            {categories.map((item) => {
              const active =
                pathname === '/products' &&
                (item.value ? activeCategory === item.value : !activeCategory)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-[#244f3d] text-white'
                      : 'text-[#6f675c] hover:bg-[#f4f1ea] hover:text-[#244f3d]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            
          </nav>

          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link
              href="/account"
              className={`px-3 py-2 transition ${
                accountActive
                  ? 'bg-[#244f3d] text-white'
                  : 'text-[#6f675c] hover:bg-[#f4f1ea] hover:text-[#244f3d]'
              }`}
            >
              Account
            </Link>

            <Link
              href="/order-guide"
              className={`border px-3 py-2 transition ${
                orderGuideActive
                  ? 'border-[#244f3d] bg-[#244f3d] text-white'
                  : 'border-[#244f3d] text-[#244f3d] hover:bg-[#f4f1ea]'
              }`}
            >
              Guides
            </Link>

            <Link
              href="/cart"
              className={`px-4 py-2 transition ${
                cartActive
                  ? 'bg-[#1b3d2f] text-white'
                  : 'bg-[#244f3d] text-white hover:bg-[#2f5d46]'
              }`}
            >
              Cart
            </Link>

            {user ? (
              <button
                onClick={handleSignOut}
                className="border border-[#d6cec0] px-4 py-2 text-[#6f675c] hover:border-[#244f3d] hover:text-[#244f3d]"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="border border-[#244f3d] px-4 py-2 text-[#244f3d] hover:bg-[#f4f1ea]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {children}
    </main>
  )
}