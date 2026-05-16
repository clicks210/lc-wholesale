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
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[#1d1d1b]/15 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-10">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-4">
          <img
            src="/images/logo.png"
            alt="Local Connect"
            className="h-14 w-auto object-contain transition duration-300 hover:opacity-80 sm:h-20"
          />
        </Link>

        {/* CTA BUTTON */}
        <Link
          href={loggedIn ? '/products' : '/signup'}
          className="
            inline-flex
            items-center
            justify-center
            border
            border-[#244f3d]
            bg-[#244f3d]
            px-4
            py-2.5
            text-[11px]
            font-black
            uppercase
            tracking-[0.08em]
            text-white
            transition
            hover:bg-transparent
            hover:text-[#244f3d]
            sm:px-5
            sm:py-3
            sm:text-xs
          "
        >
          {loading
            ? 'Loading...'
            : loggedIn
              ? 'Back to Marketplace'
              : 'Buyer Access'}
        </Link>

      </div>
    </header>
  )
}