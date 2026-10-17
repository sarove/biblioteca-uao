/**
 * CONSTRUCCIÓN DE LAS ESTRUCTURAS DE DATOS A PARTIR DE LA BASE DE DATOS
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * La base de datos guarda las tablas (libros, préstamos, reservas...).
 * Cada vez que llega el estado, esta función arma en memoria las seis
 * estructuras que usa la interfaz:
 *
 *   Pila (Stack)       -> carrito de devoluciones por reubicar
 *   Cola (Queue)       -> lista de espera de cada libro
 *   Trie               -> buscador con autocompletado
 *   Árbol N-ario       -> clasificación temática (categorías)
 *   Heap               -> préstamos por vencer (min) y más prestados (max)
 *   Grafo              -> recomendaciones entre libros
 */
import { Stack } from '../structures/Stack.js';
import { Queue } from '../structures/Queue.js';
import { Trie, words, normalize } from '../structures/Trie.js';
import { ArbolNario } from '../structures/ArbolNario.js';
import { Heap } from '../structures/Heap.js';
import { Graph } from '../structures/Graph.js';

export const EDGE_WEIGHTS = { coLoan: 3, author: 2, category: 1 };
export const REASONS = {
  coLoan: 'Prestados por los mismos lectores',
  author: 'Mismo autor',
  category: 'Misma materia',
};

const byDate = (field) => (a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : a.id - b.id);

// Autor principal para comparar: "Robert C. Martin" y "Robert C. Martin" coinciden
const authorKey = (author) => normalize(author.replace(/ et al\.?/i, ''));

