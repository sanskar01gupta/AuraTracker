require('dotenv').config({ path: '.env.local' });
const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const SQLITE_DB_PATH = path.join(DATA_DIR, 'price_alerts.db');

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error('Local SQLite DB not found at', SQLITE_DB_PATH);
  process.exit(1);
}

// Connect to local SQLite
const localDb = new Database(SQLITE_DB_PATH);
const rows = localDb.prepare('SELECT * FROM alerts').all();
console.log(`Found ${rows.length} alerts in local SQLite`);

// Connect to Turso
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
if (!tursoUrl || !tursoToken) {
  console.error('Turso env vars missing');
  process.exit(1);
}
const turso = createClient({ url: tursoUrl, authToken: tursoToken });

// Ensure schema exists on Turso (idempotent)
function initSchema(db) {
  db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        product_url TEXT NOT NULL,
        product_title TEXT NOT NULL,
        product_image TEXT,
        current_price REAL NOT NULL,
        target_price REAL NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        notify_stock INTEGER NOT NULL DEFAULT 0,
        notify_percentage_drop INTEGER NOT NULL DEFAULT 0,
        store_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_checked_at TEXT
      );
    `
  });
}
initSchema(turso);

// Insert rows into Turso
// We'll use client.execute for each row (no prepared statements in this simple script)

let migrated = 0;
for (const row of rows) {
  turso.execute({
    sql: `INSERT OR REPLACE INTO alerts (
      id, product_url, product_title, product_image, current_price, target_price,
      email, status, notify_stock, notify_percentage_drop, store_name, created_at, updated_at, last_checked_at
    ) VALUES (
      @id, @product_url, @product_title, @product_image, @current_price, @target_price,
      @email, @status, @notify_stock, @notify_percentage_drop, @store_name, @created_at, @updated_at, @last_checked_at
    )`,
    args: row,
  });
  migrated++;
}
console.log(`Migrated ${migrated} alerts to Turso`);
process.exit(0);
