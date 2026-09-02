'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const APP_VERSION = 'v1.9.5'

const navItems = [
  {
    label: 'Products',
    href: '/producer/products',
    icon: 'products' as const,
  },
  {
    label: 'Delivery',
    href: '/producer/delivery',
    icon: 'delivery' as const,
  },
  {
    label: 'Orders',
    href: '/producer/orders',
    icon: 'orders' as const,
  },
  {
    label: 'Account',
    href: '/producer/account',
    icon: 'account' as const,
  },
]

type NavIcon =
  | 'products'
  | 'delivery'
  | 'orders'
  | 'account'

export default function ProducerLayout({
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

              {/* BUYER SITE */}

              <Link
                href="/products"
                onClick={closeMenu}
                className="
                  hidden
                  h-10
                  items-center
                  border
                  border-[#d9ddd8]
                  bg-white
                  px-3
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-[#1f5a43]
                  sm:flex
                "
              >
                Buyer Site
              </Link>

              {/* MENU */}

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
                aria-label="Open navigation"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  border
                  border-[#d9ddd8]
                  bg-white
                  text-[#1f5a43]
                  transition-colors
                  active:bg-[#f1f5f2]
                "
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
            bg-black/45
            backdrop-blur-[2px]
            lg:hidden
          "
        >

          {/* BACKDROP */}

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
            onClick={closeMenu}
          />

          {/* DRAWER */}

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

            {/* DRAWER HEADER */}

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
                  Producer Portal
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

            {/* DRAWER NAV */}

            <div className="flex-1 overflow-y-auto">

              <div>

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

              </div>

              {/* PRODUCER TOOLS */}

              <div
                className="
                  border-t
                  border-[#cfd2cc]
                  px-5
                  py-6
                "
              >

                <p
                  className="
                    mb-3
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#999f9a]
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
                    border-[#cfd2cc]
                    bg-white
                    px-4
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-[#555d57]
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
                border-[#cfd2cc]
                bg-white/60
                px-5
                py-5
              "
            >

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

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-between
                  text-[10px]
                  text-[#929894]
                "
              >
                <span>
                  Producer Portal
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
              Producer Portal
            </p>

            <span className="h-1.5 w-1.5 bg-[#1f5a43]" />

          </div>

        </div>

        {/* =====================================================
            PRIMARY NAV
        ===================================================== */}

        <nav>

          {navItems.map(
            (item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(
                  item.href
                )}
              />
            )
          )}

        </nav>

        {/* =====================================================
            SCROLLABLE CONTENT
        ===================================================== */}

        <div className="flex-1 overflow-y-auto">

          {/* BETA NOTICE */}

          <div
            className="
              border-t
              border-[#cfd2cc]
              px-6
              py-6
            "
          >

            <div
              className="
                border
                border-[#e5c89e]
                bg-[#fff1df]
                p-4
              "
            >

              <div className="flex items-center justify-between gap-3">

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-[#875521]
                  "
                >
                  Beta
                </p>

                <span
                  className="
                    bg-[#f4c983]
                    px-2
                    py-1
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-[#704310]
                  "
                >
                  {APP_VERSION}
                </span>

              </div>

              <p
                className="
                  mt-3
                  text-[11px]
                  leading-5
                  text-[#735b42]
                "
              >
                The producer portal is currently in beta. Please contact Local Connect if you run into any issues.
              </p>

              <div className="mt-3 space-y-1">

                <a
                  href="tel:17782207817"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    text-[#754512]
                    underline
                    underline-offset-2
                  "
                >
                  (778) 220-7817
                </a>

                <a
                  href="mailto:lmilovick@gmail.com"
                  className="
                    block
                    truncate
                    text-[10px]
                    font-semibold
                    text-[#754512]
                    underline
                    underline-offset-2
                  "
                >
                  lmilovick@gmail.com
                </a>

              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            SIDEBAR FOOTER
        ===================================================== */}

        <div
          className="
            border-t
            border-[#cfd2cc]
            bg-[#fafaf7]
            p-5
          "
        >

          <Link
            href="/products"
            className="
              flex
              min-h-11
              w-full
              items-center
              justify-between
              border-b
              border-[#d8dad6]
              pb-4
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
              border-[#d8dad6]
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

          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              text-[10px]
              text-[#8b918c]
            "
          >
            <span>
              Marketplace Tools
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
          border-[#d9ddd8]
          bg-white/94
          px-2
          pb-[max(env(safe-area-inset-bottom),0.25rem)]
          pt-1.5
          backdrop-blur-2xl
          backdrop-saturate-150
          lg:hidden
        "
      >

        <div className="mx-auto grid max-w-md grid-cols-4">

          {navItems.map(
            (item) => (
              <MobileBottomNavLink
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
}: {
  href: string
  label: string
  active: boolean
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
          active
            ? 'bg-[#f1f5f2] text-[#1f5a43]'
            : 'text-[#555d57] hover:bg-[#f7f7f4] hover:text-[#1f5a43]'
        }
      `}
    >

      {active && (
        <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#1f5a43]" />
      )}

      <span>
        {label}
      </span>

      {active && (
        <span
          className="
            h-1.5
            w-1.5
            bg-[#1f5a43]
          "
        />
      )}

    </Link>
  )
}

/* =========================================================
   MOBILE DRAWER LINK
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
        border-[#dfe1dc]
        border-l-[3px]
        px-5
        text-[12px]
        font-semibold
        uppercase
        tracking-[0.1em]
        transition-colors

        ${
          active
            ? 'border-l-[#1f5a43] bg-[#eef3f0] text-[#1f5a43]'
            : 'border-l-transparent bg-transparent text-[#555d57]'
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
  const iconPath =
    icon === 'products'
      ? 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z'
      : icon === 'delivery'
        ? 'M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'
        : icon === 'orders'
          ? 'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4'
          : 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.9-3.4 3.2-5 7-5s6.1 1.6 7 5'

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
        text-[9px]
        font-bold
        uppercase
        tracking-[0.08em]
        transition-colors

        ${
          active
            ? 'text-[#1f5a43]'
            : 'text-[#7b827c]'
        }
      `}
    >

      {active && (
        <span className="absolute inset-x-4 top-0 h-[2px] bg-[#1f5a43]" />
      )}

      <div
        className="
          relative
          flex
          h-7
          w-7
          items-center
          justify-center
        "
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

      </div>

      <span>
        {label}
      </span>

    </Link>
  )
}