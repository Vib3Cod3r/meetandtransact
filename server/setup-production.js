const db = require('./database');
const bcrypt = require('bcryptjs');

async function setupProductionDatabase() {
  console.log('Setting up Queen Street Gardens appointment system for production...');
  
  try {
    // Create admin user with secure password
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'; // Use env var or default
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    db.run(
      'INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)',
      ['admin', hashedPassword],
      function(err) {
        if (err) {
          console.error('Error creating admin user:', err.message);
        } else {
          console.log('✅ Admin user created successfully!');
          console.log('Username: admin');
          console.log(`Password: ${adminPassword}`);
          console.log('⚠️  Please change the default password after first login!');
        }
      }
    );

    console.log('\n✅ Production database setup complete!');
    console.log('\nDatabase schema includes:');
    console.log('- appointments table (with status, max_bookings, current_bookings)');
    console.log('- users table (with phone_number, key_serial_number)');
    console.log('- bookings table');
    console.log('- admin_users table');
    console.log('- email_verifications table');
    console.log('- appointment_history table');
    console.log('\nNext steps:');
    console.log('1. Configure your .env file with production settings');
    console.log('2. Set SERVICE_HOST to your production domain');
    console.log('3. Configure SMTP settings for email functionality');
    console.log('4. Start your application');
    console.log(`5. Visit your domain/admin to access the admin panel`);
    
  } catch (error) {
    console.error('Production setup failed:', error);
  }
}

setupProductionDatabase();
