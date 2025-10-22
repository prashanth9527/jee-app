/**
 * Utility functions for cleaning text content from database
 * Handles strange characters, control characters, and encoding issues
 */

/**
 * Clean strange characters and control characters from text
 * @param text - The text to clean
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove invisible control characters (0x00-0x1F except \t, \n, \r)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove specific problematic characters that might appear as text
  cleaned = cleaned.replace(/<0x0c>/g, ''); // Form feed character
  cleaned = cleaned.replace(/<0x0a>/g, ''); // Line feed character
  cleaned = cleaned.replace(/<0x0d>/g, ''); // Carriage return character
  cleaned = cleaned.replace(/<0x09>/g, ''); // Tab character
  
  // Remove any remaining HTML-like entities
  cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, '');
  
  // Remove any remaining control character representations
  cleaned = cleaned.replace(/\\[0-9]{3}/g, ''); // Remove octal escape sequences
  cleaned = cleaned.replace(/\\x[0-9A-Fa-f]{2}/g, ''); // Remove hex escape sequences
  
  // Clean up extra whitespace that might have been created
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Clean LaTeX content specifically
 * @param latex - The LaTeX content to clean
 * @returns Cleaned LaTeX content
 */
export function cleanLatex(latex: string): string {
  if (!latex) return latex;
  
  let cleaned = cleanText(latex);
  
  // Additional LaTeX-specific cleaning
  // Fix common LaTeX issues
  cleaned = cleaned.replace(/\\rac\b/g, '\\frac');
  
  // Fix double backslashes in math functions
  cleaned = cleaned.replace(/\\\\sin\b/g, '\\sin');
  cleaned = cleaned.replace(/\\\\cos\b/g, '\\cos');
  cleaned = cleaned.replace(/\\\\tan\b/g, '\\tan');
  cleaned = cleaned.replace(/\\\\log\b/g, '\\log');
  cleaned = cleaned.replace(/\\\\ln\b/g, '\\ln');
  cleaned = cleaned.replace(/\\\\exp\b/g, '\\exp');
  cleaned = cleaned.replace(/\\\\sqrt\b/g, '\\sqrt');
  cleaned = cleaned.replace(/\\\\lim\b/g, '\\lim');
  cleaned = cleaned.replace(/\\\\sum\b/g, '\\sum');
  cleaned = cleaned.replace(/\\\\int\b/g, '\\int');
  cleaned = cleaned.replace(/\\\\prod\b/g, '\\prod');
  
  // Fix spacing issues around operators
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s*\+\s*([a-zA-Z0-9])/g, '$1 + $2');
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s*-\s*([a-zA-Z0-9])/g, '$1 - $2');
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s*\*\s*([a-zA-Z0-9])/g, '$1 \\cdot $2');
  cleaned = cleaned.replace(/([a-zA-Z0-9])\s*\/\s*([a-zA-Z0-9])/g, '$1 / $2');
  
  // Fix integral bounds formatting
  cleaned = cleaned.replace(/\\int\s*_([0-9]+)\s*\^\\?([a-zA-Z]+)/g, '\\int_{$1}^{\\$2}');
  
  // Fix superscript and subscript spacing
  cleaned = cleaned.replace(/\^([a-zA-Z0-9])/g, '^{$1}');
  cleaned = cleaned.replace(/_([a-zA-Z0-9])/g, '_{$1}');
  
  return cleaned;
}

/**
 * Clean text content for display (removes control characters but preserves formatting)
 * @param text - The text to clean
 * @returns Cleaned text safe for display
 */
export function cleanDisplayText(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove only the most problematic control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove specific problematic character representations
  cleaned = cleaned.replace(/<0x0c>/g, '');
  cleaned = cleaned.replace(/<0x0a>/g, '');
  cleaned = cleaned.replace(/<0x0d>/g, '');
  cleaned = cleaned.replace(/<0x09>/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Check if text contains strange characters
 * @param text - The text to check
 * @returns True if text contains strange characters
 */
export function hasStrangeCharacters(text: string): boolean {
  if (!text) return false;
  
  // Check for control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) return true;
  
  // Check for specific problematic character representations
  if (/<0x[0-9a-fA-F]+>/.test(text)) return true;
  
  // Check for HTML entities
  if (/&[a-zA-Z0-9#]+;/.test(text)) return true;
  
  return false;
}
