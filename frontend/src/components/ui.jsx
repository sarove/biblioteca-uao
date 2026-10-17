import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import { bookColor, initials } from '../data/format.js';

/**
 * Componentes pequeños reutilizables.
 * Estudiante: Salvador Rodriguez Velasco
 */

// Etiqueta que indica QUÉ estructura de datos alimenta cada panel
const DS = {
  pila: ['Pila', 'LIFO'],
  cola: ['Cola', 'FIFO'],
  trie: ['Trie', 'prefijos'],
  arbol: ['Árbol N-ario', 'jerarquía'],
  heap: ['Heap', 'prioridad'],
  grafo: ['Grafo', 'relaciones'],
  bd: ['SQLite', 'transacción'],
};

export function DS_Tag({ type }) {
  const [name, hint] = DS[type];
  return (
    <span className={`ds-tag ds-${type}`} title={`Estructura de datos: ${name} (${hint})`}>
      {name}
      <small>{hint}</small>
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, tags = [] }) {
  return (
    <div className="page-header">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
      {tags.length > 0 && (
        <div className="tag-row">
          {tags.map((t) => (
            <DS_Tag key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Panel({ title, tag, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || tag || actions) && (
        <div className="panel-head">
          <h2>{title}</h2>
          <div className="panel-head-right">
            {actions}
            {tag && <DS_Tag type={tag} />}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

// Portada generada: color de la facultad + iniciales del título
export function BookCover({ book, size = 'md' }) {
  const { lib } = useLibrary();
  const color = bookColor(lib, book);
  return (
    <div className={`cover cover-${size}`} style={{ '--c': color }} aria-hidden="true">
      <span className="cover-initials">{initials(book.title)}</span>
      <span className="cover-code">{book.code}</span>
    </div>
  );
}

export function Availability({ book }) {
  const { lib } = useLibrary();
  const waiting = lib.queueOf(book.id).size();
  if (book.availableCopies > 0) {
    return (
      <span className="avail ok">
        {book.availableCopies} de {book.totalCopies} disponible{book.availableCopies === 1 ? '' : 's'}
      </span>
    );
  }
  return <span className="avail none">Agotado{waiting ? ` · ${waiting} en espera` : ''}</span>;
}

export function BookLink({ id, children }) {
  const { lib } = useLibrary();
  const book = lib.booksById.get(id);
  return <Link to={`/libros/${id}`}>{children ?? book?.title ?? `Libro ${id}`}</Link>;
}

export function UserName({ id, withCode = false }) {
  const { lib } = useLibrary();
  const user = lib.usersById.get(id);
  if (!user) return <span>Usuario {id}</span>;
  return (
    <span>
      {user.name}
      {withCode && <span className="muted"> · {user.code}</span>}
    </span>
  );
}

export function Empty({ icon = '📭', children }) {
  return (
    <div className="empty">
      <span aria-hidden="true">{icon}</span>
      <p>{children}</p>
    </div>
  );
}

export function UserSelect({ value, onChange, filter, label = 'Usuario', id = 'user' }) {
  const { lib } = useLibrary();
  const users = lib.state.users.filter((u) => (filter ? filter(u) : true));
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccione…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.code})
          </option>
        ))}
      </select>
    </label>
  );
}

export function BookSelect({ value, onChange, filter, label = 'Libro', id = 'book' }) {
  const { lib } = useLibrary();
  const books = lib.state.books
    .filter((b) => (filter ? filter(b) : true))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccione…</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} — {b.availableCopies}/{b.totalCopies}
          </option>
        ))}
      </select>
    </label>
  );
}
