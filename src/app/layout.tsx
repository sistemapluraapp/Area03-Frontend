import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plura — Área 03 (Gov)',
  description: 'Páginas institucionais — Plura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
