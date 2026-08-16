'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MarketingPageNav() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setLoggedIn(!!user)
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <header
      className="
        sticky
        top-0
        z-50
        w-full
        border-b
        border-black/10
        bg-white/80
        shadow-[0_6px_24px_rgba(18,32,24,0.07)]
        backdrop-blur-xl
        backdrop-saturate-150
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-[1500px]
          items-center
          justify-between
          px-5
          py-3
          sm:px-8
          lg:px-12
          xl:px-16
        "
      >
        {/* LEFT */}
        <div className="flex items-center gap-8 lg:gap-10">

          {/* LOGO */}
          <Link
            href="/"
            aria-label="Local Connect home"
            className="flex shrink-0 items-center"
          >
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="
                h-11
                w-auto
                object-contain
                transition-opacity
                duration-200
                hover:opacity-75
                sm:h-12
              "
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-8 md:flex">
          
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* SIGN IN */}
          {!loading && !loggedIn && (
            <Link
              href="/login"
              className="
                hidden
                min-h-11
                items-center
                justify-center
                px-3
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.13em]
                text-[#4f5751]
                transition-colors
                duration-200
                hover:text-[#1f5a43]
                sm:inline-flex
              "
            >
              Sign in
            </Link>
          )}

          {/* PRIMARY CTA */}
          <Link
            href={loggedIn ? '/products' : '/signup'}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              border
              border-[#1f5a43]
              bg-[#1f5a43]
              px-4
              text-[10px]
              font-bold
              uppercase
              tracking-[0.13em]
              text-white
              shadow-[0_4px_14px_rgba(31,90,67,0.16)]
              transition-all
              duration-200
              hover:bg-[#174735]
              hover:shadow-[0_7px_20px_rgba(31,90,67,0.22)]
              sm:px-5
              sm:text-[11px]
            "
          >
            {loading
              ? 'Loading...'
              : loggedIn
                ? 'Marketplace'
                : 'Open Account'}
          </Link>
        </div>
      </div>
    </header>
  )
}