'use client'

import { useEffect, useMemo, useState } from 'react'

type Customer = {
  id: string
  business_name: string | null
  delivery_city: string | null
  email: string | null
  slug: string | null
  public_profile: boolean | null
  logo_url: string | null
  profile_description: string | null
}

type Product = {
  id: string
  name: string | null
  supplier: string | null
  category: string | null
  image_url: string | null
  public_traceability: boolean | null
}

type Supplier = {
  id: string
  name: string
  slug: string
  location: string | null
  story: string | null
  logo_url: string | null
  hero_image_url: string | null
  website_url: string | null
  instagram_url: string | null
  public_profile: boolean | null
}

type ProductAssignment = {
  id: string
  customer_id: string
  product_id: string
  created_at: string | null
}

type SupplierAssignment = {
  id: string
  customer_id: string
  supplier_profile_id: string
  created_at: string | null
}

type ApiResponse = {
  customers?: Customer[]
  products?: Product[]
  suppliers?: Supplier[]

  productAssignments?: ProductAssignment[]
  supplierAssignments?: SupplierAssignment[]

  customer?: Customer
  product?: Product
  supplier?: Supplier

  assignment?: ProductAssignment | SupplierAssignment

  success?: boolean
  assigned?: boolean
  error?: string
  raw?: string
}

type RestaurantEditForm = {
  slug: string
  logoUrl: string
  profileDescription: string
}

type SupplierEditForm = {
  slug: string
  location: string
  story: string
  logoUrl: string
  heroImageUrl: string
  websiteUrl: string
  instagramUrl: string
}

type Tab =
  | 'restaurants'
  | 'products'
  | 'suppliers'

