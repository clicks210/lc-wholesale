'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const APP_VERSION = 'v1.9.5'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'dashboard' as const,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: 'orders' as const,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: 'products' as const,
  },
  {
    label: '3rd Party Products',
    href: '/admin/producer-products',
    icon: 'marketplace' as const,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: 'categories' as const,
  },
  {
    label: 'Financials',
    href: '/admin/financials',
    icon: 'financials' as const,
  },
  {
    label: 'Traceability',
    href: '/admin/traceability-settings',
    icon: 'traceability' as const,
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: 'customers' as const,
  },
  {
    label: 'Produce Planner',
    href: '/admin/produce-planner',
    icon: 'planner' as const,
  },
  {
    label: 'Order Guides',
    href: '/admin/order-guides',
    icon: 'guides' as const,
  },
  {
    label: 'Email Specials',
    href: '/admin/email-campaigns/new',
    icon: 'email' as const,
  },
]

type NavIcon =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'marketplace'
  | 'categories'
  | 'financials'
  | 'traceability'
  | 'customers'
  | 'planner'
  | 'guides'
  | 'email'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()

    setMobileMenuOpen(false)

    window.location.assign('/login')
  }

  function closeMenu() {
    setMobileMenuOpen(false)
  }

  function isActive(
    href: string
  ) {
    return pathname.startsWith(href)
  }

  return (
    <main className="min-h-dvh bg-[#f2f4f1] pb-20 text-[#171b18] lg:pb-0">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 lg:hidden">

        <div className="border-b border-[#aeb6ae] bg-white/95 backdrop-blur-2xl backdrop-saturate-150">

          <div className="flex h-[62px] items-center justify-between px-4 sm:px-6">

            <Link
              href="/admin/dashboard"
              onClick={closeMenu}
              className="flex min-w-0 items-center"
              aria-label="Local Connect Admin"
            >
              <img
                src="/images/logo.png"
                alt="Local Connect"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2">

              <span
                className="
                  hidden
                  border
                  border-[#aeb6ae]
                  bg-[#f7f8f5]
                  px-2
                  py-1
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  text-[#596159]
                  sm:inline-flex
                "
              >
                {APP_VERSION}
              </span>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                aria-label="Open admin navigation"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  border
                  border-[#aeb6ae]
                  bg-white
                  text-[#1f5a43]
                  transition-colors
                  active:bg-[#edf1ed]
                "
              >
                <MenuIcon />
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
            bg-black/45
            backdrop-blur-[2px]
            lg:hidden
          "
        >

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <aside
            className="
              absolute
              right-0
              top-0
              flex
              h-full
              w-[90%]
              max-w-[390px]
              flex-col
              border-l
              border-[#aeb6ae]
              bg-[#f7f8f5]
              shadow-[-20px_0_55px_rgba(0,0,0,0.16)]
            "
          >

            {/* DRAWER HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[#aeb6ae]
                bg-white
                px-5
                py-5
              "
            >

              <div>

                <p
                  className="
                    text-[9px]
                    font-black
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
                    font-bold
                    text-[#303732]
                  "
                >
                  Admin Operations
                </p>

              </div>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  border
                  border-[#aeb6ae]
                  text-[#596159]
                "
              >
                <CloseIcon />
              </button>

            </div>

            {/* DRAWER NAV */}

            <div className="flex-1 overflow-y-auto">

              <nav>

                {navItems.map(
                  (item) => (
                    <MobileMenuLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      active={isActive(
                        item.href
                      )}
                      onClick={closeMenu}
                    />
                  )
                )}

              </nav>

              <div
                className="
                  border-t
                  border-[#aeb6ae]
                  px-5
                  py-6
                "
              >

                <p
                  className="
                    mb-3
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-[#737b74]
                  "
                >
                  Marketplace
                </p>

                <Link
                  href="/products"
                  onClick={closeMenu}
                  className="
                    flex
                    min-h-12
                    items-center
                    justify-between
                    border
                    border-[#aeb6ae]
                    bg-white
                    px-4
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-[#4f5750]
                    transition-colors
                    hover:border-[#1f5a43]
                    hover:text-[#1f5a43]
                  "
                >
                  <span>
                    View Buyer Site
                  </span>

                  <span>
                    →
                  </span>
                </Link>

              </div>

            </div>

            {/* DRAWER FOOTER */}

            <div
              className="
                border-t
                border-[#aeb6ae]
                bg-white
                px-5
                py-5
              "
            >

              <button
                type="button"
                onClick={handleSignOut}
                className="
                  flex
                  w-full
                  min-h-11
                  items-center
                  justify-between
                  border
                  border-[#aeb6ae]
                  bg-white
                  px-4
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-[#596159]
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

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-between
                  text-[9px]
                  font-semibold
                  text-[#7d857e]
                "
              >
                <span>
                  Admin System
                </span>

                <span>
                  {APP_VERSION}
                </span>
              </div>

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
          w-[270px]
          flex-col
          border-r
          border-[#aeb6ae]
          bg-white
          lg:flex
        "
      >

        {/* BRAND */}

        <div
          className="
            border-b
            border-[#aeb6ae]
            px-6
            pb-6
            pt-7
          "
        >

          <Link
            href="/admin/dashboard"
            className="inline-flex"
          >
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-11 w-auto object-contain"
            />
          </Link>

          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              gap-3
            "
          >

            <div>

              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-[#737b74]
                "
              >
                Admin
              </p>

              <p
                className="
                  mt-1
                  text-[12px]
                  font-bold
                  text-[#303732]
                "
              >
                Wholesale Operations
              </p>

            </div>

            <span
              className="
                border
                border-[#aeb6ae]
                bg-[#f7f8f5]
                px-2
                py-1
                text-[8px]
                font-black
                uppercase
                tracking-[0.06em]
                text-[#596159]
              "
            >
              {APP_VERSION}
            </span>

          </div>

        </div>

        {/* =====================================================
            NAV
        ===================================================== */}

        <nav className="flex-1 overflow-y-auto">

          {navItems.map(
            (item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(
                  item.href
                )}
                icon={item.icon}
              />
            )
          )}

        </nav>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div
          className="
            border-t
            border-[#aeb6ae]
            bg-[#f7f8f5]
            p-5
          "
        >

          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >

            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.18em]
                text-[#737b74]
              "
            >
              System
            </p>

            <span
              className="
                bg-[#dfe9e3]
                px-2
                py-1
                text-[8px]
                font-black
                uppercase
                tracking-[0.06em]
                text-[#1f5a43]
              "
            >
              Stable
            </span>

          </div>

          <Link
            href="/products"
            className="
              flex
              min-h-11
              items-center
              justify-between
              border-b
              border-[#c5cbc5]
              text-[10px]
              font-black
              uppercase
              tracking-[0.1em]
              text-[#596159]
              transition-colors
              hover:text-[#1f5a43]
            "
          >
            <span>
              Buyer Site
            </span>

            <span>
              →
            </span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="
              flex
              min-h-11
              w-full
              items-center
              justify-between
              border-b
              border-[#c5cbc5]
              text-[10px]
              font-black
              uppercase
              tracking-[0.1em]
              text-[#596159]
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

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              text-[9px]
              font-semibold
              text-[#7d857e]
            "
          >
            <span>
              Local Connect
            </span>

            <span>
              {APP_VERSION}
            </span>
          </div>

        </div>

      </aside>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <nav
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-[#aeb6ae]
          bg-white/95
          px-2
          pb-[max(env(safe-area-inset-bottom),0.25rem)]
          pt-1.5
          backdrop-blur-2xl
          lg:hidden
        "
      >

        <div className="mx-auto grid max-w-lg grid-cols-5">

          <MobileBottomNavLink
            href="/admin/dashboard"
            label="Home"
            active={isActive(
              '/admin/dashboard'
            )}
            icon="dashboard"
          />

          <MobileBottomNavLink
            href="/admin/orders"
            label="Orders"
            active={isActive(
              '/admin/orders'
            )}
            icon="orders"
          />

          <MobileBottomNavLink
            href="/admin/products"
            label="Products"
            active={isActive(
              '/admin/products'
            )}
            icon="products"
          />

          <MobileBottomNavLink
            href="/admin/customers"
            label="Customers"
            active={isActive(
              '/admin/customers'
            )}
            icon="customers"
          />

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            className="
              relative
              flex
              min-h-[58px]
              flex-col
              items-center
              justify-center
              gap-1
              text-[8px]
              font-black
              uppercase
              tracking-[0.07em]
              text-[#737b74]
            "
          >
            <div className="flex h-7 w-7 items-center justify-center">
              <MenuIcon />
            </div>

            <span>
              More
            </span>
          </button>

        </div>

      </nav>

      {/* =====================================================
          CONTENT AREA
      ===================================================== */}

      <div className="min-h-dvh lg:pl-[270px]">

        {/* =================================================
            DESKTOP TOP BAR
        ================================================= */}

        <header
          className="
            sticky
            top-0
            z-30
            hidden
            border-b
            border-[#aeb6ae]
            bg-white/95
            backdrop-blur-xl
            lg:block
          "
        >

          <div
            className="
              flex
              h-16
              items-center
              justify-between
              px-6
              xl:px-8
            "
          >

            <div>

              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#1f5a43]
                "
              >
                Wholesale Operations
              </p>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  font-semibold
                  text-[#737b74]
                "
              >
                Internal management portal
              </p>

            </div>

            <div className="flex items-center gap-2">

              <QuickLink
                href="/admin/orders"
                label="Orders"
              />

              <QuickLink
                href="/admin/products"
                label="Products"
              />

              <QuickLink
                href="/admin/producer-products"
                label="3rd Party"
              />

              <span
                className="
                  ml-2
                  border
                  border-[#aeb6ae]
                  bg-[#f7f8f5]
                  px-2.5
                  py-2
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  text-[#596159]
                "
              >
                {APP_VERSION}
              </span>

            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <section
          className="
            min-w-0
            flex-1
          "
        >
          {children}
        </section>

      </div>

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
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon: NavIcon
}) {
  return (
    <Link
      href={href}
      className={`
        relative
        flex
        min-h-[48px]
        items-center
        gap-3
        border-b
        border-[#d7dbd7]
        px-6
        text-[10px]
        font-black
        uppercase
        tracking-[0.1em]
        transition-colors

        ${
          active
            ? 'bg-[#edf2ee] text-[#1f5a43]'
            : 'text-[#596159] hover:bg-[#f7f8f5] hover:text-[#1f5a43]'
        }
      `}
    >

      {active && (
        <span className="absolute bottom-0 left-0 top-0 w-[4px] bg-[#1f5a43]" />
      )}

      <NavIconDisplay
        icon={icon}
      />

      <span className="min-w-0 flex-1">
        {label}
      </span>

      {active && (
        <span className="h-1.5 w-1.5 bg-[#1f5a43]" />
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
      className={`
        relative
        flex
        min-h-14
        items-center
        justify-between
        border-b
        border-[#cfd4cf]
        border-l-[4px]
        px-5
        text-[11px]
        font-black
        uppercase
        tracking-[0.1em]
        transition-colors

        ${
          active
            ? 'border-l-[#1f5a43] bg-[#eaf0ec] text-[#1f5a43]'
            : 'border-l-transparent text-[#4f5750]'
        }
      `}
    >
      <span>
        {label}
      </span>

      {active && (
        <span className="h-1.5 w-1.5 bg-[#1f5a43]" />
      )}
    </Link>
  )
}

/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="
        flex
        min-h-9
        items-center
        border
        border-[#aeb6ae]
        bg-white
        px-3
        text-[9px]
        font-black
        uppercase
        tracking-[0.08em]
        text-[#4f5750]
        transition-colors
        hover:border-[#1f5a43]
        hover:text-[#1f5a43]
      "
    >
      {label}
    </Link>
  )
}

/* =========================================================
   MOBILE BOTTOM NAV
========================================================= */

function MobileBottomNavLink({
  href,
  label,
  active,
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon: NavIcon
}) {
  return (
    <Link
      href={href}
      className={`
        relative
        flex
        min-h-[58px]
        flex-col
        items-center
        justify-center
        gap-1
        text-[8px]
        font-black
        uppercase
        tracking-[0.07em]

        ${
          active
            ? 'text-[#1f5a43]'
            : 'text-[#737b74]'
        }
      `}
    >

      {active && (
        <span className="absolute inset-x-3 top-0 h-[2px] bg-[#1f5a43]" />
      )}

      <div className="flex h-7 w-7 items-center justify-center">
        <NavIconDisplay
          icon={icon}
        />
      </div>

      <span>
        {label}
      </span>

    </Link>
  )
}

/* =========================================================
   NAV ICONS
========================================================= */

function NavIconDisplay({
  icon,
}: {
  icon: NavIcon
}) {
  const path =
    icon === 'dashboard'
      ? 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z'
      : icon === 'orders'
        ? 'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4'
        : icon === 'products'
          ? 'M4 6h16v12H4V6Zm4 0V4h8v2'
          : icon === 'marketplace'
            ? 'M4 8h16M6 8l1-4h10l1 4M6 8v12h12V8M9 12h6'
            : icon === 'categories'
              ? 'M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z'
              : icon === 'financials'
                ? 'M5 19V9M10 19V5M15 19v-7M20 19V3'
                : icon === 'traceability'
                  ? 'M4 12h5l2-6 3 12 2-6h4'
                  : icon === 'customers'
                    ? 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a3 3 0 1 0 0-6M3 20c.8-3.5 2.8-5 6-5s5.2 1.5 6 5m1-6c2.8.2 4.5 1.6 5 4'
                    : icon === 'planner'
                      ? 'M5 4v16M5 8h14M9 4v4M15 4v4M9 12h2M14 12h2M9 16h2M14 16h2'
                      : icon === 'guides'
                        ? 'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4'
                        : 'M4 6h16v12H4V6Zm0 1 8 6 8-6'

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px] shrink-0"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}