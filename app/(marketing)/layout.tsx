import MarketingPageNav from '@/components/MarketingPage-Nav'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingPageNav />

      <main className="min-h-screen">
        {children}
      </main>
    </>
  )
}