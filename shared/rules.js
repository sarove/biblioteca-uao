/**
 * REGLAS DE NEGOCIO DE LA BIBLIOTECA (modo local)
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Son las mismas reglas que el backend aplica con SQL. Aquí se aplican
 * sobre un objeto de estado en memoria. Cada operación es ATÓMICA:
 * trabaja sobre una copia del estado y solo la "confirma" (commit) si
 * no hubo errores; si algo falla, el estado original queda intacto
 * (rollback). Así se emula una transacción de base de datos.
 */
import { LOAN_DAYS_DEFAULT, MAX_ACTIVE_LOANS } from './seed.js';

const DAY = 24 * 60 * 60 * 1000;

export class LibraryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const nextId = (rows) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
const required = (value, message) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new LibraryError(400, message);
  }
};

function getBook(state, id) {
  const book = state.books.find((b) => b.id === Number(id));
  if (!book) throw new LibraryError(404, 'El libro no existe.');
  return book;
}

function getUser(state, id) {
  const user = state.users.find((u) => u.id === Number(id));
  if (!user) throw new LibraryError(404, 'El usuario no existe.');
  return user;
}

/**
 * Ejecuta una operación como transacción sobre una copia del estado.
 * @returns {{ state, result }} estado nuevo (si todo salió bien) y resultado
 */
export function transaction(state, operation) {
  const draft = structuredClone(state);
  const result = operation(draft); // si lanza un error, "draft" se descarta
  return { state: draft, result };
}

// ---------- Validaciones comunes ----------

export function checkCanBorrow(state, bookId, userId, now) {
  const book = getBook(state, bookId);
  getUser(state, userId);
  const active = state.loans.filter((l) => l.userId === Number(userId) && !l.returnDate);

  if (active.some((l) => l.bookId === book.id)) {
    throw new LibraryError(409, 'El usuario ya tiene este libro en préstamo.');
  }
  if (active.some((l) => new Date(l.dueDate) < now)) {
    throw new LibraryError(409, 'El usuario tiene préstamos vencidos: debe devolverlos antes de un nuevo préstamo.');
  }
  if (active.length >= MAX_ACTIVE_LOANS) {
    throw new LibraryError(409, `El usuario alcanzó el máximo de ${MAX_ACTIVE_LOANS} préstamos activos.`);
  }
  return book;
}

// ---------- Operaciones ----------

// Préstamo: valida, crea el préstamo y descuenta un ejemplar disponible
export function createLoan(state, { bookId, userId, days = LOAN_DAYS_DEFAULT }, now = new Date()) {
  const d = Number(days);
  if (!Number.isInteger(d) || d < 1 || d > 30) throw new LibraryError(400, 'Los días de préstamo deben estar entre 1 y 30.');
  const book = checkCanBorrow(state, bookId, userId, now);
  if (book.availableCopies <= 0) {
    throw new LibraryError(409, 'No hay ejemplares disponibles. Puede unirse a la lista de espera.');
  }
  const loan = {
    id: nextId(state.loans),
    bookId: book.id,
    userId: Number(userId),
    loanDate: now.toISOString(),
    dueDate: new Date(now.getTime() + d * DAY).toISOString(),
    returnDate: null,
  };
  state.loans.push(loan);
  book.availableCopies -= 1;
  return loan;
}

// Devolución: cierra el préstamo y APILA el ejemplar en el carrito (pila)
export function returnLoan(state, loanId, now = new Date()) {
  const loan = state.loans.find((l) => l.id === Number(loanId));
  if (!loan) throw new LibraryError(404, 'El préstamo no existe.');
  if (loan.returnDate) throw new LibraryError(409, 'Este préstamo ya fue devuelto.');
  loan.returnDate = now.toISOString();
  const item = {
    id: nextId(state.returnStack),
    loanId: loan.id,
    bookId: loan.bookId,
    pushedAt: now.toISOString(),
    shelvedAt: null,
  };
  state.returnStack.push(item);
  return item;
}

/**
 * Reubicar: saca la CIMA de la pila de devoluciones (pop). Si el libro
 * tiene lista de espera, atiende al PRIMERO de la cola (dequeue) y le
 * crea el préstamo; si no, el ejemplar vuelve a estar disponible.
 */
