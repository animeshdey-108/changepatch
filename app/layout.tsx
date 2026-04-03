import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Initialize Geist Sans
const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

// Initialize Geist Mono
const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ChangePatch — Auto-generate changelogs from GitHub commits',
  description: 'Connect your GitHub repo and ChangePatch automatically writes, publishes, and emails your changelog every time you ship.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans bg-[#fafafa] text-[#09090b]">
        {children}
      </body>
    </html>
  )
}