const moment = require('moment-timezone');

// Default timezone for the application (UK time)
const DEFAULT_TIMEZONE = 'Europe/London';

/**
 * Convert a date to UTC for storage in database
 * @param {string|Date} date - The date to convert
 * @param {string} timezone - The source timezone (defaults to UK time)
 * @returns {string} - ISO string in UTC
 */
function toUTC(date, timezone = DEFAULT_TIMEZONE) {
  if (!date) return null;
  
  const momentDate = moment.tz(date, timezone);
  return momentDate.utc().toISOString();
}

/**
 * Convert a UTC date from database to display timezone
 * @param {string|Date} utcDate - The UTC date from database
 * @param {string} timezone - The target timezone (defaults to UK time)
 * @returns {string} - Formatted date string in target timezone
 */
function fromUTC(utcDate, timezone = DEFAULT_TIMEZONE) {
  if (!utcDate) return null;
  
  return moment.utc(utcDate).tz(timezone).format();
}

/**
 * Format a date for display in UK time
 * @param {string|Date} date - The date to format
 * @param {string} format - The format string (defaults to 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} - Formatted date string
 */
function formatForDisplay(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return null;
  
  return moment.utc(date).tz(DEFAULT_TIMEZONE).format(format);
}

/**
 * Format a date for display with locale-specific formatting
 * @param {string|Date} date - The date to format
 * @param {string} timezone - The timezone to display in (defaults to UK time)
 * @returns {string} - Locale formatted date string
 */
function formatForLocale(date, timezone = DEFAULT_TIMEZONE) {
  if (!date) return null;
  
  return moment.utc(date).tz(timezone).format('dddd, MMMM Do YYYY, h:mm A');
}

/**
 * Get current time in UK timezone
 * @returns {string} - Current time in UK timezone
 */
function getCurrentUKTime() {
  return moment().tz(DEFAULT_TIMEZONE).format();
}

/**
 * Convert datetime-local input to UTC for storage
 * @param {string} localDateTime - The datetime-local input value
 * @param {string} timezone - The timezone (defaults to UK time)
 * @returns {string} - ISO string in UTC
 */
function localDateTimeToUTC(localDateTime, timezone = DEFAULT_TIMEZONE) {
  if (!localDateTime) return null;
  
  // Create a moment object in the specified timezone
  const momentDate = moment.tz(localDateTime, timezone);
  return momentDate.utc().toISOString();
}

/**
 * Convert UTC to datetime-local input format
 * @param {string} utcDate - The UTC date from database
 * @param {string} timezone - The timezone (defaults to UK time)
 * @returns {string} - Datetime-local input value
 */
function utcToLocalDateTime(utcDate, timezone = DEFAULT_TIMEZONE) {
  if (!utcDate) return null;
  
  return moment.utc(utcDate).tz(timezone).format('YYYY-MM-DDTHH:mm');
}

/**
 * Get timezone offset for UK time
 * @returns {string} - Timezone offset (e.g., '+01:00' for BST, '+00:00' for GMT)
 */
function getUKTimezoneOffset() {
  return moment().tz(DEFAULT_TIMEZONE).format('Z');
}

/**
 * Check if UK is currently in daylight saving time
 * @returns {boolean} - True if in BST, false if in GMT
 */
function isUKInDST() {
  return moment().tz(DEFAULT_TIMEZONE).isDST();
}

module.exports = {
  toUTC,
  fromUTC,
  formatForDisplay,
  formatForLocale,
  getCurrentUKTime,
  localDateTimeToUTC,
  utcToLocalDateTime,
  getUKTimezoneOffset,
  isUKInDST,
  DEFAULT_TIMEZONE
};
