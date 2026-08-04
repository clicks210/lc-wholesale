import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params

    const { data, error } = await supabaseAdmin
      .from('customer_contacts')
      .select(`
        id,
        customer_id,
        name,
        email,
        phone,
        receives_order_confirmations,
        created_at,
        updated_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      contacts: data ?? [],
    })
  } catch (error: any) {
    console.error('Customer contacts GET failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load contacts',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params
    const body = await request.json()

    const email = String(body.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('customer_contacts')
      .insert({
        customer_id: customerId,
        name: body.name?.trim() || null,
        email,
        phone: body.phone?.trim() || null,
        receives_order_confirmations:
          body.receives_order_confirmations ?? true,
      })
      .select(`
        id,
        customer_id,
        name,
        email,
        phone,
        receives_order_confirmations,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'That email is already attached to this business.',
          },
          { status: 409 }
        )
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      contact: data,
    })
  } catch (error: any) {
    console.error('Customer contacts POST failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add contact',
      },
      { status: 500 }
    )
  }
}