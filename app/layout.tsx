import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider } from '@/theme'
import { QueryProvider } from '@/components/ui/QueryProvider'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/dm-sans'

export const metadata: Metadata = {
  title: 'BikeShed - Norwich Hackspace',
  description: 'Membership, Equipment & Booking System for Norwich Hackspace',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/fonts/chicago.css" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
