import { supabase } from "@/lib/supabase"
import { CATEGORY_RULES } from "@/lib/fulfillmentRules"
import CategoryProductsClient from "./CategoryProductsClient"

export default async function AdminCategoriesPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">
          Categories
        </h1>

        <p className="mt-4 text-red-600">
          Error loading products: {error.message}
        </p>
      </main>
    )
  }

  const groupedProducts =
    products?.reduce(
      (
        acc: Record<string, any[]>,
        product: any
      ) => {
        const category =
          product.category || "Uncategorized"

        if (!acc[category]) {
          acc[category] = []
        }

        acc[category].push(product)

        return acc
      },
      {}
    ) || {}

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Category Rules
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage fulfillment rules and stock
          status.
        </p>
      </div>

      <CategoryProductsClient
        groupedProducts={groupedProducts}
        categoryRules={CATEGORY_RULES}
      />
    </main>
  )
}