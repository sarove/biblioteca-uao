import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookLink, UserSelect, BookSelect, Empty } from '../components/ui.jsx';
import QueueView from '../components/QueueView.jsx';

/**
 * RESERVAS: una COLA por libro agotado. Las reservas entran al final
 * (enqueue) y se atienden por el frente (dequeue) al reubicar devoluciones.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function ReservasPage() {
  const { lib, run, busy } = useLibrary();
  const [bookId, setBookId] = useState('');
  const [userId, setUserId] = useState('');
  const queues = [...lib.queues.entries()].sort((a, b) =>
    lib.booksById.get(a[0]).title.localeCompare(lib.booksById.get(b[0]).title, 'es')
  );

  const reserve = async (e) => {
    e.preventDefault();
    const ok = await run(
      (repo) => repo.reserve({ bookId: Number(bookId), userId: Number(userId) }),
      (_, next) => {
        const pos = next.reservations.filter((r) => r.bookId === Number(bookId) && r.status === 'waiting').length;
        return `Reserva registrada: turno ${pos} para «${lib.booksById.get(Number(bookId))?.title}».`;
      }
    );
    if (ok) setUserId('');
  };

  return (
    <div>
      <PageHeader eyebrow="Circulación" title="Reservas y listas de espera" tags={['cola', 'bd']}>
        Cuando un libro está agotado, los usuarios hacen fila. El primero que reservó es el primero en recibir el
        siguiente ejemplar devuelto.
      </PageHeader>

      <div className="grid-side">
        <Panel title="Nueva reserva" tag="cola">
          <form className="form-stack" onSubmit={reserve}>
            <BookSelect id="res-book" value={bookId} onChange={setBookId} filter={(b) => b.availableCopies === 0} label="Libro agotado" />
            <UserSelect id="res-user" value={userId} onChange={setUserId} />
            <button className="btn btn-primary" disabled={!bookId || !userId || busy}>
              Encolar reserva
            </button>
            <p className="muted small">Solo se reservan libros sin ejemplares disponibles. Un usuario no puede repetir turno.</p>
          </form>
        </Panel>

        <div>
          {queues.length === 0 ? (
            <Panel>
              <Empty icon="⏳">No hay listas de espera.</Empty>
            </Panel>
          ) : (
            queues.map(([id, q]) => (
              <Panel key={id} title={<BookLink id={id} />} tag="cola" actions={<span className="status waiting">{q.size()} en cola</span>}>
                <QueueView queue={q} />
              </Panel>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
