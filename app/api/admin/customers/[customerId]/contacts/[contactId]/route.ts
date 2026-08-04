import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ customerId: string; contactId: string }>
  }
) {
  try {
    const { customerId, contactId } = await context.params
    const body = await request.json()

    const updates: Record<string, boolean> = {}

    if ('receives_order_confirmations' in body) {
      updates.receives_order_confirmations = Boolean(
        body.receives_order_confirmations
      )
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields supplied' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('customer_contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('customer_id', customerId)
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

    if (error) throw error

    return NextResponse.json({
      success: true,
      contact: data,
    })
  } catch (error: any) {
    console.error('Customer contact PATCH failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update contact',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ customerId: string; contactId: string }>
  }
) {
  try {
    const { customerId, contactId } = await context.params

    const { error } = await supabaseAdmin
      .from('customer_contacts')
      .delete()
      .eq('id', contactId)
      .eq('customer_id', customerId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Customer contact DELETE failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove contact',
      },
      { status: 500 }
    )
  }
}