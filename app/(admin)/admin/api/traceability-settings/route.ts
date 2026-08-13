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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .order('business_name', {
        ascending: true,
        nullsFirst: false,
      })

    if (error) {
      console.error(
        'Failed to load traceability customers:',
        error
      )

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      customers: data ?? [],
    })
  } catch (error) {
    console.error(
      'Traceability settings GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const customerId = body.customerId

    if (
      typeof customerId !== 'string' ||
      !customerId.trim()
    ) {
      return NextResponse.json(
        { error: 'Customer ID is required.' },
        { status: 400 }
      )
    }

    /*
     * Load the existing customer.
     */
    const {
      data: currentCustomer,
      error: currentCustomerError,
    } = await supabaseAdmin
      .from('customers')
      .select(CUSTOMER_FIELDS)
      .eq('id', customerId)
      .maybeSingle()

    if (currentCustomerError) {
      console.error(
        'Failed to load customer:',
        currentCustomerError
      )

      return NextResponse.json(
        { error: currentCustomerError.message },
        { status: 500 }
      )
    }

    if (!currentCustomer) {
      return NextResponse.json(
        { error: 'Customer not found.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    /*
     * ==========================================
     * SLUG
     * ==========================================
     *
     * Can be configured while profile is hidden.
     */
    if ('slug' in body) {
      if (typeof body.slug !== 'string') {
        return NextResponse.json(
          { error: 'Slug must be a string.' },
          { status: 400 }
        )
      }

      const cleanSlug = body.slug
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      if (!cleanSlug) {
        return NextResponse.json(
          { error: 'Please enter a valid slug.' },
          { status: 400 }
        )
      }

      /*
       * Make sure another customer does not
       * already have this slug.
       */
      const {
        data: existingCustomer,
        error: slugCheckError,
      } = await supabaseAdmin
        .from('customers')
        .select(`
          id,
          business_name
        `)
        .eq('slug', cleanSlug)
        .neq('id', customerId)
        .maybeSingle()

      if (slugCheckError) {
        console.error(
          'Slug check failed:',
          slugCheckError
        )

        return NextResponse.json(
          { error: slugCheckError.message },
          { status: 500 }
        )
      }

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: `The slug "${cleanSlug}" is already being used by ${
              existingCustomer.business_name ||
              'another customer'
            }.`,
          },
          { status: 409 }
        )
      }

      updateData.slug = cleanSlug
    }

    /*
     * ==========================================
     * LOGO URL
     * ==========================================
     */
    if ('logoUrl' in body) {
      if (
        body.logoUrl !== null &&
        typeof body.logoUrl !== 'string'
      ) {
        return NextResponse.json(
          {
            error:
              'Logo URL must be a string or null.',
          },
          { status: 400 }
        )
      }

      updateData.logo_url =
        typeof body.logoUrl === 'string' &&
        body.logoUrl.trim()
          ? body.logoUrl.trim()
          : null
    }

    /*
     * ==========================================
     * PROFILE DESCRIPTION
     * ==========================================
     */
    if ('profileDescription' in body) {
      if (
        body.profileDescription !== null &&
        typeof body.profileDescription !== 'string'
      ) {
        return NextResponse.json(
          {
            error:
              'Profile description must be a string or null.',
          },
          { status: 400 }
        )
      }

      updateData.profile_description =
        typeof body.profileDescription === 'string' &&
        body.profileDescription.trim()
          ? body.profileDescription.trim()
          : null
    }

    /*
     * ==========================================
     * PUBLIC PROFILE
     * ==========================================
     *
     * IMPORTANT:
     * We ONLY validate publicProfile if the
     * request actually contains publicProfile.
     *
     * Saving slug/logo/description does NOT
     * require publicProfile.
     */
    if ('publicProfile' in body) {
      if (typeof body.publicProfile !== 'boolean') {
        return NextResponse.json(
          {
            error:
              'publicProfile must be true or false.',
          },
          { status: 400 }
        )
      }

      /*
       * If turning public ON, require a slug.
       *
       * Use new slug if this same request contains
       * one; otherwise use the existing slug.
       */
      if (body.publicProfile === true) {
        const effectiveSlug =
          typeof updateData.slug === 'string'
            ? updateData.slug
            : currentCustomer.slug?.trim()

        if (!effectiveSlug) {
          return NextResponse.json(
            {
              error:
                'Configure the restaurant profile and add a slug before making it public.',
            },
            { status: 400 }
          )
        }
      }

      updateData.public_profile =
        body.publicProfile
    }

    /*
     * Nothing to update?
     */
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid profile fields were provided.',
        },
        { status: 400 }
      )
    }

    /*
     * Save update.
     */
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select(CUSTOMER_FIELDS)
      .maybeSingle()

    if (error) {
      console.error(
        'Failed to update traceability customer:',
        error
      )

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Customer not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      customer: data,
    })
  } catch (error) {
    console.error(
      'Traceability settings PATCH error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected server error.',
      },
      { status: 500 }
    )
  }
}