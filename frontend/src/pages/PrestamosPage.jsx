import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookLink, UserName, UserSelect, BookSelect, Empty } from '../components/ui.jsx';
import { dueStatus, formatDate } from '../data/format.js';

/**
 * PRÉSTAMOS: registro de préstamos (transacción) y lista de préstamos
 * activos ordenada con un MIN-HEAP por fecha de vencimiento.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function PrestamosPage() {
  const { lib, run, busy } = useLibrary();
  const [bookId, setBookId] = useState('');
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState('15');
  const [filter, setFilter] = useState('todos');

  // top() extrae en orden desde una COPIA del heap: el que vence primero va arriba
  const ordered = lib.dueHeap.top();
  const rows = ordered.filter((l) => {
    const kind = dueStatus(l.dueDate, lib.now).kind;
    return filter === 'todos' || (filter === 'vencidos' ? kind === 'overdue' : kind !== 'overdue');
  });

  const lend = async (e) => {
    e.preventDefault();
    const ok = await run(
      (repo) => repo.createLoan({ bookId: Number(bookId), userId: Number(userId), days: Number(days) }),
      `Préstamo de «${lib.booksById.get(Number(bookId))?.title}» registrado.`
    );
    if (ok) {
      setBookId('');
      setUserId('');
    }
  };

  const giveBack = (loan) =>
    run(
      (repo) => repo.returnLoan(loan.id),
      `«${lib.booksById.get(loan.bookId)?.title}» devuelto: quedó en la cima del carrito de devoluciones.`
    );

  const levels = lib.dueHeap.levels().slice(0, 4);

  return (
    <div>
      <PageHeader eyebrow="Circulación" title="Préstamos" tags={['heap', 'bd']}>
        Los préstamos activos se guardan en un min-heap por fecha de vencimiento: la raíz siempre es el que vence
        primero, así se priorizan los vencidos.
      </PageHeader>

      <div className="grid-side">
        <Panel title="Nuevo préstamo" tag="bd">
          <form className="form-stack" onSubmit={lend}>
            <BookSelect id="loan-book" value={bookId} onChange={setBookId} filter={(b) => b.availableCopies > 0} label="Libro (solo con ejemplares)" />
            <UserSelect id="loan-user" value={userId} onChange={setUserId} />
            <label className="field">
              <span>Días</span>
              <select value={days} onChange={(e) => setDays(e.target.value)}>
                {[3, 7, 15, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} días
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" disabled={!bookId || !userId || busy}>
              Registrar préstamo
            </button>
            <p className="muted small">
              Reglas: máximo 5 préstamos activos, sin préstamos vencidos y sin repetir un libro que ya tiene.
            </p>
          </form>
        </Panel>

        <Panel
          title={`Préstamos activos (${ordered.length})`}
          tag="heap"
          actions={
            <div className="segmented" role="tablist">
              {[
                ['todos', 'Todos'],
                ['vencidos', 'Vencidos'],
                ['vigentes', 'Vigentes'],
              ].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {rows.length === 0 ? (
            <Empty>No hay préstamos en este filtro.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Libro</th>
                    <th>Usuario</th>
                    <th>Prestado</th>
                    <th>Vence</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l, i) => {
                    const st = dueStatus(l.dueDate, lib.now);
                    return (
                      <tr key={l.id} className={st.kind === 'overdue' ? 'row-overdue' : ''}>
                        <td>{i + 1}</td>
                        <td>
                          <BookLink id={l.bookId} />
                        </td>
                        <td>
                          <UserName id={l.userId} />
                        </td>
                        <td className="nowrap">{formatDate(l.loanDate)}</td>
                        <td className="nowrap">{formatDate(l.dueDate)}</td>
                        <td>
                          <span className={`status ${st.kind}`}>{st.label}</span>
                        </td>
                        <td>
                          <button className="btn btn-small" disabled={busy} onClick={() => giveBack(l)}>
                            Devolver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Así se ve el min-heap por dentro" tag="heap">
        <p className="muted small">
          Arreglo de {lib.dueHeap.size()} préstamos visto como árbol binario completo (primeros niveles). Cada padre vence
          antes que sus hijos; los hijos del índice i están en 2i+1 y 2i+2.
        </p>
        <div className="heap-view">
          {levels.map((level, depth) => (
            <div key={depth} className="heap-level">
              {level.map((loan, i) => {
                const st = dueStatus(loan.dueDate, lib.now);
                const index = 2 ** depth - 1 + i;
                return (
                  <div key={loan.id} className={`heap-node ${st.kind}`} title={lib.booksById.get(loan.bookId)?.title}>
                    <span className="heap-index">[{index}]</span>
                    <strong>{formatDate(loan.dueDate)}</strong>
                    <span className="small">{lib.booksById.get(loan.bookId)?.title.slice(0, 22)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
