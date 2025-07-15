import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HB Inventory',
  description: 'Sistema de inventario de Ativos',
  generator: 'Paulo Oliveira',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
