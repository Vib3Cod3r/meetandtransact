const db = require('./database');

console.log('Running database migration...');

// Add status column to appointments table if it doesn't exist
db.run(`
  ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'active'
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Status column already exists, skipping...');
    } else {
      console.error('Error adding status column:', err.message);
    }
  } else {
    console.log('✅ Added status column to appointments table');
  }
});

// Add phone_number column to users table if it doesn't exist
db.run(`
  ALTER TABLE users ADD COLUMN phone_number TEXT
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Phone number column already exists, skipping...');
    } else {
      console.error('Error adding phone_number column:', err.message);
    }
  } else {
    console.log('✅ Added phone_number column to users table');
  }
});

// Add key_serial_number column to users table if it doesn't exist
db.run(`
  ALTER TABLE users ADD COLUMN key_serial_number TEXT
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Key serial number column already exists, skipping...');
    } else {
      console.error('Error adding key_serial_number column:', err.message);
    }
  } else {
    console.log('✅ Added key_serial_number column to users table');
  }
});

// Create appointment_history table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS appointment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    appointment_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (appointment_id) REFERENCES appointments (id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating appointment_history table:', err.message);
  } else {
    console.log('✅ Created appointment_history table');
  }
});

console.log('Migration complete!');

