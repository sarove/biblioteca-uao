/**
 * OPERACIONES DE LA BIBLIOTECA SOBRE SQLite (con transacciones)
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Cada operación que cambia más de una tabla se ejecuta dentro de
 * transaction(): si una validación falla a mitad de camino, se hace
 * ROLLBACK y la base de datos queda exactamente como estaba.
 */
import { transaction, readState } from './db.js';
import {
  LibraryError,
  validateBookInput,
  validateUserInput,
} from '../../shared/rules.js';
import { LOAN_DAYS_DEFAULT, MAX_ACTIVE_LOANS } from '../../shared/seed.js';

const DAY = 24 * 60 * 60 * 1000;

const one = (db, sql, ...params) => {
  const row = db.prepare(sql).get(...params);
  return row ? { ...row } : null;
};

function getBook(db, id) {
  const book = one(db, 'SELECT * FROM books WHERE id = ?', Number(id));
  if (!book) throw new LibraryError(404, 'El libro no existe.');
  return book;
}

function getUser(db, id) {
  const user = one(db, 'SELECT * FROM users WHERE id = ?', Number(id));
  if (!user) throw new LibraryError(404, 'El usuario no existe.');
  return user;
}

function checkCanBorrow(db, bookId, userId, now) {
  getUser(db, userId);
  const active = db
    .prepare('SELECT book_id, due_date FROM loans WHERE user_id = ? AND return_date IS NULL')
    .all(Number(userId));
  if (active.some((l) => l.book_id === Number(bookId))) {
    throw new LibraryError(409, 'El usuario ya tiene este libro en préstamo.');
  }
  if (active.some((l) => new Date(l.due_date) < now)) {
    throw new LibraryError(409, 'El usuario tiene préstamos vencidos: debe devolverlos antes de un nuevo préstamo.');
  }
  if (active.length >= MAX_ACTIVE_LOANS) {
    throw new LibraryError(409, `El usuario alcanzó el máximo de ${MAX_ACTIVE_LOANS} préstamos activos.`);
  }
}

