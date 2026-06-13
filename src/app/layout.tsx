import type { Metadata, Viewport } from "next"
import "./globals.css"
import Providers from "@/components/Providers"

export const viewport: Viewport = {
  themeColor: "#4F46E5",
}

export const metadata: Metadata = {
  title: "Sky English Teacher System",
  description: "Teacher's dashboard for evaluating student skills and activities.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sky English",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
