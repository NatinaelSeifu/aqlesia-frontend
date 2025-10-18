import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
