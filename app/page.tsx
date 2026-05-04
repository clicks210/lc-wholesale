'use client'

import Link from 'next/link'
import Script from 'next/script'

const productLines = [
  {
    name: 'Fresh Produce',
    href: '/products?category=Produce',
    eyebrow: 'BC Farms',
    description:
      'Our produce program is built in partnership with the Kamloops Farmers Market and a network of local farms, giving restaurants access to fresh, seasonal product sourced close to home. We focus on quality and consistency, aggregating supply and handling logistics so kitchens can rely on local produce without the usual friction.',
    items: ['Greens', 'Root veg', 'Fruit', 'Herbs'],
    image: '/images/produce.jpg',
  },
  {
    name: 'Frozen Bakery',
    href: '/products?category=Bread',
    eyebrow: 'Specialty Bakery',
    description:
      'Our frozen bread program features premium products from Specialty Bakery, giving restaurants access to high-quality, artisan bread with the convenience of frozen inventory. Each product is crafted for consistency, easy storage, and bake-off performance so kitchens can serve fresh, great-tasting bread on demand without the waste or unpredictability of daily deliveries.',
    items: ['Buns', 'Loaves', 'Pastries', 'Specialty'],
    image: '/images/bread.jpg',
  },
  {
    name: 'Poultry',
    href: '/products?category=Protein',
    eyebrow: 'Colonial Farms',
    description:
      'Our poultry program features high-quality product from Colonial Farms, with both fresh and frozen options available. We handle sourcing, storage, and delivery to ensure consistent supply and seamless integration into your kitchen.',
    items: ['Fresh', 'Frozen'],
    image: '/images/poultry.jpg',
  },
  {
    name: 'Paper & Janitorial',
    href: '/products?category=Paper',
    eyebrow: 'R3 Distribution',
    description:
      'Our paper and janitorial program offers a full suite of products through R3 Redistribution, covering everything from essential disposables to cleaning supplies. We centralize sourcing and delivery so you can manage these core items alongside your food orders with ease and consistency.',
    items: ['Takeout', 'Gloves', 'Chemicals', 'Paper'],
    image: '/images/paper.jpg',
  },
]

const steps = [
  {
    title: 'Create account',
    text: 'Set up your buyer profile and tell us what your kitchen usually orders.',
  },
  {
    title: 'Browse supply',
    text: 'View available product lines and build a clean weekly order guide.',
  },
  {
    title: 'Submit order',
    text: 'Send everything through one flow instead of chasing sheets and texts.',
  },
  {
    title: 'We coordinate',
    text: 'Your dedicated account representative handles supplier coordination, delivery planning, and communication.',
  },
]

const emergencyItems = [
  'Paper products',
  'Dairy essentials',
  'Eggs',
  'Core produce',
  'Kitchen staples',
  'Select urgent items',
]

export default function WholesaleLandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d1d1b]">
      {/* TOP BAR / LOGO */}
      <header className="border-b border-[#1d1d1b]/25 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-4">
            <img
              src="/images/logo.png"
              alt="Local Connect"
              className="h-14 w-auto object-contain sm:h-20"
            />
          </Link>

          <Link
            href="/signup"
            className="inline-flex border border-[#244f3d] bg-[#244f3d] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-transparent hover:text-[#244f3d] sm:px-5 sm:py-3 sm:text-xs"
          >
            Buyer access
          </Link>
        </div>
      </header>

      <Script
        src="https://clickbooks-app-production.up.railway.app/embed.js"
        strategy="afterInteractive"
        data-slug="local-connect-91b5d7"
        data-label="Get Set Up"
        data-position="right"
        data-color="#244f3d"
        data-icon="none"
      />

      {/* HERO */}
