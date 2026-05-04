import { supabase } from './supabase'
import type { Product } from '@/types/product'

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data ?? []
}

export async function createProduct(product: {
  sku: string
  name: string
  category?: string
  unit?: string
  price: number
  cost_price?: number | null
  supplier?: string
  description?: string
  image_url?: string
  is_active?: boolean
}) {
  const { error } = await supabase.from('products').insert({
    sku: product.sku,
    name: product.name,
    category: product.category || null,
    unit: product.unit || null,
    price: product.price,
    cost_price: product.cost_price ?? null,
    supplier: product.supplier || null,
    description: product.description || null,
    image_url: product.image_url || null,
    is_active: product.is_active ?? true,
  })

  if (error) throw error
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteProducts(ids: string[]) {
  const { error } = await supabase
    .from('products')
    .delete()
    .in('id', ids)

  if (error) throw error
}

export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(productId: string, values: any) {
  const { error } = await supabase
    .from('products')
    .update(values)
    .eq('id', productId)

  if (error) throw error
}