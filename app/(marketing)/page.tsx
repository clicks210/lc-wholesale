import Image from 'next/image'
import Link from 'next/link'

const productLines = [
  {
    name: 'Fresh Produce',
    href: '/products?category=Produce',
    eyebrow: 'BC Farms + Regional Supply',
    description:
      'Seasonal BC produce alongside dependable regional staples, consolidated into the same order your kitchen already places.',
    items: ['Seasonal produce', 'Potatoes', 'Greens', 'Fruit'],
    image: '/images/produce.jpg',
  },
  {
    name: 'Beef',
    href: '/products?category=Beef',
    eyebrow: 'Rainier Custom Cutting + Commodity',
    description:
      'Premium local cutting through Rainier Custom Cutting backed by commodity beef programs for the volume, consistency and price points your menu needs.',
    items: ['Loins', 'Cut steaks', 'Brisket', 'Ground beef'],
    image: '/images/beef.jpg',
  },
  {
    name: 'Pork',
    href: '/products?category=Pork',
    eyebrow: 'Maple Leaf · Fribin · Britco',
    description:
      'A flexible pork program spanning Canadian staples and imported options, built around the cuts kitchens actually move.',
    items: ['Shoulder', 'Belly', 'Bacon', 'Ribs'],
    image: '/images/pork.jpg',
  },
  {
    name: 'Poultry',
    href: '/products?category=Poultry',
    eyebrow: 'Colonial Farms',
    description:
      'Fresh and frozen poultry for everyday foodservice, from whole birds and commodity cuts to convenient IQF formats.',
    items: ['Fresh chicken', 'IQF breasts', 'Thighs', 'Wings'],
    image: '/images/poultry.jpg',
  },
  {
    name: 'Seafood',
    href: '/products?category=Seafood',
    eyebrow: 'Authentic Indigenous Seafood',
    description:
      'Distinctive Canadian seafood sourced through Authentic Indigenous Seafood, bringing exceptional products and producer stories directly to local menus.',
    items: ['Arctic char', 'Arctic turbot', 'Chinook salmon'],
    image: '/images/seafood.jpg',
  },
  {
    name: 'Bakery',
    href: '/products?category=Bread',
    eyebrow: 'Specialty Bakery',
    description:
      'Premium frozen bakery built for restaurant service: dependable inventory, easy handling and products that still feel at home on a thoughtful menu.',
    items: ['Brioche buns', 'Sub buns', 'Loaves', 'Specialty'],
    image: '/images/bread.jpg',
  },
]

const steps = [
  {
    number: '01',
    title: 'Open your account',
    text: 'Tell us about your kitchen, delivery location and the products you buy.',
  },
  {
    number: '02',
    title: 'Build your order',
    text: 'Shop across local suppliers, regional partners and core foodservice products.',
  },
  {
    number: '03',
    title: 'Submit once',
    text: 'One clean order flow replaces scattered texts, spreadsheets and supplier portals.',
  },
  {
    number: '04',
    title: 'We handle the rest',
    text: 'Local Connect coordinates supply, communication and last mile so your team can stay focused on service.',
  },
]

const partners = [
  { name: 'Noble Pig', logo: '/images/partners/noble-pig.png' },
  { name: 'Swelaps Market', logo: '/images/partners/swelaps.png' },
  { name: 'Bright Eye Brewing', logo: '/images/partners/bright-eye.png' },
  { name: 'Valhalla Smokehouse', logo: '/images/partners/valhalla.png' },
  { name: 'Table 125', logo: '/images/partners/table-125.png' },
  { name: 'TRU / Aramark', logo: '/images/partners/aramark.png' },
]

