'use client'

import Link from 'next/link'
import {
  Suspense,
  useEffect,
  useState,
} from 'react'
import {
  usePathname,
  useSearchParams,
} from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCart } from '@/lib/cart'

type CategoryLink = {
  label: string
  href: string
  value: string | null
}

function BuyerLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)

  const [userRole, setUserRole] =
    useState<string | null>(null)

  const [cartCount, setCartCount] =
    useState(0)

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const [
    categories,
    setCategories,
  ] = useState<CategoryLink[]>([
    {
      label: 'All Products',
      href: '/products',
      value: null,
    },
  ])

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeCategory =
    searchParams.get('category')

  const isProductsPage =
    pathname.startsWith('/products')

  const orderGuideActive =
    pathname.startsWith('/order-guide')

  const accountActive =
    pathname.startsWith('/account')

  const cartActive =
    pathname.startsWith('/cart')

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
        (
          sum: number,
          item: any
        ) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      )
    )
  }

  async function loadCategories() {
    const {
      data,
      error,
    } = await supabase
      .from('product_categories')
      .select('name')
      .order('name', {
        ascending: true,
      })

    if (error) {
      console.error(
        'Error loading categories:',
        error
      )

      return
    }

    setCategories([
      {
        label: 'All Products',
        href: '/products',
        value: null,
      },

      ...(data || []).map(
        (category) => ({
          label: category.name,

          href:
            `/products?category=${encodeURIComponent(
              category.name
            )}`,

          value:
            category.name,
        })
      ),
    ])
  }

  async function loadUserRole(
    userId: string
  ) {
    const {
      data: profile,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    setUserRole(
      profile?.role ?? null
    )
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadCartCount()

    window.addEventListener(
      'cartUpdated',
      loadCartCount
    )

    window.addEventListener(
      'cart-updated',
      loadCartCount
    )

    window.addEventListener(
      'storage',
      loadCartCount
    )

    return () => {
      window.removeEventListener(
        'cartUpdated',
        loadCartCount
      )

      window.removeEventListener(
        'cart-updated',
        loadCartCount
      )

      window.removeEventListener(
        'storage',
        loadCartCount
      )
    }
  }, [])

  useEffect(() => {
    async function loadAuth() {
      const {
        data,
      } =
        await supabase.auth.getUser()

      setUser(data.user)

      if (data.user) {
        await loadUserRole(
          data.user.id
        )
      } else {
        setUserRole(null)
      }
    }

    loadAuth()

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          setUser(
            session?.user ??
              null
          )

          if (
            session?.user
          ) {
            await loadUserRole(
              session.user.id
            )
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

    window.location.assign(
      '/login'
    )
  }

  function closeMenu() {
    setMobileMenuOpen(false)
  }

  function categoryIsActive(
    item: CategoryLink
  ) {
    return (
      pathname === '/products' &&
      (
        item.value
          ? activeCategory ===
            item.value
          : !activeCategory
      )
    )
  }

  return (
    <main className="min-h-dvh bg-[#f4f5f2] pb-20 text-[#171b18] lg:pb-0">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 lg:hidden">
        <div className="border-b border-[#d9ddd8] bg-white/92 backdrop-blur-2xl backdrop-saturate-150">
          <div className="flex h-[62px] items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              onClick={closeMenu}
              className="flex min-w-0 items-center"
              aria-label="Local Connect home"
            >
              <img
                src="/images/logo.png"
                alt="Local Connect"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                onClick={closeMenu}
                className={`relative inline-flex h-10 items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  cartActive
                    ? 'bg-[#FFBE73] text-[#171B18]'
                    : 'bg-[#FFD09A] text-[#171B18] hover:bg-[#FFBE73]'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5h2l1.5 9h9.7l1.3-6H7.1M9.5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>Cart</span>

                {cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center bg-[#171B18] px-1 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation"
                className="flex h-10 w-10 items-center justify-center border border-[#d9ddd8] bg-white text-[#1f5a43] transition-colors active:bg-[#f1f5f2]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <path
                    d="M5 7h14M5 12h14M5 17h14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      {mobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/45 backdrop-blur-[2px]
            lg:hidden
          "
        >

          <button
            type="button"
            aria-label="Close menu"
            className="
              absolute
              inset-0
              h-full
              w-full
              cursor-default
            "
            onClick={
              closeMenu
            }
          />


          <aside
            className="
              absolute
              right-0
              top-0
              flex
              h-full
              w-[88%]
              max-w-[360px]
              flex-col
              border-l
              border-[#cfd2cc]
              bg-[#f8f9f7]
              shadow-[-18px_0_55px_rgba(0,0,0,0.16)]
            "
          >

            {/* MOBILE DRAWER HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[#cfd2cc]
                px-5
                py-5
              "
            >
              <div>

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#1f5a43]
                  "
                >
                  Local Connect
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-[#424a44]
                  "
                >
                  Wholesale
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeMenu
                }
                aria-label="Close navigation"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  border
                  border-[#cfd2cc]
                  text-[#656c66]
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

            </div>


            {/* MOBILE DRAWER NAV */}

            <div className="flex-1 overflow-y-auto">

              <div>

                {dashboardHref && (
                  <MobileMenuLink
                    href={
                      dashboardHref
                    }
                    label={
                      dashboardLabel
                    }
                    active={
                      pathname.startsWith(
                        dashboardHref
                      )
                    }
                    onClick={
                      closeMenu
                    }
                  />
                )}

                <MobileMenuLink
                  href="/products"
                  label="Products"
                  active={
                    isProductsPage
                  }
                  onClick={
                    closeMenu
                  }
                />

                <MobileMenuLink
                  href="/account"
                  label="Account"
                  active={
                    accountActive
                  }
                  onClick={
                    closeMenu
                  }
                />

                <MobileMenuLink
                  href="/order-guide"
                  label="Order Guides"
                  active={
                    orderGuideActive
                  }
                  onClick={
                    closeMenu
                  }
                />

                <MobileMenuLink
                  href="/cart"
                  label="Cart"
                  meta={
                    cartCount > 0
                      ? String(
                          cartCount
                        )
                      : undefined
                  }
                  active={
                    cartActive
                  }
                  onClick={
                    closeMenu
                  }
                />

              </div>


              {/* MOBILE CATEGORIES */}

              {isProductsPage && (
                <div
                  className="
                    border-t
                    border-[#cfd2cc]
                    py-5
                  "
                >

                  <p
                    className="
                      px-5
                      pb-3
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-[#999f9a]
                    "
                  >
                    Categories
                  </p>


                  {categories.map(
                    (item) => {
                      const active =
                        categoryIsActive(
                          item
                        )

                      return (
                        <Link
                          key={
                            item.label
                          }
                          href={
                            item.href
                          }
                          onClick={
                            closeMenu
                          }
                          className={`
                            relative
                            flex
                            min-h-10
                            items-center
                            border-l-[3px]
                            px-[17px]
                            text-[12px]
                            transition-colors

                            ${
                              active
                                ? 'border-[#1f5a43] bg-[#eef3f0] font-semibold text-[#1f5a43]'
                                : 'border-transparent text-[#747b75] hover:bg-white'
                            }
                          `}
                        >
                          {
                            item.label
                          }
                        </Link>
                      )
                    }
                  )}

                </div>
              )}

            </div>


            {/* MOBILE DRAWER FOOTER */}

            <div
              className="
                border-t
                border-[#cfd2cc]
                bg-white/60
                px-5
                py-5
              "
            >

              {user ? (
                <button
                  type="button"
                  onClick={
                    handleSignOut
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    border
                    border-[#cfd2cc]
                    bg-white
                    px-4
                    py-3
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-[#656c66]
                    transition-colors
                    hover:border-[#1f5a43]
                    hover:text-[#1f5a43]
                  "
                >
                  <span>
                    Sign Out
                  </span>

                  <span>
                    →
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={
                    closeMenu
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    bg-[#1f5a43]
                    px-4
                    py-3
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-white
                  "
                >
                  <span>
                    Sign In
                  </span>

                  <span>
                    →
                  </span>
                </Link>
              )}

            </div>

          </aside>
        </div>
      )}


      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          z-40
          hidden
          h-dvh
          w-[260px]
          flex-col
          border-r
          border-[#cfd2cc]
          bg-white/90
          backdrop-blur-xl
          backdrop-saturate-150
          lg:flex
        "
      >

        {/* BRAND */}

        <div
          className="
            border-b
            border-[#cfd2cc]
            px-6
            pb-6
            pt-7
          "
        >

          <Link
            href="/"
            className="inline-flex"
          >
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="
                h-11
                w-auto
                object-contain
              "
            />
          </Link>


          <div
            className="
              mt-5
              flex
              items-center
              justify-between
            "
          >

            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-[#919792]
              "
            >
              Wholesale Portal
            </p>


            <span
              className="
                h-1.5
                w-1.5
                bg-[#1f5a43]
              "
            />

          </div>

        </div>


        {/* PRIMARY NAV */}

        <nav>

          {dashboardHref && (
            <SidebarLink
              href={
                dashboardHref
              }
              label={
                dashboardLabel
              }
              active={
                pathname.startsWith(
                  dashboardHref
                )
              }
            />
          )}

          <SidebarLink
            href="/products"
            label="Products"
            active={
              isProductsPage
            }
          />

          <SidebarLink
            href="/account"
            label="Account"
            active={
              accountActive
            }
          />

          <SidebarLink
            href="/order-guide"
            label="Order Guides"
            active={
              orderGuideActive
            }
          />

          <SidebarLink
            href="/cart"
            label="Cart"
            meta={
              cartCount > 0
                ? String(
                    cartCount
                  )
                : undefined
            }
            active={
              cartActive
            }
          />

        </nav>


        {/* SCROLLABLE AREA */}

        <div className="flex-1 overflow-y-auto">

          {/* CATEGORIES */}

          {isProductsPage && (
            <div
              className="
                border-t
                border-[#cfd2cc]
                pb-6
              "
            >

              <div
                className="
                  px-6
                  pb-3
                  pt-6
                "
              >

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#999f9a]
                  "
                >
                  Categories
                </p>

              </div>


              <div>

                {categories.map(
                  (item) => {
                    const active =
                      categoryIsActive(
                        item
                      )

                    return (
                      <Link
                        key={
                          item.label
                        }
                        href={
                          item.href
                        }
                        className={`
                          relative
                          flex
                          min-h-10
                          items-center
                          border-l-[3px]
                          px-[21px]
                          text-[12px]
                          transition-colors

                          ${
                            active
                              ? 'border-[#1f5a43] bg-[#f1f5f2] font-semibold text-[#1f5a43]'
                              : 'border-transparent text-[#747b75] hover:bg-[#f7f7f4] hover:text-[#1f5a43]'
                          }
                        `}
                      >
                        {
                          item.label
                        }
                      </Link>
                    )
                  }
                )}

              </div>

            </div>
          )}

        </div>


        {/* SIDEBAR FOOTER */}

        <div
          className="
            border-t
            border-[#cfd2cc]
            bg-[#fafaf7]
            p-5
          "
        >

          {user && (
            <div className="mb-4">

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[#a0a5a1]
                "
              >
                Signed in
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  font-medium
                  text-[#616862]
                "
              >
                {
                  user.email
                }
              </p>

            </div>
          )}


          {user ? (
            <button
              type="button"
              onClick={
                handleSignOut
              }
              className="
                flex
                min-h-11
                w-full
                items-center
                justify-between
                border-t
                border-[#d8dad6]
                pt-4
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#727873]
                transition-colors
                hover:text-[#1f5a43]
              "
            >
              <span>
                Sign Out
              </span>

              <span>
                →
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="
                flex
                min-h-11
                w-full
                items-center
                justify-between
                bg-[#1f5a43]
                px-4
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-white
              "
            >
              <span>
                Sign In
              </span>

              <span>
                →
              </span>
            </Link>
          )}


          <p
            className="
              mt-5
              text-[11px]
              leading-5
              text-[#8b918c]
            "
          >
            Need something not listed?
            Ask your Local Connect rep.
          </p>

        </div>

      </aside>


      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9ddd8] bg-white/94 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-2xl backdrop-saturate-150 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <MobileBottomNavLink
            href="/products"
            label="Products"
            active={isProductsPage}
            icon="products"
          />

          <MobileBottomNavLink
            href="/order-guide"
            label="Guides"
            active={orderGuideActive}
            icon="guide"
          />

          <MobileBottomNavLink
            href="/account"
            label="Account"
            active={accountActive}
            icon="account"
          />

          <MobileBottomNavLink
            href="/cart"
            label="Cart"
            active={cartActive}
            icon="cart"
            meta={cartCount > 0 ? String(cartCount) : undefined}
            cart
          />
        </div>
      </nav>


      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <section
        className="
          min-w-0
          lg:pl-[260px]
        "
      >
        {children}
      </section>

    </main>
  )
}


/* =========================================================
   DESKTOP SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  label,
  active,
  meta,
}: {
  href: string
  label: string
  active: boolean
  meta?: string
}) {
  return (
    <Link
      href={href}
      className={`
        relative
        flex
        min-h-12
        items-center
        justify-between
        border-b
        border-[#e1e3de]
        px-6
        text-[11px]
        font-semibold
        uppercase
        tracking-[0.12em]
        transition-colors

        ${
          label === 'Cart'
            ? active
              ? 'bg-[#FFBE73] text-[#6A3B12]'
              : 'bg-[#FFD09A] text-[#6A3B12] hover:bg-[#FFBE73]'
            : active
              ? 'bg-[#f1f5f2] text-[#1f5a43]'
              : 'text-[#555d57] hover:bg-[#f7f7f4] hover:text-[#1f5a43]'
        }
      `}
    >

      {active && (
        <span
          className={`absolute bottom-0 left-0 top-0 w-[3px] ${
            label === 'Cart' ? 'bg-[#D98A3A]' : 'bg-[#1f5a43]'
          }`}
        />
      )}


      <span>
        {label}
      </span>


      {meta && (
        <span
          className={`min-w-5 px-1.5 py-0.5 text-center text-[9px] font-bold tracking-normal text-white ${
            label === 'Cart' ? 'bg-[#171B18]' : 'bg-[#1f5a43]'
          }`}
        >
          {meta}
        </span>
      )}

    </Link>
  )
}


/* =========================================================
   MOBILE MENU LINK
========================================================= */

function MobileMenuLink({
  href,
  label,
  active,
  onClick,
  meta,
}: {
  href: string
  label: string
  active: boolean
  onClick: () => void
  meta?: string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        relative
        flex
        min-h-14
        items-center
        justify-between
        border-b
        border-[#dfe1dc]
        border-l-[3px]
        px-5
        text-[12px]
        font-semibold
        uppercase
        tracking-[0.1em]
        transition-colors

        ${
          label === 'Cart'
            ? active
              ? 'border-l-[#D98A3A] bg-[#FFBE73] text-[#6A3B12]'
              : 'border-l-[#FFBE73] bg-[#FFD09A] text-[#6A3B12]'
            : active
              ? 'border-l-[#1f5a43] bg-[#eef3f0] text-[#1f5a43]'
              : 'border-l-transparent bg-transparent text-[#555d57]'
        }
      `}
    >
      <span>
        {label}
      </span>

      {meta && (
        <span
          className={`px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-white ${
            label === 'Cart' ? 'bg-[#171B18]' : 'bg-[#1f5a43]'
          }`}
        >
          {meta}
        </span>
      )}
    </Link>
  )
}


function MobileBottomNavLink({
  href,
  label,
  active,
  icon,
  meta,
  cart = false,
}: {
  href: string
  label: string
  active: boolean
  icon: 'products' | 'guide' | 'account' | 'cart'
  meta?: string
  cart?: boolean
}) {
  const iconPath =
    icon === 'products'
      ? 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z'
      : icon === 'guide'
        ? 'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4'
        : icon === 'account'
          ? 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.9-3.4 3.2-5 7-5s6.1 1.6 7 5'
          : 'M4 5h2l1.5 9h9.7l1.3-6H7.1M9.5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'

  return (
    <Link
      href={href}
      className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] transition-colors ${
        cart
          ? active
            ? 'bg-[#FFBE73] text-[#171B18]'
            : 'text-[#6A3B12]'
          : active
            ? 'text-[#1f5a43]'
            : 'text-[#7b827c]'
      }`}
    >
      {!cart && active && (
        <span className="absolute inset-x-4 top-0 h-[2px] bg-[#1f5a43]" />
      )}

      <div
        className={`relative flex h-7 w-7 items-center justify-center ${
          cart && !active ? 'bg-[#FFD09A]' : ''
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <path
            d={iconPath}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {meta && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center bg-[#171B18] px-1 text-[8px] font-bold text-white">
            {meta}
          </span>
        )}
      </div>

      <span>{label}</span>
    </Link>
  )
}


/* =========================================================
   EXPORT
========================================================= */

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <BuyerLayoutContent>
        {children}
      </BuyerLayoutContent>
    </Suspense>
  )
}