export function createLibrary(db, { clock = () => new Date() } = {}) {
  const insertLoan = db.prepare(
    'INSERT INTO loans (book_id, user_id, loan_date, due_date, return_date) VALUES (?, ?, ?, ?, NULL)'
  );

  return {
    state: () => readState(db),

    // PRÉSTAMO: insertar préstamo + descontar ejemplar (una transacción)
    createLoan({ bookId, userId, days = LOAN_DAYS_DEFAULT }) {
      const now = clock();
      const d = Number(days);
      if (!Number.isInteger(d) || d < 1 || d > 30) throw new LibraryError(400, 'Los días de préstamo deben estar entre 1 y 30.');
      return transaction(db, () => {
        const book = getBook(db, bookId);
        checkCanBorrow(db, book.id, userId, now);
        if (book.available_copies <= 0) {
          throw new LibraryError(409, 'No hay ejemplares disponibles. Puede unirse a la lista de espera.');
        }
        const info = insertLoan.run(book.id, Number(userId), now.toISOString(), new Date(now.getTime() + d * DAY).toISOString());
        db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(book.id);
        return { id: Number(info.lastInsertRowid) };
      });
    },

    // DEVOLUCIÓN: cerrar préstamo + APILAR en el carrito (push)
    returnLoan(loanId) {
      const now = clock().toISOString();
      return transaction(db, () => {
        const loan = one(db, 'SELECT * FROM loans WHERE id = ?', Number(loanId));
        if (!loan) throw new LibraryError(404, 'El préstamo no existe.');
        if (loan.return_date) throw new LibraryError(409, 'Este préstamo ya fue devuelto.');
        db.prepare('UPDATE loans SET return_date = ? WHERE id = ?').run(now, loan.id);
        const info = db
          .prepare('INSERT INTO return_stack (loan_id, book_id, pushed_at, shelved_at) VALUES (?, ?, ?, NULL)')
          .run(loan.id, loan.book_id, now);
        return { id: Number(info.lastInsertRowid), bookId: loan.book_id };
      });
    },

    /**
     * REUBICAR: POP de la pila (el último devuelto) y, si hay lista de
     * espera, DEQUEUE del primero que reservó (se le presta el libro).
     * Todo en una sola transacción.
     */
    shelveTop() {
      const now = clock();
      return transaction(db, () => {
        // Cima de la pila = el último que entró (LIFO)
        const top = one(
          db,
          'SELECT * FROM return_stack WHERE shelved_at IS NULL ORDER BY pushed_at DESC, id DESC LIMIT 1'
        );
        if (!top) throw new LibraryError(409, 'No hay libros en el carrito de devoluciones.');
        db.prepare('UPDATE return_stack SET shelved_at = ? WHERE id = ?').run(now.toISOString(), top.id);

        // Frente de la cola = la reserva más antigua (FIFO)
        const first = one(
          db,
          `SELECT * FROM reservations WHERE book_id = ? AND status = 'waiting'
           ORDER BY created_at ASC, id ASC LIMIT 1`,
          top.book_id
        );
        if (first) {
          db.prepare("UPDATE reservations SET status = 'fulfilled', fulfilled_at = ? WHERE id = ?").run(now.toISOString(), first.id);
          const info = insertLoan.run(
            top.book_id,
            first.user_id,
            now.toISOString(),
            new Date(now.getTime() + LOAN_DAYS_DEFAULT * DAY).toISOString()
          );
          return { itemId: top.id, bookId: top.book_id, assignedTo: first.user_id, loanId: Number(info.lastInsertRowid) };
        }
        db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(top.book_id);
        return { itemId: top.id, bookId: top.book_id, assignedTo: null, loanId: null };
      });
    },

    // RESERVA: ENCOLAR al final de la lista de espera (enqueue)
    reserve({ bookId, userId }) {
      const now = clock().toISOString();
      return transaction(db, () => {
        const book = getBook(db, bookId);
        getUser(db, userId);
        if (book.available_copies > 0) {
          throw new LibraryError(409, 'Hay ejemplares disponibles: realice el préstamo directamente.');
        }
        if (one(db, 'SELECT id FROM loans WHERE book_id = ? AND user_id = ? AND return_date IS NULL', book.id, Number(userId))) {
          throw new LibraryError(409, 'El usuario ya tiene este libro en préstamo.');
        }
        if (one(db, "SELECT id FROM reservations WHERE book_id = ? AND user_id = ? AND status = 'waiting'", book.id, Number(userId))) {
          throw new LibraryError(409, 'El usuario ya está en la lista de espera de este libro.');
        }
        const info = db
          .prepare("INSERT INTO reservations (book_id, user_id, created_at, status) VALUES (?, ?, ?, 'waiting')")
          .run(book.id, Number(userId), now);
        return { id: Number(info.lastInsertRowid) };
      });
    },

    cancelReservation(id) {
      return transaction(db, () => {
        const r = one(db, 'SELECT * FROM reservations WHERE id = ?', Number(id));
        if (!r) throw new LibraryError(404, 'La reserva no existe.');
        if (r.status !== 'waiting') throw new LibraryError(409, 'La reserva ya no está en espera.');
        db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(r.id);
        return { id: r.id };
      });
    },

    addBook(data) {
      const now = clock().toISOString();
      return transaction(db, () => {
        const { categories, books } = readState(db);
        const { year, copies, category } = validateBookInput({ categories, books }, data);
        const sameCat = books.filter((b) => b.categoryId === category.id).length;
        const info = db
          .prepare(`INSERT INTO books (code, title, author, year, publisher, category_id, total_copies, available_copies, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(
            `${category.code}-${String(sameCat + 1).padStart(3, '0')}`,
            String(data.title).trim(),
            String(data.author).trim(),
            year,
            String(data.publisher ?? '').trim() || 'Sin editorial',
            category.id,
            copies,
            copies,
            now
          );
        return { id: Number(info.lastInsertRowid) };
      });
    },

    addUser(data) {
      return transaction(db, () => {
        const users = db.prepare('SELECT code FROM users').all().map((u) => ({ ...u }));
        validateUserInput({ users }, data);
        const info = db
          .prepare('INSERT INTO users (code, name, program, role) VALUES (?, ?, ?, ?)')
          .run(String(data.code).trim(), String(data.name).trim(), String(data.program).trim(), data.role);
        return { id: Number(info.lastInsertRowid) };
      });
    },
  };
}
