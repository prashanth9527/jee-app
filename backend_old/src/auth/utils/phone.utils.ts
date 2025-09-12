/**
 * Utility functions for phone number handling
 */

/**
 * Normalizes a phone number by adding +91 prefix if not present
 * @param phone - The phone number to normalize
 * @returns Normalized phone number with +91 prefix
 */
export function normalizeIndianPhone(phone: string): string {
  if (!phone) return phone;
  
  // Remove any spaces, dashes, or parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If it already starts with +91, return as is
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  // If it starts with 91, add +
  if (cleaned.startsWith('91')) {
    return '+' + cleaned;
  }
  
  // If it starts with 0, remove it and add +91
  if (cleaned.startsWith('0')) {
    return '+91' + cleaned.substring(1);
  }
  
  // Otherwise, add +91 prefix
  return '+91' + cleaned;
}

/**
 * Validates if a phone number is a valid Indian mobile number
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  
  const normalized = normalizeIndianPhone(phone);
  
  // Indian mobile numbers should be +91 followed by 10 digits
  // and should start with 6, 7, 8, or 9
  const indianMobileRegex = /^\+91[6-9]\d{9}$/;
  
  return indianMobileRegex.test(normalized);
}

/**
 * Formats a phone number for display (masks middle digits)
 * @param phone - The phone number to format
 * @returns Formatted phone number with masked digits
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const normalized = normalizeIndianPhone(phone);
  
  // Format: +91 98765****0
  if (normalized.length === 13) { // +91 + 10 digits
    return normalized.replace(/(\+91)(\d{5})(\d{4})(\d{1})/, '$1 $2****$4');
  }
  
  return normalized;
}
