'use client'

import { useEffect, useMemo, useState } from 'react'
import { getProducts } from '@/lib/products'
import { getCustomers } from '@/lib/customers'

export default function NewEmailCampaignPage() {
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [title, setTitle] = useState("This Week's Specials")
  const [headline, setHeadline] = useState("Fresh deals for this week's delivery")
  const [deliveryCutoff, setDeliveryCutoff] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [debug, setDebug] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const productData = await getProducts()
      const customerData = await getCustomers()
      setProducts(productData || [])
      setCustomers(customerData || [])
    }

    load()
  }, [])

  const customersWithEmail = useMemo(
    () => customers.filter((customer) => customer.email),
    [customers]
  )

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase().trim()
    if (!query) return customersWithEmail

    return customersWithEmail.filter((customer) =>
      customer.name?.toLowerCase().includes(query) ||
      customer.business_name?.toLowerCase().includes(query) ||
      customer.company_name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  }, [customersWithEmail, customerSearch])

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase().trim()
    if (!query) return products

    return products.filter((product) =>
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  }, [products, productSearch])

  const selectedCustomers = useMemo(
    () => customersWithEmail.filter((customer) => selectedCustomerIds.includes(customer.id)),
    [customersWithEmail, selectedCustomerIds]
  )

  function toggleProduct(product: any) {
    setSelectedProducts((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product]
    )
  }

  function toggleCustomer(customer: any) {
    setSelectedCustomerIds((current) =>
      current.includes(customer.id)
        ? current.filter((id) => id !== customer.id)
        : [...current, customer.id]
    )
  }

  function selectAllVisibleCustomers() {
    setSelectedCustomerIds((current) =>
      Array.from(new Set([...current, ...filteredCustomers.map((c) => c.id)]))
    )
  }

  async function parseResponse(res: Response) {
    const text = await res.text()

    try {
      return JSON.parse(text)
    } catch {
      return { raw: text }
    }
  }

  async function sendTest() {
    setSending(true)
    setDebug(null)

    try {
      const payload = {
        to: testEmail,
        title,
        headline,
        deliveryCutoff,
        products: selectedProducts,
      }

      const res = await fetch('/api/email-campaigns/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(res)

      setDebug({
        type: 'test',
        status: res.status,
        ok: res.ok,
        payload,
        response: data,
      })

      if (!res.ok) return

      alert('Test email sent')
    } catch (error) {
      setDebug({
        type: 'test',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSending(false)
    }
  }

  async function sendCampaign() {
    if (selectedCustomers.length === 0) {
      alert('Select at least one customer')
      return
    }

    setSending(true)
    setDebug(null)

    try {
      const payload = {
        recipients: selectedCustomers.map((customer) => ({
          id: customer.id,
          email: customer.email,
          name: customer.name,
          business_name: customer.business_name || customer.company_name,
        })),
        title,
        headline,
        deliveryCutoff,
        products: selectedProducts,
      }

      const res = await fetch('/api/email-campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(res)

      setDebug({
        type: 'campaign',
        status: res.status,
        ok: res.ok,
        payload,
        response: data,
      })

      if (!res.ok) return

      alert(`Campaign sent. Sent: ${data.sent}. Failed: ${data.failed}.`)
    } catch (error) {
      setDebug({
        type: 'campaign',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#244f3d]">
            Email Campaigns
          </p>
          <h1 className="text-4xl font-black text-[#1f2f26]">
            Weekly Specials Builder
          </h1>
        </div>

        {debug && (
          <section className="rounded-3xl border border-red-300 bg-white p-6">
            <h2 className="mb-3 text-xl font-black text-red-700">
              Live Debug Output
            </h2>
            <pre className="max-h-[500px] overflow-auto rounded-xl bg-black p-4 text-xs text-green-300">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </section>
        )}

        <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border p-3" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="rounded-xl border p-3" value={deliveryCutoff} onChange={(e) => setDeliveryCutoff(e.target.value)} placeholder="Order cutoff" />
            <input className="rounded-xl border p-3 md:col-span-2" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
        </section>

        <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-[#1f2f26]">Select Customers</h2>
            <p className="text-sm font-bold text-[#6f675c]">{selectedCustomers.length} selected</p>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <input className="flex-1 rounded-xl border p-3" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search customers..." />
            <button type="button" onClick={selectAllVisibleCustomers} className="rounded-xl bg-[#244f3d] px-5 py-3 font-black text-white">Select Visible</button>
            <button type="button" onClick={() => setSelectedCustomerIds([])} className="rounded-xl border px-5 py-3 font-black">Clear</button>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-2xl border border-[#d6cec0]">
            {filteredCustomers.map((customer) => {
              const selected = selectedCustomerIds.includes(customer.id)
              const displayName = customer.business_name || customer.company_name || customer.name || 'Unnamed Customer'

              return (
                <button key={customer.id} type="button" onClick={() => toggleCustomer(customer)} className={`flex w-full items-center justify-between border-b p-4 text-left ${selected ? 'bg-[#eef5ec]' : 'bg-white'}`}>
                  <div>
                    <p className="font-black text-[#1f2f26]">{displayName}</p>
                    <p className="text-sm text-[#6f675c]">{customer.email}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border ${selected ? 'bg-[#244f3d]' : ''}`} />
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
          <h2 className="mb-4 text-2xl font-black text-[#1f2f26]">Select Products</h2>
          <input className="mb-4 w-full rounded-xl border p-3" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." />

          <div className="grid gap-4 md:grid-cols-3">
            {filteredProducts.map((product) => {
              const selected = selectedProducts.some((item) => item.id === product.id)

              return (
                <button key={product.id} type="button" onClick={() => toggleProduct(product)} className={`rounded-2xl border p-4 text-left ${selected ? 'border-[#244f3d] bg-[#eef5ec]' : 'border-[#d6cec0] bg-white'}`}>
                  {product.image_url && <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-xl object-cover" />}
                  <h3 className="font-black text-[#1f2f26]">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <p className="mt-2 font-bold">{product.price ? `$${Number(product.price).toFixed(2)}` : 'No price'}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[#d6cec0] bg-white p-6">
          <h2 className="mb-4 text-2xl font-black text-[#1f2f26]">Send</h2>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input className="rounded-xl border p-3" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email.com" />

            <button type="button" onClick={sendTest} disabled={sending || !testEmail || selectedProducts.length === 0} className="rounded-xl bg-[#244f3d] px-6 py-3 font-black text-white disabled:opacity-50">
              {sending ? 'Sending...' : 'Send Test'}
            </button>

            <button type="button" onClick={sendCampaign} disabled={sending || selectedProducts.length === 0 || selectedCustomers.length === 0} className="rounded-xl bg-[#1d1d1b] px-6 py-3 font-black text-white disabled:opacity-50">
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}