<section className="relative min-h-[82vh] overflow-hidden border-b border-[#1d1d1b]/25 sm:min-h-[90vh]">
  {/* Mobile clean fallback image */}
  <img
    src="/images/hero-mobile.jpg"
    alt="Local Connect wholesale"
    className="absolute inset-0 h-full w-full object-cover sm:hidden"
  />

  {/* Desktop video */}
  <iframe
    src="https://www.youtube.com/embed/NMhskDzU4hI?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=NMhskDzU4hI"
    title="Local Connect supplier video"
    className="pointer-events-none absolute inset-0 hidden h-full w-full scale-125 object-cover opacity-60 sm:block"
    allow="autoplay; encrypted-media; picture-in-picture"
  />

  <div className="absolute inset-0 bg-[#1d1d1b]/50 sm:bg-[#1d1d1b]/35" />
  <div className="absolute inset-0 bg-gradient-to-b from-[#1d1d1b]/45 via-[#1d1d1b]/20 to-[#1d1d1b]" />

  <div className="relative z-10 mx-auto flex min-h-[82vh] max-w-7xl items-center px-4 py-14 sm:min-h-[90vh] sm:px-6 sm:py-20 lg:px-10">
    <div className="max-w-3xl text-white">
      <div className="mb-5 inline-flex border border-white/40 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] backdrop-blur sm:mb-6 sm:px-5 sm:text-xs">
        Wholesale marketplace
      </div>

      <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:text-8xl">
        Premium Food-Service Distribution.
      </h1>

      <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
        Local Connect provides your restaurant with affordable staples and top-quality local food through one reliable wholesale system.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
        <Link
          href="/signup"
          className="border border-white bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-[#1d1d1b] transition hover:bg-transparent hover:text-white sm:px-7"
        >
          Request access
        </Link>

        <Link
          href="/products"
          className="border border-white/60 bg-black/20 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white backdrop-blur transition hover:bg-white hover:text-[#1d1d1b] sm:px-7"
        >
          Browse marketplace
        </Link>
      </div>
    </div>
  </div>
