const db = require('./database');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('Setting up Queen Street Gardens appointment system...');
  
  try {
    // Create admin user
    const adminPassword = 'admin123'; // Change this in production!
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    db.run(
      'INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)',
      ['admin', hashedPassword],
      function(err) {
        if (err) {
          console.error('Error creating admin user:', err.message);
        } else {
          console.log('Admin user created successfully!');
          console.log('Username: admin');
          console.log('Password: admin123');
          console.log('⚠️  Please change the default password after first login!');
        }
      }
    );

    // Add some sample appointments
    const sampleAppointments = [
      {
        place: 'Queen Street Gardens - Main Gate',
        datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        max_bookings: 5
      },
      {
        place: 'Queen Street Gardens - Main Gate',
        datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        max_bookings: 3
      },
      {
        place: 'Queen Street Gardens - Side Entrance',
        datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
        max_bookings: 2
      }
    ];

    sampleAppointments.forEach((appointment, index) => {
      db.run(
        'INSERT OR IGNORE INTO appointments (place, datetime, max_bookings) VALUES (?, ?, ?)',
        [appointment.place, appointment.datetime, appointment.max_bookings],
        function(err) {
          if (err) {
            console.error(`Error creating sample appointment ${index + 1}:`, err.message);
          } else {
            console.log(`Sample appointment ${index + 1} created successfully!`);
          }
        }
      );
    });

    console.log('\n✅ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy env.example to .env and configure your email settings');
    console.log('2. Run: npm run dev');
    console.log(`3. Visit ${process.env.SERVICE_HOST || 'http://localhost:3000'} to see the public site`);
    console.log(`4. Visit ${process.env.SERVICE_HOST || 'http://localhost:3000'}/admin to access the admin panel`);
    console.log('\n📧 Email Verification:');
    console.log('- Users must verify their email with a 6-digit code before booking');
    console.log('- Verification codes expire after 10 minutes');
    console.log('- Configure SMTP settings in .env for email functionality');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
