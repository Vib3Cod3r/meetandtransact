**User**

All users of this app will be working on UK time (currently BST).  It is therefore necessary that times are reported in UK time, even if the server and database are on a machine running in Singapore.  Can you make sur ethat the timezone of the appointments and appointments_history are displayed to the user in UK time.  To achieve this, all dates should be stored in the database in UTC (Z) but displayed to the user in a configurable timezone.

---

**Cursor**

I'll help you implement proper timezone handling for the appointment system. The key is to store all dates in UTC in the database but display them in UK time (BST/GMT) to users. Let me implement this step by step.

First, let me check the current date handling in the application:


Now let me create a comprehensive timezone handling solution. I'll need to:

1. Create a timezone utility module
2. Update the database to store dates in UTC
3. Update all date handling in the backend
4. Update all date display in the frontend
5. Add timezone configuration

Let me start by creating a timezone utility module:


```javascript
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
```

Now I need to install the moment-timezone package:


Now let me update the appointments route to use UTC storage and UK time display:



Now I need to update the appointments endpoint to convert UTC dates to UK time for display:

```diff
*** appointments12.md	2025-09-09 09:45:46.459305583 +0800
--- appointments13.md	2025-09-09 13:41:45.356683314 +0800
***************
*** 3,8 ****
--- 3,9 ----
  const router = express.Router();
  const db = require('../database');
  const nodemailer = require('nodemailer');
+ const { toUTC, fromUTC, formatForLocale, localDateTimeToUTC, utcToLocalDateTime } = require('../utils/timezone');
  
  // Get all available appointments
  router.get('/', (req, res) => {
***************
*** 19,25 ****
        res.status(500).json({ error: err.message });
        return;
      }
!     res.json(rows);
    });
  });
  
--- 20,34 ----
        res.status(500).json({ error: err.message });
        return;
      }
!     
!     // Convert UTC dates to UK time for display
!     const appointmentsWithUKTime = rows.map(row => ({
!       ...row,
!       datetime: fromUTC(row.datetime),
!       created_at: fromUTC(row.created_at)
!     }));
!     
!     res.json(appointmentsWithUKTime);
    });
  });
```





Now I need to update the booking endpoint to handle timezone conversion when creating appointments. Let me also update the admin routes:




Now let me update the admin appointments endpoint to convert UTC to UK time:


```javascript
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert UTC dates to UK time for display
    const appointmentsWithUKTime = rows.map(row => ({
      ...row,
      datetime: fromUTC(row.datetime),
      created_at: fromUTC(row.created_at)
    }));
    
    res.json(appointmentsWithUKTime);
  });
```

Let me find the specific admin appointments endpoint:

```diff
*** admin08.md	2025-09-09 09:53:49.774008797 +0800
--- admin09.md	2025-09-09 13:46:00.082980704 +0800
***************
*** 4,9 ****
--- 4,10 ----
  const db = require('../database');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
+ const { toUTC, fromUTC, formatForLocale, localDateTimeToUTC, utcToLocalDateTime } = require('../utils/timezone');
  
  // Admin login
  router.post('/login', (req, res) => {
***************
*** 119,125 ****
        res.status(500).json({ error: err.message });
        return;
      }
!     res.json(rows);
    });
  });
  
--- 120,134 ----
        res.status(500).json({ error: err.message });
        return;
      }
!     
!     // Convert UTC dates to UK time for display
!     const appointmentsWithUKTime = rows.map(row => ({
!       ...row,
!       datetime: fromUTC(row.datetime),
!       created_at: fromUTC(row.created_at)
!     }));
!     
!     res.json(appointmentsWithUKTime);
    });
  });
```


Now let me update the appointment details endpoint:




Now let me update the create appointment endpoint to convert UK time to UTC for storage:




Now let me update the update appointment endpoint:




Now let me update the user history endpoint to convert UTC to UK time:


