import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';

/**
 * ÁRBOL DE CATEGORÍAS (Árbol N-ario) - componente recursivo
 * Se imprime el árbol con DFS: cada rama se dibuja a sí misma y luego a
 * sus hijos. El número de cada categoría es la suma recursiva de los
 * libros de todo su subárbol.
 * Estudiante: Salvador Rodriguez Velasco
 */
function TreeItem({ nodo, nivel, selected, onSelect, expanded, toggle }) {
  const { lib } = useLibrary();
  const { id, name } = nodo.valor;
  const count = lib.countBooks(nodo);
  const open = expanded.has(id);
  const isLeaf = nodo.esHoja();

  return (
    <li>
      <div className={`tree-row ${selected === id ? 'selected' : ''}`} style={{ paddingLeft: 6 + nivel * 14 }}>
        {isLeaf ? (
          <span className="tree-caret placeholder" />
        ) : (
          <button
            className={`tree-caret ${open ? 'open' : ''}`}
            onClick={() => toggle(id)}
            aria-label={`${open ? 'Contraer' : 'Desplegar'} ${name}`}
            aria-expanded={open}
          >
            ▸
          </button>
        )}
        <button className="tree-label" onClick={() => onSelect(id)}>
          {name}
        </button>
        <span className="tree-count">{count}</span>
      </div>
      {!isLeaf && open && (
        <ul>
          {nodo.hijos.map((h) => (
            <TreeItem
              key={h.valor.id}
              nodo={h}
              nivel={nivel + 1}
              selected={selected}
              onSelect={onSelect}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryTree({ selected, onSelect }) {
  const { lib } = useLibrary();
  const raiz = lib.categoryTree.raiz;

  // Se despliegan la raíz, los ancestros de la categoría elegida y las facultades
  const [expanded, setExpanded] = useState(() => {
    const ids = new Set([raiz.valor.id]);
    if (selected) lib.categoryPath(selected).forEach((c) => ids.add(c.id));
    return ids;
  });

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const select = (id) => {
    setExpanded((prev) => new Set([...prev, id]));
    onSelect(id === raiz.valor.id ? null : id);
  };

  return (
    <ul className="tree">
      <TreeItem nodo={raiz} nivel={0} selected={selected ?? raiz.valor.id} onSelect={select} expanded={expanded} toggle={toggle} />
    </ul>
  );
}
