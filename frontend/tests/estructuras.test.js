/**
 * Pruebas de las 6 estructuras de datos, del modelo de la biblioteca y
 * de las reglas del modo local (transacciones en memoria).
 * Ejecutar con:  npm test   (dentro de frontend/)
 * Estudiante: Salvador Rodriguez Velasco
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Stack } from '../src/structures/Stack.js';
import { Queue } from '../src/structures/Queue.js';
import { Trie, normalize } from '../src/structures/Trie.js';
import { ArbolNario, Nodo } from '../src/structures/ArbolNario.js';
import { Heap } from '../src/structures/Heap.js';
import { Graph } from '../src/structures/Graph.js';
import { buildLibrary } from '../src/data/buildLibrary.js';
import { createSeed } from '../../shared/seed.js';
import * as rules from '../../shared/rules.js';

const NOW = new Date('2026-10-16T15:00:00.000Z');

test('Pila: LIFO (ejemplo de la clase: push 10, push 20, pop, peek)', () => {
  const s = new Stack();
  s.push(10);
  s.push(20);
  assert.equal(s.pop(), 20);
  assert.equal(s.peek(), 10);
  assert.equal(s.isEmpty(), false);
  s.push(30);
  assert.deepEqual(s.print(), [30, 10]);
  s.pop();
  s.pop();
  assert.equal(s.pop(), null);
});

test('Cola enlazada: FIFO (ejemplo de la clase: A, B, C)', () => {
  const q = new Queue();
  ['A', 'B', 'C'].forEach((x) => q.enqueue(x));
  assert.equal(q.dequeue(), 'A');
  assert.equal(q.peek(), 'B');
  assert.equal(q.size(), 2);
  assert.equal(q.positionOf((x) => x === 'C'), 2);
  q.dequeue();
  q.dequeue();
  assert.equal(q.dequeue(), null);
  assert.equal(q.tail, null);
  q.enqueue('D');
  assert.deepEqual(q.toArray(), ['D']);
});

test('Trie: inserción, búsqueda exacta, prefijos y normalización', () => {
  const t = new Trie();
  t.insert('algoritmos', 1);
  t.insert('algebra', 2);
  t.insert('Álgebra', 3);
  t.insert('alto', 4);
  assert.deepEqual(t.search('algebra'), [2, 3]);
  assert.equal(t.startsWith('alg'), true);
  assert.equal(t.startsWith('xyz'), false);
  assert.deepEqual(t.collect('alg').sort(), [1, 2, 3]);
  assert.deepEqual(t.collect('al').sort(), [1, 2, 3, 4]);
  assert.equal(t.keyCount, 3);
  assert.equal(normalize('  Física   Universitaria! '), 'fisica universitaria');
});

test('Árbol N-ario: DFS, BFS, altura, subárbol y suma recursiva', () => {
  const filas = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
    { id: 4, parentId: 2 },
    { id: 5, parentId: 2 },
  ];
  const arbol = ArbolNario.desdeFilas(filas);
  assert.deepEqual(arbol.dfs().map(({ nodo }) => nodo.valor.id), [1, 2, 4, 5, 3]);
  assert.deepEqual(arbol.bfs().map(({ nodo }) => nodo.valor.id), [1, 2, 3, 4, 5]);
  assert.equal(arbol.altura(), 2);
  assert.equal(arbol.tamano(), 5);
  const nodo2 = arbol.buscar((v) => v.id === 2);
  assert.deepEqual(arbol.subarbol(nodo2).map((v) => v.id), [2, 4, 5]);
  assert.equal(arbol.sumar((v) => v.id), 15);
  assert.ok(new Nodo('x').esHoja());
});

test('Heap: min-heap y max-heap mantienen la raíz y ordenan con pop', () => {
  const min = new Heap((a, b) => a - b, [5, 3, 8, 1, 9, 2]);
  assert.equal(min.peek(), 1);
  assert.deepEqual(min.top(3), [1, 2, 3]);
  assert.equal(min.size(), 6, 'top() no modifica el heap');
  const sorted = [];
  while (!min.isEmpty()) sorted.push(min.pop());
  assert.deepEqual(sorted, [1, 2, 3, 5, 8, 9]);

  const max = new Heap((a, b) => b - a, [4, 10, 7]);
  assert.equal(max.pop(), 10);
  assert.deepEqual(max.levels(), [[7], [4]]);
});

test('Grafo: aristas no dirigidas con peso acumulado, BFS y camino', () => {
  const g = new Graph();
  [1, 2, 3, 4].forEach((id) => g.addNode({ id }));
  g.addEdge(1, 2, 3, 'co');
  g.addEdge(1, 2, 1, 'cat');
  g.addEdge(2, 3, 1, 'cat');
  assert.equal(g.adjList[1][2].weight, 4);
  assert.deepEqual(g.adjList[2][1].reasons, ['co', 'cat']);
  assert.equal(g.edgeCount(), 2);
  assert.deepEqual(g.neighbors(2).map((n) => n.node.id), [1, 3]);
  assert.deepEqual(g.bfs(1).map((r) => [r.id, r.distance]), [[1, 0], [2, 1], [3, 2]]);
  assert.deepEqual(g.shortestPath(1, 3), [1, 2, 3]);
  assert.deepEqual(g.shortestPath(1, 4), []);
});

test('Modelo de la biblioteca: las 6 estructuras con los datos de ejemplo', () => {
  const lib = buildLibrary(createSeed(NOW), NOW);

  // Pila: la cima es la última devolución (Grokking Algorithms)
  assert.equal(lib.returnStack.size(), 3);
  assert.equal(lib.booksById.get(lib.returnStack.peek().bookId).title, 'Grokking Algorithms');

  // Cola: lista de espera de Grokking en orden de reserva
  const grokking = lib.state.books.find((b) => b.title === 'Grokking Algorithms');
  assert.deepEqual(lib.queueOf(grokking.id).toArray().map((r) => r.userId), [2, 4, 6]);

  // Trie: búsqueda por prefijos combinados y sin tildes
  assert.deepEqual(lib.search('clean mar').map((b) => b.title), ['Clean Architecture', 'Clean Code']);
  assert.deepEqual(lib.search('algebra').map((b) => b.title), ['Álgebra lineal y sus aplicaciones']);
  assert.ok(lib.suggest('garc').some((s) => s.label === 'Gabriel García Márquez'));

  // Árbol: Informática incluye sus 4 materias
  const inf = lib.categoryTree.buscar((c) => c.name === 'Informática');
  assert.equal(lib.countBooks(inf), 15);
  assert.equal(lib.search('', 3).length, 15);
  assert.deepEqual(lib.categoryPath(5).map((c) => c.name), ['Biblioteca UAO', 'Ingeniería', 'Informática', 'Estructuras de datos y algoritmos']);

  // Heap: el préstamo que vence primero es el más vencido (DDIA, -10 días)
  const first = lib.dueHeap.peek();
  assert.equal(lib.booksById.get(first.bookId).title, 'Designing Data-Intensive Applications');
  assert.equal(lib.stats.overdue, 3);
  assert.equal(lib.popularHeap.peek().title, 'Cálculo de una variable');

  // Grafo: Clean Code y Clean Architecture comparten autor
  const cc = lib.state.books.find((b) => b.title === 'Clean Code');
  const ca = lib.state.books.find((b) => b.title === 'Clean Architecture');
  assert.ok(lib.graph.adjList[cc.id][ca.id].reasons.includes('Mismo autor'));
  assert.ok(lib.recommend(cc.id).length > 0);
});

test('Modo local: transacciones atómicas sobre el estado (commit / rollback)', () => {
  const s0 = createSeed(NOW);
  const refactoring = s0.books.find((b) => b.title === 'Refactoring');

  // Commit: préstamo exitoso
  const ok = rules.transaction(s0, (draft) => rules.createLoan(draft, { bookId: refactoring.id, userId: 6 }, NOW));
  assert.equal(ok.state.books.find((b) => b.id === refactoring.id).availableCopies, 0);
  assert.equal(s0.books.find((b) => b.id === refactoring.id).availableCopies, 1, 'el original no cambia');

  // Rollback: el préstamo falla (usuario con vencidos) y nada cambia
  assert.throws(
    () => rules.transaction(s0, (draft) => rules.createLoan(draft, { bookId: refactoring.id, userId: 4 }, NOW)),
    /vencidos/
  );

  // Reubicar: pop de la pila + dequeue de la cola
  const shelved = rules.transaction(s0, (draft) => rules.shelveTop(draft, NOW));
  assert.equal(shelved.result.assignedTo, 2);
  assert.ok(shelved.state.loans.some((l) => l.userId === 2 && l.bookId === shelved.result.item.bookId && !l.returnDate));
});
