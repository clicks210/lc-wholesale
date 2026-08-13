import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

const CUSTOMER_FIELDS = `
  id,
  business_name,
  delivery_city,
  email,
  slug,
  public_profile,
  logo_url,
  profile_description
`

const PRODUCT_FIELDS = `
  id,
  name,
  supplier,
  category,
  image_url,
  public_traceability
`

const SUPPLIER_FIELDS = `
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
`

const PRODUCT_ASSIGNMENT_FIELDS = `
  id,
  customer_id,
  product_id,
  created_at
`

const SUPPLIER_ASSIGNMENT_FIELDS = `
  id,
  customer_id,
  supplier_profile_id,
  created_at
`

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/*
 * =========================================================
 * GET
 * =========================================================
 */
export async function GET() {
  try {
    const [
      customerResult,
      productResult,
      supplierProfileResult,
      productAssignmentResult,
      supplierAssignmentResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('customers')
        .select(CUSTOMER_FIELDS)
        .order('business_name', {
          ascending: true,
          nullsFirst: false,
        }),

      supabaseAdmin
        .from('products')
        .select(PRODUCT_FIELDS)
        .order('name', {
          ascending: true,
          nullsFirst: false,
        }),

      supabaseAdmin
        .from('supplier_profiles')
        .select(SUPPLIER_FIELDS)
        .order('name', {
          ascending: true,
          nullsFirst: false,
        }),

      supabaseAdmin
        .from('restaurant_traceability_products')
        .select(PRODUCT_ASSIGNMENT_FIELDS),

      supabaseAdmin
        .from('restaurant_traceability_suppliers')
        .select(SUPPLIER_ASSIGNMENT_FIELDS),
    ])

    if (customerResult.error) {
      throw customerResult.error
    }

    if (productResult.error) {
      throw productResult.error
    }

    if (supplierProfileResult.error) {
      throw supplierProfileResult.error
    }

    if (productAssignmentResult.error) {
      throw productAssignmentResult.error
    }

    if (supplierAssignmentResult.error) {
      throw supplierAssignmentResult.error
    }

    const customers =
      customerResult.data ?? []

    const products =
      productResult.data ?? []

    const supplierProfiles =
      supplierProfileResult.data ?? []

    /*
     * =====================================================
     * SUPPLIER DISCOVERY
     * =====================================================
     *
     * We want the admin UI to display:
     *
     * 1. Every supplier referenced by products
     * 2. Every existing supplier_profiles record
     *
     * And we want supplier matching to be
     * CASE INSENSITIVE.
     *
     * This avoids duplicate React keys caused by:
     *
     * "Ok Quality Produce"
     * "OK Quality Produce"
     *
     * resolving to the same supplier profile.
     */

    const supplierNameMap =
      new Map<string, string>()

    /*
     * Suppliers referenced by products.
     */
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

    /*
     * Also include every configured supplier profile,
     * even if no current product references it.
     */
    for (const profile of supplierProfiles) {
      const supplierName =
        profile.name?.trim()

      if (!supplierName) continue

      const key =
        supplierName.toLowerCase()

      /*
       * Prefer the configured profile's spelling.
       */
      supplierNameMap.set(
        key,
        supplierName
      )
    }

    const supplierNames =
      Array.from(
        supplierNameMap.values()
      ).sort((a, b) =>
        a.localeCompare(b)
      )

    /*
     * Case-insensitive profile lookup.
     */
    const profileMap = new Map(
      supplierProfiles.map(
        (profile) => [
          profile.name
            .trim()
            .toLowerCase(),
          profile,
        ]
      )
    )

    /*
     * Build admin rows.
     *
     * If a profile exists, return the real row.
     *
     * If not, create an admin-only temporary row.
     */
    const supplierRows =
      supplierNames.map(
        (supplierName) => {
          const profile =
            profileMap.get(
              supplierName.toLowerCase()
            )

          if (profile) {
            return profile
          }

          return {
            id: `unconfigured:${supplierName}`,
            name: supplierName,
            slug: '',
            location: null,
            story: null,
            logo_url: null,
            hero_image_url: null,
            website_url: null,
            instagram_url: null,
            public_profile: false,
          }
        }
      )

    /*
     * Absolute final safety net:
     * never send duplicate supplier IDs to React.
     */
    const suppliers =
      Array.from(
        new Map(
          supplierRows.map(
            (supplier) => [
              supplier.id,
              supplier,
            ]
          )
        ).values()
      ).sort((a, b) =>
        a.name.localeCompare(b.name)
      )

    return NextResponse.json({
      customers,
      products,
      suppliers,

      productAssignments:
        productAssignmentResult.data ??
        [],

      supplierAssignments:
        supplierAssignmentResult.data ??
        [],
    })
  } catch (error) {
    console.error(
      'TRACEABILITY GET ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load traceability settings.',
      },
      {
        status: 500,
      }
    )
  }
}

