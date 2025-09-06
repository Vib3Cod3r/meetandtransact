const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment-timezone');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Running timezone migration...');

async function migrateTable(tableName, dateColumns) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(`Error fetching ${tableName}:`, err);
        reject(err);
        return;
      }

      console.log(`Found ${rows.length} ${tableName} records to migrate`);

      if (rows.length === 0) {
        resolve();
        return;
      }

      let completed = 0;
      const total = rows.length;

      rows.forEach((row) => {
        const updates = {};
        let hasUpdates = false;

        dateColumns.forEach(column => {
          if (row[column]) {
            try {
              // Parse the existing date and convert to UTC
              // Assume existing dates are in UK time
              const ukTime = moment.tz(row[column], 'Europe/London');
              const utcTime = ukTime.utc().toISOString();
              updates[column] = utcTime;
              hasUpdates = true;
            } catch (error) {
              console.error(`Error processing ${tableName} ${row.id} ${column}:`, error);
            }
          }
        });

        if (hasUpdates) {
          const setClause = Object.keys(updates).map(col => `${col} = ?`).join(', ');
          const values = Object.values(updates);
          values.push(row.id);

          db.run(
            `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
            values,
            (err) => {
              if (err) {
                console.error(`Error updating ${tableName} ${row.id}:`, err);
              } else {
                console.log(`✅ Updated ${tableName} ${row.id}`);
              }
              completed++;
              if (completed === total) {
                resolve();
              }
            }
          );
        } else {
          completed++;
          if (completed === total) {
            resolve();
          }
        }
      });
    });
  });
}

async function runMigration() {
  try {
    // Migrate appointments
    await migrateTable('appointments', ['datetime', 'created_at']);
    
    // Migrate bookings
    await migrateTable('bookings', ['booking_date']);
    
    // Migrate appointment_history
    await migrateTable('appointment_history', ['action_timestamp']);
    
    // Migrate email_verifications
    await migrateTable('email_verifications', ['expires_at', 'created_at']);
    
    // Migrate users
    await migrateTable('users', ['created_at']);
    
    // Migrate admin_users
    await migrateTable('admin_users', ['created_at']);
    
    console.log('✅ Timezone migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

runMigration();