import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { SITE_URL } from '@/lib/config'
import './globals.css'

const title = 'BurnRate — Subscription Tracker for macOS'
const description =
  'Track every subscription. See every dollar burn. A beautiful menu bar app for macOS — local-first, private, and free.'

// eslint-disable-next-line react-refresh/only-export-components -- Next.js metadata convention
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: 'BurnRate',
  icons: { icon: '/icon.png', apple: '/app-icon-512.png' },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'BurnRate — Know Your Burn Rate',
    description:
      'A beautiful macOS menu bar app that tracks your subscription spending in real-time.',
    url: SITE_URL,
    siteName: 'BurnRate',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BurnRate',
    description: 'Subscription tracker that lives in your macOS menu bar.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="antialiased">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
