import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Anw Ka Ta Djì - Le carburant intelligent du Mali',
  description: 'Plateforme numérique de gestion intelligente de l\'approvisionnement en carburant au Mali. Suivi des livraisons, traçabilité, réservation en ligne et paiement mobile.',
  keywords: ['carburant', 'Mali', 'gestion', 'livraison', 'station-service', 'digital', 'Afrique'],
  authors: [{ name: 'Anw Ka Ta Djì' }],
  openGraph: {
    title: 'Anw Ka Ta Djì - Le carburant intelligent du Mali',
    description: 'Plateforme numérique de gestion intelligente de l\'approvisionnement en carburant au Mali',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} bg-[#050505]`}>
      <body className="font-sans antialiased bg-[#050505] text-[#f5f5f5]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
