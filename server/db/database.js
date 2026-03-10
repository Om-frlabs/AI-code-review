import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'reviews.db');

let db;

export function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Reviews metadata table (lightweight for listing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('paste', 'github')),
      language TEXT DEFAULT 'plaintext',
      provider TEXT NOT NULL,
      score INTEGER,
      file_count INTEGER DEFAULT 1,
      preview TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Review content table (heavy data, fetched on demand)
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_content (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      code TEXT,
      diff TEXT,
      review_json TEXT,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    )
  `);

  console.log('📦 Database initialized');
  return db;
}

export function getDB() {
  if (!db) initDB();
  return db;
}

// ---- CRUD Operations ----

export function createReview({ id, title, source, language, provider, score, fileCount, preview, code, diff, reviewJson }) {
  const db = getDB();
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, title, source, language, provider, score, file_count, preview, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const insertContent = db.prepare(`
    INSERT INTO review_content (id, review_id, code, diff, review_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertReview.run(id, title, source, language, provider, score, fileCount, preview);
    insertContent.run(id, id, code, diff, JSON.stringify(reviewJson));
  });

  transaction();
  return id;
}

export function listReviews(limit = 50, offset = 0) {
  const db = getDB();
  return db.prepare(`
    SELECT id, title, source, language, provider, score, file_count, preview, created_at
    FROM reviews ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
}

export function getReview(id) {
  const db = getDB();
  const row = db.prepare(`
    SELECT r.*, rc.code, rc.diff, rc.review_json
    FROM reviews r
    JOIN review_content rc ON rc.review_id = r.id
    WHERE r.id = ?
  `).get(id);

  if (row && row.review_json) {
    row.review_json = JSON.parse(row.review_json);
  }
  return row;
}

export function deleteReview(id) {
  const db = getDB();
  return db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
}

export function updateReviewResult(id, reviewJson, score) {
  const db = getDB();
  const transaction = db.transaction(() => {
    db.prepare('UPDATE reviews SET score = ? WHERE id = ?').run(score, id);
    db.prepare('UPDATE review_content SET review_json = ? WHERE review_id = ?').run(JSON.stringify(reviewJson), id);
  });
  transaction();
}
