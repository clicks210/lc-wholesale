import { supabase } from './supabase'

export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data ?? []
}

export async function approveCustomer(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .update({ approved: true })
    .eq('id', customerId)

  if (error) throw error
}

export async function unapproveCustomer(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .update({ approved: false })
    .eq('id', customerId)

  if (error) throw error
}

export async function updateCustomerDeliveryTerms(
  customerId: string,
  values: {
    order_minimum: number
    delivery_cost: number
  }
) {
  const { error } = await supabase
    .from('customers')
    .update({
      order_minimum: values.order_minimum,
      delivery_cost: values.delivery_cost,
    })
    .eq('id', customerId)

  if (error) throw error
}