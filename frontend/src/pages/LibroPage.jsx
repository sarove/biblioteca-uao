import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Panel, BookCover, Availability, UserName, UserSelect, Empty, DS_Tag } from '../components/ui.jsx';
import QueueView from '../components/QueueView.jsx';
import { dueStatus, formatDate } from '../data/format.js';

/**
 * DETALLE DEL LIBRO: préstamo, reserva (cola), ejemplares prestados,
 * ruta en el árbol de categorías y recomendaciones del grafo.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function LibroPage() {
  const { id } = useParams();
  const { lib, run, busy } = useLibrary();
  const book = lib.booksById.get(Number(id));
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState('15');

  if (!book) {
    return (
      <Empty icon="📕">
        El libro no existe. <Link to="/catalogo">Volver al catálogo</Link>
      </Empty>
    );
  }

  const path = lib.categoryPath(book.categoryId);
  const queue = lib.queueOf(book.id);
  const loans = lib.activeLoans.filter((l) => l.bookId === book.id);
  const recs = lib.recommend(book.id, 6);
  const available = book.availableCopies > 0;

  const lend = () =>
    run(
      (repo) => repo.createLoan({ bookId: book.id, userId: Number(userId), days: Number(days) }),
      `Préstamo registrado para ${lib.usersById.get(Number(userId))?.name}.`
    ).then((ok) => ok && setUserId(''));

  const reserve = () =>
    run(
      (repo) => repo.reserve({ bookId: book.id, userId: Number(userId) }),
      (_, next) => {
        const pos = next.reservations.filter((r) => r.bookId === book.id && r.status === 'waiting').length;
        return `${lib.usersById.get(Number(userId))?.name} entró a la lista de espera en el turno ${pos}.`;
      }
    ).then((ok) => ok && setUserId(''));

  const giveBack = (loanId) =>
    run((repo) => repo.returnLoan(loanId), 'Devolución registrada: el libro quedó en la cima del carrito.');

  return (
    <div>
      <nav className="crumbs page-crumbs" aria-label="Categoría">
        <Link to="/catalogo">Catálogo</Link>
        {path.slice(1).map((c) => (
          <span key={c.id}>
            <span className="sep">›</span>
            <Link to={`/catalogo?cat=${c.id}`}>{c.name}</Link>
          </span>
        ))}
      </nav>

      <section className="book-hero">
        <BookCover book={book} size="lg" />
        <div className="book-hero-info">
          <h1>{book.title}</h1>
          <p className="lead">{book.author}</p>
          <dl className="kv">
            <dt>Código</dt>
            <dd>{book.code}</dd>
            <dt>Año</dt>
            <dd>{book.year}</dd>
            <dt>Editorial</dt>
            <dd>{book.publisher}</dd>
            <dt>Ejemplares</dt>
            <dd>{book.totalCopies}</dd>
            <dt>Préstamos</dt>
            <dd>{lib.loanCount.get(book.id) ?? 0} en total</dd>
          </dl>
          <Availability book={book} />
        </div>

        <div className="panel action-card">
          <div className="panel-head">
            <h2>{available ? 'Prestar' : 'Reservar'}</h2>
            <DS_Tag type={available ? 'bd' : 'cola'} />
          </div>
          <UserSelect id="action-user" value={userId} onChange={setUserId} />
          {available ? (
            <>
              <label className="field">
                <span>Días de préstamo</span>
                <select value={days} onChange={(e) => setDays(e.target.value)}>
                  {[3, 7, 15, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} días
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" disabled={!userId || busy} onClick={lend}>
                Registrar préstamo
              </button>
              <p className="muted small">Transacción: se crea el préstamo y se descuenta un ejemplar, o no se hace nada.</p>
            </>
          ) : (
            <>
              <button className="btn btn-primary" disabled={!userId || busy} onClick={reserve}>
                Unirse a la lista de espera
              </button>
              <p className="muted small">
                No hay ejemplares. La reserva entra al final de la cola; cuando se reubique una devolución, se atiende al primero.
              </p>
            </>
          )}
        </div>
      </section>

      <div className="grid-2">
        <Panel title={`Lista de espera (${queue.size()})`} tag="cola">
          <QueueView queue={queue} />
        </Panel>

        <Panel title={`Ejemplares prestados (${loans.length})`} tag="bd">
          {loans.length === 0 ? (
            <Empty>Ningún ejemplar está prestado.</Empty>
          ) : (
            <ul className="list">
              {loans.map((l) => {
                const st = dueStatus(l.dueDate, lib.now);
                return (
                  <li key={l.id}>
                    <div>
                      <UserName id={l.userId} withCode />
                      <span className="muted small">
                        Desde {formatDate(l.loanDate)} · <span className={`status-text ${st.kind}`}>{st.label}</span>
                      </span>
                    </div>
                    <button className="btn btn-small" disabled={busy} onClick={() => giveBack(l.id)}>
                      Registrar devolución
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Quienes leyeron este libro también leyeron…"
        tag="grafo"
        actions={
          <Link className="link" to={`/recomendaciones?libro=${book.id}`}>
            Ver en el grafo
          </Link>
        }
      >
        {recs.length === 0 ? (
          <Empty>Este libro todavía no tiene relaciones en el grafo.</Empty>
        ) : (
          <div className="rec-grid">
            {recs.map(({ node, weight, reasons }) => {
              const b = lib.booksById.get(node.id);
              return (
                <Link key={node.id} to={`/libros/${node.id}`} className="rec-card">
                  <BookCover book={b} size="sm" />
                  <div>
                    <strong>{b.title}</strong>
                    <span className="muted small">{b.author}</span>
                    <span className="weight">Peso {weight}</span>
                    <span className="reasons">{reasons.join(' · ')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
