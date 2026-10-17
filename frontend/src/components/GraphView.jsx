import { useEffect, useMemo, useRef, useState } from 'react';
import { Graph as D3Graph } from 'react-d3-graph';
import { useLibrary } from '../context/LibraryContext.jsx';
import { bookColor } from '../data/format.js';

/**
 * Dibuja el grafo de recomendaciones con react-d3-graph.
 * Recibe los ids de los nodos a mostrar y resalta el libro elegido y,
 * si existe, el camino más corto entre dos libros.
 * Estudiante: Salvador Rodriguez Velasco
 */
const short = (t) => (t.length > 26 ? `${t.slice(0, 24)}…` : t);

export default function GraphView({ nodeIds, selectedId, path = [], minWeight = 1, starOnly = false, onSelect }) {
  const { lib } = useLibrary();
  const box = useRef(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(300, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const ids = new Set(nodeIds);
    const onPath = new Set(path);
    const pathEdges = new Set(path.slice(1).map((id, i) => [path[i], id].sort().join('|')));

    const nodes = [...ids].map((id) => {
      const b = lib.booksById.get(id);
      const isSel = id === selectedId;
      return {
        id: String(id),
        label: short(b.title),
        color: bookColor(lib, b),
        size: isSel ? 900 : 300 + Math.min(500, lib.graph.degree(id) * 18),
        strokeColor: isSel || onPath.has(id) ? '#0b1324' : '#ffffff',
        strokeWidth: isSel || onPath.has(id) ? 3 : 1.5,
        fontWeight: isSel ? 'bold' : 'normal',
      };
    });

    const links = lib.graph
      .edges()
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .filter((e) => {
        const onPathEdge = pathEdges.has([e.source, e.target].sort().join('|'));
        if (onPathEdge) return true;
        if (e.weight < minWeight) return false;
        // Con 1 salto solo se dibujan las aristas que salen del libro central (estrella)
        return !starOnly || e.source === selectedId || e.target === selectedId;
      })
      .map((e) => {
        const highlighted = pathEdges.has([e.source, e.target].sort().join('|'));
        return {
          source: String(e.source),
          target: String(e.target),
          strokeWidth: highlighted ? 5 : Math.min(6, 0.6 + e.weight * 0.6),
          color: highlighted ? '#c8102e' : e.reasons.includes('Prestados por los mismos lectores') ? '#64748b' : '#cbd5e1',
        };
      });
    return { nodes, links };
  }, [lib, nodeIds, selectedId, path, minWeight, starOnly]);

  const height = width < 640 ? 420 : 560;
  const config = useMemo(
    () => ({
      width,
      height,
      nodeHighlightBehavior: true,
      linkHighlightBehavior: true,
      highlightOpacity: 0.25,
      maxZoom: 3,
      minZoom: 0.3,
      d3: { gravity: -320, linkLength: 120, alphaTarget: 0.05 },
      node: { labelProperty: 'label', fontSize: 11, highlightFontSize: 12, highlightStrokeColor: '#0b1324', labelPosition: 'bottom' },
      link: { highlightColor: '#0b1324', semanticStrokeWidth: false },
    }),
    [width, height]
  );

  return (
    <div className="graph-box" ref={box}>
      {data.nodes.length > 0 && (
        <D3Graph
          id="grafo-recomendaciones"
          data={data}
          config={config}
          onClickNode={(id) => onSelect?.(Number(id))}
        />
      )}
    </div>
  );
}
