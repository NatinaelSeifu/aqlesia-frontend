import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toEthiopian } from "ethiopian-date"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize Ethiopian phone numbers to E.164 format (251xxxxxxxxx)
export function normalizeEthiopianPhone(phone: string): string {
  if (!phone) return phone
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Handle different Ethiopian phone number formats:
  // +251987654321 -> 251987654321
  // 0987654321 -> 251987654321  
  // 987654321 -> 251987654321
  // 251987654321 -> 251987654321 (already normalized)
  
  if (digitsOnly.startsWith('251') && digitsOnly.length === 12) {
    // Already in E.164 format
    return digitsOnly
  } else if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    // Ethiopian local format: 0987654321 -> 251987654321
    return '251' + digitsOnly.substring(1)
  } else if (digitsOnly.length === 9) {
    // Mobile number without country code: 987654321 -> 251987654321
    return '251' + digitsOnly
  }
  
  // If it doesn't match expected formats, return as-is
  return phone
}

// URL utility functions for managing auth views
export function updateAuthURL(view: string, phone?: string) {
  if (typeof window === 'undefined') return
  
  const params = new URLSearchParams()
  params.set('view', view)
  if (phone) {
    params.set('phone', phone)
  }
  const newURL = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState(null, '', newURL)
}

export function getAuthViewFromURL(): { view: string | null; phone: string | null } {
  if (typeof window === 'undefined') return { view: null, phone: null }
  
  const params = new URLSearchParams(window.location.search)
  return {
    view: params.get('view'),
    phone: params.get('phone')
  }
}

// Ethiopian calendar utilities
const AMHARIC_MONTHS = [
  "መስከረም", // Meskerem
  "ጥቅምት",  // Tikimit
  "ኅዳር",   // Hidar
  "ታኅሣሥ",  // Tahsas
  "ጥር",    // Tir
  "የካቲት",  // Yekatit
  "መጋቢት",  // Megabit
  "ሚያዝያ",  // Miazia
  "ግንቦት",  // Ginbot
  "ሰኔ",    // Sene
  "ሐምሌ",   // Hamle
  "ነሐሴ",   // Nehasse
  "ጳጉሜን"   // Pagumen
]

const AMHARIC_DAYS = [
  "እሁድ",   // Sunday
  "ሰኞ",    // Monday
  "ማክሰኞ",  // Tuesday
  "ረቡዕ",   // Wednesday
  "ሐሙስ",   // Thursday
  "ዓርብ",   // Friday
  "ቅዳሜ"    // Saturday
]

/**
 * Convert Gregorian date to Ethiopian date
 */
export function toEthiopianDate(gregorianDate: Date | string): { year: number; month: number; day: number } {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // JavaScript months are 0-indexed
  const day = date.getDate()
  
  // toEthiopian returns [year, month, day]
  const [ethYear, ethMonth, ethDay] = toEthiopian([year, month, day])
  
  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay
  }
}

/**
 * Format Ethiopian date with Amharic month names
 * @param date - Gregorian date (Date object or string)
 * @param format - 'short' (e.g., "መስከረም 1, 2017") or 'long' (e.g., "እሁድ መስከረም 1, 2017")
 */
export function formatEthiopianDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const gregorianDate = typeof date === 'string' ? new Date(date) : date
  const ethDate = toEthiopianDate(gregorianDate)
  
  const monthName = AMHARIC_MONTHS[ethDate.month - 1] || ''
  const dateStr = `${monthName} ${ethDate.day}, ${ethDate.year}`
  
  if (format === 'long') {
    const dayOfWeek = AMHARIC_DAYS[gregorianDate.getDay()]
    return `${dayOfWeek} ${dateStr}`
  }
  
  return dateStr
}

/**
 * Format Ethiopian date with custom format
 * @param date - Gregorian date (Date object or string)
 * @param options - Formatting options
 */
export function formatEthiopianDateCustom(date: Date | string, options?: {
  includeWeekday?: boolean
  includeYear?: boolean
  shortMonth?: boolean
}): string {
  const gregorianDate = typeof date === 'string' ? new Date(date) : date
  const ethDate = toEthiopianDate(gregorianDate)
  
  const monthName = AMHARIC_MONTHS[ethDate.month - 1] || ''
  const shortMonth = options?.shortMonth ? monthName.substring(0, 3) : monthName
  
  let result = `${shortMonth} ${ethDate.day}`
  
  if (options?.includeYear !== false) {
    result += `, ${ethDate.year}`
  }
  
  if (options?.includeWeekday) {
    const dayOfWeek = AMHARIC_DAYS[gregorianDate.getDay()]
    result = `${dayOfWeek}, ${result}`
  }
  
  return result
}

/**
 * Get Amharic month name
 */
export function getAmharicMonthName(monthNumber: number): string {
  return AMHARIC_MONTHS[monthNumber - 1] || ''
}

/**
 * Get Amharic day name
 */
export function getAmharicDayName(dayOfWeek: number): string {
  return AMHARIC_DAYS[dayOfWeek] || ''
}
