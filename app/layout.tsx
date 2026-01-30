import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider } from '@/theme'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'

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
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
