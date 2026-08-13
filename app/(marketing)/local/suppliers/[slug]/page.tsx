import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type SupplierProfile = {
  id: string
  name: string
  slug: string
  location: string | null
  story: string | null
  logo_url: string | null
  hero_image_url: string | null
  website_url: string | null
  instagram_url: string | null
  public_profile: boolean | null
}

type Product = {
  id: string
  name: string | null
  category: string | null
  image_url: string | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((word: string) => word.length > 0)
    .slice(0, 2)
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('')
}

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: supplierData, error: supplierError } =
    await supabaseAdmin
      .from('supplier_profiles')
      .select(`
        id,
        name,
        slug,
        location,
        story,
        logo_url,
        hero_image_url,
        website_url,
        instagram_url,
        public_profile
      `)
      .eq('slug', slug)
      .eq('public_profile', true)
      .single()

  if (supplierError || !supplierData) {
    notFound()
  }

  const supplier = supplierData as SupplierProfile

  const { data: productData, error: productError } =
    await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        category,
        image_url
      `)
      .eq('supplier', supplier.name)
      .eq('public_traceability', true)
      .order('name')

  if (productError) {
    console.error('Failed to load supplier products:', productError)
  }

  const products = (productData ?? []) as Product[]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e9e1d4]">
      <img
        src="/images/Paige-Top-Vector.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-24 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply lg:-top-32"
      />

      <section className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 pb-[32rem] pt-52 sm:px-6 sm:pt-64 md:px-12 md:pt-72">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/local"
            className="font-serif text-base font-semibold italic text-[#2f6a53]"
          >
            ← Restaurants
          </Link>
        </div>

        <header className="mx-auto mt-12 max-w-4xl text-center">
          <div className="flex justify-center">
            <div className="rounded-full border border-[#c9b88f] bg-[#fcf7ef] p-3 shadow-[0_18px_50px_rgba(74,57,25,.20)]">
              {supplier.logo_url ? (
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-white">
                  <img
                    src={supplier.logo_url}
                    alt={`${supplier.name} logo`}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#fdf8ef] font-serif text-4xl font-semibold text-[#244f3d]">
                  {getInitials(supplier.name)}
                </div>
              )}
            </div>
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-[#244f3d]">
            Meet the producer
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold tracking-[-0.045em] text-[#183f30] sm:text-6xl md:text-7xl">
            {supplier.name}
          </h1>

          {supplier.location && (
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#2b6a52]">
              {supplier.location}
            </p>
          )}

          {supplier.story && (
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#5e5b50] sm:text-lg">
              {supplier.story}
            </p>
          )}
        </header>

        {supplier.hero_image_url && (
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden border border-[#c5b286] bg-[#f9f2e6] p-2 shadow-[0_18px_45px_rgba(72,56,20,.16)]">
            <div className="aspect-[16/8] overflow-hidden">
              <img
                src={supplier.hero_image_url}
                alt={supplier.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {(supplier.website_url || supplier.instagram_url) && (
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            {supplier.website_url && (
              <a
                href={supplier.website_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#244f3d] px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#244f3d] transition hover:bg-[#244f3d] hover:text-[#f9f2e6]"
              >
                Visit website
              </a>
            )}

            {supplier.instagram_url && (
              <a
                href={supplier.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#9a7a3e] px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#765e31] transition hover:bg-[#9a7a3e] hover:text-[#f9f2e6]"
              >
                Instagram
              </a>
            )}
          </div>
        )}

        <section className="mx-auto mt-20 max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#244f3d]">
              From this producer
            </p>

            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#183f30]">
              Products in our food system
            </h2>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex items-center gap-5 border border-[#cdbb95] bg-[#f9f2e6] p-5 shadow-[0_10px_28px_rgba(72,56,20,.10)]"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-full border border-[#c5b082] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#c5b082] bg-[#fdf8ef] text-xl text-[#244f3d]">
                    ✿
                  </div>
                )}

                <div>
                  {product.category && (
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#80796b]">
                      {product.category}
                    </p>
                  )}

                  <h3 className="mt-1 font-serif text-2xl font-semibold text-[#183f30]">
                    {product.name || 'Local Product'}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-20 max-w-3xl text-center">
          <div className="mx-auto mb-7 h-px max-w-md bg-[#b29d74]" />

          <p className="font-serif text-2xl italic text-[#4c4a42]">
            Grown here. Made here. Served here.
          </p>
        </footer>
      </section>

      <img
        src="/images/Paige-Bottom-Vector (1).png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply"
      />
    </main>
  )
}