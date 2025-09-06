const express = require('express');
const router = express.Router();
const db = require('../database');

// Get user's bookings
router.get('/:email/bookings', (req, res) => {
  const { email } = req.params;
  
  const query = `
    SELECT b.*, a.place, a.datetime, u.name, u.email
    FROM bookings b
    JOIN appointments a ON b.appointment_id = a.id
    JOIN users u ON b.user_id = u.id
    WHERE u.email = ?
    ORDER BY a.datetime ASC
  `;
  
  db.all(query, [email], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Cancel a booking
router.delete('/:email/bookings/:bookingId', (req, res) => {
  const { email, bookingId } = req.params;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get booking details
    db.get(
      'SELECT b.*, a.id as appointment_id FROM bookings b JOIN users u ON b.user_id = u.id JOIN appointments a ON b.appointment_id = a.id WHERE b.id = ? AND u.email = ?',
      [bookingId, email],
      (err, booking) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        if (!booking) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Delete booking
        db.run(
          'DELETE FROM bookings WHERE id = ?',
          [bookingId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            // Update appointment booking count
            db.run(
              'UPDATE appointments SET current_bookings = current_bookings - 1 WHERE id = ?',
              [booking.appointment_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }
                
                db.run('COMMIT', (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  res.json({ message: 'Booking cancelled successfully' });
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;

