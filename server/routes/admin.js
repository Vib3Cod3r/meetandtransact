const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { toUTC, fromUTC, formatForLocale, localDateTimeToUTC, utcToLocalDateTime } = require('../utils/timezone');

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.get(
    'SELECT * FROM admin_users WHERE username = ?',
    [username],
    (err, admin) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      bcrypt.compare(password, admin.password_hash, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
          { id: admin.id, username: admin.username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ token, username: admin.username });
      });
    }
  );
});

// Create admin user (for initial setup)
router.post('/create-admin', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: 'Admin user created successfully', id: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Test endpoint to verify SERVICE_HOST configuration
router.get('/config', verifyAdmin, (req, res) => {
  res.json({
    serviceHost: process.env.SERVICE_HOST || 'http://localhost:3000',
    frontendUrl: process.env.SERVICE_HOST || 'http://localhost:3000'
  });
});

// Get all appointments (admin view)
router.get('/appointments', verifyAdmin, (req, res) => {
  const query = `
    SELECT a.*, 
           COUNT(CASE WHEN a.status = 'active' THEN b.id END) as current_bookings,
           GROUP_CONCAT(CASE WHEN a.status = 'active' THEN u.name || ' (' || u.email || ')' END, ', ') as booked_users
    FROM appointments a
    LEFT JOIN bookings b ON a.id = b.appointment_id
    LEFT JOIN users u ON b.user_id = u.id
    GROUP BY a.id
    ORDER BY datetime(a.datetime) ASC
  `;
  
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
});

// Get appointment details with attendees
router.get('/appointments/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT a.*, 
           u.id as user_id,
           u.name,
           u.email,
           u.home_address,
           u.phone_number,
           u.key_serial_number,
           b.booking_date
    FROM appointments a
    LEFT JOIN bookings b ON a.id = b.appointment_id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE a.id = ? AND a.status = 'active'
    ORDER BY b.booking_date ASC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = {
      id: rows[0].id,
      place: rows[0].place,
      datetime: fromUTC(rows[0].datetime),
      max_bookings: rows[0].max_bookings,
      current_bookings: rows[0].current_bookings,
      status: rows[0].status,
      created_at: fromUTC(rows[0].created_at),
      attendees: rows.filter(row => row.user_id).map(row => ({
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        home_address: row.home_address,
        phone_number: row.phone_number,
        key_serial_number: row.key_serial_number,
        booking_date: fromUTC(row.booking_date)
      }))
    };
    
    res.json(appointment);
  });
});

// Create new appointment
router.post('/appointments', verifyAdmin, (req, res) => {
  const { place, datetime, maxBookings } = req.body;
  
  if (!place || !datetime) {
    return res.status(400).json({ error: 'Place and datetime are required' });
  }
  
  const maxBookingsValue = maxBookings || 1;
  
  // Convert UK time to UTC for storage
  const utcDateTime = localDateTimeToUTC(datetime);
  
  db.run(
    'INSERT INTO appointments (place, datetime, max_bookings) VALUES (?, ?, ?)',
    [place, utcDateTime, maxBookingsValue],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        message: 'Appointment created successfully', 
        id: this.lastID,
        place,
        datetime: fromUTC(utcDateTime), // Return UK time for display
        max_bookings: maxBookingsValue
      });
    }
  );
});

// Update appointment
router.put('/appointments/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { place, datetime, maxBookings } = req.body;
  
  if (!place || !datetime) {
    return res.status(400).json({ error: 'Place and datetime are required' });
  }
  
  // First check if appointment has attendees
  db.get(
    'SELECT COUNT(b.id) as current_bookings FROM appointments a LEFT JOIN bookings b ON a.id = b.appointment_id WHERE a.id = ? AND a.status = "active" GROUP BY a.id',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      const currentBookings = row.current_bookings || 0;
      const newMaxBookings = maxBookings || 1;
      
      // If appointment has attendees, only allow increasing max_bookings
      if (currentBookings > 0) {
        if (newMaxBookings < currentBookings) {
          return res.status(400).json({ 
            error: `Cannot reduce maximum bookings below current number of attendees (${currentBookings}). You can only increase the maximum or cancel the appointment.` 
          });
        }
        
        // For appointments with attendees, only update max_bookings
        db.run(
          'UPDATE appointments SET max_bookings = ? WHERE id = ?',
          [newMaxBookings, id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Appointment not found' });
            }
            res.json({ message: 'Maximum attendees increased successfully' });
          }
        );
      } else {
        // For appointments without attendees, allow full editing
        const utcDateTime = localDateTimeToUTC(datetime);
        
        db.run(
          'UPDATE appointments SET place = ?, datetime = ?, max_bookings = ? WHERE id = ?',
          [place, utcDateTime, newMaxBookings, id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Appointment not found' });
            }
            res.json({ message: 'Appointment updated successfully' });
          }
        );
      }
    }
  );
});