export default function TraceabilitySettingsPage() {
  const [tab, setTab] =
    useState<Tab>('restaurants')

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [products, setProducts] =
    useState<Product[]>([])

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])

  const [
    productAssignments,
    setProductAssignments,
  ] = useState<ProductAssignment[]>([])

  const [
    supplierAssignments,
    setSupplierAssignments,
  ] = useState<SupplierAssignment[]>([])

  const [customerSearch, setCustomerSearch] =
    useState('')

  const [productSearch, setProductSearch] =
    useState('')

  const [supplierSearch, setSupplierSearch] =
    useState('')

  const [
    assignmentProductSearch,
    setAssignmentProductSearch,
  ] = useState('')

  const [
    assignmentSupplierSearch,
    setAssignmentSupplierSearch,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [savingIds, setSavingIds] =
    useState<string[]>([])

  const [
    editingRestaurantId,
    setEditingRestaurantId,
  ] = useState<string | null>(null)

  const [
    managingRestaurantId,
    setManagingRestaurantId,
  ] = useState<string | null>(null)

  const [
    editingSupplierId,
    setEditingSupplierId,
  ] = useState<string | null>(null)

  const [
    restaurantEditForm,
    setRestaurantEditForm,
  ] =
    useState<RestaurantEditForm>({
      slug: '',
      logoUrl: '',
      profileDescription: '',
    })

  const [
    supplierEditForm,
    setSupplierEditForm,
  ] =
    useState<SupplierEditForm>({
      slug: '',
      location: '',
      story: '',
      logoUrl: '',
      heroImageUrl: '',
      websiteUrl: '',
      instagramUrl: '',
    })

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadTraceabilitySettings()
  }, [])

  async function parseResponse(
    res: Response
  ): Promise<ApiResponse> {
    const text = await res.text()

    if (!text) {
      return {}
    }

    try {
      return JSON.parse(text)
    } catch {
      console.error(
        'API returned non-JSON response:',
        {
          status: res.status,
          statusText: res.statusText,
          url: res.url,
          response: text,
        }
      )

      return {
        error: `The API returned ${res.status} ${res.statusText} instead of JSON.`,
        raw: text,
      }
    }
  }

  async function loadTraceabilitySettings() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to load traceability settings. Server returned ${res.status}.`
        )
      }

      setCustomers(
        Array.isArray(data.customers)
          ? data.customers
          : []
      )

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      )

      setSuppliers(
        Array.isArray(data.suppliers)
          ? data.suppliers
          : []
      )

      setProductAssignments(
        Array.isArray(
          data.productAssignments
        )
          ? data.productAssignments
          : []
      )

      setSupplierAssignments(
        Array.isArray(
          data.supplierAssignments
        )
          ? data.supplierAssignments
          : []
      )
    } catch (err) {
      console.error(
        'Failed to load traceability settings:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load traceability settings.'
      )
    } finally {
      setLoading(false)
    }
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function productAssignmentSavingKey(
    customerId: string,
    productId: string
  ) {
    return `restaurant-product:${customerId}:${productId}`
  }

  function supplierAssignmentSavingKey(
    customerId: string,
    supplierId: string
  ) {
    return `restaurant-supplier:${customerId}:${supplierId}`
  }

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase()

      if (!query) return customers

      return customers.filter(
        (customer) =>
          customer.business_name
            ?.toLowerCase()
            .includes(query) ||
          customer.delivery_city
            ?.toLowerCase()
            .includes(query) ||
          customer.email
            ?.toLowerCase()
            .includes(query) ||
          customer.slug
            ?.toLowerCase()
            .includes(query)
      )
    }, [
      customers,
      customerSearch,
    ])

  const filteredProducts =
    useMemo(() => {
      const query =
        productSearch
          .trim()
          .toLowerCase()

      if (!query) return products

      return products.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(query) ||
          product.supplier
            ?.toLowerCase()
            .includes(query) ||
          product.category
            ?.toLowerCase()
            .includes(query)
      )
    }, [
      products,
      productSearch,
    ])

  const filteredSuppliers =
    useMemo(() => {
      const query =
        supplierSearch
          .trim()
          .toLowerCase()

      if (!query) return suppliers

      return suppliers.filter(
        (supplier) =>
          supplier.name
            ?.toLowerCase()
            .includes(query) ||
          supplier.location
            ?.toLowerCase()
            .includes(query) ||
          supplier.slug
            ?.toLowerCase()
            .includes(query)
      )
    }, [
      suppliers,
      supplierSearch,
    ])

  const assignmentProducts =
    useMemo(() => {
      const query =
        assignmentProductSearch
          .trim()
          .toLowerCase()

      const sorted = [...products].sort(
        (a, b) =>
          (a.name || '').localeCompare(
            b.name || ''
          )
      )

      if (!query) return sorted

      return sorted.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(query) ||
          product.supplier
            ?.toLowerCase()
            .includes(query) ||
          product.category
            ?.toLowerCase()
            .includes(query)
      )
    }, [
      products,
      assignmentProductSearch,
    ])

  const assignmentSuppliers =
    useMemo(() => {
      const query =
        assignmentSupplierSearch
          .trim()
          .toLowerCase()

      const sorted = [...suppliers].sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      )

      if (!query) return sorted

      return sorted.filter(
        (supplier) =>
          supplier.name
            .toLowerCase()
            .includes(query) ||
          supplier.location
            ?.toLowerCase()
            .includes(query) ||
          supplier.slug
            ?.toLowerCase()
            .includes(query)
      )
    }, [
      suppliers,
      assignmentSupplierSearch,
    ])

  const publicRestaurantCount =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            customer.public_profile ===
            true
        ).length,
      [customers]
    )

  const publicProductCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.public_traceability ===
            true
        ).length,
      [products]
    )

  const publicSupplierCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.public_profile ===
            true
        ).length,
      [suppliers]
    )

  function startEditingRestaurant(
    customer: Customer
  ) {
    setEditingRestaurantId(
      customer.id
    )

    setManagingRestaurantId(null)
    setEditingSupplierId(null)

    setRestaurantEditForm({
      slug: customer.slug || '',
      logoUrl:
        customer.logo_url || '',
      profileDescription:
        customer.profile_description ||
        '',
    })

    setError(null)
  }

  function cancelEditingRestaurant() {
    setEditingRestaurantId(null)

    setRestaurantEditForm({
      slug: '',
      logoUrl: '',
      profileDescription: '',
    })
  }

  function startManagingTraceability(
    customer: Customer
  ) {
    if (
      managingRestaurantId ===
      customer.id
    ) {
      setManagingRestaurantId(null)
      return
    }

    setManagingRestaurantId(
      customer.id
    )

    setEditingRestaurantId(null)
    setEditingSupplierId(null)

    setAssignmentProductSearch('')
    setAssignmentSupplierSearch('')
    setError(null)
  }

  function startEditingSupplier(
    supplier: Supplier
  ) {
    setEditingSupplierId(
      supplier.id
    )

    setEditingRestaurantId(null)
    setManagingRestaurantId(null)

    setSupplierEditForm({
      slug: supplier.slug || '',
      location:
        supplier.location || '',
      story: supplier.story || '',
      logoUrl:
        supplier.logo_url || '',
      heroImageUrl:
        supplier.hero_image_url || '',
      websiteUrl:
        supplier.website_url || '',
      instagramUrl:
        supplier.instagram_url || '',
    })

    setError(null)
  }

  function cancelEditingSupplier() {
    setEditingSupplierId(null)

    setSupplierEditForm({
      slug: '',
      location: '',
      story: '',
      logoUrl: '',
      heroImageUrl: '',
      websiteUrl: '',
      instagramUrl: '',
    })
  }

  function isProductAssigned(
    customerId: string,
    productId: string
  ) {
    return productAssignments.some(
      (assignment) =>
        assignment.customer_id ===
          customerId &&
        assignment.product_id ===
          productId
    )
  }

  function isSupplierAssigned(
    customerId: string,
    supplierId: string
  ) {
    return supplierAssignments.some(
      (assignment) =>
        assignment.customer_id ===
          customerId &&
        assignment.supplier_profile_id ===
          supplierId
    )
  }

  function manualProductCount(
    customerId: string
  ) {
    return productAssignments.filter(
      (assignment) =>
        assignment.customer_id ===
        customerId
    ).length
  }

  function manualSupplierCount(
    customerId: string
  ) {
    return supplierAssignments.filter(
      (assignment) =>
        assignment.customer_id ===
        customerId
    ).length
  }

  async function saveRestaurantProfile(
    customer: Customer
  ) {
    if (
      savingIds.includes(
        customer.id
      )
    ) {
      return
    }

    const cleanSlug = slugify(
      restaurantEditForm.slug
    )

    if (!cleanSlug) {
      alert(
        'Please enter a valid slug.'
      )
      return
    }

    setSavingIds((current) => [
      ...current,
      customer.id,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            customerId:
              customer.id,
            slug: cleanSlug,
            logoUrl:
              restaurantEditForm.logoUrl.trim() ||
              null,
            profileDescription:
              restaurantEditForm.profileDescription.trim() ||
              null,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Failed to save profile. Server returned ${res.status}.`
        )
      }

      if (!data.customer) {
        throw new Error(
          'No updated customer was returned.'
        )
      }

      setCustomers(
        (current) =>
          current.map((item) =>
            item.id === customer.id
              ? {
                  ...item,
                  ...data.customer,
                }
              : item
          )
      )

      setEditingRestaurantId(
        null
      )
    } catch (err) {
      console.error(
        'Failed to save restaurant profile:',
        err
      )

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save profile.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== customer.id
          )
      )
    }
  }

  async function toggleRestaurant(
    customer: Customer
  ) {
    if (
      savingIds.includes(
        customer.id
      )
    ) {
      return
    }

    const nextValue =
      !Boolean(
        customer.public_profile
      )

    if (
      nextValue &&
      !customer.slug?.trim()
    ) {
      alert(
        'Configure and save this restaurant profile before making it public.'
      )

      startEditingRestaurant(
        customer
      )

      return
    }

    setSavingIds((current) => [
      ...current,
      customer.id,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            customerId:
              customer.id,
            publicProfile:
              nextValue,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update restaurant visibility.'
        )
      }

      if (data.customer) {
        setCustomers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                customer.id
                  ? {
                      ...item,
                      ...data.customer,
                    }
                  : item
            )
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update restaurant.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== customer.id
          )
      )
    }
  }

  async function toggleRestaurantProductAssignment(
    customer: Customer,
    product: Product
  ) {
    const currentlyAssigned =
      isProductAssigned(
        customer.id,
        product.id
      )

    const nextValue =
      !currentlyAssigned

    const savingKey =
      productAssignmentSavingKey(
        customer.id,
        product.id
      )

    if (
      savingIds.includes(
        savingKey
      )
    ) {
      return
    }

    setSavingIds((current) => [
      ...current,
      savingKey,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            entity:
              'restaurant-product-assignment',
            customerId:
              customer.id,
            productId:
              product.id,
            assigned:
              nextValue,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update product assignment.'
        )
      }

      if (nextValue) {
        const assignment =
          data.assignment as
            | ProductAssignment
            | undefined

        if (!assignment) {
          throw new Error(
            'Product was assigned but no assignment record was returned.'
          )
        }

        setProductAssignments(
          (current) => {
            const withoutDuplicate =
              current.filter(
                (item) =>
                  !(
                    item.customer_id ===
                      customer.id &&
                    item.product_id ===
                      product.id
                  )
              )

            return [
              ...withoutDuplicate,
              assignment,
            ]
          }
        )
      } else {
        setProductAssignments(
          (current) =>
            current.filter(
              (assignment) =>
                !(
                  assignment.customer_id ===
                    customer.id &&
                  assignment.product_id ===
                    product.id
                )
            )
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update product assignment.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== savingKey
          )
      )
    }
  }

  async function toggleRestaurantSupplierAssignment(
    customer: Customer,
    supplier: Supplier
  ) {
    if (
      supplier.id.startsWith(
        'unconfigured:'
      )
    ) {
      alert(
        'Configure this supplier profile before assigning it directly to a restaurant.'
      )
      return
    }

    const currentlyAssigned =
      isSupplierAssigned(
        customer.id,
        supplier.id
      )

    const nextValue =
      !currentlyAssigned

    const savingKey =
      supplierAssignmentSavingKey(
        customer.id,
        supplier.id
      )

    if (
      savingIds.includes(
        savingKey
      )
    ) {
      return
    }

    setSavingIds((current) => [
      ...current,
      savingKey,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            entity:
              'restaurant-supplier-assignment',
            customerId:
              customer.id,
            supplierId:
              supplier.id,
            assigned:
              nextValue,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update supplier assignment.'
        )
      }

      if (nextValue) {
        const assignment =
          data.assignment as
            | SupplierAssignment
            | undefined

        if (!assignment) {
          throw new Error(
            'Supplier was assigned but no assignment record was returned.'
          )
        }

        setSupplierAssignments(
          (current) => {
            const withoutDuplicate =
              current.filter(
                (item) =>
                  !(
                    item.customer_id ===
                      customer.id &&
                    item.supplier_profile_id ===
                      supplier.id
                  )
              )

            return [
              ...withoutDuplicate,
              assignment,
            ]
          }
        )
      } else {
        setSupplierAssignments(
          (current) =>
            current.filter(
              (assignment) =>
                !(
                  assignment.customer_id ===
                    customer.id &&
                  assignment.supplier_profile_id ===
                    supplier.id
                )
            )
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update supplier assignment.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== savingKey
          )
      )
    }
  }

  async function toggleProduct(
    product: Product
  ) {
    if (
      savingIds.includes(
        product.id
      )
    ) {
      return
    }

    const nextValue =
      !Boolean(
        product.public_traceability
      )

    setSavingIds((current) => [
      ...current,
      product.id,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            entity: 'product',
            id: product.id,
            publicTraceability:
              nextValue,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update product.'
        )
      }

      if (data.product) {
        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                product.id
                  ? {
                      ...item,
                      ...data.product,
                    }
                  : item
            )
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update product.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== product.id
          )
      )
    }
  }

  async function toggleSupplier(
    supplier: Supplier
  ) {
    if (
      savingIds.includes(
        supplier.id
      )
    ) {
      return
    }

    const nextValue =
      !Boolean(
        supplier.public_profile
      )

    if (
      nextValue &&
      !supplier.slug?.trim()
    ) {
      alert(
        'Configure this supplier before making its profile public.'
      )

      startEditingSupplier(
        supplier
      )

      return
    }

    setSavingIds((current) => [
      ...current,
      supplier.id,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            entity: 'supplier',
            id: supplier.id,
            publicProfile:
              nextValue,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update supplier.'
        )
      }

      if (data.supplier) {
        setSuppliers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                supplier.id
                  ? {
                      ...item,
                      ...data.supplier,
                    }
                  : item
            )
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update supplier.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== supplier.id
          )
      )
    }
  }

  async function saveSupplierProfile(
    supplier: Supplier
  ) {
    if (
      savingIds.includes(
        supplier.id
      )
    ) {
      return
    }

    const cleanSlug = slugify(
      supplierEditForm.slug
    )

    if (!cleanSlug) {
      alert(
        'Please enter a valid supplier slug.'
      )

      return
    }

    setSavingIds((current) => [
      ...current,
      supplier.id,
    ])

    setError(null)

    try {
      const res = await fetch(
        '/api/admin/traceability-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          body: JSON.stringify({
            entity:
              'supplier-profile',
            id: supplier.id,
            slug: cleanSlug,
            location:
              supplierEditForm.location.trim() ||
              null,
            story:
              supplierEditForm.story.trim() ||
              null,
            logoUrl:
              supplierEditForm.logoUrl.trim() ||
              null,
            heroImageUrl:
              supplierEditForm.heroImageUrl.trim() ||
              null,
            websiteUrl:
              supplierEditForm.websiteUrl.trim() ||
              null,
            instagramUrl:
              supplierEditForm.instagramUrl.trim() ||
              null,
          }),
        }
      )

      const data =
        await parseResponse(res)

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to save supplier profile.'
        )
      }

      if (!data.supplier) {
        throw new Error(
          'No updated supplier was returned.'
        )
      }

      setSuppliers(
        (current) =>
          current.map((item) =>
            item.id === supplier.id
              ? {
                  ...item,
                  ...data.supplier,
                }
              : item
          )
      )

      setEditingSupplierId(
        null
      )
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save supplier profile.'

      setError(message)
      alert(message)
    } finally {
      setSavingIds(
        (current) =>
          current.filter(
            (id) =>
              id !== supplier.id
          )
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HEADER */}
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#244f3d]">
            Traceability
          </p>

          <h1 className="text-4xl font-black text-[#1f2f26]">
            Traceability Settings
          </h1>

          <p className="mt-3 max-w-2xl text-[#6f675c]">
            Manage restaurant profiles,
            traceable products, supplier
            profiles and manual sourcing
            relationships.
          </p>
        </div>

        {/* TABS */}
        <section className="rounded-2xl border border-[#d6cec0] bg-white p-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                key: 'restaurants',
                label: 'Restaurants',
              },
              {
                key: 'products',
                label: 'Products',
              },
              {
                key: 'suppliers',
                label: 'Suppliers',
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setTab(
                    item.key as Tab
                  )
                }
                className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                  tab === item.key
                    ? 'bg-[#244f3d] text-white'
                    : 'text-[#6f675c] hover:bg-[#f8f3ea]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Restaurants Public"
            value={
              publicRestaurantCount
            }
            total={customers.length}
          />

          <StatCard
            label="Products Traceable"
            value={
              publicProductCount
            }
            total={products.length}
          />

          <StatCard
            label="Suppliers Public"
            value={
              publicSupplierCount
            }
            total={suppliers.length}
          />
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-black text-red-700">
              Unable to complete request
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* RESTAURANTS */}
        {tab === 'restaurants' && (
          <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#244f3d]">
                  Restaurant Profiles
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#1f2f26]">
                  Restaurants
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-[#6f675c]">
                  Configure public profiles
                  and manually assign products
                  or suppliers for restaurants
                  that do not order through the
                  LC platform.
                </p>
              </div>

              <div className="rounded-full bg-[#eef5ec] px-4 py-2 text-sm font-black text-[#244f3d]">
                {publicRestaurantCount}{' '}
                visible
              </div>
            </div>

            <input
              type="text"
              value={customerSearch}
              onChange={(e) =>
                setCustomerSearch(
                  e.target.value
                )
              }
              placeholder="Search customers..."
              className="mb-5 w-full rounded-xl border border-[#d6cec0] bg-white p-3 text-[#1f2f26] outline-none transition focus:border-[#244f3d]"
            />

            {loading ? (
              <LoadingPanel />
            ) : filteredCustomers.length ===
              0 ? (
              <EmptyPanel text="No restaurants found." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#d6cec0]">
                {filteredCustomers.map(
                  (
                    customer,
                    index
                  ) => {
                    const isPublic =
                      Boolean(
                        customer.public_profile
                      )

                    const saving =
                      savingIds.includes(
                        customer.id
                      )

                    const hasSlug =
                      Boolean(
                        customer.slug?.trim()
                      )

                    const isEditing =
                      editingRestaurantId ===
                      customer.id

                    const isManaging =
                      managingRestaurantId ===
                      customer.id

                    const displayName =
                      customer.business_name?.trim() ||
                      'Unnamed Customer'

                    const manualProducts =
                      manualProductCount(
                        customer.id
                      )

                    const manualSuppliers =
                      manualSupplierCount(
                        customer.id
                      )

                    return (
                      <div
                        key={
                          customer.id
                        }
                        className={
                          index !==
                          filteredCustomers.length -
                            1
                            ? 'border-b border-[#e8e1d7]'
                            : ''
                        }
                      >
                        {/* ROW */}
                        <div
                          className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                            isPublic
                              ? 'bg-[#f7fbf5]'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <Avatar
                              image={
                                customer.logo_url
                              }
                              initials={getInitials(
                                displayName
                              )}
                            />

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-[#1f2f26]">
                                  {
                                    displayName
                                  }
                                </p>

                                {isPublic && (
                                  <StatusBadge>
                                    Public
                                  </StatusBadge>
                                )}

                                {!hasSlug && (
                                  <WarningBadge>
                                    Needs Setup
                                  </WarningBadge>
                                )}

                                {(manualProducts >
                                  0 ||
                                  manualSuppliers >
                                    0) && (
                                  <InfoBadge>
                                    {
                                      manualProducts
                                    }{' '}
                                    products ·{' '}
                                    {
                                      manualSuppliers
                                    }{' '}
                                    suppliers
                                  </InfoBadge>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-[#6f675c]">
                                {customer.delivery_city
                                  ? `${customer.delivery_city}, BC`
                                  : 'No city'}
                              </p>

                              {customer.slug && (
                                <p className="mt-1 text-xs text-[#948b80]">
                                  /local/
                                  {
                                    customer.slug
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                startManagingTraceability(
                                  customer
                                )
                              }
                              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                                isManaging
                                  ? 'bg-[#244f3d] text-white'
                                  : 'border border-[#244f3d] bg-white text-[#244f3d]'
                              }`}
                            >
                              {isManaging
                                ? 'Close Traceability'
                                : 'Manage Traceability'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                isEditing
                                  ? cancelEditingRestaurant()
                                  : startEditingRestaurant(
                                      customer
                                    )
                              }
                              className="rounded-xl border border-[#d6cec0] bg-white px-4 py-2 text-sm font-black text-[#1f2f26]"
                            >
                              {isEditing
                                ? 'Close'
                                : hasSlug
                                  ? 'Edit Profile'
                                  : 'Configure Profile'}
                            </button>

                            <ToggleStatus
                              active={
                                isPublic
                              }
                              saving={
                                saving
                              }
                              label={
                                isPublic
                                  ? 'Visible'
                                  : 'Hidden'
                              }
                              onClick={() =>
                                toggleRestaurant(
                                  customer
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* PROFILE EDITOR */}
                        {isEditing && (
                          <div className="border-t border-[#e8e1d7] bg-[#fbf8f2] p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#244f3d]">
                              Public Profile
                            </p>

                            <h3 className="mt-1 text-xl font-black text-[#1f2f26]">
                              Configure{' '}
                              {
                                displayName
                              }
                            </h3>

                            <div className="mt-5 grid gap-5">
                              <Field
                                label="URL Slug"
                                value={
                                  restaurantEditForm.slug
                                }
                                onChange={(
                                  value
                                ) =>
                                  setRestaurantEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      slug: slugify(
                                        value
                                      ),
                                    })
                                  )
                                }
                              />

                              <p className="-mt-3 text-xs text-[#6f675c]">
                                Public URL:{' '}
                                <span className="font-bold text-[#244f3d]">
                                  /local/
                                  {restaurantEditForm.slug ||
                                    'restaurant-name'}
                                </span>
                              </p>

                              <Field
                                label="Logo URL"
                                value={
                                  restaurantEditForm.logoUrl
                                }
                                onChange={(
                                  value
                                ) =>
                                  setRestaurantEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      logoUrl:
                                        value,
                                    })
                                  )
                                }
                              />

                              <TextAreaField
                                label="Profile Description"
                                value={
                                  restaurantEditForm.profileDescription
                                }
                                onChange={(
                                  value
                                ) =>
                                  setRestaurantEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      profileDescription:
                                        value,
                                    })
                                  )
                                }
                              />
                            </div>

                            <div className="mt-5 flex justify-end gap-3">
                              <SecondaryButton
                                onClick={
                                  cancelEditingRestaurant
                                }
                              >
                                Cancel
                              </SecondaryButton>

                              <PrimaryButton
                                disabled={
                                  saving ||
                                  !restaurantEditForm.slug.trim()
                                }
                                onClick={() =>
                                  saveRestaurantProfile(
                                    customer
                                  )
                                }
                              >
                                {saving
                                  ? 'Saving...'
                                  : 'Save Profile'}
                              </PrimaryButton>
                            </div>
                          </div>
                        )}

                        {/* TRACEABILITY MANAGER */}
                        {isManaging && (
                          <div className="border-t border-[#d6cec0] bg-[#f3eee5] p-5 sm:p-6">
                            <div className="mb-6">
                              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#244f3d]">
                                Manual
                                Traceability
                              </p>

                              <h3 className="mt-1 text-2xl font-black text-[#1f2f26]">
                                {
                                  displayName
                                }
                              </h3>

                              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f675c]">
                                Assign products
                                and suppliers
                                directly to this
                                restaurant. These
                                relationships are
                                separate from
                                order history and
                                are useful when a
                                restaurant does
                                not order through
                                the LC platform.
                              </p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                              {/* ASSIGN PRODUCTS */}
                              <div className="rounded-2xl border border-[#d6cec0] bg-white p-5">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#244f3d]">
                                      Products
                                    </p>

                                    <h4 className="mt-1 text-xl font-black text-[#1f2f26]">
                                      Assign Products
                                    </h4>
                                  </div>

                                  <div className="rounded-full bg-[#eef5ec] px-3 py-1.5 text-xs font-black text-[#244f3d]">
                                    {
                                      manualProducts
                                    }{' '}
                                    assigned
                                  </div>
                                </div>

                                <p className="mb-4 text-sm leading-6 text-[#6f675c]">
                                  Assigned products
                                  can be shown on
                                  this restaurant's
                                  traceability
                                  profile without an
                                  LC order.
                                </p>

                                <input
                                  type="text"
                                  value={
                                    assignmentProductSearch
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setAssignmentProductSearch(
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Search products..."
                                  className="mb-4 w-full rounded-xl border border-[#d6cec0] p-3 outline-none focus:border-[#244f3d]"
                                />

                                <div className="max-h-[520px] overflow-auto rounded-xl border border-[#e8e1d7]">
                                  {assignmentProducts.map(
                                    (
                                      product,
                                      index
                                    ) => {
                                      const assigned =
                                        isProductAssigned(
                                          customer.id,
                                          product.id
                                        )

                                      const savingKey =
                                        productAssignmentSavingKey(
                                          customer.id,
                                          product.id
                                        )

                                      const assignmentSaving =
                                        savingIds.includes(
                                          savingKey
                                        )

                                      const publiclyEnabled =
                                        Boolean(
                                          product.public_traceability
                                        )

                                      return (
                                        <button
                                          key={
                                            product.id
                                          }
                                          type="button"
                                          disabled={
                                            assignmentSaving
                                          }
                                          onClick={() =>
                                            toggleRestaurantProductAssignment(
                                              customer,
                                              product
                                            )
                                          }
                                          className={`flex w-full items-center justify-between gap-4 p-3 text-left transition ${
                                            index !==
                                            assignmentProducts.length -
                                              1
                                              ? 'border-b border-[#eee8df]'
                                              : ''
                                          } ${
                                            assigned
                                              ? 'bg-[#f2f8ef]'
                                              : 'bg-white hover:bg-[#fbf8f2]'
                                          }`}
                                        >
                                          <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d6cec0] bg-[#f8f3ea]">
                                              {product.image_url ? (
                                                <img
                                                  src={
                                                    product.image_url
                                                  }
                                                  alt=""
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-[#244f3d]">
                                                  ✿
                                                </span>
                                              )}
                                            </div>

                                            <div className="min-w-0">
                                              <p className="truncate text-sm font-black text-[#1f2f26]">
                                                {product.name ||
                                                  'Unnamed Product'}
                                              </p>

                                              <p className="mt-0.5 truncate text-xs text-[#6f675c]">
                                                {product.supplier ||
                                                  'No supplier'}
                                              </p>

                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {!publiclyEnabled && (
                                                  <WarningBadge>
                                                    Public
                                                    traceability
                                                    off
                                                  </WarningBadge>
                                                )}

                                                {assigned && (
                                                  <StatusBadge>
                                                    Manual
                                                  </StatusBadge>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <AssignmentCheck
                                            active={
                                              assigned
                                            }
                                            saving={
                                              assignmentSaving
                                            }
                                          />
                                        </button>
                                      )
                                    }
                                  )}
                                </div>
                              </div>

                              {/* ASSIGN SUPPLIERS */}
                              <div className="rounded-2xl border border-[#d6cec0] bg-white p-5">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#244f3d]">
                                      Suppliers
                                    </p>

                                    <h4 className="mt-1 text-xl font-black text-[#1f2f26]">
                                      Assign Suppliers
                                    </h4>
                                  </div>

                                  <div className="rounded-full bg-[#eef5ec] px-3 py-1.5 text-xs font-black text-[#244f3d]">
                                    {
                                      manualSuppliers
                                    }{' '}
                                    assigned
                                  </div>
                                </div>

                                <p className="mb-4 text-sm leading-6 text-[#6f675c]">
                                  Use this when you
                                  want a supplier
                                  relationship shown
                                  even without
                                  assigning a
                                  specific product.
                                </p>

                                <input
                                  type="text"
                                  value={
                                    assignmentSupplierSearch
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setAssignmentSupplierSearch(
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Search suppliers..."
                                  className="mb-4 w-full rounded-xl border border-[#d6cec0] p-3 outline-none focus:border-[#244f3d]"
                                />

                                <div className="max-h-[520px] overflow-auto rounded-xl border border-[#e8e1d7]">
                                  {assignmentSuppliers.map(
                                    (
                                      supplier,
                                      index
                                    ) => {
                                      const configured =
                                        !supplier.id.startsWith(
                                          'unconfigured:'
                                        )

                                      const assigned =
                                        configured &&
                                        isSupplierAssigned(
                                          customer.id,
                                          supplier.id
                                        )

                                      const savingKey =
                                        supplierAssignmentSavingKey(
                                          customer.id,
                                          supplier.id
                                        )

                                      const assignmentSaving =
                                        savingIds.includes(
                                          savingKey
                                        )

                                      return (
                                        <button
                                          key={
                                            supplier.id
                                          }
                                          type="button"
                                          disabled={
                                            assignmentSaving ||
                                            !configured
                                          }
                                          onClick={() =>
                                            toggleRestaurantSupplierAssignment(
                                              customer,
                                              supplier
                                            )
                                          }
                                          className={`flex w-full items-center justify-between gap-4 p-3 text-left transition ${
                                            index !==
                                            assignmentSuppliers.length -
                                              1
                                              ? 'border-b border-[#eee8df]'
                                              : ''
                                          } ${
                                            assigned
                                              ? 'bg-[#f2f8ef]'
                                              : 'bg-white'
                                          } ${
                                            configured
                                              ? 'hover:bg-[#fbf8f2]'
                                              : 'cursor-not-allowed opacity-55'
                                          }`}
                                        >
                                          <div className="flex min-w-0 items-center gap-3">
                                            <Avatar
                                              image={
                                                supplier.logo_url
                                              }
                                              initials={getInitials(
                                                supplier.name
                                              )}
                                              small
                                            />

                                            <div className="min-w-0">
                                              <p className="truncate text-sm font-black text-[#1f2f26]">
                                                {
                                                  supplier.name
                                                }
                                              </p>

                                              <p className="mt-0.5 truncate text-xs text-[#6f675c]">
                                                {supplier.location ||
                                                  'No location'}
                                              </p>

                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {!configured && (
                                                  <WarningBadge>
                                                    Configure
                                                    first
                                                  </WarningBadge>
                                                )}

                                                {configured &&
                                                  !supplier.public_profile && (
                                                    <WarningBadge>
                                                      Public
                                                      profile
                                                      off
                                                    </WarningBadge>
                                                  )}

                                                {assigned && (
                                                  <StatusBadge>
                                                    Manual
                                                  </StatusBadge>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <AssignmentCheck
                                            active={
                                              assigned
                                            }
                                            saving={
                                              assignmentSaving
                                            }
                                            disabled={
                                              !configured
                                            }
                                          />
                                        </button>
                                      )
                                    }
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-[#d6cec0] bg-white p-4">
                              <p className="text-sm font-black text-[#1f2f26]">
                                Display rules
                              </p>

                              <p className="mt-1 text-sm leading-6 text-[#6f675c]">
                                Assigning a product
                                here does not
                                automatically turn
                                that product's
                                global public
                                traceability
                                setting on.
                                Likewise, manually
                                assigning a
                                supplier does not
                                automatically make
                                its supplier
                                profile public.
                                Those global
                                controls remain in
                                the Products and
                                Suppliers tabs.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#244f3d]">
                  Traceable Products
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#1f2f26]">
                  Products
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-[#6f675c]">
                  Enable products that may
                  appear publicly when they are
                  either purchased or manually
                  assigned to a restaurant.
                </p>
              </div>

              <div className="rounded-full bg-[#eef5ec] px-4 py-2 text-sm font-black text-[#244f3d]">
                {publicProductCount}{' '}
                enabled
              </div>
            </div>

            <input
              value={productSearch}
              onChange={(e) =>
                setProductSearch(
                  e.target.value
                )
              }
              placeholder="Search products, suppliers or categories..."
              className="mb-5 w-full rounded-xl border border-[#d6cec0] p-3 outline-none focus:border-[#244f3d]"
            />

            {loading ? (
              <LoadingPanel />
            ) : filteredProducts.length ===
              0 ? (
              <EmptyPanel text="No products found." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#d6cec0]">
                {filteredProducts.map(
                  (
                    product,
                    index
                  ) => {
                    const active =
                      Boolean(
                        product.public_traceability
                      )

                    const saving =
                      savingIds.includes(
                        product.id
                      )

                    return (
                      <div
                        key={
                          product.id
                        }
                        className={`flex items-center justify-between gap-5 p-4 ${
                          index !==
                          filteredProducts.length -
                            1
                            ? 'border-b border-[#e8e1d7]'
                            : ''
                        } ${
                          active
                            ? 'bg-[#f7fbf5]'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <Avatar
                            image={
                              product.image_url
                            }
                            initials="✿"
                            cover
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-[#1f2f26]">
                                {product.name ||
                                  'Unnamed Product'}
                              </p>

                              {active && (
                                <StatusBadge>
                                  Traceable
                                </StatusBadge>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-[#6f675c]">
                              {product.supplier ||
                                'No supplier'}
                            </p>

                            {product.category && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#948b80]">
                                {
                                  product.category
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <ToggleStatus
                          active={
                            active
                          }
                          saving={
                            saving
                          }
                          label={
                            active
                              ? 'Enabled'
                              : 'Hidden'
                          }
                          onClick={() =>
                            toggleProduct(
                              product
                            )
                          }
                        />
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* SUPPLIERS */}
        {tab === 'suppliers' && (
          <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#244f3d]">
                  Supplier Profiles
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#1f2f26]">
                  Suppliers
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-[#6f675c]">
                  Configure supplier stories,
                  imagery and public profile
                  availability.
                </p>
              </div>

              <div className="rounded-full bg-[#eef5ec] px-4 py-2 text-sm font-black text-[#244f3d]">
                {publicSupplierCount}{' '}
                visible
              </div>
            </div>

            <input
              value={supplierSearch}
              onChange={(e) =>
                setSupplierSearch(
                  e.target.value
                )
              }
              placeholder="Search suppliers..."
              className="mb-5 w-full rounded-xl border border-[#d6cec0] p-3 outline-none focus:border-[#244f3d]"
            />

            {loading ? (
              <LoadingPanel />
            ) : filteredSuppliers.length ===
              0 ? (
              <EmptyPanel text="No suppliers found." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#d6cec0]">
                {filteredSuppliers.map(
                  (
                    supplier,
                    index
                  ) => {
                    const active =
                      Boolean(
                        supplier.public_profile
                      )

                    const saving =
                      savingIds.includes(
                        supplier.id
                      )

                    const hasSlug =
                      Boolean(
                        supplier.slug?.trim()
                      )

                    const isEditing =
                      editingSupplierId ===
                      supplier.id

                    return (
                      <div
                        key={
                          supplier.id
                        }
                        className={
                          index !==
                          filteredSuppliers.length -
                            1
                            ? 'border-b border-[#e8e1d7]'
                            : ''
                        }
                      >
                        <div
                          className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                            active
                              ? 'bg-[#f7fbf5]'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <Avatar
                              image={
                                supplier.logo_url
                              }
                              initials={getInitials(
                                supplier.name
                              )}
                            />

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-[#1f2f26]">
                                  {
                                    supplier.name
                                  }
                                </p>

                                {active && (
                                  <StatusBadge>
                                    Public
                                  </StatusBadge>
                                )}

                                {!hasSlug && (
                                  <WarningBadge>
                                    Needs Setup
                                  </WarningBadge>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-[#6f675c]">
                                {supplier.location ||
                                  'No location'}
                              </p>

                              {hasSlug && (
                                <p className="mt-1 text-xs text-[#948b80]">
                                  /local/suppliers/
                                  {
                                    supplier.slug
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                isEditing
                                  ? cancelEditingSupplier()
                                  : startEditingSupplier(
                                      supplier
                                    )
                              }
                              className="rounded-xl border border-[#d6cec0] bg-white px-4 py-2 text-sm font-black text-[#1f2f26]"
                            >
                              {isEditing
                                ? 'Close'
                                : hasSlug
                                  ? 'Edit Profile'
                                  : 'Configure Profile'}
                            </button>

                            <ToggleStatus
                              active={
                                active
                              }
                              saving={
                                saving
                              }
                              label={
                                active
                                  ? 'Visible'
                                  : 'Hidden'
                              }
                              onClick={() =>
                                toggleSupplier(
                                  supplier
                                )
                              }
                            />
                          </div>
                        </div>

                        {isEditing && (
                          <div className="border-t border-[#e8e1d7] bg-[#fbf8f2] p-5">
                            <h3 className="text-xl font-black text-[#1f2f26]">
                              Configure{' '}
                              {
                                supplier.name
                              }
                            </h3>

                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                              <Field
                                label="URL Slug"
                                value={
                                  supplierEditForm.slug
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      slug: slugify(
                                        value
                                      ),
                                    })
                                  )
                                }
                              />

                              <Field
                                label="Location"
                                value={
                                  supplierEditForm.location
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      location:
                                        value,
                                    })
                                  )
                                }
                              />

                              <Field
                                label="Logo URL"
                                value={
                                  supplierEditForm.logoUrl
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      logoUrl:
                                        value,
                                    })
                                  )
                                }
                              />

                              <Field
                                label="Hero Image URL"
                                value={
                                  supplierEditForm.heroImageUrl
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      heroImageUrl:
                                        value,
                                    })
                                  )
                                }
                              />

                              <Field
                                label="Website URL"
                                value={
                                  supplierEditForm.websiteUrl
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      websiteUrl:
                                        value,
                                    })
                                  )
                                }
                              />

                              <Field
                                label="Instagram URL"
                                value={
                                  supplierEditForm.instagramUrl
                                }
                                onChange={(
                                  value
                                ) =>
                                  setSupplierEditForm(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      instagramUrl:
                                        value,
                                    })
                                  )
                                }
                              />

                              <div className="md:col-span-2">
                                <TextAreaField
                                  label="Supplier Story"
                                  value={
                                    supplierEditForm.story
                                  }
                                  rows={6}
                                  onChange={(
                                    value
                                  ) =>
                                    setSupplierEditForm(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        story:
                                          value,
                                      })
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <p className="mt-3 text-xs text-[#6f675c]">
                              Public URL:{' '}
                              <span className="font-bold text-[#244f3d]">
                                /local/suppliers/
                                {supplierEditForm.slug ||
                                  'supplier-name'}
                              </span>
                            </p>

                            <div className="mt-5 flex justify-end gap-3">
                              <SecondaryButton
                                onClick={
                                  cancelEditingSupplier
                                }
                              >
                                Cancel
                              </SecondaryButton>

                              <PrimaryButton
                                disabled={
                                  saving ||
                                  !supplierEditForm.slug.trim()
                                }
                                onClick={() =>
                                  saveSupplierProfile(
                                    supplier
                                  )
                                }
                              >
                                {saving
                                  ? 'Saving...'
                                  : 'Save Supplier'}
                              </PrimaryButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

function getInitials(
  name: string
) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word
          .charAt(0)
          .toUpperCase()
      )
      .join('') || 'LC'
  )
}

function Avatar({
  image,
  initials,
  cover = false,
  small = false,
}: {
  image: string | null
  initials: string
  cover?: boolean
  small?: boolean
}) {
  const size = small
    ? 'h-11 w-11 rounded-xl'
    : 'h-14 w-14 rounded-2xl'

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#d6cec0] bg-[#f8f3ea] ${size}`}
    >
      {image ? (
        <img
          src={image}
          alt=""
          className={`h-full w-full ${
            cover
              ? 'object-cover'
              : 'object-contain p-2'
          }`}
        />
      ) : (
        <span className="text-sm font-black text-[#244f3d]">
          {initials}
        </span>
      )}
    </div>
  )
}

function StatusBadge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="rounded-full bg-[#244f3d] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
      {children}
    </span>
  )
}

function WarningBadge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="rounded-full bg-[#f8eee1] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#8a5c20]">
      {children}
    </span>
  )
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="rounded-full border border-[#c9d7cf] bg-[#f4f8f5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#466759]">
      {children}
    </span>
  )
}

function AssignmentCheck({
  active,
  saving,
  disabled = false,
}: {
  active: boolean
  saving: boolean
  disabled?: boolean
}) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
        active
          ? 'border-[#244f3d] bg-[#244f3d] text-white'
          : 'border-[#cfc6b8] bg-white text-transparent'
      } ${
        disabled
          ? 'opacity-40'
          : ''
      }`}
    >
      {saving ? (
        <span className="text-[10px] font-black text-[#244f3d]">
          ...
        </span>
      ) : (
        <span className="text-sm font-black">
          ✓
        </span>
      )}
    </div>
  )
}

function ToggleStatus({
  active,
  saving,
  label,
  onClick,
}: {
  active: boolean
  saving: boolean
  label: string
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-xs font-black uppercase tracking-wider text-[#6f675c]">
          Public
        </p>

        <p
          className={`text-sm font-bold ${
            active
              ? 'text-[#244f3d]'
              : 'text-[#948b80]'
          }`}
        >
          {saving
            ? 'Saving...'
            : label}
        </p>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={onClick}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          active
            ? 'bg-[#244f3d]'
            : 'bg-[#d6cec0]'
        } ${
          saving
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            active
              ? 'left-7'
              : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

function StatCard({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  return (
    <div className="rounded-3xl border border-[#d6cec0] bg-white p-6">
      <p className="text-sm font-bold uppercase tracking-wide text-[#6f675c]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#244f3d]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#948b80]">
        of {total}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#1f2f26]">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-[#d6cec0] bg-white p-3 outline-none transition focus:border-[#244f3d]"
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
  rows?: number
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#1f2f26]">
        {label}
      </label>

      <textarea
        value={value}
        rows={rows}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full resize-none rounded-xl border border-[#d6cec0] bg-white p-3 outline-none transition focus:border-[#244f3d]"
      />
    </div>
  )
}

function LoadingPanel() {
  return (
    <div className="rounded-2xl border border-[#d6cec0] p-10 text-center">
      <p className="font-bold text-[#6f675c]">
        Loading traceability
        settings...
      </p>
    </div>
  )
}

function EmptyPanel({
  text,
}: {
  text: string
}) {
  return (
    <div className="rounded-2xl border border-[#d6cec0] p-10 text-center">
      <p className="font-bold text-[#6f675c]">
        {text}
      </p>
    </div>
  )
}

function PrimaryButton({
  children,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-[#244f3d] px-6 py-3 font-black text-white disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[#d6cec0] bg-white px-5 py-3 font-black text-[#1f2f26]"
    >
      {children}
    </button>
  )
}