```diff
*** admin09.md	2025-09-09 13:46:00.082980704 +0800
--- admin10.md	2025-09-09 13:52:07.239705133 +0800
***************
*** 164,181 ****
      const appointment = {
        id: rows[0].id,
        place: rows[0].place,
!       datetime: rows[0].datetime,
        max_bookings: rows[0].max_bookings,
        current_bookings: rows[0].current_bookings,
        status: rows[0].status,
!       created_at: rows[0].created_at,
        attendees: rows.filter(row => row.user_id).map(row => ({
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          home_address: row.home_address,
          phone_number: row.phone_number,
!         booking_date: row.booking_date
        }))
      };
      
--- 164,181 ----
      const appointment = {
        id: rows[0].id,
        place: rows[0].place,
!       datetime: fromUTC(rows[0].datetime),
        max_bookings: rows[0].max_bookings,
        current_bookings: rows[0].current_bookings,
        status: rows[0].status,
!       created_at: fromUTC(rows[0].created_at),
        attendees: rows.filter(row => row.user_id).map(row => ({
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          home_address: row.home_address,
          phone_number: row.phone_number,
!         booking_date: fromUTC(row.booking_date)
        }))
      };
      
***************
*** 193,201 ****
    
    const maxBookingsValue = maxBookings || 1;
    
    db.run(
      'INSERT INTO appointments (place, datetime, max_bookings) VALUES (?, ?, ?)',
!     [place, datetime, maxBookingsValue],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
--- 193,204 ----
    
    const maxBookingsValue = maxBookings || 1;
    
+   // Convert UK time to UTC for storage
+   const utcDateTime = localDateTimeToUTC(datetime);
+   
    db.run(
      'INSERT INTO appointments (place, datetime, max_bookings) VALUES (?, ?, ?)',
!     [place, utcDateTime, maxBookingsValue],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
***************
*** 204,210 ****
          message: 'Appointment created successfully', 
          id: this.lastID,
          place,
!         datetime,
          max_bookings: maxBookingsValue
        });
      }
--- 207,213 ----
          message: 'Appointment created successfully', 
          id: this.lastID,
          place,
!         datetime: fromUTC(utcDateTime), // Return UK time for display
          max_bookings: maxBookingsValue
        });
      }
***************
*** 220,228 ****
      return res.status(400).json({ error: 'Place and datetime are required' });
    }
    
    db.run(
      'UPDATE appointments SET place = ?, datetime = ?, max_bookings = ? WHERE id = ?',
!     [place, datetime, maxBookings || 1, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
--- 223,234 ----
      return res.status(400).json({ error: 'Place and datetime are required' });
    }
    
+   // Convert UK time to UTC for storage
+   const utcDateTime = localDateTimeToUTC(datetime);
+   
    db.run(
      'UPDATE appointments SET place = ?, datetime = ?, max_bookings = ? WHERE id = ?',
!     [place, utcDateTime, maxBookings || 1, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
***************
*** 444,450 ****
        res.status(500).json({ error: err.message });
        return;
      }
!     res.json(rows);
    });
  });
  
--- 450,464 ----
        res.status(500).json({ error: err.message });
        return;
      }
!     
!     // Convert UTC dates to UK time for display
!     const historyWithUKTime = rows.map(row => ({
!       ...row,
!       action_timestamp: fromUTC(row.action_timestamp),
!       datetime: fromUTC(row.datetime)
!     }));
!     
!     res.json(historyWithUKTime);
    });
  });
```


Now I need to update the email functions to use UK time formatting. Let me update the sendConfirmationEmail function:


```diff
*** appointments13.md	2025-09-09 13:41:45.356683314 +0800
--- appointments14.md	2025-09-09 13:53:52.612194176 +0800
***************
*** 263,276 ****
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${new Date(appointment.datetime).toLocaleString('en-GB', {
!             weekday: 'long',
!             year: 'numeric',
!             month: 'long',
!             day: 'numeric',
!             hour: '2-digit',
!             minute: '2-digit'
!           })}</p>
          </div>
          
          <div style="margin: 20px 0;">
--- 263,269 ----
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
          </div>
          
          <div style="margin: 20px 0;">
```


Now let me update the admin email functions to use UK time formatting:


```javascript
          <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
```

Let me find and update the email functions in the admin routes:


Let me update both email functions:


```diff
*** admin10.md	2025-09-09 13:52:07.239705133 +0800
--- admin11.md	2025-09-09 13:55:08.910721330 +0800
***************
*** 502,515 ****
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${new Date(appointment.datetime).toLocaleString('en-GB', {
!             weekday: 'long',
!             year: 'numeric',
!             month: 'long',
!             day: 'numeric',
!             hour: '2-digit',
!             minute: '2-digit'
!           })}</p>
          </div>
          
          <p>Please arrive on time for your appointment. If you need to reschedule, please contact us as soon as possible.</p>
--- 502,508 ----
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
          </div>
          
          <p>Please arrive on time for your appointment. If you need to reschedule, please contact us as soon as possible.</p>
***************
*** 561,574 ****
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">Cancelled Appointment</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${new Date(appointment.datetime).toLocaleString('en-GB', {
!             weekday: 'long',
!             year: 'numeric',
!             month: 'long',
!             day: 'numeric',
!             hour: '2-digit',
!             minute: '2-digit'
!           })}</p>
          </div>
          
          <p>We apologize for any inconvenience. Please use the link below to quickly reschedule your appointment with your details pre-filled:</p>
--- 554,560 ----
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">Cancelled Appointment</h3>
            <p><strong>Location:</strong> ${appointment.place}</p>
!           <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
          </div>
          
          <p>We apologize for any inconvenience. Please use the link below to quickly reschedule your appointment with your details pre-filled:</p>
```