// Send reminder emails to all attendees
router.post('/appointments/:id/remind', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  // Get appointment details and attendees
  const query = `
    SELECT a.*, 
           u.name,
           u.email
    FROM appointments a
    LEFT JOIN bookings b ON a.id = b.appointment_id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE a.id = ? AND u.email IS NOT NULL
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = rows[0];
    const attendees = rows.filter(row => row.email);
    
    if (attendees.length === 0) {
      return res.status(400).json({ error: 'No attendees found for this appointment' });
    }
    
    // Send reminder emails
    const emailPromises = attendees.map(attendee => sendReminderEmail(attendee.email, attendee.name, appointment));
    
    Promise.all(emailPromises)
      .then(() => {
        res.json({ message: `Reminder emails sent to ${attendees.length} attendees` });
      })
      .catch((error) => {
        console.error('Error sending reminder emails:', error);
        res.status(500).json({ error: 'Failed to send some reminder emails' });
      });
  });
});

// Cancel appointment and send rescheduling emails
router.post('/appointments/:id/cancel', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get appointment details and attendees before cancelling
    const getAttendeesQuery = `
      SELECT a.*, 
             u.id as user_id,
             u.name,
             u.email,
             u.home_address,
             u.phone_number
      FROM appointments a
      LEFT JOIN bookings b ON a.id = b.appointment_id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE a.id = ? AND u.email IS NOT NULL
    `;
    
    db.all(getAttendeesQuery, [id], (err, rows) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      if (rows.length === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      const appointment = rows[0];
      const attendees = rows.filter(row => row.email);
      
      // Update appointment status to cancelled and reset current_bookings to 0
      db.run(
        'UPDATE appointments SET status = ?, current_bookings = 0 WHERE id = ?',
        ['cancelled', id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Log cancellation history for each attendee
            attendees.forEach(attendee => {
              logAppointmentHistory(attendee.user_id, id, 'cancelled', `Appointment cancelled by admin - was at ${appointment.place} on ${appointment.datetime}`);
            });
            
            // Send cancellation emails with rescheduling links
            const emailPromises = attendees.map(attendee => 
              sendCancellationEmail(attendee.email, attendee.name, appointment, attendee)
            );
            
            Promise.all(emailPromises)
              .then(() => {
                res.json({ message: `Appointment cancelled and rescheduling emails sent to ${attendees.length} attendees` });
              })
              .catch((error) => {
                console.error('Error sending cancellation emails:', error);
                res.json({ message: 'Appointment cancelled but some emails may not have been sent' });
              });
          });
        }
      );
    });
  });
});

// Delete appointment
router.delete('/appointments/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Delete all bookings for this appointment
    db.run(
      'DELETE FROM bookings WHERE appointment_id = ?',
      [id],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        // Delete the appointment
        db.run(
          'DELETE FROM appointments WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return res.status(404).json({ error: 'Appointment not found' });
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'Appointment deleted successfully' });
            });
          }
        );
      }
    );
  });
});

// Get all users
router.get('/users', verifyAdmin, (req, res) => {
  const query = `
    SELECT u.*, 
           COUNT(b.id) as total_bookings,
           GROUP_CONCAT(a.place || ' (' || a.datetime || ')', ', ') as appointments
    FROM users u
    LEFT JOIN bookings b ON u.id = b.user_id
    LEFT JOIN appointments a ON b.appointment_id = a.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert UTC dates to UK time for display
    const usersWithUKTime = rows.map(row => ({
      ...row,
      created_at: fromUTC(row.created_at)
    }));
    
    res.json(usersWithUKTime);
  });
});

