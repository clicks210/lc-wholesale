import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  const { email, password, businessName, contactName, phone } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || 'Signup failed' },
      { status: 400 }
    )
  }

  const { error: customerError } = await supabaseAdmin.from('customers').insert({
    user_id: data.user.id,
    business_name: businessName,
    contact_name: contactName,
    email,
    phone,
    approved: false,
  })

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}