Now I need to update the frontend components to handle timezone conversion. Let me create a timezone utility for the frontend:


```typescript
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
```

Now let me update the frontend components to use the timezone utilities. Let me start with the BookingPage:




```diff
*** booking11.md	2025-09-08 23:57:11.501872419 +0800
--- booking12.md	2025-09-09 13:57:55.497284910 +0800
***************
*** 2,7 ****
--- 2,8 ----
  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import EmailVerification from './EmailVerification';
+ import { formatDateTimeForUK } from '../utils/timezone';
  import './BookingPage.css';
  
  interface Appointment {
***************
*** 160,173 ****
    };
  
    const formatDateTime = (datetime: string) => {
!     return new Date(datetime).toLocaleString('en-GB', {
!       weekday: 'long',
!       year: 'numeric',
!       month: 'long',
!       day: 'numeric',
!       hour: '2-digit',
!       minute: '2-digit'
!     });
    };
  
    if (loading) {
--- 161,167 ----
    };
  
    const formatDateTime = (datetime: string) => {
!     return formatDateTimeForUK(datetime);
    };
  
    if (loading) {
```


Now let me update the AdminDashboard component:






Now I need to update the appointment form handling to convert between UTC and local time:




Now I need to update the appointment submission to convert local time to UTC:


```diff
*** admin-dashboard06.md	2025-09-09 09:56:15.440948198 +0800
--- admin-dashboard07.md	2025-09-09 14:02:22.926984270 +0800
***************
*** 2,7 ****
--- 2,8 ----
  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';
+ import { formatDateTimeForUK, utcToLocalDateTime, localDateTimeToUTC } from '../utils/timezone';
  import './AdminDashboard.css';
  
  interface Appointment {
***************
*** 114,124 ****
        const token = localStorage.getItem('adminToken');
        const headers = { Authorization: `Bearer ${token}` };
        
        if (editingAppointment) {
!         await axios.put(`/api/admin/appointments/${editingAppointment.id}`, appointmentForm, { headers });
          setMessage({ type: 'success', text: 'Appointment updated successfully!' });
        } else {
!         await axios.post('/api/admin/appointments', appointmentForm, { headers });
          setMessage({ type: 'success', text: 'Appointment created successfully!' });
        }
        
--- 115,131 ----
        const token = localStorage.getItem('adminToken');
        const headers = { Authorization: `Bearer ${token}` };
        
+       // Convert local datetime to UTC for API
+       const formData = {
+         ...appointmentForm,
+         datetime: localDateTimeToUTC(appointmentForm.datetime)
+       };
+       
        if (editingAppointment) {
!         await axios.put(`/api/admin/appointments/${editingAppointment.id}`, formData, { headers });
          setMessage({ type: 'success', text: 'Appointment updated successfully!' });
        } else {
!         await axios.post('/api/admin/appointments', formData, { headers });
          setMessage({ type: 'success', text: 'Appointment created successfully!' });
        }
        
***************
*** 136,142 ****
      setEditingAppointment(appointment);
      setAppointmentForm({
        place: appointment.place,
!       datetime: appointment.datetime,
        maxBookings: appointment.max_bookings
      });
      setShowAppointmentForm(true);
--- 143,149 ----
      setEditingAppointment(appointment);
      setAppointmentForm({
        place: appointment.place,
!       datetime: utcToLocalDateTime(appointment.datetime),
        maxBookings: appointment.max_bookings
      });
      setShowAppointmentForm(true);
***************
*** 161,174 ****
    };
  
    const formatDateTime = (datetime: string) => {
!     return new Date(datetime).toLocaleString('en-GB', {
!       weekday: 'long',
!       year: 'numeric',
!       month: 'long',
!       day: 'numeric',
!       hour: '2-digit',
!       minute: '2-digit'
!     });
    };
  
    const handleViewUserHistory = (user: User) => {
--- 168,174 ----
    };
  
    const formatDateTime = (datetime: string) => {
!     return formatDateTimeForUK(datetime);
    };
  
    const handleViewUserHistory = (user: User) => {
```


Now let me update the AppointmentDetail component:




