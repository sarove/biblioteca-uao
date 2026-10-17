/**
 * REPOSITORIO DE DATOS
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * La interfaz habla con un "repositorio" que tiene siempre los mismos
 * métodos. Hay dos implementaciones:
 *
 *   - HttpRepository:  usa la API REST del backend (SQLite + transacciones).
 *   - LocalRepository: si no hay backend, guarda la base de datos en el
 *                      navegador (localStorage) y aplica las mismas reglas
 *                      con transacciones en memoria (shared/rules.js).
 *
 * Todos los métodos de escritura retornan { result, state } con el estado
 * actualizado para reconstruir las estructuras de datos.
 */
import { createSeed } from '../../../shared/seed.js';
import * as rules from '../../../shared/rules.js';

export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class RepositoryError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

// ---------------- API REST ----------------
class HttpRepository {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.mode = 'api';
  }

  async request(method, path, body) {
    let res;
    try {
      res = await fetch(this.baseUrl + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new RepositoryError('No se pudo conectar con el servidor.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new RepositoryError(data.error ?? `Error ${res.status}`, res.status);
    return data;
  }

  health() {
    return this.request('GET', '/health');
  }

  getState() {
    return this.request('GET', '/state');
  }

  addBook(data) {
    return this.request('POST', '/books', data);
  }

  addUser(data) {
    return this.request('POST', '/users', data);
  }

  createLoan(data) {
    return this.request('POST', '/loans', data);
  }

  returnLoan(loanId) {
    return this.request('POST', `/loans/${loanId}/return`);
  }

  shelveTop() {
    return this.request('POST', '/returns/shelve');
  }

  reserve(data) {
    return this.request('POST', '/reservations', data);
  }

  cancelReservation(id) {
    return this.request('DELETE', `/reservations/${id}`);
  }

  reset() {
    return this.request('POST', '/reset');
  }
}

// ---------------- Modo local (localStorage) ----------------
const STORAGE_KEY = 'biblioteca-uao-db-v1';

class LocalRepository {
  constructor(reason = null) {
    this.mode = 'local';
    this.reason = reason;
    this.state = this.#load();
  }

  #load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* almacenamiento no disponible: se usan los datos de ejemplo */
    }
    const seed = createSeed(new Date());
    this.#save(seed);
    return seed;
  }

  #save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sin almacenamiento persistente: los datos viven solo en memoria */
    }
  }

  // Ejecuta la operación como transacción: commit solo si no hay error
  #run(operation) {
    try {
      const { state, result } = rules.transaction(this.state, (draft) => operation(draft, new Date()));
      this.state = state;
      this.#save(state);
      return Promise.resolve({ result, state: structuredClone(state) });
    } catch (error) {
      return Promise.reject(new RepositoryError(error.message, error.status ?? 400));
    }
  }

  getState() {
    return Promise.resolve(structuredClone(this.state));
  }

  addBook(data) {
    return this.#run((s, now) => ({ id: rules.addBook(s, data, now).id }));
  }

  addUser(data) {
    return this.#run((s) => ({ id: rules.addUser(s, data).id }));
  }

  createLoan(data) {
    return this.#run((s, now) => ({ id: rules.createLoan(s, data, now).id }));
  }

  returnLoan(loanId) {
    return this.#run((s, now) => {
      const item = rules.returnLoan(s, loanId, now);
      return { id: item.id, bookId: item.bookId };
    });
  }

  shelveTop() {
    return this.#run((s, now) => {
      const r = rules.shelveTop(s, now);
      return { itemId: r.item.id, bookId: r.item.bookId, assignedTo: r.assignedTo, loanId: r.loan?.id ?? null };
    });
  }

  reserve(data) {
    return this.#run((s, now) => ({ id: rules.reserve(s, data, now).id }));
  }

  cancelReservation(id) {
    return this.#run((s) => ({ id: rules.cancelReservation(s, id).id }));
  }

  reset() {
    this.state = createSeed(new Date());
    this.#save(this.state);
    return Promise.resolve({ result: { reset: true }, state: structuredClone(this.state) });
  }
}

/**
 * Elige el repositorio: si hay VITE_API_URL y el backend responde, se usa
 * la API; si no, el modo local (la plataforma siempre funciona).
 */
export async function connectRepository() {
  if (!API_URL) return new LocalRepository('No se configuró VITE_API_URL.');
  const http = new HttpRepository(API_URL);
  try {
    await http.health();
    return http;
  } catch {
    return new LocalRepository(`El backend (${API_URL}) no respondió.`);
  }
}