/*
 * =========================================================
 * PATCH
 * =========================================================
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    console.log(
      'TRACEABILITY PATCH:',
      body
    )

    /*
     * =====================================================
     * RESTAURANT → PRODUCT ASSIGNMENT
     * =====================================================
     */
    if (
      body.entity ===
      'restaurant-product-assignment'
    ) {
      const {
        customerId,
        productId,
        assigned,
      } = body

      if (
        typeof customerId !== 'string' ||
        !customerId.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Customer ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof productId !== 'string' ||
        !productId.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Product ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof assigned !== 'boolean'
      ) {
        return NextResponse.json(
          {
            error:
              'assigned must be true or false.',
          },
          {
            status: 400,
          }
        )
      }

      /*
       * ADD
       */
      if (assigned) {
        const {
          data: customer,
          error: customerError,
        } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq(
            'id',
            customerId
          )
          .maybeSingle()

        if (customerError) {
          return NextResponse.json(
            {
              error:
                customerError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!customer) {
          return NextResponse.json(
            {
              error:
                'Customer not found.',
            },
            {
              status: 404,
            }
          )
        }

        const {
          data: product,
          error: productError,
        } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq(
            'id',
            productId
          )
          .maybeSingle()

        if (productError) {
          return NextResponse.json(
            {
              error:
                productError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!product) {
          return NextResponse.json(
            {
              error:
                'Product not found.',
            },
            {
              status: 404,
            }
          )
        }

        const {
          data,
          error,
        } = await supabaseAdmin
          .from(
            'restaurant_traceability_products'
          )
          .upsert(
            {
              customer_id:
                customerId,
              product_id:
                productId,
            },
            {
              onConflict:
                'customer_id,product_id',
            }
          )
          .select(
            PRODUCT_ASSIGNMENT_FIELDS
          )
          .single()

        if (error) {
          console.error(
            'PRODUCT ASSIGNMENT ERROR:',
            error
          )

          return NextResponse.json(
            {
              error:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            },
            {
              status: 500,
            }
          )
        }

        return NextResponse.json({
          success: true,
          entity:
            'restaurant-product-assignment',
          assigned: true,
          assignment: data,
        })
      }

      /*
       * REMOVE
       */
      const {
        error: deleteError,
      } = await supabaseAdmin
        .from(
          'restaurant_traceability_products'
        )
        .delete()
        .eq(
          'customer_id',
          customerId
        )
        .eq(
          'product_id',
          productId
        )

      if (deleteError) {
        console.error(
          'PRODUCT ASSIGNMENT DELETE ERROR:',
          deleteError
        )

        return NextResponse.json(
          {
            error:
              deleteError.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity:
          'restaurant-product-assignment',
        assigned: false,
        customerId,
        productId,
      })
    }

    /*
     * =====================================================
     * RESTAURANT → SUPPLIER ASSIGNMENT
     * =====================================================
     */
    if (
      body.entity ===
      'restaurant-supplier-assignment'
    ) {
      const {
        customerId,
        supplierId,
        assigned,
      } = body

      if (
        typeof customerId !== 'string' ||
        !customerId.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Customer ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof supplierId !== 'string' ||
        !supplierId.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Supplier ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof assigned !== 'boolean'
      ) {
        return NextResponse.json(
          {
            error:
              'assigned must be true or false.',
          },
          {
            status: 400,
          }
        )
      }

      /*
       * Placeholder suppliers do not have a real
       * supplier_profiles ID yet.
       */
      if (
        supplierId.startsWith(
          'unconfigured:'
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Configure this supplier profile before assigning it directly to a restaurant.',
          },
          {
            status: 400,
          }
        )
      }

      /*
       * ADD
       */
      if (assigned) {
        const {
          data: customer,
          error: customerError,
        } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq(
            'id',
            customerId
          )
          .maybeSingle()

        if (customerError) {
          return NextResponse.json(
            {
              error:
                customerError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!customer) {
          return NextResponse.json(
            {
              error:
                'Customer not found.',
            },
            {
              status: 404,
            }
          )
        }

        const {
          data: supplier,
          error: supplierError,
        } = await supabaseAdmin
          .from(
            'supplier_profiles'
          )
          .select('id')
          .eq(
            'id',
            supplierId
          )
          .maybeSingle()

        if (supplierError) {
          return NextResponse.json(
            {
              error:
                supplierError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!supplier) {
          return NextResponse.json(
            {
              error:
                'Supplier profile not found.',
            },
            {
              status: 404,
            }
          )
        }

        const {
          data,
          error,
        } = await supabaseAdmin
          .from(
            'restaurant_traceability_suppliers'
          )
          .upsert(
            {
              customer_id:
                customerId,

              supplier_profile_id:
                supplierId,
            },
            {
              onConflict:
                'customer_id,supplier_profile_id',
            }
          )
          .select(
            SUPPLIER_ASSIGNMENT_FIELDS
          )
          .single()

        if (error) {
          console.error(
            'SUPPLIER ASSIGNMENT ERROR:',
            error
          )

          return NextResponse.json(
            {
              error:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            },
            {
              status: 500,
            }
          )
        }

        return NextResponse.json({
          success: true,
          entity:
            'restaurant-supplier-assignment',
          assigned: true,
          assignment: data,
        })
      }

      /*
       * REMOVE
       */
      const {
        error: deleteError,
      } = await supabaseAdmin
        .from(
          'restaurant_traceability_suppliers'
        )
        .delete()
        .eq(
          'customer_id',
          customerId
        )
        .eq(
          'supplier_profile_id',
          supplierId
        )

      if (deleteError) {
        console.error(
          'SUPPLIER ASSIGNMENT DELETE ERROR:',
          deleteError
        )

        return NextResponse.json(
          {
            error:
              deleteError.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity:
          'restaurant-supplier-assignment',
        assigned: false,
        customerId,
        supplierId,
      })
    }

    /*
     * =====================================================
     * PRODUCT GLOBAL TRACEABILITY
     * =====================================================
     */
    if (
      body.entity === 'product'
    ) {
      if (
        typeof body.id !== 'string' ||
        !body.id.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Product ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof body.publicTraceability !==
        'boolean'
      ) {
        return NextResponse.json(
          {
            error:
              'publicTraceability must be true or false.',
          },
          {
            status: 400,
          }
        )
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from('products')
        .update({
          public_traceability:
            body.publicTraceability,
        })
        .eq(
          'id',
          body.id
        )
        .select(
          PRODUCT_FIELDS
        )
        .single()

      if (error) {
        console.error(
          'PRODUCT TRACEABILITY UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity: 'product',
        product: data,
      })
    }

    /*
     * =====================================================
     * SUPPLIER GLOBAL VISIBILITY
     * =====================================================
     */
    if (
      body.entity === 'supplier'
    ) {
      if (
        typeof body.id !== 'string' ||
        !body.id.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Supplier ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        body.id.startsWith(
          'unconfigured:'
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Configure this supplier profile before making it public.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof body.publicProfile !==
        'boolean'
      ) {
        return NextResponse.json(
          {
            error:
              'publicProfile must be true or false.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        body.publicProfile
      ) {
        const {
          data: supplier,
          error: lookupError,
        } = await supabaseAdmin
          .from(
            'supplier_profiles'
          )
          .select(
            'id, slug'
          )
          .eq(
            'id',
            body.id
          )
          .maybeSingle()

        if (lookupError) {
          return NextResponse.json(
            {
              error:
                lookupError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!supplier) {
          return NextResponse.json(
            {
              error:
                'Supplier profile not found.',
            },
            {
              status: 404,
            }
          )
        }

        if (
          !supplier.slug?.trim()
        ) {
          return NextResponse.json(
            {
              error:
                'Configure a supplier slug before making this supplier public.',
            },
            {
              status: 400,
            }
          )
        }
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from(
          'supplier_profiles'
        )
        .update({
          public_profile:
            body.publicProfile,
        })
        .eq(
          'id',
          body.id
        )
        .select(
          SUPPLIER_FIELDS
        )
        .single()

      if (error) {
        console.error(
          'SUPPLIER VISIBILITY UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity: 'supplier',
        supplier: data,
      })
    }

    /*
     * =====================================================
     * SUPPLIER PROFILE CREATE / EDIT
     * =====================================================
     */
    if (
      body.entity ===
      'supplier-profile'
    ) {
      if (
        typeof body.id !== 'string' ||
        !body.id.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Supplier ID is required.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        typeof body.slug !== 'string' ||
        !body.slug.trim()
      ) {
        return NextResponse.json(
          {
            error:
              'Supplier slug is required.',
          },
          {
            status: 400,
          }
        )
      }

      const cleanSlug =
        slugify(body.slug)

      if (!cleanSlug) {
        return NextResponse.json(
          {
            error:
              'A valid supplier slug is required.',
          },
          {
            status: 400,
          }
        )
      }

      const isUnconfigured =
        body.id.startsWith(
          'unconfigured:'
        )

      const supplierName =
        isUnconfigured
          ? body.id
              .replace(
                /^unconfigured:/,
                ''
              )
              .trim()
          : null

      if (
        isUnconfigured &&
        !supplierName
      ) {
        return NextResponse.json(
          {
            error:
              'Unable to determine supplier name.',
          },
          {
            status: 400,
          }
        )
      }

      /*
       * Check slug uniqueness.
       */
      const {
        data: slugMatches,
        error: slugCheckError,
      } = await supabaseAdmin
        .from(
          'supplier_profiles'
        )
        .select(
          'id, name'
        )
        .eq(
          'slug',
          cleanSlug
        )

      if (slugCheckError) {
        console.error(
          'SUPPLIER SLUG CHECK ERROR:',
          slugCheckError
        )

        return NextResponse.json(
          {
            error:
              slugCheckError.message,
          },
          {
            status: 500,
          }
        )
      }

      const slugOwner =
        (
          slugMatches ?? []
        ).find(
          (supplier) =>
            isUnconfigured ||
            supplier.id !==
              body.id
        )

      if (slugOwner) {
        return NextResponse.json(
          {
            error: `The slug "${cleanSlug}" is already being used by ${slugOwner.name}.`,
          },
          {
            status: 409,
          }
        )
      }

      const supplierValues = {
        slug: cleanSlug,

        location:
          typeof body.location ===
            'string' &&
          body.location.trim()
            ? body.location.trim()
            : null,

        story:
          typeof body.story ===
            'string' &&
          body.story.trim()
            ? body.story.trim()
            : null,

        logo_url:
          typeof body.logoUrl ===
            'string' &&
          body.logoUrl.trim()
            ? body.logoUrl.trim()
            : null,

        hero_image_url:
          typeof body.heroImageUrl ===
            'string' &&
          body.heroImageUrl.trim()
            ? body.heroImageUrl.trim()
            : null,

        website_url:
          typeof body.websiteUrl ===
            'string' &&
          body.websiteUrl.trim()
            ? body.websiteUrl.trim()
            : null,

        instagram_url:
          typeof body.instagramUrl ===
            'string' &&
          body.instagramUrl.trim()
            ? body.instagramUrl.trim()
            : null,
      }

      /*
       * =================================================
       * CREATE / RECOVER UNCONFIGURED SUPPLIER
       * =================================================
       */
      if (isUnconfigured) {
        /*
         * Look for an existing supplier by name
         * case-insensitively before inserting.
         */
        const {
          data: existingProfiles,
          error: existingProfileError,
        } = await supabaseAdmin
          .from(
            'supplier_profiles'
          )
          .select(
            SUPPLIER_FIELDS
          )

        if (existingProfileError) {
          return NextResponse.json(
            {
              error:
                existingProfileError.message,
            },
            {
              status: 500,
            }
          )
        }

        const existingByName =
          (
            existingProfiles ?? []
          ).find(
            (profile) =>
              profile.name
                .trim()
                .toLowerCase() ===
              supplierName!
                .trim()
                .toLowerCase()
          )

        /*
         * Profile somehow already exists.
         * Update it instead of duplicating it.
         */
        if (existingByName) {
          const {
            data,
            error,
          } = await supabaseAdmin
            .from(
              'supplier_profiles'
            )
            .update(
              supplierValues
            )
            .eq(
              'id',
              existingByName.id
            )
            .select(
              SUPPLIER_FIELDS
            )
            .single()

          if (error) {
            console.error(
              'SUPPLIER PROFILE RECOVERY UPDATE ERROR:',
              error
            )

            return NextResponse.json(
              {
                error:
                  error.message,
              },
              {
                status: 500,
              }
            )
          }

          return NextResponse.json({
            success: true,
            entity:
              'supplier-profile',
            created: false,
            supplier: data,
          })
        }

        /*
         * Truly new profile.
         */
        const {
          data,
          error,
        } = await supabaseAdmin
          .from(
            'supplier_profiles'
          )
          .insert({
            name:
              supplierName,
            ...supplierValues,
            public_profile:
              false,
          })
          .select(
            SUPPLIER_FIELDS
          )
          .single()

        if (error) {
          console.error(
            'SUPPLIER PROFILE INSERT ERROR:',
            error
          )

          return NextResponse.json(
            {
              error:
                error.message,
              details:
                error.details,
              hint:
                error.hint,
              code:
                error.code,
            },
            {
              status: 500,
            }
          )
        }

        console.log(
          'SUPPLIER PROFILE CREATED:',
          data
        )

        return NextResponse.json({
          success: true,
          entity:
            'supplier-profile',
          created: true,
          supplier: data,
        })
      }

      /*
       * =================================================
       * UPDATE EXISTING SUPPLIER
       * =================================================
       */
      const {
        data,
        error,
      } = await supabaseAdmin
        .from(
          'supplier_profiles'
        )
        .update(
          supplierValues
        )
        .eq(
          'id',
          body.id
        )
        .select(
          SUPPLIER_FIELDS
        )
        .single()

      if (error) {
        console.error(
          'SUPPLIER PROFILE UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity:
          'supplier-profile',
        created: false,
        supplier: data,
      })
    }

    /*
     * =====================================================
     * RESTAURANT PROFILE SAVE
     * =====================================================
     */
    if (
      typeof body.customerId ===
        'string' &&
      (
        'slug' in body ||
        'logoUrl' in body ||
        'profileDescription' in
          body
      )
    ) {
      const cleanSlug =
        typeof body.slug ===
        'string'
          ? slugify(
              body.slug
            )
          : ''

      if (!cleanSlug) {
        return NextResponse.json(
          {
            error:
              'A valid restaurant slug is required.',
          },
          {
            status: 400,
          }
        )
      }

      const {
        data: slugMatches,
        error: slugCheckError,
      } = await supabaseAdmin
        .from('customers')
        .select(
          'id, business_name'
        )
        .eq(
          'slug',
          cleanSlug
        )

      if (slugCheckError) {
        return NextResponse.json(
          {
            error:
              slugCheckError.message,
          },
          {
            status: 500,
          }
        )
      }

      const existingCustomer =
        (
          slugMatches ?? []
        ).find(
          (customer) =>
            customer.id !==
            body.customerId
        )

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: `The slug "${cleanSlug}" is already being used by ${
              existingCustomer.business_name ||
              'another customer'
            }.`,
          },
          {
            status: 409,
          }
        )
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from('customers')
        .update({
          slug:
            cleanSlug,

          logo_url:
            typeof body.logoUrl ===
              'string' &&
            body.logoUrl.trim()
              ? body.logoUrl.trim()
              : null,

          profile_description:
            typeof body.profileDescription ===
              'string' &&
            body.profileDescription.trim()
              ? body.profileDescription.trim()
              : null,
        })
        .eq(
          'id',
          body.customerId
        )
        .select(
          CUSTOMER_FIELDS
        )
        .single()

      if (error) {
        console.error(
          'RESTAURANT PROFILE UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity:
          'restaurant-profile',
        customer: data,
      })
    }

    /*
     * =====================================================
     * RESTAURANT VISIBILITY
     * =====================================================
     */
    if (
      typeof body.customerId ===
        'string' &&
      typeof body.publicProfile ===
        'boolean'
    ) {
      if (
        body.publicProfile
      ) {
        const {
          data: customer,
          error: lookupError,
        } = await supabaseAdmin
          .from('customers')
          .select(
            'id, slug'
          )
          .eq(
            'id',
            body.customerId
          )
          .maybeSingle()

        if (lookupError) {
          return NextResponse.json(
            {
              error:
                lookupError.message,
            },
            {
              status: 500,
            }
          )
        }

        if (!customer) {
          return NextResponse.json(
            {
              error:
                'Customer not found.',
            },
            {
              status: 404,
            }
          )
        }

        if (
          !customer.slug?.trim()
        ) {
          return NextResponse.json(
            {
              error:
                'Configure the restaurant before making it public.',
            },
            {
              status: 400,
            }
          )
        }
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from('customers')
        .update({
          public_profile:
            body.publicProfile,
        })
        .eq(
          'id',
          body.customerId
        )
        .select(
          CUSTOMER_FIELDS
        )
        .single()

      if (error) {
        console.error(
          'RESTAURANT VISIBILITY UPDATE ERROR:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        )
      }

      return NextResponse.json({
        success: true,
        entity:
          'restaurant-visibility',
        customer: data,
      })
    }

    /*
     * =====================================================
     * UNKNOWN
     * =====================================================
     */
    return NextResponse.json(
      {
        error:
          'No recognizable traceability action was provided.',
      },
      {
        status: 400,
      }
    )
  } catch (error) {
    console.error(
      'TRACEABILITY PATCH FATAL:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error.',
      },
      {
        status: 500,
      }
    )
  }
}