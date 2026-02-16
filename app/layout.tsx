import React from "react"
import type { Metadata } from 'next'
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from 'sonner'
import { initializeServer } from '@/lib/server/initialize'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

// Phase 2: Initialize job runner on server startup
initializeServer().catch(err => console.error('[Init Error]', err))

export const metadata: Metadata = {
  title: 'FRAME - Your Gallery, Your Story',
  description: 'Upload, organize, and share your visual stories. A modern gallery platform for creators.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00D9FF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
            }}
          />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
