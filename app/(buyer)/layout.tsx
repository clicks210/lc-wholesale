'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCart } from '@/lib/cart'

type CategoryLink = {
  label: string
  href: string
  value: string | null
}

function BuyerLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryLink[]>([
    { label: 'All Products', href: '/products', value: null },
  ])

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')
  const isProductsPage = pathname.startsWith('/products')

  const orderGuideActive = pathname.startsWith('/order-guide')
  const accountActive = pathname.startsWith('/account')
  const cartActive = pathname.startsWith('/cart')

  const dashboardHref =
    userRole === 'admin'
      ? '/admin'
      : userRole === 'producer'
        ? '/producer/products'
        : null

  const dashboardLabel =
    userRole === 'admin'
      ? 'Admin Dashboard'
      : userRole === 'producer'
        ? 'Producer Dashboard'
        : 'Dashboard'

  function loadCartCount() {
    const cart = getCart()
    setCartCount(
      cart.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0
      )
    )
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading categories:', error)
      return
    }

    setCategories([
      { label: 'All Products', href: '/products', value: null },
      ...(data || []).map((category) => ({
        label: category.name,
        href: `/products?category=${encodeURIComponent(category.name)}`,
        value: category.name,
      })),
    ])
  }

  async function loadUserRole(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    setUserRole(profile?.role ?? null)
  }

  useEffect(() => {
    loadCategories()
  }, [])

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
    async function loadAuth() {
      const { data } = await supabase.auth.getUser()

      setUser(data.user)

      if (data.user) {
        await loadUserRole(data.user.id)
      } else {
        setUserRole(null)
      }
    }

    loadAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadUserRole(session.user.id)
        } else {
          setUserRole(null)
        }
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

  function categoryIsActive(item: CategoryLink) {
    return (
      pathname === '/products' &&
      (item.value ? activeCategory === item.value : !activeCategory)
    )
  }

  return (
    <main className="min-h-dvh bg-[#f4f1ea] text-[#1e1e1e]">
      <header className="sticky top-0 z-40 border-b border-[#d6cec0] bg-white/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center" onClick={closeMenu}>
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-11 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            {dashboardHref && (
              <Link
                href={dashboardHref}
                onClick={closeMenu}
                className="bg-[#244f3d] px-3 py-2 text-sm font-bold text-white"
              >
                Dashboard
              </Link>
            )}

            <Link
              href="/cart"
              onClick={closeMenu}
              className={`relative px-3 py-2 text-sm font-bold ${
                cartActive ? 'bg-[#1b3d2f] text-white' : 'bg-[#244f3d] text-white'
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

        {isProductsPage && (
          <nav className="flex gap-2 overflow-x-auto border-t border-[#eee7da] bg-white px-4 py-3">
            {categories.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 border px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] ${
                  categoryIsActive(item)
                    ? 'border-[#244f3d] bg-[#244f3d] text-white'
                    : 'border-[#d6cec0] bg-[#f4f1ea] text-[#6f675c]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
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
              {dashboardHref && (
                <MobileMenuLink
                  href={dashboardHref}
                  label={dashboardLabel}
                  active={pathname.startsWith(dashboardHref)}
                  onClick={closeMenu}
                />
              )}

              <MobileMenuLink
                href="/products"
                label="Browse Products"
                active={isProductsPage}
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
          </aside>
        </div>
      )}

      <aside className="fixed left-5 top-5 z-40 hidden h-[calc(100dvh-2.5rem)] w-72 flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/45 shadow-2xl backdrop-blur-2xl lg:flex">
        <div className="border-b border-white/60 bg-white/40 p-6">
          <Link href="/" className="inline-flex">
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#244f3d]">
            Wholesale Portal
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6f675c]">
            Browse, build orders, and manage your Local Connect account.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {dashboardHref && (
              <SidebarLink
                href={dashboardHref}
                label={dashboardLabel}
                active={pathname.startsWith(dashboardHref)}
              />
            )}

            <SidebarLink
              href="/products"
              label="Products"
              active={isProductsPage}
            />

            <SidebarLink
              href="/account"
              label="Account"
              active={accountActive}
            />

            <SidebarLink
              href="/order-guide"
              label="Guides"
              active={orderGuideActive}
            />

            <SidebarLink
              href="/cart"
              label={`Cart${cartCount > 0 ? ` (${cartCount})` : ''}`}
              active={cartActive}
            />
          </div>

          {isProductsPage && (
            <div className="mt-7 border-t border-white/60 pt-6">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#244f3d]">
                Categories
              </p>

              <div className="space-y-2">
                {categories.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      categoryIsActive(item)
                        ? 'bg-[#244f3d] text-white shadow-lg'
                        : 'text-[#6f675c] hover:bg-white/70 hover:text-[#244f3d]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/60 bg-white/35 p-5">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-2xl border border-[#d6cec0] bg-white/60 px-4 py-3 text-left text-sm font-bold text-[#6f675c] transition hover:border-[#244f3d] hover:text-[#244f3d]"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="block w-full rounded-2xl border border-[#244f3d] bg-white/60 px-4 py-3 text-sm font-bold text-[#244f3d] transition hover:bg-white"
            >
              Sign In
            </Link>
          )}

          <p className="mt-4 text-xs leading-5 text-[#6f675c]">
            Need something not listed? Contact your Local Connect rep.
          </p>
        </div>
      </aside>

      <section className="min-w-0 lg:pl-[19rem]">{children}</section>
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