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
  
  // Create a date object and treat it as UK time
  const date = new Date(localDateTime+'+01:00');
  
  // Use a more direct approach: create a date that represents the UK time
  // and then convert it to UTC by adjusting for the timezone offset
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Create a new date in UTC that represents the same moment in UK time
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  // Now we need to adjust for the UK timezone offset
  // Get the offset for this specific date
  const testDate = new Date(year, month, day, 12, 0, 0, 0); // Noon on the same date
  const utcTest = new Date(testDate.getTime() - (testDate.getTimezoneOffset() * 60000));
  const ukTest = new Date(utcTest.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const offset = (ukTest.getTime() - utcTest.getTime()) / (1000 * 60);
  
  // Apply the offset
  const adjustedDate = new Date(utcDate.getTime() - (offset * 60 * 1000));
  
  return adjustedDate.toISOString();
}

/**
 * Convert a UTC date from API to datetime-local input value
 * @param utcDate - The UTC date from API
 * @returns Datetime-local input value
 */
export function utcToLocalDateTime(utcDate: string): string {
  if (!utcDate) return '';
  
  const date = new Date(utcDate);
  
  // Use toLocaleString to get the UK time components
  const ukTimeString = date.toLocaleString('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the UK time string to get individual components
  const [datePart, timePart] = ukTimeString.split(', ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
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
