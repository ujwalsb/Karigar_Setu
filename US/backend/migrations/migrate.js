'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('Starting migration...');

  // Connect without DB selected first to create DB if needed
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const sqlFile = path.join(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing 001_create_tables.sql...');
    await connection.query(sql);
    console.log('Migration completed successfully. Database and all tables are ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();

