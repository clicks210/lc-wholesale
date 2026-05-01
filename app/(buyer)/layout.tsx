'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCart } from '@/lib/cart'

const categories = [
  { label: 'All Products', href: '/products', value: null },
  { label: 'Produce', href: '/products?category=Produce', value: 'Produce' },
  { label: 'Bread', href: '/products?category=Bread', value: 'Bread' },
  { label: 'Poultry', href: '/products?category=Poultry', value: 'Poultry' },
  { label: 'Paper', href: '/products?category=Paper', value: 'Paper' },
]

function BuyerLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  function loadCartCount() {
    const cart = getCart()

    const count = cart.reduce((sum: number, item: any) => {
      return sum + Number(item.quantity || 0)
    }, 0)

    setCartCount(count)
  }

  useEffect(() => {
    loadCartCount()

    window.addEventListener('cartUpdated', loadCartCount)
    window.addEventListener('cart-updated', loadCartCount)
    window.addEventListener('storage', loadCartCount)

    return () => {
      window.removeEventListener('cartUpdated', loadCartCount)
      window.removeEventListener('cart-updated', loadCartCount)
      window.removeEventListener('storage', loadCartCount)
    }
  }, [])

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
    setMobileMenuOpen(false)
    window.location.assign('/login')
  }

  function closeMenu() {
    setMobileMenuOpen(false)
  }

  const orderGuideActive = pathname.startsWith('/order-guide')
  const accountActive = pathname.startsWith('/account')
  const cartActive = pathname.startsWith('/cart')

  return (
    <main className="min-h-dvh bg-[#f4f1ea] text-[#1e1e1e]">
      <header className="sticky top-0 z-40 border-b border-[#d6cec0] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center" onClick={closeMenu}>
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-11 w-auto object-contain sm:h-12"
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

          <div className="hidden items-center gap-2 text-sm font-semibold md:flex">
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
              className={`relative px-4 py-2 transition ${
                cartActive
                  ? 'bg-[#1b3d2f] text-white'
                  : 'bg-[#244f3d] text-white hover:bg-[#2f5d46]'
              }`}
            >
              Cart

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
                  {cartCount}
                </span>
              )}
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

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/cart"
              onClick={closeMenu}
              className={`relative px-3 py-2 text-sm font-bold transition ${
                cartActive
                  ? 'bg-[#1b3d2f] text-white'
                  : 'bg-[#244f3d] text-white'
              }`}
            >
              Cart

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="border border-[#d6cec0] px-3 py-2 text-sm font-bold text-[#244f3d]"
            >
              Menu
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-[#eee7da] bg-white px-4 py-3 md:hidden">
          {categories.map((item) => {
            const active =
              pathname === '/products' &&
              (item.value ? activeCategory === item.value : !activeCategory)

            return (
              <Link
                key={item.label}
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
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeMenu}
          />

          <aside className="absolute right-0 top-0 h-full w-[84%] max-w-sm border-l border-[#d6cec0] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d6cec0] px-5 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f3d]">
                  Local Connect
                </p>
                <p className="mt-1 text-sm text-[#6f675c]">
                  Wholesale Portal
                </p>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="border border-[#d6cec0] px-3 py-2 text-sm font-bold text-[#6f675c]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-5">
              <MobileMenuLink
                href="/products"
                label="Browse Products"
                active={pathname.startsWith('/products')}
                onClick={closeMenu}
              />
              <MobileMenuLink
                href="/account"
                label="Account"
                active={accountActive}
                onClick={closeMenu}
              />
              <MobileMenuLink
                href="/order-guide"
                label="Order Guides"
                active={orderGuideActive}
                onClick={closeMenu}
              />
              <MobileMenuLink
                href="/cart"
                label={`Cart${cartCount > 0 ? ` (${cartCount})` : ''}`}
                active={cartActive}
                onClick={closeMenu}
              />

              <div className="border-t border-[#d6cec0] pt-4">
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full border border-[#d6cec0] px-4 py-3 text-left text-sm font-bold text-[#6f675c]"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="block w-full border border-[#244f3d] px-4 py-3 text-sm font-bold text-[#244f3d]"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-[#d6cec0] bg-[#f4f1ea] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#244f3d]">
                Need help?
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6f675c]">
                Contact your Local Connect representative for ordering support.
              </p>
            </div>
          </aside>
        </div>
      )}

      {children}
    </main>
  )
}

function MobileMenuLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block border px-4 py-4 text-sm font-bold ${
        active
          ? 'border-[#244f3d] bg-[#244f3d] text-white'
          : 'border-[#d6cec0] bg-[#f4f1ea] text-[#1e1e1e]'
      }`}
    >
      {label}
    </Link>
  )
}

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <BuyerLayoutContent>{children}</BuyerLayoutContent>
    </Suspense>
  )
}