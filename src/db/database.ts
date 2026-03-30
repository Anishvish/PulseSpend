import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "pulsespend.db";

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

let initialized = false;

export function initializeDatabase() {
  if (initialized) {
    return;
  }

  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      merchant TEXT,
      category TEXT,
      app_source TEXT,
      type TEXT CHECK(type IN ('debit', 'credit')) NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_app_source ON transactions(app_source);
  `);

  initialized = true;
}
