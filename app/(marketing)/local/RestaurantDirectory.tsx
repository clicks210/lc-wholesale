'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Restaurant = {
  id: string
  name: string
  slug: string
  location: string
  initials: string
  logoUrl: string | null
  description: string
}

/*
 * Paige's social links
 *
 * Replace these with her actual URLs.
 * Leave as null if you don't want one displayed yet.
 */
const PAIGE_INSTAGRAM_URL =
  'https://www.instagram.com/paiggecreates/'

const PAIGE_FACEBOOK_URL =
  'https://www.facebook.com/profile.php?id=61554202616993#'

export default function RestaurantDirectory({
  restaurants,
}: {
  restaurants: Restaurant[]
}) {
  const [search, setSearch] = useState('')

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return restaurants

    return restaurants.filter((restaurant) =>
      `${restaurant.name} ${restaurant.location}`
        .toLowerCase()
        .includes(query)
    )
  }, [restaurants, search])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e9e1d4] text-[#183f30]">
      {/* Paige top floral artwork */}
      <img
        src="/images/Paige-Top-Vector.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply"
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col bg-transparent px-4 pb-[30rem] pt-40 sm:px-6 sm:pb-[34rem] sm:pt-48 md:px-16 md:pt-56 lg:px-24 lg:pt-64">
        {/* Header */}
        <header className="relative z-20 mx-auto w-full max-w-4xl text-center">
          <div className="relative mx-auto h-[305px] w-full overflow-hidden sm:h-[365px] md:h-[420px] lg:h-[465px]">
            <img
              src="/images/tree-vector.png"
              alt="Local Connect"
              className="absolute left-1/2 top-0 w-[620px] max-w-none -translate-x-1/2 sm:w-[760px] md:w-[860px] lg:w-[980px]"
            />
          </div>

          <p className="mt-3 text-xs font-black uppercase tracking-[0.30em] text-[#244f3d] sm:mt-4">
            Local Connect
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#183f30] sm:mt-4 sm:text-5xl md:text-6xl lg:text-7xl">
            Where are you dining?
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5e5b50] sm:text-lg sm:leading-8">
            Discover the local producers and products supplied to restaurants
            in your community.
          </p>
        </header>

        {/* Search */}
        <div className="mx-auto mt-10 w-full max-w-3xl sm:mt-12">
          <label className="relative block">
            <span className="sr-only">Search restaurants</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 text-[#8a7140]"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurants..."
              className="w-full rounded-[30px] border border-[#bca980] bg-[#fdf8ef] py-6 pl-16 pr-6 font-serif text-lg text-[#2b2b27] shadow-[0_10px_30px_rgba(84,65,28,.14)] outline-none transition placeholder:text-[#8a877e] focus:border-[#244f3d] focus:ring-4 focus:ring-[#244f3d]/10 sm:text-xl"
            />
          </label>
        </div>

        {/* Restaurants heading */}
        <div className="mt-12 text-center">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-[#244f3d]">
            Our Restaurants
          </p>

          <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-3 text-[#9b7a40]">
            <span className="h-px flex-1 bg-[#b29d74]" />
            <span className="text-lg">✿</span>
            <span className="h-px flex-1 bg-[#b29d74]" />
          </div>
        </div>

        {/* Restaurant cards */}
        <div className="mt-7 grid gap-5">
          {filteredRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/local/${restaurant.slug}`}
              className="group relative overflow-hidden border border-[#cdbb95] bg-[#f9f2e6] px-5 py-5 shadow-[0_12px_32px_rgba(72,56,20,.12)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(72,56,20,.18)] sm:px-7"
              style={{
                clipPath:
                  'polygon(0.5% 3%, 5% 1%, 10% 2%, 16% 1%, 23% 2%, 31% 1%, 40% 2%, 50% 1%, 61% 2%, 70% 1%, 80% 2%, 90% 1%, 99.5% 3%, 100% 97%, 94% 99%, 85% 98%, 75% 99%, 64% 98%, 52% 99%, 41% 98%, 30% 99%, 18% 98%, 8% 99%, 0% 97%)',
              }}
            >
              <div className="grid items-center gap-5 sm:grid-cols-[96px_1fr_auto]">
                {/* Restaurant logo */}
                <div className="mx-auto sm:mx-0">
                  {restaurant.logoUrl ? (
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#9a7a3e] bg-[#fdf8ef] p-2 shadow-[0_6px_18px_rgba(72,56,20,.14)]">
                      <img
                        src={restaurant.logoUrl}
                        alt={`${restaurant.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#9a7a3e] bg-[#fdf8ef] font-serif text-2xl font-bold text-[#244f3d] shadow-inner">
                      {restaurant.initials}
                    </div>
                  )}
                </div>

                {/* Restaurant info */}
                <div className="text-center sm:text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2b6a52]">
                    {restaurant.location}
                  </p>

                  <h2 className="mt-1 font-serif text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#183f30]">
                    {restaurant.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#5e5b50] sm:text-base">
                    {restaurant.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="justify-self-center border-b border-[#2f7a5d] pb-1 font-serif text-base font-semibold italic text-[#2f6a53] sm:justify-self-end">
                  View suppliers

                  <span className="ml-2 inline-block not-italic transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* No results */}
          {filteredRestaurants.length === 0 && (
            <div className="border border-[#cdbb95] bg-[#f9f2e6] p-8 text-center shadow-[0_12px_32px_rgba(72,56,20,.12)]">
              <p className="font-serif text-2xl font-semibold">
                No restaurants found.
              </p>

              <p className="mt-2 text-[#5e5b50]">
                Try searching by restaurant name or city.
              </p>
            </div>
          )}
        </div>

        {/* Local thank you */}
        <footer className="mt-14 text-center">
          <p className="font-serif text-xl italic text-[#4c4a42]">
            Thank you for supporting local.
          </p>
        </footer>

        {/* Artist section */}
        <section className="relative z-10 mx-auto mt-16 w-full max-w-3xl px-2 text-center sm:px-6">
          <div className="mx-auto mb-7 flex max-w-md items-center gap-4 text-[#9b7a40]">
            <span className="h-px flex-1 bg-[#b29d74]" />
            <span className="text-lg">✿</span>
            <span className="h-px flex-1 bg-[#b29d74]" />
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#244f3d]">
            Illustrated by
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-[#183f30] sm:text-4xl">
            Paige Creates
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5e5b50] sm:text-base">
            When I first saw Liam’s original tree logo, I felt there was a need to incorporate colourful fruit and vegetables to better represent Local Connect. The greenery and natural colours create a calming effect while reflecting vitality of nature and the life found within the vegetables being represented in my digital artwork. 
          </p>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5e5b50] sm:text-base">
            The pink flowers symbolize the arrival of spring, a time when we recognize that fruits and vegetables are ready to be grown and harvested from the heart of our land. Together, these elements represent growth, nourishment, connection, and the natural cycles of the land, while also creating a welcoming and vibrant visual identity for Local Connect. 
          </p>

           <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5e5b50] sm:text-base">
            Overall, I aim to continue creating nature and culture focused artwork that connects with our local community. 
          </p>

          {/* Artist signature spot */}
          <div className="mx-auto mt-8 flex min-h-[90px] max-w-sm items-center justify-center">
            {/*
              SIGNATURE:

              When you have Paige's transparent signature PNG,
              replace the placeholder below with:

              <img
                src="/images/Paige-Signature.png"
                alt="Paige's signature"
                className="max-h-20 w-auto max-w-[240px] object-contain mix-blend-multiply"
              />
            */}

            <img
              src="/images/Paige-Signature.png"
              alt="Paige's signature"
              className="max-h-32 w-auto max-w-[360px] object-contain mix-blend-multiply"
            />
          </div>

          {/* Artist socials */}
          {(PAIGE_INSTAGRAM_URL || PAIGE_FACEBOOK_URL) && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {/* Instagram */}
              {PAIGE_INSTAGRAM_URL && (
                <a
                  href={PAIGE_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Paige on Instagram"
                  title="Instagram"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2f6a53] bg-[#f9f2e6] text-[#2f6a53] shadow-[0_5px_14px_rgba(72,56,20,.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e8ede6]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="5"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                    />
                    <circle
                      cx="17.3"
                      cy="6.7"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </a>
              )}

              {/* Facebook */}
              {PAIGE_FACEBOOK_URL && (
                <a
                  href={PAIGE_FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Paige on Facebook"
                  title="Facebook"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2f6a53] bg-[#f9f2e6] text-[#2f6a53] shadow-[0_5px_14px_rgba(72,56,20,.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e8ede6]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M13.8 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.4v1.8H7.3V13h2.8v8h3.7Z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          <p className="mx-auto mt-5 max-w-md text-xs leading-6 text-[#777166]">
            Original artwork created for Local Connect.
          </p>

          <div className="mx-auto mt-8 h-px max-w-md bg-[#b29d74]" />
        </section>
      </section>

      {/* Paige bottom floral artwork */}
      <img
        src="/images/Paige-Bottom-Vector (1).png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply"
      />
    </main>
  )
}