import { getProducts } from '@/lib/products'
import ProductsClient from '@/components/buyer/ProductsClient'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const products = await getProducts()

  return <ProductsClient products={products} initialCategory={category || ''} />
}