export function shelveTop(state, now = new Date()) {
  const pending = state.returnStack.filter((r) => !r.shelvedAt);
  if (pending.length === 0) throw new LibraryError(409, 'No hay libros en el carrito de devoluciones.');
  const top = pending.reduce((a, b) => (b.pushedAt > a.pushedAt || (b.pushedAt === a.pushedAt && b.id > a.id) ? b : a));
  top.shelvedAt = now.toISOString();

  const book = getBook(state, top.bookId);
  const waiting = state.reservations
    .filter((r) => r.bookId === book.id && r.status === 'waiting')
    .sort((a, b) => (a.createdAt === b.createdAt ? a.id - b.id : a.createdAt < b.createdAt ? -1 : 1));

  if (waiting.length > 0) {
    const first = waiting[0];
    first.status = 'fulfilled';
    first.fulfilledAt = now.toISOString();
    const loan = {
      id: nextId(state.loans),
      bookId: book.id,
      userId: first.userId,
      loanDate: now.toISOString(),
      dueDate: new Date(now.getTime() + LOAN_DAYS_DEFAULT * DAY).toISOString(),
      returnDate: null,
    };
    state.loans.push(loan);
    return { item: top, assignedTo: first.userId, loan };
  }

  book.availableCopies += 1;
  return { item: top, assignedTo: null, loan: null };
}

// Reserva: entra al FINAL de la cola de espera del libro (enqueue)
export function reserve(state, { bookId, userId }, now = new Date()) {
  const book = getBook(state, bookId);
  getUser(state, userId);
  if (book.availableCopies > 0) {
    throw new LibraryError(409, 'Hay ejemplares disponibles: realice el préstamo directamente.');
  }
  if (state.loans.some((l) => l.bookId === book.id && l.userId === Number(userId) && !l.returnDate)) {
    throw new LibraryError(409, 'El usuario ya tiene este libro en préstamo.');
  }
  if (state.reservations.some((r) => r.bookId === book.id && r.userId === Number(userId) && r.status === 'waiting')) {
    throw new LibraryError(409, 'El usuario ya está en la lista de espera de este libro.');
  }
  const reservation = {
    id: nextId(state.reservations),
    bookId: book.id,
    userId: Number(userId),
    createdAt: now.toISOString(),
    status: 'waiting',
  };
  state.reservations.push(reservation);
  return reservation;
}

export function cancelReservation(state, reservationId) {
  const r = state.reservations.find((x) => x.id === Number(reservationId));
  if (!r) throw new LibraryError(404, 'La reserva no existe.');
  if (r.status !== 'waiting') throw new LibraryError(409, 'La reserva ya no está en espera.');
  r.status = 'cancelled';
  return r;
}

export function validateBookInput(state, data) {
  required(data.title, 'El título es obligatorio.');
  required(data.author, 'El autor es obligatorio.');
  const year = Number(data.year);
  const copies = Number(data.totalCopies);
  if (!Number.isInteger(year) || year < 1450 || year > new Date().getFullYear() + 1) {
    throw new LibraryError(400, 'El año de publicación no es válido.');
  }
  if (!Number.isInteger(copies) || copies < 1 || copies > 50) {
    throw new LibraryError(400, 'Los ejemplares deben estar entre 1 y 50.');
  }
  const category = state.categories.find((c) => c.id === Number(data.categoryId));
  if (!category || category.parentId === null) throw new LibraryError(400, 'Seleccione una categoría válida.');
  const dup = state.books.find(
    (b) => b.title.trim().toLowerCase() === String(data.title).trim().toLowerCase() &&
      b.author.trim().toLowerCase() === String(data.author).trim().toLowerCase()
  );
  if (dup) throw new LibraryError(409, 'Ese libro ya está en el catálogo; aumente sus ejemplares en su lugar.');
  return { year, copies, category };
}

export function addBook(state, data, now = new Date()) {
  const { year, copies, category } = validateBookInput(state, data);
  const sameCat = state.books.filter((b) => b.categoryId === category.id).length;
  const book = {
    id: nextId(state.books),
    code: `${category.code}-${String(sameCat + 1).padStart(3, '0')}`,
    title: String(data.title).trim(),
    author: String(data.author).trim(),
    year,
    publisher: String(data.publisher ?? '').trim() || 'Sin editorial',
    categoryId: category.id,
    totalCopies: copies,
    availableCopies: copies,
    createdAt: now.toISOString(),
  };
  state.books.push(book);
  return book;
}

export function validateUserInput(state, data) {
  required(data.code, 'El código es obligatorio.');
  required(data.name, 'El nombre es obligatorio.');
  required(data.program, 'El programa o dependencia es obligatorio.');
  if (!['Estudiante', 'Docente', 'Administrativo'].includes(data.role)) {
    throw new LibraryError(400, 'El rol no es válido.');
  }
  if (state.users.some((u) => u.code.toLowerCase() === String(data.code).trim().toLowerCase())) {
    throw new LibraryError(409, 'Ya existe un usuario con ese código.');
  }
}

export function addUser(state, data) {
  validateUserInput(state, data);
  const user = {
    id: nextId(state.users),
    code: String(data.code).trim(),
    name: String(data.name).trim(),
    program: String(data.program).trim(),
    role: data.role,
  };
  state.users.push(user);
  return user;
}
