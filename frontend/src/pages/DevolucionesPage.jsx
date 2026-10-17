import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookLink, UserName, Empty, BookCover } from '../components/ui.jsx';
import QueueView from '../components/QueueView.jsx';
import { timeAgo } from '../data/format.js';

/**
 * DEVOLUCIONES: carrito del bibliotecario implementado como PILA.
 * Reubicar = pop() de la cima; si ese libro tiene lista de espera, se
 * atiende al primero de la COLA (dequeue) y se le presta automáticamente.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function DevolucionesPage() {
  const { lib, run, busy } = useLibrary();
  const [last, setLast] = useState(null);
  const items = lib.returnStack.print(); // de la cima a la base
  const top = lib.returnStack.peek();
  const topBook = top ? lib.booksById.get(top.bookId) : null;
  const topQueue = top ? lib.queueOf(top.bookId) : null;

  const shelve = async () => {
    const result = await run(
      (repo) => repo.shelveTop(),
      (r) => {
        const title = lib.booksById.get(r.bookId)?.title;
        return r.assignedTo
          ? `«${title}» se prestó a ${lib.usersById.get(r.assignedTo)?.name}, primero de la lista de espera.`
          : `«${title}» volvió a la estantería.`;
      }
    );
    if (result) setLast(result);
  };

  return (
    <div>
      <PageHeader eyebrow="Circulación" title="Carrito de devoluciones" tags={['pila', 'cola', 'bd']}>
        Cada libro devuelto se apila en el carrito. El bibliotecario siempre toma el de arriba (el último que llegó).
        Al reubicarlo, si alguien lo reservó, se presta al primero de la cola en la misma transacción.
      </PageHeader>

      <div className="grid-side">
        <Panel title={`Pila (${items.length})`} tag="pila">
          {items.length === 0 ? (
            <Empty icon="🛒">El carrito está vacío. Registre devoluciones en Préstamos.</Empty>
          ) : (
            <div className="stack">
              {items.map((item, i) => {
                const book = lib.booksById.get(item.bookId);
                const loan = lib.state.loans.find((l) => l.id === item.loanId);
                return (
                  <div key={item.id} className={`stack-item ${i === 0 ? 'top' : ''}`}>
                    {i === 0 && <span className="stack-top">CIMA</span>}
                    <BookCover book={book} size="xs" />
                    <div>
                      <strong>{book.title}</strong>
                      <span className="small">
                        Devuelto por <UserName id={loan?.userId} /> · {timeAgo(item.pushedAt, lib.now)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="stack-base">BASE DEL CARRITO</div>
            </div>
          )}
        </Panel>

        <div className="stack-side">
          <Panel title="Reubicar el libro de la cima" tag="pila">
            {top ? (
              <>
                <p>
                  Siguiente en salir: <BookLink id={top.bookId} />
                </p>
                <p className="muted small">
                  {topQueue.size() > 0
                    ? `Tiene ${topQueue.size()} persona(s) en espera: se prestará a la primera.`
                    : 'No tiene reservas: el ejemplar volverá a estar disponible.'}
                </p>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={shelve}>
                  Reubicar (pop)
                </button>
              </>
            ) : (
              <Empty icon="✅">No hay libros por reubicar.</Empty>
            )}
            {last && (
              <div className="result-box">
                <strong>Última operación</strong>
                <span>
                  pop() → <BookLink id={last.bookId} />
                </span>
                <span>
                  {last.assignedTo ? (
                    <>
                      dequeue() → prestado a <UserName id={last.assignedTo} />
                    </>
                  ) : (
                    'cola vacía → +1 ejemplar disponible'
                  )}
                </span>
              </div>
            )}
          </Panel>

          {topBook && (
            <Panel title={`Lista de espera de «${topBook.title}»`} tag="cola">
              <QueueView queue={topQueue} compact />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