export function buildLibrary(state, now = new Date()) {
  const booksById = new Map(state.books.map((b) => [b.id, b]));
  const usersById = new Map(state.users.map((u) => [u.id, u]));
  const categoriesById = new Map(state.categories.map((c) => [c.id, c]));

  // ---------- ÁRBOL N-ARIO de categorías ----------
  const categoryTree = ArbolNario.desdeFilas(state.categories);
  const directCount = new Map();
  state.books.forEach((b) => directCount.set(b.categoryId, (directCount.get(b.categoryId) ?? 0) + 1));
  const countBooks = (node) => categoryTree.sumar((c) => directCount.get(c.id) ?? 0, node);
  const categoryIdsUnder = (categoryId) => {
    const node = categoryTree.buscar((c) => c.id === Number(categoryId));
    return new Set(categoryTree.subarbol(node).map((c) => c.id));
  };
  const categoryPath = (categoryId) => categoryTree.rutaHasta((c) => c.id === Number(categoryId)).map((n) => n.valor);

  // ---------- TRIE: índice por palabra y sugerencias por frase ----------
  const wordTrie = new Trie(); // palabra -> ids de libros
  const suggestTrie = new Trie(); // título / autor completo -> sugerencia
  state.books.forEach((b) => {
    [...words(b.title), ...words(b.author)].forEach((w) => wordTrie.insert(w, b.id));
    suggestTrie.insert(b.title, { type: 'title', label: b.title, bookId: b.id });
    words(b.title).forEach((w, i, arr) => {
      // también se sugiere el título desde cualquiera de sus palabras
      if (i > 0) suggestTrie.insert(arr.slice(i).join(' '), { type: 'title', label: b.title, bookId: b.id });
    });
    b.author.split(/ y |, /).forEach((name) => {
      const clean = name.replace(/ et al\.?/i, '').trim();
      // el autor se sugiere desde cualquiera de sus nombres o apellidos
      const parts = clean.split(' ');
      parts.forEach((_, i) => suggestTrie.insert(parts.slice(i).join(' '), { type: 'author', label: clean }));
    });
  });

  /**
   * Búsqueda: cada palabra de la consulta se busca como PREFIJO en el
   * Trie y se intersectan los resultados ("clean mar" -> Clean Code y
   * Clean Architecture de Robert C. Martin).
   */
  const search = (query, categoryId = null) => {
    const terms = normalize(query).split(' ').filter(Boolean);
    let ids = null;
    for (const term of terms) {
      const found = new Set(wordTrie.collect(term));
      ids = ids === null ? found : new Set([...ids].filter((id) => found.has(id)));
    }
    let result = ids === null ? state.books.slice() : [...ids].map((id) => booksById.get(id));
    if (categoryId) {
      const allowed = categoryIdsUnder(categoryId);
      result = result.filter((b) => allowed.has(b.categoryId));
    }
    return result.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  };
  const suggest = (prefix, limit = 8) => (normalize(prefix).length < 1 ? [] : suggestTrie.collect(prefix, limit));

  // ---------- Préstamos ----------
  const activeLoans = state.loans.filter((l) => !l.returnDate);
  const isOverdue = (loan) => !loan.returnDate && new Date(loan.dueDate) < now;

  // HEAP mínimo por fecha de vencimiento: la raíz es el que vence primero
  const dueHeap = new Heap(byDate('dueDate'), activeLoans);

  // HEAP máximo por número de préstamos: el libro más prestado arriba
  const loanCount = new Map();
  state.loans.forEach((l) => loanCount.set(l.bookId, (loanCount.get(l.bookId) ?? 0) + 1));
  const popularHeap = new Heap(
    (a, b) => b.total - a.total || a.title.localeCompare(b.title, 'es'),
    state.books.map((b) => ({ id: b.id, title: b.title, total: loanCount.get(b.id) ?? 0 }))
  );

  // ---------- PILA: carrito de devoluciones (orden de llegada) ----------
  const returnStack = new Stack();
  state.returnStack
    .filter((r) => !r.shelvedAt)
    .sort(byDate('pushedAt'))
    .forEach((r) => returnStack.push(r));

  // ---------- COLAS: lista de espera por libro (orden de reserva) ----------
  const queues = new Map();
  state.reservations
    .filter((r) => r.status === 'waiting')
    .sort(byDate('createdAt'))
    .forEach((r) => {
      if (!queues.has(r.bookId)) queues.set(r.bookId, new Queue());
      queues.get(r.bookId).enqueue(r);
    });
  const queueOf = (bookId) => queues.get(bookId) ?? new Queue();

  // ---------- GRAFO de recomendaciones ----------
  const graph = new Graph();
  state.books.forEach((b) => graph.addNode({ id: b.id, title: b.title, categoryId: b.categoryId }));

  // 1) Co-préstamo: libros que prestó un mismo usuario
  const booksByUser = new Map();
  state.loans.forEach((l) => {
    if (!booksByUser.has(l.userId)) booksByUser.set(l.userId, new Set());
    booksByUser.get(l.userId).add(l.bookId);
  });
  booksByUser.forEach((set) => {
    const list = [...set];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) graph.addEdge(list[i], list[j], EDGE_WEIGHTS.coLoan, REASONS.coLoan);
    }
  });
  // 2) Mismo autor y 3) misma materia
  for (let i = 0; i < state.books.length; i++) {
    for (let j = i + 1; j < state.books.length; j++) {
      const a = state.books[i];
      const b = state.books[j];
      if (authorKey(a.author) === authorKey(b.author)) graph.addEdge(a.id, b.id, EDGE_WEIGHTS.author, REASONS.author);
      if (a.categoryId === b.categoryId) graph.addEdge(a.id, b.id, EDGE_WEIGHTS.category, REASONS.category);
    }
  }
  const recommend = (bookId, limit = 5) => graph.neighbors(bookId).slice(0, limit);

  // ---------- Resúmenes ----------
  const userLoans = (userId) => state.loans.filter((l) => l.userId === userId);
  const stats = {
    books: state.books.length,
    copies: state.books.reduce((s, b) => s + b.totalCopies, 0),
    available: state.books.reduce((s, b) => s + b.availableCopies, 0),
    users: state.users.length,
    activeLoans: activeLoans.length,
    overdue: activeLoans.filter(isOverdue).length,
    waiting: state.reservations.filter((r) => r.status === 'waiting').length,
    toShelve: returnStack.size(),
  };

  return {
    state,
    now,
    booksById,
    usersById,
    categoriesById,
    categoryTree,
    countBooks,
    categoryIdsUnder,
    categoryPath,
    wordTrie,
    suggestTrie,
    search,
    suggest,
    activeLoans,
    isOverdue,
    dueHeap,
    popularHeap,
    loanCount,
    returnStack,
    queues,
    queueOf,
    graph,
    recommend,
    userLoans,
    stats,
  };
}
