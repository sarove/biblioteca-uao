import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookSelect, BookLink, Empty } from '../components/ui.jsx';
import GraphView from '../components/GraphView.jsx';
import { EDGE_WEIGHTS, REASONS } from '../data/buildLibrary.js';
import { FACULTY_COLORS } from '../data/format.js';

/**
 * RECOMENDACIONES: grafo ponderado de libros dibujado con react-d3-graph.
 *   - Vecinos ordenados por peso = recomendaciones.
 *   - BFS a 1 o 2 saltos = vecindario que se dibuja.
 *   - Camino más corto (BFS) = cómo se conectan dos libros.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function RecomendacionesPage() {
  const { lib } = useLibrary();
  const [params, setParams] = useSearchParams();
  const defaultId = lib.popularHeap.peek()?.id;
  const selectedId = Number(params.get('libro') ?? defaultId);
  const [depth, setDepth] = useState(1);
  const [minWeight, setMinWeight] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const select = (id) => {
    const next = new URLSearchParams(params);
    next.set('libro', id);
    setParams(next, { replace: true });
  };

  const reach = useMemo(() => lib.graph.bfs(selectedId, depth), [lib, selectedId, depth]);
  const path = useMemo(() => (from && to ? lib.graph.shortestPath(Number(from), Number(to)) : []), [lib, from, to]);
  const nodeIds = useMemo(() => {
    const ids = new Set(depth === 3 ? lib.state.books.map((b) => b.id) : reach.map((r) => r.id));
    path.forEach((id) => ids.add(id));
    return [...ids];
  }, [reach, path, depth, lib]);

  const recs = lib.recommend(selectedId, 8);
  const book = lib.booksById.get(selectedId);

  return (
    <div>
      <PageHeader eyebrow="Descubrimiento" title="Recomendaciones" tags={['grafo']}>
        Cada libro es un nodo. Dos libros se unen si los prestó el mismo lector (+{EDGE_WEIGHTS.coLoan}), si son del mismo
        autor (+{EDGE_WEIGHTS.author}) o de la misma materia (+{EDGE_WEIGHTS.category}). Los vecinos con más peso son las
        mejores recomendaciones.
      </PageHeader>

      <Panel>
        <div className="graph-controls">
          <BookSelect id="graph-book" value={String(selectedId)} onChange={(v) => v && select(Number(v))} label="Libro central" />
          <label className="field">
            <span>Mostrar</span>
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              <option value={1}>Vecinos directos (BFS 1 salto)</option>
              <option value={2}>Hasta 2 saltos (BFS)</option>
              <option value={3}>Todo el grafo</option>
            </select>
          </label>
          <label className="field">
            <span>Peso mínimo de arista: {minWeight}</span>
            <input type="range" min={1} max={6} value={minWeight} onChange={(e) => setMinWeight(Number(e.target.value))} />
          </label>
        </div>
        <div className="legend">
          {Object.entries({ ING: 'Ingeniería', CB: 'Ciencias Básicas', HUM: 'Humanidades', CE: 'Ciencias Económicas' }).map(([code, name]) => (
            <span key={code}>
              <i style={{ background: FACULTY_COLORS[code] }} /> {name}
            </span>
          ))}
          <span>
            <i className="ln dark" /> {REASONS.coLoan}
          </span>
          <span>
            <i className="ln light" /> Autor o materia
          </span>
          {path.length > 1 && (
            <span>
              <i className="ln red" /> Camino más corto
            </span>
          )}
        </div>
        <GraphView nodeIds={nodeIds} selectedId={selectedId} path={path} minWeight={minWeight} starOnly={depth === 1} onSelect={select} />
        <p className="muted small">
          {nodeIds.length} nodos visibles de {lib.graph.nodes.length} · {lib.graph.edgeCount()} aristas en total · clic en un
          nodo para centrarlo · arrastre y use la rueda del mouse para moverse.
        </p>
      </Panel>

      <div className="grid-2">
        <Panel title={`Recomendados para «${book?.title}»`} tag="grafo">
          {recs.length === 0 ? (
            <Empty>Sin vecinos.</Empty>
          ) : (
            <ol className="ranking">
              {recs.map(({ node, weight, reasons }, i) => (
                <li key={node.id}>
                  <span className="rank">{i + 1}</span>
                  <div>
                    <BookLink id={node.id} />
                    <span className="reasons">{reasons.join(' · ')}</span>
                  </div>
                  <span className="weight">Peso {weight}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="muted small">
            Grado del nodo: {lib.graph.degree(selectedId)} vecinos. <Link to={`/libros/${selectedId}`}>Ver ficha del libro</Link>
          </p>
        </Panel>

        <Panel title="¿Cómo se conectan dos libros?" tag="grafo">
          <div className="form-stack">
            <BookSelect id="path-from" value={from} onChange={setFrom} label="Desde" />
            <BookSelect id="path-to" value={to} onChange={setTo} label="Hasta" />
          </div>
          {from && to && (
            path.length === 0 ? (
              <p className="muted">No hay camino entre esos libros.</p>
            ) : (
              <ol className="path">
                {path.map((id, i) => (
                  <li key={id}>
                    <BookLink id={id} />
                    {i > 0 && (
                      <span className="reasons">{lib.graph.adjList[path[i - 1]][id].reasons.join(' · ')}</span>
                    )}
                  </li>
                ))}
              </ol>
            )
          )}
          {path.length > 1 && <p className="muted small">BFS: {path.length - 1} salto(s). El camino se resalta en rojo en el grafo.</p>}
        </Panel>
      </div>
    </div>
  );
}
