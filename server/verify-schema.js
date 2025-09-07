const db = require('./database');

function verifySchema() {
  console.log('Verifying database schema...\n');
  
  // Check if all required tables exist with correct columns
  const tables = [
    {
      name: 'appointments',
      requiredColumns: ['id', 'place', 'datetime', 'max_bookings', 'current_bookings', 'status', 'created_at']
    },
    {
      name: 'users', 
      requiredColumns: ['id', 'name', 'email', 'home_address', 'phone_number', 'key_serial_number', 'created_at']
    },
    {
      name: 'bookings',
      requiredColumns: ['id', 'user_id', 'appointment_id', 'booking_date']
    },
    {
      name: 'admin_users',
      requiredColumns: ['id', 'username', 'password_hash', 'created_at']
    },
    {
      name: 'email_verifications',
      requiredColumns: ['id', 'email', 'code', 'expires_at', 'verified', 'created_at']
    },
    {
      name: 'appointment_history',
      requiredColumns: ['id', 'user_id', 'appointment_id', 'action', 'action_timestamp', 'details']
    }
  ];

  let allTablesValid = true;

  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
      if (err) {
        console.log(`❌ Table '${table.name}' does not exist or error: ${err.message}`);
        allTablesValid = false;
        return;
      }

      const existingColumns = columns.map(col => col.name);
      const missingColumns = table.requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log(`✅ Table '${table.name}' - All required columns present`);
      } else {
        console.log(`❌ Table '${table.name}' - Missing columns: ${missingColumns.join(', ')}`);
        allTablesValid = false;
      }
    });
  });

  // Wait a moment for async operations to complete
  setTimeout(() => {
    if (allTablesValid) {
      console.log('\n🎉 Database schema verification complete - All tables and columns are correct!');
    } else {
      console.log('\n⚠️  Database schema verification failed - Some tables or columns are missing.');
      console.log('Run the migration script: node server/migrate.js');
    }
  }, 1000);
}

verifySchema();
