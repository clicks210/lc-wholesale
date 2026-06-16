import { supabase } from './supabase'
import type { Product } from '@/types/product'

type ProductInput = {
  sku: string
  name: string
  category?: string
  unit?: string
  price: number | null
  price_on_request?: boolean
  cost_price?: number | null
  supplier?: string
  description?: string
  image_url?: string
  is_active?: boolean
  in_stock?: boolean

  producer_customer_id?: string | null
  source_type?: 'lc' | 'producer'
  fulfillment_type?: 'lc_stocked' | 'producer_fulfilled'
}

const productSelect = '*'

const productReadTable = 'products_with_delivery'
const productWriteTable = 'products'

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from(productReadTable)
    .select(productSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return dedupeProducts(normalizeProducts(data ?? []))
}

export async function createProduct(product: ProductInput) {
  const payload = buildProductPayload(product)

  if (payload.producer_customer_id && payload.sku) {
    const { error } = await supabase.from(productWriteTable).upsert(payload, {
      onConflict: 'producer_customer_id,sku',
    })

    if (error) throw error
    return
  }

  const { error } = await supabase.from(productWriteTable).insert(payload)

  if (error) throw error
}

export async function publishProducerProduct(product: ProductInput) {
  if (!product.producer_customer_id) {
    throw new Error('Producer customer ID is required.')
  }

  if (!product.sku) {
    throw new Error('SKU is required before publishing.')
  }

  const payload = buildProductPayload({
    ...product,
    source_type: 'producer',
    fulfillment_type: product.fulfillment_type || 'producer_fulfilled',
    is_active: product.is_active ?? true,
  })

  const { error } = await supabase.from(productWriteTable).upsert(payload, {
    onConflict: 'producer_customer_id,sku',
  })

  if (error) throw error
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from(productWriteTable)
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from(productWriteTable)
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteProducts(ids: string[]) {
  const { error } = await supabase
    .from(productWriteTable)
    .delete()
    .in('id', ids)

  if (error) throw error
}

export async function getProductById(productId: string): Promise<Product> {
  const { data, error } = await supabase
    .from(productReadTable)
    .select(productSelect)
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (error) throw error

  return normalizeProduct(data)
}

export async function updateProduct(
  productId: string,
  values: Partial<ProductInput>
) {
  const updateValues = {
    ...values,
    price: values.price_on_request ? null : values.price,
  }

  const { error } = await supabase
    .from(productWriteTable)
    .update(updateValues)
    .eq('id', productId)

  if (error) throw error
}

function buildProductPayload(product: ProductInput) {
  return {
    sku: product.sku,
    name: product.name,
    category: product.category || null,
    unit: product.unit || null,
    price: product.price_on_request ? null : product.price,
    price_on_request: product.price_on_request ?? false,
    cost_price: product.cost_price ?? null,
    supplier: product.supplier || null,
    description: product.description || null,
    image_url: product.image_url || null,
    is_active: product.is_active ?? true,
    in_stock: product.in_stock ?? true,

    producer_customer_id: product.producer_customer_id ?? null,
    source_type: product.source_type ?? 'lc',
    fulfillment_type: product.fulfillment_type ?? 'lc_stocked',
  }
}

function normalizeProducts(products: Product[]) {
  return products.map(normalizeProduct)
}

function normalizeProduct(product: any) {
  const isLcFulfilled =
    product.fulfillment_type === 'lc_stocked' ||
    product.producer_delivery_fulfillment_type === 'local_connect'

  const categoryDeliverySchedule = Array.isArray(
    product.category_delivery_schedule
  )
    ? product.category_delivery_schedule
    : []

  const producerDeliverySchedule = Array.isArray(product.delivery_schedule)
    ? product.delivery_schedule
    : []

  const deliverySchedule = isLcFulfilled
    ? categoryDeliverySchedule
    : producerDeliverySchedule

  return {
    ...product,

    fulfillment_type: isLcFulfilled
      ? 'lc_stocked'
      : product.fulfillment_type || 'producer_fulfilled',

    category_minimum: Number(product.category_minimum || 0),

    delivery_schedule: deliverySchedule,

    delivery_days: deliverySchedule.map((item: any) => item.delivery_day),
  }
}

function dedupeProducts(products: Product[]) {
  const seen = new Set<string>()

  return products.filter((product: any) => {
    const key = product.producer_customer_id
      ? `${product.producer_customer_id}-${product.sku}`
      : product.id

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}