</section>

      {/* STORY / TRUST */}
      <section className="border-b border-[#1d1d1b]/25">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-10">
          <div className="border border-[#1d1d1b]/30 bg-white p-2 sm:p-3">
            <div className="relative min-h-[260px] overflow-hidden border border-[#1d1d1b]/20 sm:min-h-[380px] md:min-h-[460px]">
              <img
                src="/images/lc-story.jpg"
                alt="Local Connect working with suppliers"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
            </div>
          </div>

          <div className="flex items-center">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f3d]">
                Why Local Connect
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Built by chefs, for chefs.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#4b4b45] sm:text-lg sm:leading-8">
                Local Connect was built inside kitchens to solve a simple problem: great local products weren’t reaching restaurants easily. We bring local produce, poultry, bread, paper, and janitorial products into one reliable, centralized wholesale system.
              </p>
              <p className="mt-4 text-base leading-7 text-[#4b4b45] sm:text-lg sm:leading-8">
                We source directly, warehouse, and deliver ourselves, making buying local as seamless and dependable as traditional distribution while strengthening the local food system.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/signup"
                  className="border border-[#1d1d1b] bg-[#1d1d1b] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#244f3d]"
                >
                  Request access
                </Link>
                <Link
                  href="/products"
                  className="border border-[#1d1d1b] bg-transparent px-6 py-4 text-center text-sm font-black uppercase tracking-[0.08em] transition hover:bg-[#1d1d1b] hover:text-white"
                >
                  View products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT LINES */}
      <section className="bg-white text-[#1d1d1b]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f3d]">
              Product lines
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Four core categories. One clean wholesale system.
            </h2>
          </div>
        </div>

        <div className="border-t border-[#1d1d1b]/20">
          {productLines.map((line, index) => {
            const imageFirst = index % 2 === 0

            return (
              <section key={line.name} className="border-b border-[#1d1d1b]/20">
                <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-0 lg:px-10 lg:py-20">
                  <div
                    className={`${
                      imageFirst ? 'lg:order-1' : 'lg:order-2'
                    } border border-[#1d1d1b]/30 bg-white p-2 sm:p-3`}
                  >
                    <div className="relative min-h-[250px] overflow-hidden border border-[#1d1d1b]/20 bg-[#2a2a26] sm:min-h-[340px] md:min-h-[460px]">
                      <img
                        src={line.image}
                        alt={line.name}
                        className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                    </div>
                  </div>

                  <div
                    className={`${
                      imageFirst ? 'lg:order-2' : 'lg:order-1'
                    } flex items-center border border-[#1d1d1b]/30 bg-[#244f3d] p-6 text-white sm:p-8 lg:p-12`}
                  >
                    <div className="max-w-xl">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">
                        {line.eyebrow}
                      </p>
                      <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl">
                        {line.name}
                      </h3>
                      <p className="mt-5 text-base leading-7 text-white/82 sm:mt-6 sm:text-lg sm:leading-8">
                        {line.description}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2 sm:mt-7">
                        {line.items.map((item) => (
                          <span
                            key={item}
                            className="border border-white/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-white/80 sm:text-xs"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={line.href}
                        className="mt-8 inline-flex w-full justify-center border border-white bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#1d1d1b] transition hover:bg-transparent hover:text-white sm:mt-9 sm:w-auto"
                      >
                        Browse {line.name}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </section>

      {/* PAPER CREDIT PROGRAM */}
   <section className="border-b border-[#1d1d1b]/25 bg-[#f4f1ea] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
  <div className="mx-auto max-w-5xl text-center">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f3d]">
      Paper products rebate
    </p>

    <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-5xl md:text-6xl">
      Turn paper into profit.
    </h2>

    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#4b4b45] sm:text-lg sm:leading-8">
      Buy paper, takeout, and janitorial products through Local Connect and earn monthly LC Credit toward future food orders.
    </p>

    <div className="mx-auto mt-8 max-w-xl border border-[#1d1d1b] bg-white p-5 shadow-[7px_7px_0_#244f3d]">
      <div className="grid gap-3 text-left sm:grid-cols-3 sm:text-center">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            Spend
          </p>
          <p className="mt-1 text-3xl font-black">$1,200</p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            Earn
          </p>
          <p className="mt-1 text-3xl font-black text-[#244f3d]">$60</p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#6f675c]">
            Use On
          </p>
          <p className="mt-2 text-sm font-black leading-5">
            Produce, bread, dairy, poultry.
          </p>
        </div>
      </div>
    </div>

    <Link
      href="/products?category=Paper"
      className="mt-8 inline-flex justify-center border border-[#244f3d] bg-[#244f3d] px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#1d1d1b]"
    >
      Get paid for paper →
    </Link>

 
  </div>
</section>   

   {/* LOCAL CONNECT 911 */}
<section className="border-b border-[#1d1d1b]/25 bg-[#244f3d] px-4 py-14 text-center text-white sm:px-6 sm:py-20 lg:px-10">
  <div className="mx-auto max-w-4xl">
    <p className="inline-flex border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
      Emergency delivery
    </p>

    <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-5xl md:text-7xl">
      Local Connect 911
    </h2>

    <p className="mx-auto mt-5 max-w-2xl text-xl font-black leading-tight tracking-[-0.03em] sm:text-2xl">
      Ran out mid-service? Call us.
    </p>

    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
      Emergency support for missed orders, slammed weekends, and essential products that didn’t show up.
    </p>


   <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
     <a
  href="#"
  data-open-clickbooks
  data-service="911-order"
  className="border border-[#b4472c] bg-[#b4472c] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-transparent hover:text-[#b4472c]"
>
  Call LC 911
</a>

      <Link
        href="/products"
        className="border border-white/40 bg-transparent px-7 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-[#244f3d]"
      >
        Browse essentials
      </Link>
    </div>
  </div>
</section>

      {/* HOW IT WORKS */}
<section className="border-b border-[#1d1d1b]/25 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f3d]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
              From scattered sourcing to one clean order flow.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4b45] sm:text-lg sm:leading-8">
              We’re not just a tech platform. We’re a hands-on partner in your business, with real people helping you source, order, warehouse, and receive the products your kitchen depends on.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="border border-[#1d1d1b] bg-[#fffaf1] p-5 sm:p-6"
              >
                <div className="mb-6 text-sm font-black text-[#244f3d] sm:mb-8">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-black tracking-[-0.03em] sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5f57] sm:mt-4 sm:text-base sm:leading-7">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl border border-[#1d1d1b] bg-[#244f3d] p-6 text-white shadow-[7px_7px_0_#1d1d1b] sm:p-8 sm:shadow-[12px_12px_0_#1d1d1b] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
                Buyer access
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Start ordering smarter.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                Get access to the Local Connect wholesale marketplace and build your first order guide with support from a dedicated account representative.
              </p>
            </div>
            <Link
              href="/signup"
              className="border border-white bg-white px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-[#1d1d1b] transition hover:bg-transparent hover:text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1d1d1b]/25 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 text-center sm:text-left md:grid-cols-3 md:gap-12">
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em]">
              Contact
            </h3>
            <p className="text-sm text-[#5f5f57]">Local Connect Wholesale</p>
            <p className="mt-2 text-sm text-[#5f5f57]">Kamloops, BC</p>
            <p className="mt-2 text-sm text-[#5f5f57]">liam@localconnect.ca</p>
          </div>

          <div>
  <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em]">
  <span className="border-b-2 border-[#244f3d] pb-1">
    Our Mission
  </span>
</h3>

  <p className="text-sm leading-6 text-[#5f5f57]">
    Supporting Canadian foodservice by connecting kitchens directly with local producers and suppliers.
  </p>

  <p className="mt-3 text-sm font-bold leading-6 text-[#244f3d]">
    Driving stronger local supply chains.
  </p>
</div>

          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em]">
              Suppliers
            </h3>
            <div className="grid gap-2 text-sm text-[#5f5f57]">
              <p>Local Farms</p>
              <p>Specialty Bakery</p>
              <p>Colonial Farms</p>
              <p>R3 Redistribution</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#1d1d1b]/10 pt-6 text-center text-xs text-[#7a7a72] sm:mt-12">
          © {new Date().getFullYear()} Local Connect. All rights reserved.
        </div>
      </footer>
    </main>
  )
}