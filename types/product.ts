export type Product = {
  id: string
  sku: string | null
  name: string
  category: string | null
  unit: string | null
  price: number | null
  price_on_request: boolean
  cost_price: number | null
  description: string | null
  image_url: string | null
  supplier: string | null
  is_active: boolean
  created_at: string
}