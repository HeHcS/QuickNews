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
          {/* Phone Container */}
          <div className="w-[360px] tall-screen:w-[720px] h-screen max-h-screen aspect-[375/700] bg-black rounded-3xl overflow-hidden shadow-2xl relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
} 