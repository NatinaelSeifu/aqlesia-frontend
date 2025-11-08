export function formatEthiopianDate(date: Date, locale: string = "am") {
  // Try to use Intl with Ethiopic calendar; fall back to standard if unsupported
  try {
    const loc = normalizeEthiopicLocale(locale)
    const out = new Intl.DateTimeFormat(loc, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
    return normalizeEra(out)
  } catch {
    try {
      return new Intl.DateTimeFormat(locale || "en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date)
    } catch {
      return date.toDateString()
    }
  }
}

export function formatEthiopianDay(date: Date, locale: string = "am") {
  try {
    const loc = normalizeEthiopicLocale(locale)
    return new Intl.DateTimeFormat(loc, { day: "numeric" }).format(date)
  } catch {
    return String(date.getDate())
  }
}

export function formatEthiopianMonthYear(date: Date, locale: string = "am") {
  try {
    const loc = normalizeEthiopicLocale(locale)
    const out = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(date)
    return normalizeEra(out)
  } catch {
    return new Intl.DateTimeFormat(locale || "en", { month: "long", year: "numeric" }).format(date)
  }
}

export function formatEthiopianWeekday(date: Date, locale: string = "am") {
  try {
    const loc = normalizeEthiopicLocale(locale)
    return new Intl.DateTimeFormat(loc, { weekday: "long" }).format(date)
  } catch {
    try {
      return new Intl.DateTimeFormat(locale || "en", { weekday: "long" }).format(date)
    } catch {
      return ""
    }
  }
}

function normalizeEthiopicLocale(locale: string) {
  const base = (locale || "am").startsWith("am") ? "am-ET" : locale
  return `${base}-u-ca-ethiopic`
}

function normalizeEra(s: string) {
  // Replace inconsistent era label (e.g., ERA1) with EC
  return s.replace(/\bERA1\b/g, "EC")
}
