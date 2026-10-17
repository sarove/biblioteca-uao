import { useLibrary } from '../context/LibraryContext.jsx';
import { UserName, Empty } from './ui.jsx';
import { timeAgo } from '../data/format.js';

/**
 * Dibuja una COLA del frente al final, recorriendo sus nodos enlazados
 * (head -> next -> ... -> tail).
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function QueueView({ queue, compact = false }) {
  const { lib, run, busy } = useLibrary();
  const items = queue.toArray();

  if (items.length === 0) return <Empty icon="⏳">Nadie está esperando este libro.</Empty>;

  const cancel = (r) =>
    run((repo) => repo.cancelReservation(r.id), `Reserva de ${lib.usersById.get(r.userId)?.name} cancelada.`);

  return (
    <div className={`queue ${compact ? 'compact' : ''}`}>
      <span className="queue-end">FRENTE</span>
      {items.map((r, i) => (
        <div key={r.id} className={`queue-node ${i === 0 ? 'front' : ''}`}>
          <span className="queue-turn">Turno {i + 1}</span>
          <strong>
            <UserName id={r.userId} />
          </strong>
          <span className="muted small">Reservó {timeAgo(r.createdAt, lib.now)}</span>
          {!compact && (
            <button className="link-btn small" disabled={busy} onClick={() => cancel(r)}>
              Cancelar
            </button>
          )}
          {i < items.length - 1 && <span className="queue-arrow" aria-hidden="true">→</span>}
        </div>
      ))}
      <span className="queue-end">FINAL</span>
    </div>
  );
}
