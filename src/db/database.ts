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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      merchant TEXT,
      category TEXT,
      app_source TEXT,
      source TEXT DEFAULT 'sms',
      type TEXT CHECK(type IN ('debit', 'credit')) NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS import_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      file_name TEXT,
      total_parsed INTEGER NOT NULL DEFAULT 0,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      duplicates_skipped INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_app_source ON transactions(app_source);
    CREATE INDEX IF NOT EXISTS idx_source ON transactions(source);
    CREATE INDEX IF NOT EXISTS idx_import_events_created_at ON import_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_import_events_source ON import_events(source);
  `);

  const columns = db.getAllSync<{ name: string }>("PRAGMA table_info(transactions)");
  if (!columns.some((column) => column.name === "source")) {
    db.execSync("ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'sms';");
    db.execSync("CREATE INDEX IF NOT EXISTS idx_source ON transactions(source);");
  }

  initialized = true;
}
