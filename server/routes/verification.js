const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

// Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
function sendVerificationEmail(email, code) {
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
    replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
    to: email,
    subject: 'Queen Street Gardens - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Email Verification Required</h2>
        <p>Thank you for requesting an appointment at Queen Street Gardens. To complete your booking, please verify your email address using the code below:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #1e40af; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        
        <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          Queen Street Gardens Management
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Request verification code
router.post('/request-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing unverified codes for this email
    db.run(
      'DELETE FROM email_verifications WHERE email = ? AND verified = FALSE',
      [email],
      (err) => {
        if (err) {
          console.error('Error deleting old codes:', err);
        }
      }
    );

    // Insert new verification code
    db.run(
      'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt.toISOString()],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to generate verification code' });
        }

        // Send verification email
        sendVerificationEmail(email, code)
          .then(() => {
            res.json({ 
              message: 'Verification code sent to your email address',
              email: email
            });
          })
          .catch((emailError) => {
            console.error('Error sending email:', emailError);
            // Still return success to user, but log the error
            res.json({ 
              message: 'Verification code generated. Please check your email.',
              email: email,
              note: 'If you don\'t receive the email, please check your spam folder.'
            });
          });
      }
    );
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify code
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  // Check if verification code is valid and not expired
  db.get(
    'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND verified = FALSE AND expires_at > datetime("now", "utc")',
    [email, code],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      // Mark code as verified
      db.run(
        'UPDATE email_verifications SET verified = TRUE WHERE id = ?',
        [row.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to verify code' });
          }

          res.json({ 
            message: 'Email verified successfully',
            verified: true
          });
        }
      );
    }
  );
});

// Check if email is verified
router.get('/check-verification/:email', (req, res) => {
  const { email } = req.params;

  db.get(
    'SELECT * FROM email_verifications WHERE email = ? AND verified = TRUE AND expires_at > datetime("now", "utc") ORDER BY created_at DESC LIMIT 1',
    [email],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ 
        verified: !!row,
        email: email
      });
    }
  );
});

module.exports = router;

