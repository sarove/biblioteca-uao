import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, DS_Tag } from '../components/ui.jsx';
import { normalize } from '../structures/Trie.js';

/**
 * ESTRUCTURAS: qué estructura se usa, dónde, por qué y sus números en vivo.
 * Incluye un explorador del Trie y el estado de la base de datos.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function EstructurasPage() {
  const { lib, mode, modeReason, apiUrl, run, busy } = useLibrary();
  const [prefix, setPrefix] = useState('clea');
  const steps = lib.wordTrie.path(prefix);
  const matches = lib.wordTrie.collect(prefix).map((id) => lib.booksById.get(id).title);

  const rows = [
    {
      type: 'pila',
      where: 'Carrito de devoluciones',
      why: 'El bibliotecario toma siempre el libro que quedó encima: el último devuelto es el primero en reubicarse (LIFO).',
      ops: 'push O(1) · pop O(1) · peek O(1)',
      live: `${lib.returnStack.size()} libro(s) en el carrito`,
    },
    {
      type: 'cola',
      where: 'Lista de espera de cada libro',
      why: 'Es justo atender primero a quien reservó primero (FIFO). Implementada con nodos enlazados para que dequeue sea O(1).',
      ops: 'enqueue O(1) · dequeue O(1) · peek O(1)',
      live: `${lib.queues.size} cola(s) · ${lib.stats.waiting} reserva(s)`,
    },
    {
      type: 'trie',
      where: 'Buscador y autocompletado',
      why: 'Encuentra todas las palabras que empiezan por un prefijo recorriendo solo los caracteres escritos, sin revisar todo el catálogo.',
      ops: 'insert O(m) · buscar prefijo O(m + k)',
      live: `${lib.wordTrie.keyCount} palabras · ${lib.wordTrie.nodeCount} nodos`,
    },
    {
      type: 'arbol',
      where: 'Clasificación temática del catálogo',
      why: 'Las categorías son jerárquicas (facultad → área → materia). Filtrar una categoría incluye todo su subárbol y los conteos se suman recursivamente.',
      ops: 'DFS / BFS O(n) · subárbol O(n)',
      live: `${lib.categoryTree.tamano()} nodos · altura ${lib.categoryTree.altura()} · ${lib.categoryTree.hojas().length} hojas`,
    },
    {
      type: 'heap',
      where: 'Préstamos por vencer y libros más prestados',
      why: 'Siempre se necesita el elemento más urgente (o el más popular). La raíz del heap lo da en O(1) y se mantiene en O(log n).',
      ops: 'push O(log n) · pop O(log n) · peek O(1)',
      live: `min-heap: ${lib.dueHeap.size()} préstamos · max-heap: ${lib.popularHeap.size()} libros`,
    },
    {
      type: 'grafo',
      where: 'Recomendaciones entre libros',
      why: 'Las relaciones “leído por los mismos usuarios”, “mismo autor” y “misma materia” forman una red; los vecinos con más peso son las recomendaciones.',
      ops: 'addEdge O(1) · vecinos O(grado) · BFS O(V + E)',
      live: `${lib.graph.nodes.length} nodos · ${lib.graph.edgeCount()} aristas`,
    },
  ];

  return (
    <div>
      <PageHeader eyebrow="Proyecto Final · EDA II" title="Estructuras de datos de la plataforma">
        Seis estructuras implementadas en JavaScript (sin librerías) y reconstruidas cada vez que cambia la base de datos.
      </PageHeader>

      <Panel>
        <div className="table-wrap">
          <table className="table ds-table">
            <thead>
              <tr>
                <th>Estructura</th>
                <th>Dónde se usa</th>
                <th>Por qué</th>
                <th>Operaciones</th>
                <th>En este momento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.type}>
                  <td>
                    <DS_Tag type={r.type} />
                  </td>
                  <td>
                    <strong>{r.where}</strong>
                  </td>
                  <td className="why">{r.why}</td>
                  <td className="mono small">{r.ops}</td>
                  <td className="small">{r.live}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Explorador del Trie" tag="trie">
          <label className="field">
            <span>Prefijo</span>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Escriba un prefijo" />
          </label>
          <div className="trie-path">
            <span className="trie-char root">raíz</span>
            {steps.map((s, i) => (
              <span key={i} className={`trie-char ${s.found ? '' : 'missing'}`} title={s.found ? `${s.branches} rama(s)` : 'No existe'}>
                {s.ch === ' ' ? '␣' : s.ch}
                {s.found && <small>{s.branches}</small>}
              </span>
            ))}
          </div>
          <p className="muted small">
            Prefijo normalizado: «{normalize(prefix)}» · {matches.length} libro(s) con alguna palabra que empieza así.
          </p>
          <ul className="chips-list">
            {matches.slice(0, 12).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Base de datos" tag="bd">
          <dl className="kv">
            <dt>Modo</dt>
            <dd>{mode === 'api' ? 'API REST + SQLite (backend)' : 'Local (localStorage del navegador)'}</dd>
            {apiUrl && (
              <>
                <dt>API</dt>
                <dd className="mono small">{apiUrl}</dd>
              </>
            )}
            {modeReason && (
              <>
                <dt>Motivo</dt>
                <dd>{modeReason}</dd>
              </>
            )}
            <dt>Tablas</dt>
            <dd>categories, books, users, loans, reservations, return_stack</dd>
            <dt>Registros</dt>
            <dd>
              {lib.state.books.length} libros · {lib.state.users.length} usuarios · {lib.state.loans.length} préstamos ·{' '}
              {lib.state.reservations.length} reservas
            </dd>
          </dl>
          <p className="muted small">
            Las operaciones de préstamo, devolución, reubicación y reserva son transacciones: si una regla falla, no queda
            ningún cambio a medias.
          </p>
          <button
            className="btn"
            disabled={busy}
            onClick={() => run((repo) => repo.reset(), 'Datos de ejemplo restaurados.')}
          >
            Restaurar datos de ejemplo
          </button>
        </Panel>
      </div>
    </div>
  );
}
