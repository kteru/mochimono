import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'

export const metadata: Metadata = {
  title: '持ち物メモ',
  description: '持ち物をメモするアプリ',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <MantineProvider
          theme={{
            primaryColor: 'blue',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            headings: { fontFamily: 'system-ui, -apple-system, sans-serif' },
          }}
        >
          <ModalsProvider>
            <Notifications />
            <Providers>
              <div className="app-container">
                <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem 1rem' }}>
                  {children}
                </div>
              </div>
            </Providers>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}