import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookCover, Availability, Empty } from '../components/ui.jsx';
import SearchBox from '../components/SearchBox.jsx';
import CategoryTree from '../components/CategoryTree.jsx';
import AddBookForm from '../components/AddBookForm.jsx';

/**
 * CATÁLOGO: búsqueda con Trie + filtro por el Árbol N-ario de categorías.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function CatalogoPage() {
  const { lib } = useLibrary();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [showForm, setShowForm] = useState(false);
  const query = params.get('q') ?? '';
  const cat = params.get('cat') ? Number(params.get('cat')) : null;
  const soloDisponibles = params.get('disp') === '1';

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === '' || v === false ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  let results = lib.search(query, cat);
  if (soloDisponibles) results = results.filter((b) => b.availableCopies > 0);
  const path = cat ? lib.categoryPath(cat) : [];

  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Buscar en la colección" tags={['trie', 'arbol']}>
        Escriba parte de un título o autor: cada palabra se busca como prefijo en el Trie. Use el árbol de la izquierda
        para filtrar por facultad, área o materia.
      </PageHeader>

      <div className="catalog">
        <aside className="panel tree-panel">
          <div className="panel-head">
            <h2>Categorías</h2>
          </div>
          <CategoryTree selected={cat} onSelect={(id) => update({ cat: id })} />
          <p className="muted small tree-foot">
            {lib.categoryTree.tamano()} categorías · altura {lib.categoryTree.altura()} · {lib.categoryTree.hojas().length} materias
          </p>
        </aside>

        <div className="catalog-main">
          <div className="search-row">
            <SearchBox
              value={text}
              onChange={(v) => {
                setText(v);
                update({ q: v });
              }}
              onSubmit={(v) => update({ q: v })}
              onPickBook={(id) => navigate(`/libros/${id}`)}
            />
            <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cerrar formulario' : '＋ Agregar libro'}
            </button>
          </div>

          {showForm && (
            <Panel title="Nuevo libro" tag="bd">
              <AddBookForm defaultCategory={cat} onDone={(id) => navigate(`/libros/${id}`)} />
            </Panel>
          )}

          <div className="results-bar">
            <div className="crumbs">
              {path.length > 0 ? (
                path.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && <span className="sep">›</span>}
                    <button className="crumb" onClick={() => update({ cat: c.parentId === null ? null : c.id })}>
                      {c.name}
                    </button>
                  </span>
                ))
              ) : (
                <span className="muted">Toda la colección</span>
              )}
            </div>
            <label className="check">
              <input type="checkbox" checked={soloDisponibles} onChange={(e) => update({ disp: e.target.checked ? '1' : null })} />
              Solo disponibles
            </label>
            <span className="muted small">
              {results.length} resultado{results.length === 1 ? '' : 's'}
              {query && <> para «{query}»</>}
            </span>
          </div>

          {results.length === 0 ? (
            <Empty icon="🔍">
              No se encontraron libros. Pruebe con otra palabra o{' '}
              <button className="link-btn" onClick={() => { setText(''); update({ q: null, cat: null, disp: null }); }}>
                limpie los filtros
              </button>
              .
            </Empty>
          ) : (
            <div className="book-grid">
              {results.map((b) => (
                <Link key={b.id} to={`/libros/${b.id}`} className="book-card">
                  <BookCover book={b} />
                  <div className="book-info">
                    <strong>{b.title}</strong>
                    <span className="muted">{b.author}</span>
                    <span className="muted small">
                      {b.year} · {lib.categoriesById.get(b.categoryId)?.name}
                    </span>
                    <Availability book={b} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
