/**
 * BASE DE DATOS SQLite
 * ------------------------------------------------------------
 * Proyecto Final - Estructuras de Datos y Algoritmos II - UAO
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Usa el módulo nativo node:sqlite (Node.js 22.13 o superior), así que no
 * necesita instalar ni compilar drivers. Las operaciones que modifican
 * varias tablas se ejecutan dentro de una TRANSACCIÓN (BEGIN / COMMIT /
 * ROLLBACK): o se aplican todos los cambios o ninguno.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSeed } from '../../shared/seed.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  code      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  author           TEXT NOT NULL,
  year             INTEGER NOT NULL,
  publisher        TEXT NOT NULL,
  category_id      INTEGER NOT NULL REFERENCES categories(id),
  total_copies     INTEGER NOT NULL CHECK (total_copies >= 1),
  available_copies INTEGER NOT NULL CHECK (available_copies >= 0 AND available_copies <= total_copies),
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  code    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name    TEXT NOT NULL,
  program TEXT NOT NULL,
  role    TEXT NOT NULL CHECK (role IN ('Estudiante', 'Docente', 'Administrativo'))
);

CREATE TABLE IF NOT EXISTS loans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id     INTEGER NOT NULL REFERENCES books(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  loan_date   TEXT NOT NULL,
  due_date    TEXT NOT NULL,
  return_date TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id      INTEGER NOT NULL REFERENCES books(id),
  user_id      INTEGER NOT NULL REFERENCES users(id),
  created_at   TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('waiting', 'fulfilled', 'cancelled')),
  fulfilled_at TEXT
);

CREATE TABLE IF NOT EXISTS return_stack (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id    INTEGER NOT NULL REFERENCES loans(id),
  book_id    INTEGER NOT NULL REFERENCES books(id),
  pushed_at  TEXT NOT NULL,
  shelved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(user_id) WHERE return_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_queue ON reservations(book_id, status, created_at);
`;

/**
 * Ejecuta "fn" dentro de una transacción. Si fn lanza un error se hace
 * ROLLBACK y ningún cambio queda guardado.
 */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function seedDatabase(db, now = new Date()) {
  const s = createSeed(now);
  transaction(db, () => {
    db.exec('DELETE FROM return_stack; DELETE FROM reservations; DELETE FROM loans; DELETE FROM books; DELETE FROM users; DELETE FROM categories; DELETE FROM sqlite_sequence;');

    const cat = db.prepare('INSERT INTO categories (id, name, parent_id, code) VALUES (?, ?, ?, ?)');
    s.categories.forEach((c) => cat.run(c.id, c.name, c.parentId, c.code));

    const book = db.prepare(`INSERT INTO books (id, code, title, author, year, publisher, category_id, total_copies, available_copies, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    s.books.forEach((b) =>
      book.run(b.id, b.code, b.title, b.author, b.year, b.publisher, b.categoryId, b.totalCopies, b.availableCopies, b.createdAt)
    );

    const user = db.prepare('INSERT INTO users (id, code, name, program, role) VALUES (?, ?, ?, ?, ?)');
    s.users.forEach((u) => user.run(u.id, u.code, u.name, u.program, u.role));

    const loan = db.prepare('INSERT INTO loans (id, book_id, user_id, loan_date, due_date, return_date) VALUES (?, ?, ?, ?, ?, ?)');
    s.loans.forEach((l) => loan.run(l.id, l.bookId, l.userId, l.loanDate, l.dueDate, l.returnDate));

    const res = db.prepare('INSERT INTO reservations (id, book_id, user_id, created_at, status) VALUES (?, ?, ?, ?, ?)');
    s.reservations.forEach((r) => res.run(r.id, r.bookId, r.userId, r.createdAt, r.status));

    const stack = db.prepare('INSERT INTO return_stack (id, loan_id, book_id, pushed_at, shelved_at) VALUES (?, ?, ?, ?, ?)');
    s.returnStack.forEach((r) => stack.run(r.id, r.loanId, r.bookId, r.pushedAt, r.shelvedAt));
  });
}

export function openDatabase(path = ':memory:', { now = new Date() } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM books').get();
  if (n === 0) seedDatabase(db, now);
  return db;
}

// ---------- Lectura del estado completo (camelCase para el frontend) ----------
export function readState(db) {
  const all = (sql) => db.prepare(sql).all().map((row) => ({ ...row }));
  return {
    categories: all('SELECT id, name, parent_id AS parentId, code FROM categories ORDER BY id'),
    books: all(`SELECT id, code, title, author, year, publisher, category_id AS categoryId,
      total_copies AS totalCopies, available_copies AS availableCopies, created_at AS createdAt FROM books ORDER BY id`),
    users: all('SELECT id, code, name, program, role FROM users ORDER BY id'),
    loans: all(`SELECT id, book_id AS bookId, user_id AS userId, loan_date AS loanDate, due_date AS dueDate,
      return_date AS returnDate FROM loans ORDER BY id`),
    reservations: all(`SELECT id, book_id AS bookId, user_id AS userId, created_at AS createdAt, status,
      fulfilled_at AS fulfilledAt FROM reservations ORDER BY id`),
    returnStack: all(`SELECT id, loan_id AS loanId, book_id AS bookId, pushed_at AS pushedAt, shelved_at AS shelvedAt
      FROM return_stack ORDER BY id`),
  };
}
