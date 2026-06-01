import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'price_alerts.db');

// Initialize database connection
let dbInstance: any = null; // Holds either Turso client or SQLite instance

export function getDb() {
  // Use Turso if env vars are set
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    if (!dbInstance) {
      console.log('🔗 Connecting to Turso DB');
      dbInstance = createClient({ url: tursoUrl, authToken: tursoToken });
      // Initialize schema on Turso (idempotent)
      initSchema(dbInstance);
    }
    return dbInstance;
  }

  // Fallback to local SQLite
  if (dbInstance) return dbInstance;

  // DATA_DIR and DB_PATH are already defined globally

  console.log('🗄️ Using local SQLite DB at', DB_PATH);
  dbInstance = new Database(DB_PATH, { verbose: console.log });
  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: any) {
/**
 * Execute a SQL command on the given database connection.
 * Works with both better-sqlite3 (db.exec/prepare) and @libsql/client (db.execute).
 */
function runQuery(db: any, sql: string, args?: any[]) {
  if (typeof db.execute === 'function') {
    // Turso client – use execute
    return db.execute({ sql, args: args ?? [] });
  }
  // SQLite – use exec for statements, prepare for queries
  if (args && args.length > 0) {
    const stmt = db.prepare(sql);
    return stmt.run(...args);
  }
  return db.exec(sql);
}
}

export interface Alert {
  id: string;
  product_url: string;
  product_title: string;
  product_image?: string;
  current_price: number;
  target_price: number;
  email: string;
  status: 'active' | 'triggered' | 'paused';
  notify_stock: number; // SQLite uses 0 or 1 for boolean
  notify_percentage_drop: number; // 0 or 1
  store_name?: string;
  created_at: string;
  updated_at: string;
  last_checked_at?: string;
}

export const db = {
  createAlert(alert: Omit<Alert, 'created_at' | 'updated_at' | 'last_checked_at'>): Alert {
    const conn = getDb();
    const now = new Date().toISOString();
    const fullAlert = {
      ...alert,
      created_at: now,
      updated_at: now,
      last_checked_at: now,
    };

    const stmt = conn.prepare(`
      INSERT INTO alerts (
        id, product_url, product_title, product_image, current_price, target_price,
        email, status, notify_stock, notify_percentage_drop, store_name, created_at, updated_at, last_checked_at
      ) VALUES (
        @id, @product_url, @product_title, @product_image, @current_price, @target_price,
        @email, @status, @notify_stock, @notify_percentage_drop, @store_name, @created_at, @updated_at, @last_checked_at
      )
    `);

    stmt.run(fullAlert);
    return fullAlert;
  },

  getAlert(id: string): Alert | null {
    const conn = getDb();
    const stmt = conn.prepare('SELECT * FROM alerts WHERE id = ?');
    const result = stmt.get(id);
    return (result as Alert) || null;
  },

  getAlertsByIds(ids: string[]): Alert[] {
    if (ids.length === 0) return [];
    const conn = getDb();
    // Dynamically create placeholders to prevent SQL injection
    const placeholders = ids.map(() => '?').join(',');
    const stmt = conn.prepare(`SELECT * FROM alerts WHERE id IN (${placeholders}) ORDER BY created_at DESC`);
    const results = stmt.all(...ids);
    return results as Alert[];
  },

  getActiveAlerts(): Alert[] {
    const conn = getDb();
    const stmt = conn.prepare("SELECT * FROM alerts WHERE status = 'active'");
    return stmt.all() as Alert[];
  },

  updateAlert(id: string, updates: Partial<Omit<Alert, 'id' | 'created_at'>>): Alert | null {
    const conn = getDb();
    const current = this.getAlert(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatedData = {
      ...current,
      ...updates,
      updated_at: now,
    };

    const stmt = conn.prepare(`
      UPDATE alerts SET
        product_url = @product_url,
        product_title = @product_title,
        product_image = @product_image,
        current_price = @current_price,
        target_price = @target_price,
        email = @email,
        status = @status,
        notify_stock = @notify_stock,
        notify_percentage_drop = @notify_percentage_drop,
        store_name = @store_name,
        updated_at = @updated_at,
        last_checked_at = @last_checked_at
      WHERE id = @id
    `);

    stmt.run(updatedData);
    return updatedData;
  },

  deleteAlert(id: string): boolean {
    const conn = getDb();
    const stmt = conn.prepare('DELETE FROM alerts WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};
