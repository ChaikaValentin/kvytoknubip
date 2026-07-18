import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.KVYTOK_DB || path.join(dir, 'kvytok.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL,
  age_rating TEXT NOT NULL DEFAULT '0+',
  duration_min INTEGER NOT NULL,
  rating REAL NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  formats TEXT NOT NULL DEFAULT '2D',
  poster_style TEXT NOT NULL DEFAULT 'warm'
);

CREATE TABLE IF NOT EXISTS cinemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  distance_km REAL
);

CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cinema_id INTEGER NOT NULL REFERENCES cinemas(id),
  name TEXT NOT NULL,
  rows_count INTEGER NOT NULL,
  seats_per_row INTEGER NOT NULL,
  comfort_rows TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL REFERENCES movies(id),
  hall_id INTEGER NOT NULL REFERENCES halls(id),
  starts_at TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '2D',
  price_standard INTEGER NOT NULL,
  price_comfort INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL,
  promo_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  row INTEGER NOT NULL,
  seat INTEGER NOT NULL,
  seat_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_movie ON sessions(movie_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
`)

export default db
