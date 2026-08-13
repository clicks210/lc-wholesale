import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type CustomerRow = {
  id: string
  business_name: string | null
  slug: string | null
  delivery_city: string | null
  profile_description: string | null
  public_profile: boolean | null
  logo_url: string | null
  hero_image_url: string | null
  menu_url: string | null
  website_url: string | null
  instagram_url: string | null
  facebook_url: string | null
}

type OrderRow = {
  id: string
  created_at: string | null
}

type OrderItemRow = {
  product_id: string | null
}

type ManualProductAssignmentRow = {
  product_id: string | null
}

type ManualSupplierAssignmentRow = {
  supplier_profile_id: string | null
}

type ProductRow = {
  id: string
  name: string | null
  supplier: string | null
  category: string | null
  image_url: string | null
  public_traceability: boolean | null
}

type SupplierProfileRow = {
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

type SupplierGroup = {
  supplier: string
  profile: SupplierProfileRow | null
  products: ProductRow[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((word: string) => word.length > 0)
    .slice(0, 2)
    .map((word: string) =>
      word.charAt(0).toUpperCase()
    )
    .join('')
}

export default async function RestaurantLocalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  /*
   * =====================================================
   * 1. LOAD RESTAURANT
   * =====================================================
   */
  const {
    data: customerData,
    error: customerError,
  } = await supabaseAdmin
    .from('customers')
    .select(`
      id,
      business_name,
      slug,
      delivery_city,
      profile_description,
      public_profile,
      logo_url,
      hero_image_url,
      menu_url,
      website_url,
      instagram_url,
      facebook_url
    `)
    .eq('slug', slug)
    .eq('public_profile', true)
    .single()

  if (customerError) {
    console.error(
      'Failed to load restaurant:',
      customerError
    )

    throw new Error(
      `Failed to load restaurant: ${customerError.message}`
    )
  }

  if (!customerData) {
    notFound()
  }

  const customer =
    customerData as CustomerRow

  /*
   * =====================================================
   * 2. LOAD RESTAURANT ORDERS
   * =====================================================
   *
   * Public page deliberately does not load:
   * prices, quantities, totals, margins or payments.
   */
  const {
    data: orderData,
    error: orderError,
  } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      created_at
    `)
    .eq(
      'customer_id',
      customer.id
    )

  if (orderError) {
    console.error(
      'Failed to load restaurant orders:',
      orderError
    )
  }

  const orders =
    (orderData ?? []) as OrderRow[]

  const orderIds =
    orders.map(
      (order) => order.id
    )

  /*
   * =====================================================
   * 3. LOAD PRODUCTS FROM ORDER HISTORY
   * =====================================================
   */
  let orderItems: OrderItemRow[] = []

  if (orderIds.length > 0) {
    const {
      data: orderItemData,
      error: orderItemError,
    } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id
      `)
      .in(
        'order_id',
        orderIds
      )

    if (orderItemError) {
      console.error(
        'Failed to load restaurant order items:',
        orderItemError
      )
    }

    orderItems =
      (orderItemData ??
        []) as OrderItemRow[]
  }

  const orderedProductIds =
    orderItems
      .map(
        (item) =>
          item.product_id
      )
      .filter(
        (
          id
        ): id is string =>
          Boolean(id)
      )

  /*
   * =====================================================
   * 4. LOAD MANUALLY ASSIGNED PRODUCTS
   * =====================================================
   */
  const {
    data: manualProductData,
    error: manualProductError,
  } = await supabaseAdmin
    .from(
      'restaurant_traceability_products'
    )
    .select(`
      product_id
    `)
    .eq(
      'customer_id',
      customer.id
    )

  if (manualProductError) {
    console.error(
      'Failed to load manually assigned restaurant products:',
      manualProductError
    )
  }

  const manualProductAssignments =
    (manualProductData ??
      []) as ManualProductAssignmentRow[]

  const manualProductIds =
    manualProductAssignments
      .map(
        (item) =>
          item.product_id
      )
      .filter(
        (
          id
        ): id is string =>
          Boolean(id)
      )

  /*
   * =====================================================
   * 5. COMBINE ORDERED + MANUAL PRODUCTS
   * =====================================================
   */
  const productIds =
    Array.from(
      new Set([
        ...orderedProductIds,
        ...manualProductIds,
      ])
    )

  /*
   * =====================================================
   * 6. LOAD ONLY GLOBALLY PUBLIC PRODUCTS
   * =====================================================
   *
   * Manual assignment alone is not enough.
   * products.public_traceability must still be true.
   */
  let products: ProductRow[] = []

  if (productIds.length > 0) {
    const {
      data: productData,
      error: productError,
    } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        supplier,
        category,
        image_url,
        public_traceability
      `)
      .in(
        'id',
        productIds
      )
      .eq(
        'public_traceability',
        true
      )

    if (productError) {
      console.error(
        'Failed to load public traceability products:',
        productError
      )
    }

    products =
      (productData ??
        []) as ProductRow[]
  }

  /*
   * =====================================================
   * 7. LOAD MANUALLY ASSIGNED SUPPLIERS
   * =====================================================
   */
  const {
    data: manualSupplierData,
    error: manualSupplierError,
  } = await supabaseAdmin
    .from(
      'restaurant_traceability_suppliers'
    )
    .select(`
      supplier_profile_id
    `)
    .eq(
      'customer_id',
      customer.id
    )

  if (manualSupplierError) {
    console.error(
      'Failed to load manually assigned suppliers:',
      manualSupplierError
    )
  }

  const manualSupplierAssignments =
    (manualSupplierData ??
      []) as ManualSupplierAssignmentRow[]

  const manualSupplierProfileIds =
    manualSupplierAssignments
      .map(
        (item) =>
          item.supplier_profile_id
      )
      .filter(
        (
          id
        ): id is string =>
          Boolean(id)
      )

  /*
   * =====================================================
   * 8. DETERMINE SUPPLIERS FROM PRODUCTS
   * =====================================================
   *
   * Deduplicate case-insensitively.
   */
  const supplierNameMap =
    new Map<string, string>()

  for (const product of products) {
    const supplierName =
      product.supplier?.trim()

    if (!supplierName) continue

    const key =
      supplierName.toLowerCase()

    if (!supplierNameMap.has(key)) {
      supplierNameMap.set(
        key,
        supplierName
      )
    }
  }

  const productSupplierNames =
    Array.from(
      supplierNameMap.values()
    )

  /*
   * =====================================================
   * 9. LOAD PUBLIC SUPPLIER PROFILES
   * =====================================================
   *
   * Supplier profiles can enter the page from:
   *
   * A. products shown on this restaurant
   * B. manual supplier assignments
   */
  const supplierProfileById =
    new Map<
      string,
      SupplierProfileRow
    >()

  /*
   * First load profiles related to product suppliers.
   *
   * We load all public supplier profiles then match
   * case-insensitively because `.in('name', ...)`
   * is case-sensitive.
   */
  if (
    productSupplierNames.length > 0
  ) {
    const {
      data: supplierData,
      error: supplierError,
    } = await supabaseAdmin
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
      .eq(
        'public_profile',
        true
      )

    if (supplierError) {
      console.error(
        'Failed to load supplier profiles:',
        supplierError
      )
    }

    const wantedNames =
      new Set(
        productSupplierNames.map(
          (name) =>
            name
              .trim()
              .toLowerCase()
        )
      )

    for (const rawProfile of
      supplierData ?? []) {
      const profile =
        rawProfile as SupplierProfileRow

      if (
        wantedNames.has(
          profile.name
            .trim()
            .toLowerCase()
        )
      ) {
        supplierProfileById.set(
          profile.id,
          profile
        )
      }
    }
  }

  /*
   * Then load directly assigned supplier profiles.
   */
  if (
    manualSupplierProfileIds.length >
    0
  ) {
    const {
      data: manualProfiles,
      error:
        manualProfilesError,
    } = await supabaseAdmin
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
      .in(
        'id',
        manualSupplierProfileIds
      )
      .eq(
        'public_profile',
        true
      )

    if (manualProfilesError) {
      console.error(
        'Failed to load manually assigned supplier profiles:',
        manualProfilesError
      )
    }

    for (const rawProfile of
      manualProfiles ?? []) {
      const profile =
        rawProfile as SupplierProfileRow

      supplierProfileById.set(
        profile.id,
        profile
      )
    }
  }

  const supplierProfiles =
    Array.from(
      supplierProfileById.values()
    )

  /*
   * Case-insensitive profile lookup by supplier name.
   */
  const supplierProfileByName =
    new Map<
      string,
      SupplierProfileRow
    >()

  for (const profile of supplierProfiles) {
    supplierProfileByName.set(
      profile.name
        .trim()
        .toLowerCase(),
      profile
    )
  }

  /*
   * =====================================================
   * 10. GROUP PRODUCTS UNDER SUPPLIERS
   * =====================================================
   *
   * Also deduplicate groups case-insensitively.
   */
  const groupedProducts =
    new Map<
      string,
      {
        supplier: string
        products: ProductRow[]
      }
    >()

  for (const product of products) {
    const supplier =
      product.supplier?.trim() ||
      'Local Supplier'

    const key =
      supplier.toLowerCase()

    const existing =
      groupedProducts.get(key)

    if (existing) {
      /*
       * Prevent accidental duplicate product rows.
       */
      if (
        !existing.products.some(
          (existingProduct) =>
            existingProduct.id ===
            product.id
        )
      ) {
        existing.products.push(
          product
        )
      }

      continue
    }

    groupedProducts.set(key, {
      supplier,
      products: [product],
    })
  }

  /*
   * =====================================================
   * 11. ADD MANUAL SUPPLIER-ONLY GROUPS
   * =====================================================
   *
   * This allows a supplier to display even when no
   * specific product has been assigned.
   */
  for (const profile of supplierProfiles) {
    const key =
      profile.name
        .trim()
        .toLowerCase()

    if (!groupedProducts.has(key)) {
      groupedProducts.set(
        key,
        {
          supplier:
            profile.name,
          products: [],
        }
      )
    }
  }

  /*
   * =====================================================
   * 12. BUILD FINAL SUPPLIER GROUPS
   * =====================================================
   */
  const supplierGroups: SupplierGroup[] =
    Array.from(
      groupedProducts.values()
    )
      .map(
        ({
          supplier,
          products:
            supplierProducts,
        }) => ({
          supplier,

          profile:
            supplierProfileByName.get(
              supplier
                .trim()
                .toLowerCase()
            ) ?? null,

          products:
            [...supplierProducts].sort(
              (a, b) =>
                (
                  a.name ?? ''
                ).localeCompare(
                  b.name ?? ''
                )
            ),
        })
      )
      .sort((a, b) =>
        a.supplier.localeCompare(
          b.supplier
        )
      )

  /*
   * =====================================================
   * RESTAURANT DISPLAY DATA
   * =====================================================
   */
  const restaurantName =
    customer.business_name?.trim() ||
    'Restaurant'

  const restaurantInitials =
    getInitials(
      restaurantName
    ) || 'LC'

  const location =
    customer.delivery_city?.trim()
      ? `${customer.delivery_city}, BC`
      : 'British Columbia'

  const description =
    customer.profile_description?.trim() ||
    'Discover the local farms, producers and products behind this restaurant.'

  const hasRestaurantLinks =
    Boolean(customer.menu_url) ||
    Boolean(customer.website_url) ||
    Boolean(
      customer.instagram_url
    ) ||
    Boolean(customer.facebook_url)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e9e1d4] text-[#183f30]">
      {/* Paige top floral */}
      <img
        src="/images/Paige-Top-Vector.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-20 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply sm:-top-24 lg:-top-32"
      />

      <section className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 pb-[32rem] pt-52 sm:px-6 sm:pb-[36rem] sm:pt-60 md:px-12 md:pt-72 lg:px-16 lg:pt-80">
        {/* Back */}
        <div className="mx-auto max-w-4xl">
          <Link
            href="/local"
            className="inline-flex items-center gap-2 font-serif text-base font-semibold italic text-[#2f6a53] transition hover:opacity-70"
          >
            <span aria-hidden="true">
              ←
            </span>

            All restaurants
          </Link>
        </div>

        {/* Restaurant header */}
        <header className="relative mx-auto mt-10 max-w-4xl text-center">
          {/* Restaurant logo */}
          <div className="relative z-20 mx-auto flex justify-center">
            <div className="rounded-full border border-[#c9b88f] bg-[#fcf7ef] p-3 shadow-[0_18px_50px_rgba(74,57,25,.20)]">
              {customer.logo_url ? (
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white sm:h-36 sm:w-36">
                  <img
                    src={
                      customer.logo_url
                    }
                    alt={`${restaurantName} logo`}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#fdf8ef] font-serif text-4xl font-semibold text-[#244f3d] sm:h-36 sm:w-36">
                  {
                    restaurantInitials
                  }
                </div>
              )}
            </div>
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.30em] text-[#244f3d]">
            Local Connect
          </p>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#2b6a52]">
            {location}
          </p>

          <h1 className="mx-auto mt-3 max-w-4xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#183f30] sm:text-6xl md:text-7xl">
            {restaurantName}
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#5e5b50] sm:text-lg sm:leading-8">
            {description}
          </p>

          {/* Restaurant actions */}
          {hasRestaurantLinks && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {customer.menu_url && (
                <a
                  href={
                    customer.menu_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#244f3d] bg-[#244f3d] px-7 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#f9f2e6] shadow-[0_8px_22px_rgba(36,79,61,.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#183f30]"
                >
                  View Menu

                  <span className="ml-2 text-base">
                    ↗
                  </span>
                </a>
              )}

              {customer.website_url && (
                <a
                  href={
                    customer.website_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${restaurantName} website`}
                  title="Website"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#9a7a3e] bg-[#f9f2e6] text-[#765e31] shadow-[0_5px_14px_rgba(72,56,20,.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#efe5d4]"
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
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M3 12h18" />

                    <path d="M12 3c2.7 2.4 4.2 5.5 4.2 9S14.7 18.6 12 21" />

                    <path d="M12 3C9.3 5.4 7.8 8.5 7.8 12S9.3 18.6 12 21" />
                  </svg>
                </a>
              )}

              {customer.instagram_url && (
                <a
                  href={
                    customer.instagram_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${restaurantName} on Instagram`}
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

              {customer.facebook_url && (
                <a
                  href={
                    customer.facebook_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${restaurantName} on Facebook`}
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

          <div className="mx-auto mt-10 flex max-w-sm items-center justify-center gap-4 text-[#9b7a40]">
            <span className="h-px flex-1 bg-[#b29d74]" />
            <span className="text-lg">
              ✿
            </span>
            <span className="h-px flex-1 bg-[#b29d74]" />
          </div>
        </header>

        {/* Restaurant hero */}
        {customer.hero_image_url && (
          <section className="mx-auto mt-12 max-w-4xl">
            <div
              className="relative overflow-hidden border border-[#c5b286] bg-[#f9f2e6] p-2 shadow-[0_18px_45px_rgba(72,56,20,.16)]"
              style={{
                clipPath:
                  'polygon(1% 2%, 8% 1%, 18% 2%, 29% 1%, 42% 2%, 54% 1%, 67% 2%, 80% 1%, 92% 2%, 99% 1%, 100% 98%, 91% 99%, 79% 98%, 66% 99%, 52% 98%, 39% 99%, 25% 98%, 12% 99%, 0% 98%)',
              }}
            >
              <div className="aspect-[16/8] overflow-hidden">
                <img
                  src={
                    customer.hero_image_url
                  }
                  alt={
                    restaurantName
                  }
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* Supplier introduction */}
        <section className="mx-auto mt-20 max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#244f3d]">
            Local sourcing
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#183f30] sm:text-5xl">
            Tonight&apos;s meal starts
            here.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#5e5b50] sm:text-lg">
            Meet the farms, bakers and
            producers behind the food
            served at{' '}
            {restaurantName}.
          </p>
        </section>

        {/* Supplier cards */}
        <section className="mx-auto mt-10 max-w-4xl">
          {supplierGroups.length > 0 ? (
            <div className="grid gap-8">
              {supplierGroups.map(
                (group) => {
                  const supplierContent =
                    (
                      <article
                        className="group relative overflow-hidden border border-[#cdbb95] bg-[#f9f2e6] shadow-[0_14px_38px_rgba(72,56,20,.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(72,56,20,.18)]"
                        style={{
                          clipPath:
                            'polygon(0.5% 2%, 5% 1%, 10% 2%, 16% 1%, 23% 2%, 31% 1%, 40% 2%, 50% 1%, 61% 2%, 70% 1%, 80% 2%, 90% 1%, 99.5% 2%, 100% 98%, 94% 99%, 85% 98%, 75% 99%, 64% 98%, 52% 99%, 41% 98%, 30% 99%, 18% 98%, 8% 99%, 0% 98%)',
                        }}
                      >
                        {/* Supplier hero */}
                        {group.profile
                          ?.hero_image_url && (
                          <div className="h-52 w-full overflow-hidden sm:h-64">
                            <img
                              src={
                                group
                                  .profile
                                  .hero_image_url
                              }
                              alt=""
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                        )}

                        <div className="px-6 py-7 sm:px-8 sm:py-9">
                          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            {/* Supplier logo */}
                            <div className="shrink-0">
                              {group.profile
                                ?.logo_url ? (
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#bda777] bg-white p-2 shadow-sm">
                                  <img
                                    src={
                                      group
                                        .profile
                                        .logo_url
                                    }
                                    alt={`${group.supplier} logo`}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#bda777] bg-[#fdf8ef] font-serif text-2xl font-semibold text-[#244f3d]">
                                  {getInitials(
                                    group.supplier
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Supplier text */}
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#2b6a52]">
                                Local Supplier
                              </p>

                              <h3 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-[#183f30] sm:text-4xl">
                                {
                                  group.supplier
                                }
                              </h3>

                              {group.profile
                                ?.location && (
                                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#887a5b]">
                                  {
                                    group
                                      .profile
                                      .location
                                  }
                                </p>
                              )}

                              {group.profile
                                ?.story ? (
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e5b50] sm:text-base">
                                  {
                                    group
                                      .profile
                                      .story
                                  }
                                </p>
                              ) : (
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e5b50] sm:text-base">
                                  Supplying quality
                                  ingredients through
                                  Local Connect.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Products */}
                          {group.products.length >
                            0 && (
                            <div className="mt-8 border-t border-[#d2c19d] pt-6">
                              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#80745e]">
                                Products supplied
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {group.products.map(
                                  (
                                    product
                                  ) => (
                                    <div
                                      key={
                                        product.id
                                      }
                                      className="flex items-center gap-4"
                                    >
                                      {product.image_url ? (
                                        <img
                                          src={
                                            product.image_url
                                          }
                                          alt=""
                                          className="h-14 w-14 shrink-0 rounded-full border border-[#c5b082] object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c5b082] bg-[#fdf8ef] text-[#244f3d]">
                                          ✿
                                        </div>
                                      )}

                                      <div>
                                        <p className="font-serif text-lg font-semibold leading-tight text-[#183f30]">
                                          {product.name ||
                                            'Local Product'}
                                        </p>

                                        {product.category && (
                                          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#80796b]">
                                            {
                                              product.category
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Supplier CTA */}
                          {group.profile && (
                            <div className="mt-8 flex flex-col gap-2 border-t border-[#d2c19d] pt-5 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-serif text-base italic text-[#6b665b]">
                                Meet the people
                                behind your food
                              </span>

                              <span className="font-serif text-lg font-semibold italic text-[#2f6a53]">
                                Meet the supplier

                                <span className="ml-2 inline-block not-italic transition group-hover:translate-x-1">
                                  →
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    )

                  if (group.profile) {
                    return (
                      <Link
                        key={
                          group.profile
                            .id
                        }
                        href={`/local/suppliers/${group.profile.slug}`}
                        className="block"
                      >
                        {
                          supplierContent
                        }
                      </Link>
                    )
                  }

                  return (
                    <div
                      key={`supplier:${group.supplier
                        .trim()
                        .toLowerCase()}`}
                    >
                      {
                        supplierContent
                      }
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            <div className="border border-[#cdbb95] bg-[#f9f2e6] p-10 text-center shadow-[0_12px_32px_rgba(72,56,20,.12)]">
              <p className="font-serif text-3xl font-semibold text-[#183f30]">
                Local sourcing profile
                coming soon.
              </p>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#5e5b50] sm:text-base">
                This restaurant is part
                of Local Connect, but
                there are currently no
                products or suppliers
                approved for public
                traceability.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mx-auto mt-20 max-w-3xl text-center">
          <div className="mx-auto mb-7 h-px max-w-md bg-[#b29d74]" />

          <p className="font-serif text-2xl italic text-[#4c4a42]">
            Thank you for supporting
            local.
          </p>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6b675e]">
            Sourcing information reflects
            Local Connect order history
            and verified supplier
            relationships maintained by
            Local Connect.
          </p>
        </footer>
      </section>

      {/* Paige bottom floral */}
      <img
        src="/images/Paige-Bottom-Vector (1).png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-screen max-w-none -translate-x-1/2 select-none mix-blend-multiply"
      />
    </main>
  )
}