export default function WholesaleLandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#171b18]">
      {/* HERO */}
      <section className="relative -mt-px min-h-[calc(100svh-0px)] overflow-hidden bg-black text-white">
        <iframe
          src="https://www.youtube.com/embed/NMhskDzU4hI?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=NMhskDzU4hI&playsinline=1&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1"
          title="Local Connect foodservice"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.18] sm:scale-110 lg:scale-100"
          allow="autoplay; encrypted-media; picture-in-picture"
        />

        {/* Neutral contrast only — preserve the colour in the footage */}
        <div className="absolute inset-0 bg-black/24 sm:bg-black/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/66 via-black/24 to-transparent sm:from-black/58 sm:via-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/42 via-black/14 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] items-end px-5 pb-20 pt-24 sm:px-10 sm:pb-28 lg:px-12 xl:px-16">
          <div className="max-w-[720px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/62">
              Local Connect Foodservice
            </p>

            <h1 className="mt-4 text-[46px] font-semibold leading-[0.94] tracking-[-0.055em] sm:mt-5 sm:text-[72px] lg:text-[88px]">
              Heard, Chef.
            </h1>

            <p className="mt-5 max-w-[560px] text-[16px] leading-6 text-white/82 sm:mt-6 sm:text-[18px] sm:leading-7">
              The products you want to serve.
              <span className="text-white/58"> One order. One delivery. A team that answers.</span>
            </p>

            <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-row sm:gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center bg-white px-4 text-center text-[10px] font-bold uppercase tracking-[0.09em] text-[#171b18] transition-colors hover:bg-[#ecece8] sm:px-6 sm:text-[12px] sm:tracking-[0.1em]"
              >
                Open account
              </Link>

              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center border border-white/70 px-4 text-center text-[10px] font-bold uppercase tracking-[0.09em] text-white transition-colors hover:bg-white hover:text-[#171b18] sm:px-6 sm:text-[12px] sm:tracking-[0.1em]"
              >
                Browse products →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RELATIONSHIP */}
      <section className="bg-[#f4f5f2] px-2.5 py-2.5 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
        <div className="relative mx-auto min-h-[72svh] max-w-[1500px] overflow-hidden border border-white bg-black text-white shadow-[0_0_0_1px_rgba(23,27,24,0.08)] sm:min-h-[84vh]">
          <Image
            src="/images/relationship.jpg"
            alt="Local Connect working alongside restaurant and foodservice partners"
            fill
            className="object-cover"
            sizes="100vw"
          />

          {/* Local contrast only — this section should read as a framed photograph */}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/12 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/34 to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[72svh] items-end px-5 pb-10 pt-20 sm:min-h-[84vh] sm:px-10 sm:pb-16 lg:px-12 xl:px-16">
            <div className="max-w-[690px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/58">
                Why Local Connect
              </p>

              <h2 className="mt-4 text-[36px] font-semibold leading-[0.98] tracking-[-0.05em] sm:mt-5 sm:text-5xl lg:text-6xl">
                Foodservice is a
                <br />
                relationship business.
              </h2>

              <p className="mt-5 max-w-xl text-[14px] leading-6 text-white/78 sm:mt-6 sm:text-[16px] sm:leading-7">
                Need something? Ask us. Can’t get it? We’ll find it. Supplier
                issue? We’ll help solve it. Local Connect is built to act like
                part of your operation, not another vendor portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="border-b border-[#bfc2bc] bg-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="px-5 py-10 sm:px-10 sm:py-16 lg:px-12 xl:px-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f5a43]">
              What we supply
            </p>
            <h2 className="mt-3 max-w-4xl text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] sm:mt-4 sm:text-5xl">
              Local specialties. Serious foodservice staples.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#6c726d]">
              A catalogue built around what kitchens need, not around one
              supplier’s warehouse.
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            {productLines.map((line, index) => (
              <Link
                key={line.name}
                href={line.href}
                className={`group border-b border-[#bfc2bc] ${
                  index % 2 === 0 ? 'md:border-r' : ''
                }`}
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-[#dedfd9] sm:aspect-[4/3]">
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-6 sm:gap-6 sm:px-8 sm:py-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6f766f]">
                      {line.eyebrow}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                      {line.name}
                    </h3>
                    <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#737974] sm:mt-3 sm:text-sm sm:leading-6">
                      {line.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 sm:mt-5 sm:gap-x-5">
                      {line.items.map((item) => (
                        <span
                          key={item}
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#777e78]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xl text-[#1f5a43] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPLIER NETWORK */}
      <section className="relative min-h-[72svh] overflow-hidden border-b border-[#bfc2bc] text-white sm:min-h-[760px]">
        <Image
          src="/images/producer.png"
          alt="Local producers and suppliers working through Local Connect"
          fill
          className="object-cover object-[62%_center] sm:object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-black/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/34 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[72svh] max-w-[1500px] items-end px-5 pb-12 pt-20 sm:min-h-[760px] sm:px-10 sm:pb-20 lg:px-12 xl:px-16">
          <div className="max-w-[760px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              For producers + suppliers
            </p>

            <h2 className="mt-4 text-[36px] font-semibold leading-[1] tracking-[-0.05em] sm:mt-5 sm:text-6xl">
              Sell through Local Connect.
              <span className="block text-white/55">Keep doing what you do best.</span>
            </h2>

            <p className="mt-5 max-w-2xl text-[14px] leading-6 text-white/76 sm:mt-6 sm:text-[16px] sm:leading-7">
              Bring your products into our customer network. We handle the
              ordering infrastructure, customer relationship and, when it makes
              sense, the last mile.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/65">
              <span>Reach our buyers</span>
              <span>Use our platform</span>
              <span>Choose fulfillment</span>
            </div>

            <Link
              href="/signup"
              className="mt-9 inline-flex min-h-12 items-center bg-white px-6 text-[12px] font-bold uppercase tracking-[0.1em] text-[#171b18]"
            >
              Become a supplier →
            </Link>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-b border-[#bfc2bc] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-10 sm:py-16 lg:px-12 xl:px-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f5a43]">
            The businesses we serve
          </p>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              Built around real kitchens.
            </h2>

            <p className="max-w-xl text-[15px] leading-7 text-[#6d736e]">
              Restaurants, breweries, retailers and institutional foodservice
              operators use Local Connect every week.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-[#d9dbd6] pt-6 sm:mt-10 sm:gap-x-8 sm:gap-y-10 sm:pt-8 md:grid-cols-3 lg:grid-cols-6">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="flex h-16 items-center justify-center sm:h-20"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-11 max-w-full object-contain opacity-75 sm:max-h-14"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#bfc2bc] bg-[#f4f5f2]">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-10 sm:py-16 lg:px-12 xl:px-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f5a43]">
            How it works
          </p>

          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            One clean order flow.
          </h2>

          <div className="mt-10 border-t border-[#bfc2bc]">
            {steps.map((step) => (
              <div
                key={step.number}
                className="grid grid-cols-[42px_1fr] gap-x-3 gap-y-1 border-b border-[#bfc2bc] py-5 sm:grid-cols-[60px_240px_1fr] sm:items-start sm:gap-3 sm:py-6"
              >
                <span className="text-[10px] font-bold tracking-[0.14em] text-[#1f5a43]">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="col-start-2 max-w-2xl text-[13px] leading-5 text-[#717772] sm:col-start-auto sm:text-sm sm:leading-6">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#171b18] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-7 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 lg:py-20 xl:px-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              07 / Your next order
            </p>
            <h2 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.05em] sm:mt-5 sm:text-6xl">
              Heard, Chef?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
              Build an order guide around the products your kitchen actually
              uses.
            </p>
          </div>

          <Link
            href="/signup"
            className="inline-flex min-h-12 w-full items-center justify-center bg-white px-7 text-[11px] font-bold uppercase tracking-[0.1em] text-[#171b18] sm:w-auto sm:text-[12px]"
          >
            Open an account →
          </Link>
        </div>
      </section>
    </main>
  )
}