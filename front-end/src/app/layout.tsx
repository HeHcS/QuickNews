import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { metadata } from './metadata'

const inter = Inter({ subsets: ['latin'] })

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900`}>
        <div className="min-h-screen flex items-center justify-center">
          {/* Phone Container - Always maintains 9:16 aspect ratio */}
          <div 
            className="h-screen max-h-screen bg-black rounded-3xl overflow-hidden shadow-2xl relative"
            style={{
              width: 'min(calc(100vh * 9/16), 100vw)',
              height: 'min(100vh, calc(100vw * 16/9))'
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  )
} 