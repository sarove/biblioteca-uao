import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Panel, BookLink, UserName, Empty, BookCover, DS_Tag } from '../components/ui.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { dueStatus, timeAgo } from '../data/format.js';

/**
 * INICIO: tablero del bibliotecario. Cada panel se alimenta de una
 * estructura de datos distinta.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function InicioPage() {
  const { lib } = useLibrary();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { stats } = lib;

  const dueSoon = lib.dueHeap.top(5); // HEAP mínimo
  const popular = lib.popularHeap.top(5); // HEAP máximo
  const cart = lib.returnStack.print().slice(0, 3); // PILA (desde la cima)
  const queues = [...lib.queues.entries()].sort((a, b) => b[1].size() - a[1].size()).slice(0, 4); // COLAS

  const tiles = [
    ['Libros', stats.books, `${stats.copies} ejemplares`],
    ['Disponibles', stats.available, 'ejemplares en estantería'],
    ['Préstamos activos', stats.activeLoans, `${stats.overdue} vencidos`],
    ['En espera', stats.waiting, 'reservas en cola'],
    ['Por reubicar', stats.toShelve, 'en el carrito'],
    ['Usuarios', stats.users, 'registrados'],
  ];

  return (
    <div>
      <section className="hero">
        <div>
          <p className="eyebrow">Universidad Autónoma de Occidente · Biblioteca</p>
          <h1>Encuentre, preste y devuelva libros en un solo lugar</h1>
          <p className="lead">
            Plataforma de la biblioteca universitaria construida sobre seis estructuras de datos y una base de datos con
            transacciones.
          </p>
          <SearchBox
            value={query}
            onChange={setQuery}
            onSubmit={(q) => navigate(`/catalogo?q=${encodeURIComponent(q)}`)}
            onPickBook={(id) => navigate(`/libros/${id}`)}
          />
        </div>
        <div className="hero-shelf" aria-hidden="true">
          {lib.state.books.filter((_, i) => i % 2 === 0).slice(0, 14).map((b) => (
            <BookCover key={b.id} book={b} size="sm" />
          ))}
        </div>
      </section>

      <div className="tiles">
        {tiles.map(([label, value, hint]) => (
          <div className="tile" key={label}>
            <span className="tile-label">{label}</span>
            <span className="tile-value">{value}</span>
            <span className="tile-hint">{hint}</span>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <Panel title="Préstamos por vencer" tag="heap" actions={<Link to="/prestamos" className="link">Ver todos</Link>}>
          <p className="muted small">La raíz del min-heap es siempre el préstamo con la fecha de vencimiento más cercana.</p>
          {dueSoon.length === 0 ? (
            <Empty>No hay préstamos activos.</Empty>
          ) : (
            <ul className="list">
              {dueSoon.map((loan) => {
                const st = dueStatus(loan.dueDate, lib.now);
                return (
                  <li key={loan.id}>
                    <div>
                      <BookLink id={loan.bookId} />
                      <span className="muted small">
                        <UserName id={loan.userId} />
                      </span>
                    </div>
                    <span className={`status ${st.kind}`}>{st.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Carrito de devoluciones" tag="pila" actions={<Link to="/devoluciones" className="link">Reubicar</Link>}>
          <p className="muted small">El último libro devuelto queda encima y es el primero que se reubica.</p>
          {cart.length === 0 ? (
            <Empty icon="🛒">El carrito está vacío.</Empty>
          ) : (
            <ul className="list">
              {cart.map((item, i) => (
                <li key={item.id}>
                  <div>
                    <BookLink id={item.bookId} />
                    <span className="muted small">Devuelto {timeAgo(item.pushedAt, lib.now)}</span>
                  </div>
                  {i === 0 ? <span className="status top">Cima</span> : <span className="muted small">#{i + 1}</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Listas de espera" tag="cola" actions={<Link to="/reservas" className="link">Ver colas</Link>}>
          {queues.length === 0 ? (
            <Empty icon="⏳">No hay reservas en espera.</Empty>
          ) : (
            <ul className="list">
              {queues.map(([bookId, q]) => (
                <li key={bookId}>
                  <div>
                    <BookLink id={bookId} />
                    <span className="muted small">
                      Siguiente: <UserName id={q.peek().userId} />
                    </span>
                  </div>
                  <span className="status waiting">{q.size()} en cola</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Libros más prestados" tag="heap">
          <p className="muted small">Max-heap por número de préstamos: se extraen los 5 primeros sin recorrer todo el catálogo ordenado.</p>
          <ol className="ranking">
            {popular.map((p, i) => (
              <li key={p.id}>
                <span className="rank">{i + 1}</span>
                <BookLink id={p.id} />
                <span className="muted small">{p.total} préstamos</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="Estructuras de datos de la plataforma" actions={<Link to="/estructuras" className="link">Detalle</Link>}>
        <div className="ds-grid">
          {[
            ['pila', 'Carrito de devoluciones', '/devoluciones'],
            ['cola', 'Lista de espera por libro', '/reservas'],
            ['trie', 'Buscador con autocompletado', '/catalogo'],
            ['arbol', 'Clasificación temática', '/catalogo'],
            ['heap', 'Vencimientos y ranking', '/prestamos'],
            ['grafo', 'Recomendaciones', '/recomendaciones'],
          ].map(([type, text, to]) => (
            <Link key={type} to={to} className="ds-card">
              <DS_Tag type={type} />
              <span>{text}</span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
