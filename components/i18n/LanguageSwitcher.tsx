"use client";

import {useLocale, useTranslations} from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');

  const setLocale = (next: string) => {
    try {
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
      window.location.reload();
    } catch {}
  };

  return (
    <div className="inline-flex items-center bg-blue-600 text-white rounded-full shadow-lg p-0.5">
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-sm rounded-full ${locale === 'en' ? 'bg-white text-blue-700' : 'hover:bg-blue-500/70'}`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('am')}
        className={`px-2 py-1 text-sm rounded-full ml-1 ${locale === 'am' ? 'bg-white text-blue-700' : 'hover:bg-blue-500/70'}`}
        aria-pressed={locale === 'am'}
      >
        አማ
      </button>
    </div>
  );
}