// Get user appointment history
router.get('/users/:id/history', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT h.*, 
           a.place,
           a.datetime,
           u.name as user_name,
           u.email
    FROM appointment_history h
    JOIN appointments a ON h.appointment_id = a.id
    JOIN users u ON h.user_id = u.id
    WHERE h.user_id = ?
    ORDER BY h.action_timestamp DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert UTC dates to UK time for display
    const historyWithUKTime = rows.map(row => ({
      ...row,
      action_timestamp: fromUTC(row.action_timestamp),
      datetime: fromUTC(row.datetime)
    }));
    
    res.json(historyWithUKTime);
  });
});

// Log appointment history
function logAppointmentHistory(userId, appointmentId, action, details = null) {
  db.run(
    'INSERT INTO appointment_history (user_id, appointment_id, action, details) VALUES (?, ?, ?, ?)',
    [userId, appointmentId, action, details],
    (err) => {
      if (err) {
        console.error('Error logging appointment history:', err);
      }
    }
  );
}

// Email functions
function sendReminderEmail(email, name, appointment) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Queen Street Gardens - Appointment Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e403a;">Appointment Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a reminder about your upcoming Queen Street Gardens key pickup appointment:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
          <p><strong>Location:</strong> ${appointment.place}</p>
          <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
        </div>
        
        <p>Please arrive on time for your appointment. If you need to reschedule, please contact us as soon as possible.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          Queen Street Gardens Management
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

function sendCancellationEmail(email, name, appointment, attendee) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Create rescheduling link with pre-filled data
  const rescheduleData = encodeURIComponent(JSON.stringify({
    name: attendee.name,
    email: attendee.email,
    homeAddress: attendee.home_address,
    phoneNumber: attendee.phone_number || ''
  }));
  
  const rescheduleUrl = `${process.env.SERVICE_HOST || 'http://localhost:3000'}/reschedule?data=${rescheduleData}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Queen Street Gardens - Appointment Cancelled - Please Reschedule',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appointment Cancelled</h2>
        <p>Dear ${name},</p>
        <p>We regret to inform you that your Queen Street Gardens key pickup appointment has been cancelled:</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">Cancelled Appointment</h3>
          <p><strong>Location:</strong> ${appointment.place}</p>
          <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
        </div>
        
        <p>We apologize for any inconvenience. Please use the link below to quickly reschedule your appointment with your details pre-filled:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rescheduleUrl}" 
             style="background-color: #1e403a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Reschedule Appointment
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          Queen Street Gardens Management
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Issue key to user
router.post('/users/:id/issue-key', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { keySerialNumber } = req.body;
  
  if (!keySerialNumber || !keySerialNumber.trim()) {
    return res.status(400).json({ error: 'Key serial number is required' });
  }
  
  // Check if user exists and doesn't already have a key
  db.get(
    'SELECT id, name, email, key_serial_number FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.key_serial_number) {
        return res.status(400).json({ 
          error: 'User already has a key issued',
          existingKey: user.key_serial_number
        });
      }
      
      // Update user with key serial number
      db.run(
        'UPDATE users SET key_serial_number = ? WHERE id = ?',
        [keySerialNumber.trim(), id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          // Log the key issuance
          logAppointmentHistory(id, null, 'key_issued', `Key issued with serial number: ${keySerialNumber.trim()}`);
          
          res.json({ 
            message: 'Key issued successfully',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              key_serial_number: keySerialNumber.trim()
            }
          });
        }
      );
    }
  );
});

// Revoke key from user
router.post('/users/:id/revoke-key', verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  // Check if user exists and has a key
  db.get(
    'SELECT id, name, email, key_serial_number FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.key_serial_number) {
        return res.status(400).json({ error: 'User does not have a key to revoke' });
      }
      
      const oldKeySerial = user.key_serial_number;
      
      // Remove key serial number
      db.run(
        'UPDATE users SET key_serial_number = NULL WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          // Log the key revocation
          logAppointmentHistory(id, null, 'key_revoked', `Key revoked (was serial number: ${oldKeySerial})`);
          
          res.json({ 
            message: 'Key revoked successfully',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              key_serial_number: null
            }
          });
        }
      );
    }
  );
});

module.exports = router;
