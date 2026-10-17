/**
 * Pruebas del backend: API REST + SQLite + transacciones.
 * Se usa una base de datos en memoria y un reloj fijo.
 * Ejecutar con:  npm test   (dentro de backend/)
 * Estudiante: Salvador Rodriguez Velasco
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, transaction } from '../src/db.js';
import { createApp } from '../src/app.js';

const NOW = new Date('2026-10-16T15:00:00.000Z');
let server;
let base;
let db;

before(async () => {
  db = openDatabase(':memory:', { now: NOW });
  const app = createApp(db, { clock: () => NOW });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const api = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

const reset = () => api('POST', '/reset');
const bookByTitle = (state, title) => state.books.find((b) => b.title === title);

test('health y estado inicial de la base de datos', async () => {
  const health = await api('GET', '/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);

  const { data } = await api('GET', '/state');
  assert.equal(data.categories.length, 17);
  assert.equal(data.books.length, 31);
  assert.equal(data.users.length, 8);
  assert.equal(data.loans.filter((l) => !l.returnDate).length, 10);
  assert.equal(data.reservations.filter((r) => r.status === 'waiting').length, 7);
  assert.equal(data.returnStack.filter((r) => !r.shelvedAt).length, 3);
});

test('préstamo: crea el préstamo y descuenta un ejemplar en la misma transacción', async () => {
  const { data: s0 } = await reset();
  const book = bookByTitle(s0.state, 'Refactoring');
  assert.equal(book.availableCopies, 1);

  const r = await api('POST', '/loans', { bookId: book.id, userId: 6, days: 10 });
  assert.equal(r.status, 201);
  assert.equal(bookByTitle(r.data.state, 'Refactoring').availableCopies, 0);
  const loan = r.data.state.loans.find((l) => l.id === r.data.result.id);
  assert.equal(loan.userId, 6);
  assert.equal(new Date(loan.dueDate) - new Date(loan.loanDate), 10 * 86400000);
});

test('préstamo rechazado: sin ejemplares, usuario con vencidos o ya lo tiene', async () => {
  const { data: s0 } = await reset();
  const grokking = bookByTitle(s0.state, 'Grokking Algorithms');
  const sinCopias = await api('POST', '/loans', { bookId: grokking.id, userId: 6 });
  assert.equal(sinCopias.status, 409);
  assert.match(sinCopias.data.error, /lista de espera/);

  // Usuario 4 tiene un préstamo vencido (Clean Code)
  const vencido = await api('POST', '/loans', { bookId: bookByTitle(s0.state, 'Refactoring').id, userId: 4 });
  assert.equal(vencido.status, 409);
  assert.match(vencido.data.error, /vencidos/);

  const repetido = await api('POST', '/loans', { bookId: bookByTitle(s0.state, 'Introduction to Algorithms').id, userId: 2 });
  assert.equal(repetido.status, 409);

  const { data: s1 } = await api('GET', '/state');
  assert.equal(s1.loans.length, s0.state.loans.length, 'no se insertó ningún préstamo');
});

test('devolución: cierra el préstamo y lo APILA en el carrito (push)', async () => {
  const { data: s0 } = await reset();
  const loan = s0.state.loans.find((l) => l.userId === 6 && !l.returnDate);
  const r = await api('POST', `/loans/${loan.id}/return`);
  assert.equal(r.status, 200);
  const pending = r.data.state.returnStack.filter((x) => !x.shelvedAt);
  assert.equal(pending.length, 4);
  assert.equal(pending.at(-1).loanId, loan.id, 'queda en la cima');
  assert.ok(r.data.state.loans.find((l) => l.id === loan.id).returnDate);

  const again = await api('POST', `/loans/${loan.id}/return`);
  assert.equal(again.status, 409);
});

test('reubicar: POP de la pila + DEQUEUE de la cola en una transacción', async () => {
  const { data: s0 } = await reset();
  const grokking = bookByTitle(s0.state, 'Grokking Algorithms');

  // La cima es Grokking (último devuelto) y su cola tiene 3 reservas: primero Ana (usuario 2)
  const r1 = await api('POST', '/returns/shelve');
  assert.equal(r1.status, 200);
  assert.equal(r1.data.result.bookId, grokking.id);
  assert.equal(r1.data.result.assignedTo, 2);
  const s1 = r1.data.state;
  assert.equal(s1.reservations.find((r) => r.bookId === grokking.id && r.userId === 2).status, 'fulfilled');
  assert.equal(s1.reservations.filter((r) => r.bookId === grokking.id && r.status === 'waiting').length, 2);
  assert.ok(s1.loans.some((l) => l.bookId === grokking.id && l.userId === 2 && !l.returnDate));
  assert.equal(bookByTitle(s1, 'Grokking Algorithms').availableCopies, 0, 'el ejemplar pasó directo a la reserva');

  // Siguiente cima: Matemáticas discretas, sin reservas -> vuelve a estar disponible
  const r2 = await api('POST', '/returns/shelve');
  assert.equal(r2.data.result.assignedTo, null);
  assert.equal(bookByTitle(r2.data.state, 'Matemáticas discretas y sus aplicaciones').availableCopies, 2);

  await api('POST', '/returns/shelve');
  const vacia = await api('POST', '/returns/shelve');
  assert.equal(vacia.status, 409);
});

test('reservas: solo sin ejemplares, sin duplicados, y cancelación', async () => {
  const { data: s0 } = await reset();
  const disponible = await api('POST', '/reservations', { bookId: bookByTitle(s0.state, 'Clean Code').id, userId: 3 });
  assert.equal(disponible.status, 409);

  const ddia = bookByTitle(s0.state, 'Designing Data-Intensive Applications');
  const ok = await api('POST', '/reservations', { bookId: ddia.id, userId: 3 });
  assert.equal(ok.status, 201);
  const cola = ok.data.state.reservations.filter((r) => r.bookId === ddia.id && r.status === 'waiting');
  assert.deepEqual(cola.map((r) => r.userId), [1, 3], 'entra al final de la cola');

  const dup = await api('POST', '/reservations', { bookId: ddia.id, userId: 3 });
  assert.equal(dup.status, 409);

  const cancel = await api('DELETE', `/reservations/${ok.data.result.id}`);
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.state.reservations.find((r) => r.id === ok.data.result.id).status, 'cancelled');
});

test('libros y usuarios nuevos con validación', async () => {
  await reset();
  const book = await api('POST', '/books', {
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson y Gerald Jay Sussman',
    year: 1996,
    publisher: 'MIT Press',
    categoryId: 4,
    totalCopies: 2,
  });
  assert.equal(book.status, 201);
  const nuevo = book.data.state.books.find((b) => b.id === book.data.result.id);
  assert.equal(nuevo.code, 'PRG-006');
  assert.equal(nuevo.availableCopies, 2);

  const malo = await api('POST', '/books', { title: '', author: 'X', year: 2020, categoryId: 4, totalCopies: 1 });
  assert.equal(malo.status, 400);

  const user = await api('POST', '/users', { code: '2230001', name: 'Daniela Arango', program: 'Biología', role: 'Estudiante' });
  assert.equal(user.status, 201);
  const dupUser = await api('POST', '/users', { code: '2230001', name: 'Otra', program: 'X', role: 'Estudiante' });
  assert.equal(dupUser.status, 409);
});

test('transacción: si falla a mitad de camino se hace ROLLBACK', () => {
  const before = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  assert.throws(() =>
    transaction(db, () => {
      db.prepare("INSERT INTO users (code, name, program, role) VALUES ('X-1', 'Temporal', 'Prueba', 'Estudiante')").run();
      throw new Error('falla simulada después del INSERT');
    })
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, before);

  // La restricción CHECK impide ejemplares disponibles negativos
  assert.throws(() => db.prepare('UPDATE books SET available_copies = -1 WHERE id = 1').run());
});

test('rutas y JSON inválidos', async () => {
  assert.equal((await api('GET', '/no-existe')).status, 404);
  const res = await fetch(`${base}/loans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malo' });
  assert.equal(res.status, 400);
});
