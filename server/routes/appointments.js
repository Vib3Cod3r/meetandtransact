const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');
const { toUTC, fromUTC, formatForLocale, localDateTimeToUTC, utcToLocalDateTime } = require('../utils/timezone');

// Get all available appointments
router.get('/', (req, res) => {
  const query = `
    SELECT a.*, 
           (a.max_bookings - a.current_bookings) as available_slots
    FROM appointments a 
    WHERE a.current_bookings < a.max_bookings AND a.status = 'active'
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

// Book an appointment
router.post('/book', async (req, res) => {
  const { name, email, homeAddress, phoneNumber, appointmentId } = req.body;

  if (!name || !email || !homeAddress || !appointmentId) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check if email is verified
  db.get(
    'SELECT * FROM email_verifications WHERE email = ? AND verified = TRUE ORDER BY created_at DESC LIMIT 1',
    [email],
    (err, verification) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!verification) {
        return res.status(400).json({ 
          error: 'Email verification required. Please verify your email address first.',
          requiresVerification: true
        });
      }

      // Proceed with booking if email is verified
      try {
        // Start transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Check if appointment is still available
          db.get(
            'SELECT * FROM appointments WHERE id = ? AND current_bookings < max_bookings',
            [appointmentId],
            (err, appointment) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              if (!appointment) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: 'Appointment is no longer available' });
              }

              // Check if user already exists
              db.get(
                'SELECT id FROM users WHERE email = ?',
                [email],
                (err, existingUser) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }

                  let userId;
                  if (existingUser) {
                    userId = existingUser.id;
                    
                    // Check if user already has a key (ineligible for new appointments)
                    db.get(
                      'SELECT key_serial_number FROM users WHERE id = ?',
                      [userId],
                      (err, user) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: err.message });
                        }

                        if (user && user.key_serial_number) {
                          db.run('ROLLBACK');
                          return res.status(400).json({ 
                            error: 'You have already received a key and are no longer eligible to book appointments through this system.',
                            hasKey: true
                          });
                        }

                        // Check if user already has an active appointment
                        db.get(
                          `SELECT a.id, a.place, a.datetime, a.max_bookings, a.current_bookings
                           FROM appointments a
                           JOIN bookings b ON a.id = b.appointment_id
                           WHERE b.user_id = ? AND a.status = 'active'`,
                          [userId],
                          (err, existingAppointment) => {
                            if (err) {
                              db.run('ROLLBACK');
                              return res.status(500).json({ error: err.message });
                            }

                            if (existingAppointment) {
                              db.run('ROLLBACK');
                              return res.status(400).json({ 
                                error: 'You already have an active appointment',
                                hasExistingAppointment: true,
                                existingAppointment: {
                                  id: existingAppointment.id,
                                  place: existingAppointment.place,
                                  datetime: fromUTC(existingAppointment.datetime)
                                }
                              });
                            }

                            // Update user info and proceed with booking
                            db.run(
                              'UPDATE users SET name = ?, home_address = ?, phone_number = ? WHERE id = ?',
                              [name, homeAddress, phoneNumber || null, userId],
                              (err) => {
                                if (err) {
                                  db.run('ROLLBACK');
                                  return res.status(500).json({ error: err.message });
                                }
                                proceedWithBooking(userId);
                              }
                            );
                          }
                        );
                      }
                    );
                  } else {
                    // Create new user and proceed with booking
                    db.run(
                      'INSERT INTO users (name, email, home_address, phone_number) VALUES (?, ?, ?, ?)',
                      [name, email, homeAddress, phoneNumber || null],
                      function(err) {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: err.message });
                        }
                        userId = this.lastID;
                        proceedWithBooking(userId);
                      }
                    );
                  }

                  // Helper function to proceed with booking after user validation
                  function proceedWithBooking(userId) {
                    // Check if user already has a booking for this appointment
                    db.get(
                      'SELECT id FROM bookings WHERE user_id = ? AND appointment_id = ?',
                      [userId, appointmentId],
                      (err, existingBooking) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: err.message });
                        }

                        if (existingBooking) {
                          db.run('ROLLBACK');
                          return res.status(400).json({ error: 'You have already booked this appointment' });
                        }

                        // Create booking
                        db.run(
                          'INSERT INTO bookings (user_id, appointment_id) VALUES (?, ?)',
                          [userId, appointmentId],
                          (err) => {
                            if (err) {
                              db.run('ROLLBACK');
                              return res.status(500).json({ error: err.message });
                            }

                            // Update appointment booking count
                            db.run(
                              'UPDATE appointments SET current_bookings = current_bookings + 1 WHERE id = ?',
                              [appointmentId],
                              (err) => {
                                if (err) {
                                  db.run('ROLLBACK');
                                  return res.status(500).json({ error: err.message });
                                }

                                db.run('COMMIT', (err) => {
                                  if (err) {
                                    return res.status(500).json({ error: err.message });
                                  }

                                  // Log appointment history
                                  logAppointmentHistory(userId, appointmentId, 'booked', `Booked appointment at ${appointment.place} on ${appointment.datetime}`);

                                  // Send confirmation email
                                  sendConfirmationEmail(email, name, appointment, homeAddress, phoneNumber);
                                  res.json({ message: 'Appointment booked successfully!' });
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          );
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
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

// Generate reschedule URL with user data
function generateRescheduleUrl(email, name, homeAddress, phoneNumber) {
  const rescheduleData = {
    email: email,
    name: name,
    homeAddress: homeAddress,
    phoneNumber: phoneNumber || ''
  };
  
  const encodedData = Buffer.from(JSON.stringify(rescheduleData)).toString('base64');
  return `${process.env.SERVICE_HOST || 'http://localhost:3000'}/reschedule?data=${encodedData}`;
}

// Generate calendar event (.ics format)
function generateCalendarEvent(appointment, name, email) {
  const startDate = new Date(appointment.datetime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const eventId = `appointment-${appointment.id}-${Date.now()}@queenstreetgardens.org`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Queen Street Gardens//Appointment System//EN
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Queen Street Gardens - Key Pickup Appointment
DESCRIPTION:Key pickup appointment at ${appointment.place}\\n\\nPlease arrive on time for your appointment.\\n\\nIf you need to reschedule, please use the link in your confirmation email.
LOCATION:${appointment.place}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

// Send confirmation email
function sendConfirmationEmail(email, name, appointment, homeAddress, phoneNumber) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const rescheduleUrl = generateRescheduleUrl(email, name, homeAddress, phoneNumber);
  const calendarEvent = generateCalendarEvent(appointment, name, email);
  
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Queen Street Gardens - Key Pickup Appointment Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e403a;">Appointment Confirmed</h2>
        <p>Dear ${name},</p>
        <p>Your appointment to pick up your Queen Street Gardens key has been confirmed:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e403a; margin: 0 0 10px 0;">Appointment Details</h3>
          <p><strong>Location:</strong> ${appointment.place}</p>
          <p><strong>Date & Time:</strong> ${formatForLocale(appointment.datetime)}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Need to reschedule?</strong></p>
          <p>If you need to change your appointment time, you can do so by clicking the link below:</p>
          <a href="${rescheduleUrl}" style="background-color: #1e403a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            Reschedule Appointment
          </a>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Add to Calendar</strong></p>
          <p>You can add this appointment to your calendar using the attached .ics file, or click the link below:</p>
          <a href="data:text/calendar;charset=utf8,${encodeURIComponent(calendarEvent)}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            Add to Calendar
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          Queen Street Gardens Management
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'appointment.ics',
        content: calendarEvent,
        contentType: 'text/calendar; charset=utf-8'
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

// Reschedule an appointment
router.post('/reschedule', async (req, res) => {
  const { name, email, homeAddress, phoneNumber, appointmentId } = req.body;

  if (!name || !email || !homeAddress || !appointmentId) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check if email is verified
  db.get(
    'SELECT * FROM email_verifications WHERE email = ? AND verified = TRUE LIMIT 1',
    [email],
    (err, verification) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!verification) {
        console.log('Email verification required. Please verify your email address first.');
        return res.status(400).json({ 
          error: 'Email verification required. Please verify your email address first.',
          requiresVerification: true
        });
      }

      // Proceed with rescheduling if email is verified
      try {
        // Start transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Check if appointment is still available
          db.get(
            'SELECT * FROM appointments WHERE id = ? AND current_bookings < max_bookings AND status = "active"',
            [appointmentId],
            (err, appointment) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              if (!appointment) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: 'Appointment is no longer available' });
              }

              // Find user by email
              db.get(
                'SELECT id FROM users WHERE email = ?',
                [email],
                (err, user) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }

                  if (!user) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'User not found' });
                  }

                  // Cancel any existing bookings for this user
                  db.run(
                    'DELETE FROM bookings WHERE user_id = ?',
                    [user.id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                      }

                      // Update appointment booking counts (decrease for cancelled bookings)
                      db.run(
                        'UPDATE appointments SET current_bookings = current_bookings - 1 WHERE id IN (SELECT appointment_id FROM bookings WHERE user_id = ?)',
                        [user.id],
                        (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                          }

                          // Create new booking
                          db.run(
                            'INSERT INTO bookings (user_id, appointment_id) VALUES (?, ?)',
                            [user.id, appointmentId],
                            (err) => {
                              if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err.message });
                              }

                              // Update new appointment booking count
                              db.run(
                                'UPDATE appointments SET current_bookings = current_bookings + 1 WHERE id = ?',
                                [appointmentId],
                                (err) => {
                                  if (err) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: err.message });
                                  }

                                  db.run('COMMIT', (err) => {
                                    if (err) {
                                      return res.status(500).json({ error: err.message });
                                    }

                                    // Log appointment history
                                    logAppointmentHistory(user.id, appointmentId, 'rescheduled', `Rescheduled to appointment at ${appointment.place} on ${appointment.datetime}`);

                                    // Send confirmation email
                                    sendConfirmationEmail(email, name, appointment, homeAddress, phoneNumber);
                                    res.json({ message: 'Appointment rescheduled successfully!' });
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      } catch (error) {
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Internal server error' });
      }
    });
});

module.exports = router;
