import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { cookies } from "next/headers"
import IntlProvider from "@/components/i18n/IntlProvider"
import { defaultLocale, type Locale } from "@/lib/i18n/locales"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kesis - Ethiopian Appointment System",
  description: "Professional appointment booking system for Ethiopian users",
  generator: "v0.app",
}

async function getMessages(locale: Locale) {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default
    return messages
  } catch (e) {
    const messages = (await import("@/messages/en.json")).default
    return messages
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined
  const locale: Locale = cookieLocale ?? defaultLocale
  const messages = await getMessages(locale)

  return (
    <html lang={locale} className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <IntlProvider locale={locale} messages={messages}>
          {/* Global language switcher - top-right */}
          <div className="fixed right-4 top-4 z-[1000]">
            <LanguageSwitcher />
          </div>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </IntlProvider>
      </body>
    </html>
  )
}
