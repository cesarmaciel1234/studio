import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase"

export const metadata: Metadata = {
  title: "RutaRápida Pro",
  description: "The ultimate delivery management PWA for professional fleets.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RutaRápida",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-slate-50 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
        <FirebaseClientProvider>
          <main className="max-w-md mx-auto min-h-screen h-screen bg-background relative shadow-2xl md:shadow-none overflow-hidden">
            {children}
          </main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  )
}
