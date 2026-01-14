/**
 * Utility functions for masking sensitive data
 */

/**
 * Masks a string by showing only its length with asterisks
 * @param value - The string to mask
 * @param maskChar - Character to use for masking (default: '*')
 * @param showLength - Whether to show the length (default: true)
 * @returns Masked string or 'N/A' if value is falsy
 */
export const maskWithLength = (
  value: string | null | undefined, 
  maskChar: string = '*', 
  showLength: boolean = true
): string => {
  if (!value) {
    return 'N/A';
  }

  const length = value.length;
  const maskLength = Math.min(8, Math.max(4, Math.floor(length / 3))); // Show 4-8 asterisks based on length
  
  if (showLength) {
    return `${maskChar.repeat(maskLength)}${length} characters${maskChar.repeat(maskLength)}`;
  }
  
  return maskChar.repeat(maskLength);
};

/**
 * Masks a string by showing first and last few characters
 * @param value - The string to mask
 * @param showFirst - Number of characters to show at the beginning (default: 2)
 * @param showLast - Number of characters to show at the end (default: 2)
 * @param maskChar - Character to use for masking (default: '*')
 * @returns Masked string or 'N/A' if value is falsy
 */
export const maskPartial = (
  value: string | null | undefined,
  showFirst: number = 2,
  showLast: number = 2,
  maskChar: string = '*'
): string => {
  if (!value) {
    return 'N/A';
  }

  if (value.length <= showFirst + showLast) {
    return maskChar.repeat(value.length);
  }

  const first = value.substring(0, showFirst);
  const last = value.substring(value.length - showLast);
  const middle = maskChar.repeat(Math.max(3, value.length - showFirst - showLast));
  
  return `${first}${middle}${last}`;
};

/**
 * Masks email addresses
 * @param email - Email address to mask
 * @returns Masked email or 'N/A' if email is falsy
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) {
    return 'N/A';
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return 'N/A';
  }

  const maskedLocal = localPart.length > 2 
    ? `${localPart.substring(0, 2)}${'*'.repeat(localPart.length - 2)}`
    : localPart;
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Masks phone numbers
 * @param phone - Phone number to mask
 * @returns Masked phone number or 'N/A' if phone is falsy
 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) {
    return 'N/A';
  }

  // Remove all non-digit characters for processing
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 4) {
    return '*'.repeat(phone.length);
  }

  // Show last 4 digits, mask the rest
  const masked = '*'.repeat(digits.length - 4) + digits.substring(digits.length - 4);
  
  // Restore original formatting
  let result = masked;
  let originalIndex = 0;
  
  for (let i = 0; i < phone.length; i++) {
    if (/\d/.test(phone[i])) {
      result = result.substring(0, originalIndex) + result[originalIndex] + result.substring(originalIndex + 1);
      originalIndex++;
    } else {
      result = result.substring(0, originalIndex) + phone[i] + result.substring(originalIndex);
    }
  }
  
  return result;
};
