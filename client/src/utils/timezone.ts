/**
 * Timezone utilities for the frontend
 * All dates are stored in UTC in the database but displayed in UK time
 */

/**
 * Format a date for display in UK time
 * @param date - The date to format (can be string or Date object)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in UK time
 */
export function formatDateTimeForUK(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London'
  }
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-GB', options);
}

/**
 * Format a date for display in UK time with shorter format
 * @param date - The date to format
 * @returns Formatted date string in UK time
 */
export function formatDateTimeShort(date: string | Date): string {
  return formatDateTimeForUK(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London'
  });
}

/**
 * Format a date for display in UK time with time only
 * @param date - The date to format
 * @returns Formatted time string in UK time
 */
export function formatTimeOnly(date: string | Date): string {
  return formatDateTimeForUK(date, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London'
  });
}

/**
 * Format a date for display in UK time with date only
 * @param date - The date to format
 * @returns Formatted date string in UK time
 */
export function formatDateOnly(date: string | Date): string {
  return formatDateTimeForUK(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/London'
  });
}

/**
 * Convert a datetime-local input value to UTC for API calls
 * @param localDateTime - The datetime-local input value
 * @returns ISO string in UTC
 */
export function localDateTimeToUTC(localDateTime: string): string {
  if (!localDateTime) return '';
  
  // Create a date object in UK timezone
  const date = new Date(localDateTime + '+01:00'); // Assume BST for now, could be improved
  
  // Check if we're in BST or GMT
  const now = new Date();
  const isBST = now.getTimezoneOffset() < 0; // Simple check, could be more sophisticated
  
  if (isBST) {
    // BST is UTC+1
    return new Date(localDateTime + '+01:00').toISOString();
  } else {
    // GMT is UTC+0
    return new Date(localDateTime + '+00:00').toISOString();
  }
}

/**
 * Convert a UTC date from API to datetime-local input value
 * @param utcDate - The UTC date from API
 * @returns Datetime-local input value
 */
export function utcToLocalDateTime(utcDate: string): string {
  if (!utcDate) return '';
  
  const date = new Date(utcDate);
  
  // Convert to UK time and format for datetime-local input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get current time in UK timezone
 * @returns Current time in UK timezone
 */
export function getCurrentUKTime(): string {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Check if UK is currently in daylight saving time
 * @returns True if in BST, false if in GMT
 */
export function isUKInDST(): boolean {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  
  const janOffset = jan.getTimezoneOffset();
  const julOffset = jul.getTimezoneOffset();
  
  return Math.max(janOffset, julOffset) !== now.getTimezoneOffset();
}
