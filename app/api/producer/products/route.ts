// app/api/producer/products/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.userId || !body.name || !body.category) {
      return NextResponse.json(
        { error: 'Missing required product information.' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', body.userId)
      .single()

    if (profileError || profile?.role !== 'producer') {
      return NextResponse.json(
        { error: 'Only producer accounts can submit products.' },
        { status: 403 }
      )
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('customer_members')
      .select('customer_id')
      .eq('user_id', body.userId)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Producer account could not be found.' },
        { status: 403 }
      )
    }

    const { data: customer, error: customerError } = await supabaseAdmin
  .from('customers')
  .select('business_name')
  .eq('id', membership.customer_id)
  .single()

if (customerError || !customer) {
  return NextResponse.json(
    { error: 'Producer business could not be found.' },
    { status: 403 }
  )
}

const { error } = await supabaseAdmin.from('producer_products').insert({
  producer_customer_id: membership.customer_id,

  sku: body.sku || null,
  name: body.name,
  category: body.category,

  supplier: customer.business_name || null,

  unit: body.unit || null,
  price: body.price,
  cost_price: body.cost_price,
  description: body.description || null,
  image_url: body.image_url || null,

  is_active: false,
  in_stock: body.in_stock ?? true,
  price_on_request: body.price_on_request ?? false,
  pricing_type: 'fixed',

  status: 'pending_review',
  submitted_at: new Date().toISOString(),
})

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Could not submit product.' },
      { status: 500 }
    )
  }
}