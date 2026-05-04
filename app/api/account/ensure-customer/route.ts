import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID.' }, { status: 400 })
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: userError?.message || 'User not found.' },
        { status: 400 }
      )
    }

    const user = userData.user
    const meta = user.user_metadata || {}

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email has not been verified yet.' },
        { status: 403 }
      )
    }

    const { data: existingCustomer, error: existingError } = await supabaseAdmin
      .from('customers')
      .select('id, approved')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 400 }
      )
    }

    if (existingCustomer) {
      if (meta.accessApproved && !existingCustomer.approved) {
        const { error: updateError } = await supabaseAdmin
          .from('customers')
          .update({ approved: true })
          .eq('id', existingCustomer.id)

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 400 }
          )
        }
      }

      return NextResponse.json({ success: true })
    }

    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: user.id,
        business_name: meta.businessName || '',
        contact_name: meta.contactName || '',
        email: user.email,
        phone: meta.phone || '',
        approved: Boolean(meta.accessApproved),
        order_minimum: 0,
        delivery_cost: 0,
      })

    if (customerError) {
      return NextResponse.json(
        { error: customerError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      approved: Boolean(meta.accessApproved),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Could not create customer.' },
      { status: 500 }
    )
  }
}