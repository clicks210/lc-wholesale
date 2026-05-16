import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Local Connect Foodservice',
    template: '%s | Local Connect',
  },

  description:
    'Wholesale food distribution across BC. Produce, bakery, poultry, dairy, and paper products for restaurants and commercial kitchens.',

  keywords: [
    'wholesale food',
    'restaurant supplier',
    'foodservice distributor',
    'kamloops wholesale',
    'bc food distribution',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f4f1ea] text-[#1e1e1e]">
        {children}
      </body>
    </html>
  )
}