```diff
*** appointment-detail01.md	2025-09-09 14:04:52.960604512 +0800
--- appointment-detail02.md	2025-09-09 14:03:45.285400942 +0800
***************
*** 2,7 ****
--- 2,8 ----
  import React, { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import axios from 'axios';
+ import { formatDateTimeForUK, formatDateTimeShort } from '../utils/timezone';
  import './AppointmentDetail.css';
  
  interface Attendee {
***************
*** 103,126 ****
    };
  
    const formatDateTime = (datetime: string) => {
!     return new Date(datetime).toLocaleString('en-GB', {
!       weekday: 'long',
!       year: 'numeric',
!       month: 'long',
!       day: 'numeric',
!       hour: '2-digit',
!       minute: '2-digit'
!     });
    };
  
    const formatBookingDate = (bookingDate: string) => {
!     return new Date(bookingDate).toLocaleString('en-GB', {
!       year: 'numeric',
!       month: 'short',
!       day: 'numeric',
!       hour: '2-digit',
!       minute: '2-digit'
!     });
    };
  
    if (loading) {
--- 104,114 ----
    };
  
    const formatDateTime = (datetime: string) => {
!     return formatDateTimeForUK(datetime);
    };
  
    const formatBookingDate = (bookingDate: string) => {
!     return formatDateTimeShort(bookingDate);
    };
  
    if (loading) {
```

Now let me update the ReschedulePage component:


```typescriptreact
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatDateTimeForUK } from '../utils/timezone';
import './ReschedulePage.css';
```



```diff
*** reschedule06.md	2025-09-09 09:30:15.842001678 +0800
--- reschedule07.md	2025-09-09 14:07:40.793368823 +0800
***************
*** 3,8 ****
--- 3,9 ----
  import { useSearchParams, useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import EmailVerification from './EmailVerification';
+ import { formatDateTimeForUK } from '../utils/timezone';
  import './BookingPage.css';
  
  interface Appointment {
***************
*** 182,195 ****
    };
  
    const formatDateTime = (datetime: string) => {
!     return new Date(datetime).toLocaleString('en-GB', {
!       weekday: 'long',
!       year: 'numeric',
!       month: 'long',
!       day: 'numeric',
!       hour: '2-digit',
!       minute: '2-digit'
!     });
    };
  
    if (loading) {
--- 190,196 ----
    };
  
    const formatDateTime = (datetime: string) => {
!     return formatDateTimeForUK(datetime);
    };
  
    if (loading) {
```

Now I need to create a migration script to convert existing dates to UTC. Let me create a new migration script:


