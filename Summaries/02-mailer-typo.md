## This is an error


**User**

Looks ok, but I get the following runtime error  when making an appointment: [0] TypeError: nodemailer.createTransporter is not a function
[0]     at sendConfirmationEmail (/home/steve/Cursor/morag/server/routes/appointments.js:154:34)
[0]     at Statement.<anonymous> (/home/steve/Cursor/morag/server/routes/appointments.js:133:29)
[0] 


---

**Commentary**

So as sometimes happens, Cursor gets the names of functions wrong, especially if they are far apart in context.

**Cursor**

I see the issue! There's a typo in the nodemailer function call. It should be `createTransport` (without the 'er' at the end). Let me fix that:


[And so Cursor rewrites the entire file to fix a typo!]


```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

// Get all available appointments
router.get('/', (req, res) => {
  const query = `
    SELECT a.*, 
           (a.max_bookings - a.current_bookings) as available_slots
    FROM appointments a 
    WHERE a.current_bookings < a.max_bookings
    ORDER BY a.datetime ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Book an appointment
router.post('/book', async (req, res) => {
  const { name, email, homeAddress, appointmentId } = req.body;

  if (!name || !email || !homeAddress || !appointmentId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

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
                // Update user info
                db.run(
                  'UPDATE users SET name = ?, home_address = ? WHERE id = ?',
                  [name, homeAddress, userId],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }
                  }
                );
              } else {
                // Create new user
                db.run(
                  'INSERT INTO users (name, email, home_address) VALUES (?, ?, ?)',
                  [name, email, homeAddress],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }
                    userId = this.lastID;
                  }
                );
              }

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

                            // Send confirmation email
                            sendConfirmationEmail(email, name, appointment);
                            res.json({ message: 'Appointment booked successfully!' });
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
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send confirmation email
function sendConfirmationEmail(email, name, appointment) {
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
    subject: 'Queen Street Gardens - Key Pickup Appointment Confirmed',
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your appointment to pick up your Queen Street Gardens key has been confirmed:</p>
      <ul>
        <li><strong>Location:</strong> ${appointment.place}</li>
        <li><strong>Date & Time:</strong> ${new Date(appointment.datetime).toLocaleString()}</li>
      </ul>
      <p>Please arrive on time for your appointment.</p>
      <p>Best regards,<br>Queen Street Gardens Management</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

module.exports = router;

```

Perfect! The error was caused by a simple typo - `createTransporter` should be `createTransport`. The function is now fixed and should work correctly.

The appointment booking system should now work properly. When users book an appointment, they'll receive a confirmation email (assuming you've configured the email settings in your `.env` file).

If you haven't set up email configuration yet, the booking will still work - it will just log an error when trying to send the email, but the appointment will be successfully created in the database.

To test the fix, you can:
1. Try booking an appointment through the web interface
2. Check the server logs to see if the email sending works (or if it shows the expected error about missing email configuration)

The application should now be fully functional!

---
