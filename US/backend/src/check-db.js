'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'us_platform';

  console.log('\n--- Checking MySQL Database Connectivity ---');
  console.log(`Target: ${user}@${host}:${port} (Database: ${database})`);
  console.log(`Password configured: ${password ? 'Yes (' + password.length + ' chars)' : 'No (empty)'}`);

  // Test 1: Connect to MySQL server
  let serverConn;
  try {
    serverConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000
    });
    console.log('✅ Connection to MySQL Server: SUCCESSFUL');
  } catch (err) {
    console.error('❌ Connection to MySQL Server: FAILED');
    console.error(`   Error: ${err.message} (${err.code || 'UNKNOWN'})`);

    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Resolution:');
      console.log('   The MySQL server is not running on port ' + port + '.');
      console.log('   1. If using MySQL installer: Open Windows Services (services.msc) and start "MySQL" or "MySQL80".');
      console.log('   2. If using XAMPP: Open XAMPP Control Panel and click "Start" next to MySQL.');
      console.log('   3. If MySQL runs on another port (e.g. 3307), update DB_PORT in backend/.env.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Resolution:');
      console.log('   Authentication failed. Please verify DB_USER and DB_PASSWORD in backend/.env.');
    }
    process.exit(1);
  }

  // Test 2: Check database exists
  try {
    const [dbs] = await serverConn.query('SHOW DATABASES LIKE ?', [database]);
    if (dbs.length === 0) {
      console.log(`⚠️ Database "${database}" does not exist yet.`);
      console.log('   Run: npm run migrate to create it and its tables.');
    } else {
      console.log(`✅ Database "${database}": FOUND`);

      // Test 3: Check tables
      await serverConn.query(`USE \`${database}\``);
      const [tables] = await serverConn.query('SHOW TABLES');
      console.log(`✅ Tables found: ${tables.length} tables in ${database}`);
    }
  } catch (err) {
    console.error('Database query error:', err.message);
  } finally {
    if (serverConn) await serverConn.end();
  }
  console.log('--------------------------------------------\n');
}

checkDatabase();

