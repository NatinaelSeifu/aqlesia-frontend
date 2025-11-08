"use client";

import {NextIntlClientProvider} from "next-intl";
import type {ReactNode} from "react";
import type {Locale} from "@/lib/i18n/locales";

export default function IntlProvider({
  locale,
  messages,
  children
}: {
  locale: Locale;
  messages: Record<string, any>;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