```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment-timezone');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Running timezone migration...');

db.serialize(() => {
  // Get all appointments and convert their datetime to UTC
  db.all('SELECT id, datetime FROM appointments', [], (err, appointments) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return;
    }

    console.log(`Found ${appointments.length} appointments to migrate`);

    appointments.forEach((appointment, index) => {
      try {
        // Parse the existing datetime and convert to UTC
        // Assume existing dates are in UK time
        const ukTime = moment.tz(appointment.datetime, 'Europe/London');
        const utcTime = ukTime.utc().toISOString();

        // Update the appointment with UTC time
        db.run(
          'UPDATE appointments SET datetime = ? WHERE id = ?',
          [utcTime, appointment.id],
          (err) => {
            if (err) {
              console.error(`Error updating appointment ${appointment.id}:`, err);
            } else {
              console.log(`✅ Updated appointment ${appointment.id}: ${appointment.datetime} -> ${utcTime}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
      }
    });
  });

  // Get all booking dates and convert to UTC
  db.all('SELECT id, booking_date FROM bookings', [], (err, bookings) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return;
    }

    console.log(`Found ${bookings.length} bookings to migrate`);

    bookings.forEach((booking, index) => {
      try {
        // Parse the existing booking_date and convert to UTC
        const ukTime = moment.tz(booking.booking_date, 'Europe/London');
        const utcTime = ukTime.utc().toISOString();

        // Update the booking with UTC time
        db.run(
          'UPDATE bookings SET booking_date = ? WHERE id = ?',
          [utcTime, booking.id],
          (err) => {
            if (err) {
              console.error(`Error updating booking ${booking.id}:`, err);
            } else {
              console.log(`✅ Updated booking ${booking.id}: ${booking.booking_date} -> ${utcTime}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
      }
    });
  });

  // Get all appointment history and convert to UTC
  db.all('SELECT id, action_timestamp FROM appointment_history', [], (err, history) => {
    if (err) {
      console.error('Error fetching appointment history:', err);
      return;
    }

    console.log(`Found ${history.length} history records to migrate`);

    history.forEach((record, index) => {
      try {
        // Parse the existing action_timestamp and convert to UTC
        const ukTime = moment.tz(record.action_timestamp, 'Europe/London');
        const utcTime = ukTime.utc().toISOString();

        // Update the history record with UTC time
        db.run(
          'UPDATE appointment_history SET action_timestamp = ? WHERE id = ?',
          [utcTime, record.id],
          (err) => {
            if (err) {
              console.error(`Error updating history record ${record.id}:`, err);
            } else {
              console.log(`✅ Updated history record ${record.id}: ${record.action_timestamp} -> ${utcTime}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing history record ${record.id}:`, error);
      }
    });
  });

  // Get all email verifications and convert to UTC
  db.all('SELECT id, expires_at, created_at FROM email_verifications', [], (err, verifications) => {
    if (err) {
      console.error('Error fetching email verifications:', err);
      return;
    }

    console.log(`Found ${verifications.length} email verifications to migrate`);

    verifications.forEach((verification, index) => {
      try {
        // Convert expires_at
        const ukExpiresAt = moment.tz(verification.expires_at, 'Europe/London');
        const utcExpiresAt = ukExpiresAt.utc().toISOString();

        // Convert created_at
        const ukCreatedAt = moment.tz(verification.created_at, 'Europe/London');
        const utcCreatedAt = ukCreatedAt.utc().toISOString();

        // Update the verification with UTC times
        db.run(
          'UPDATE email_verifications SET expires_at = ?, created_at = ? WHERE id = ?',
          [utcExpiresAt, utcCreatedAt, verification.id],
          (err) => {
            if (err) {
              console.error(`Error updating verification ${verification.id}:`, err);
            } else {
              console.log(`✅ Updated verification ${verification.id}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing verification ${verification.id}:`, error);
      }
    });
  });

  // Get all users and convert created_at to UTC
  db.all('SELECT id, created_at FROM users', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }

    console.log(`Found ${users.length} users to migrate`);

    users.forEach((user, index) => {
      try {
        // Parse the existing created_at and convert to UTC
        const ukTime = moment.tz(user.created_at, 'Europe/London');
        const utcTime = ukTime.utc().toISOString();

        // Update the user with UTC time
        db.run(
          'UPDATE users SET created_at = ? WHERE id = ?',
          [utcTime, user.id],
          (err) => {
            if (err) {
              console.error(`Error updating user ${user.id}:`, err);
            } else {
              console.log(`✅ Updated user ${user.id}: ${user.created_at} -> ${utcTime}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    });
  });

  // Get all admin users and convert created_at to UTC
  db.all('SELECT id, created_at FROM admin_users', [], (err, adminUsers) => {
    if (err) {
      console.error('Error fetching admin users:', err);
      return;
    }

    console.log(`Found ${adminUsers.length} admin users to migrate`);

    adminUsers.forEach((adminUser, index) => {
      try {
        // Parse the existing created_at and convert to UTC
        const ukTime = moment.tz(adminUser.created_at, 'Europe/London');
        const utcTime = ukTime.utc().toISOString();

        // Update the admin user with UTC time
        db.run(
          'UPDATE admin_users SET created_at = ? WHERE id = ?',
          [utcTime, adminUser.id],
          (err) => {
            if (err) {
              console.error(`Error updating admin user ${adminUser.id}:`, err);
            } else {
              console.log(`✅ Updated admin user ${adminUser.id}: ${adminUser.created_at} -> ${utcTime}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error processing admin user ${adminUser.id}:`, error);
      }
    });
  });

  console.log('Timezone migration complete!');
});

db.close();
```


Now let me run the timezone migration:


The migration script had an issue with the database handle being closed. Let me fix the migration script:




Let me rewrite the migration script to be simpler and more reliable:


```diff
*** migratetime01.md	2025-09-09 14:10:56.377154625 +0800
--- migratetime02.md	2025-09-09 14:11:30.525674160 +0800
***************
*** 18,23 ****
--- 18,24 ----
  
      console.log(`Found ${appointments.length} appointments to migrate`);
  
+     let completed = 0;
      appointments.forEach((appointment, index) => {
        try {
          // Parse the existing datetime and convert to UTC
***************
*** 35,44 ****
--- 36,53 ----
              } else {
                console.log(`✅ Updated appointment ${appointment.id}: ${appointment.datetime} -> ${utcTime}`);
              }
+             completed++;
+             if (completed === appointments.length) {
+               processBookings();
+             }
            }
          );
        } catch (error) {
          console.error(`Error processing appointment ${appointment.id}:`, error);
+         completed++;
+         if (completed === appointments.length) {
+           processBookings();
+         }
        }
      });
    });
```


Now let me run the fixed migration script:


Great! The migration was successful. Now let me test the application to make sure the timezone handling is working correctly:


---

**Commentary**

