import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { PageHeader, Panel, BookLink, Empty } from '../components/ui.jsx';
import { dueStatus } from '../data/format.js';

/**
 * USUARIOS: registro (base de datos) y resumen de préstamos y reservas.
 * Estudiante: Salvador Rodriguez Velasco
 */
const EMPTY = { code: '', name: '', program: '', role: 'Estudiante' };

export default function UsuariosPage() {
  const { lib, run, busy } = useLibrary();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const ok = await run((repo) => repo.addUser(form), `Usuario ${form.name.trim()} registrado.`);
    if (ok) setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader eyebrow="Comunidad" title="Usuarios" tags={['bd']}>
        Estudiantes, docentes y administrativos que pueden prestar y reservar libros.
      </PageHeader>

      <div className="grid-side">
        <Panel title="Nuevo usuario" tag="bd">
          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              <span>Código</span>
              <input value={form.code} onChange={set('code')} placeholder="2230001" />
            </label>
            <label className="field">
              <span>Nombre completo</span>
              <input value={form.name} onChange={set('name')} placeholder="Nombre y apellidos" />
            </label>
            <label className="field">
              <span>Programa o dependencia</span>
              <input value={form.program} onChange={set('program')} placeholder="Ingeniería Informática" />
            </label>
            <label className="field">
              <span>Rol</span>
              <select value={form.role} onChange={set('role')}>
                <option>Estudiante</option>
                <option>Docente</option>
                <option>Administrativo</option>
              </select>
            </label>
            <button className="btn btn-primary" disabled={busy || !form.code.trim() || !form.name.trim() || !form.program.trim()}>
              Registrar usuario
            </button>
          </form>
        </Panel>

        <Panel title={`Usuarios (${lib.state.users.length})`}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Programa</th>
                  <th>Activos</th>
                  <th>Vencidos</th>
                  <th>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {lib.state.users.map((u) => {
                  const loans = lib.userLoans(u.id);
                  const active = loans.filter((l) => !l.returnDate);
                  const overdue = active.filter((l) => lib.isOverdue(l)).length;
                  const waiting = lib.state.reservations.filter((r) => r.userId === u.id && r.status === 'waiting');
                  const isOpen = open === u.id;
                  return [
                    <tr key={u.id} className="clickable" onClick={() => setOpen(isOpen ? null : u.id)}>
                      <td className="mono">{u.code}</td>
                      <td>
                        <button className="link-btn" aria-expanded={isOpen}>
                          {u.name}
                        </button>
                        <span className="muted small"> · {u.role}</span>
                      </td>
                      <td>{u.program}</td>
                      <td>{active.length}</td>
                      <td>{overdue ? <span className="status overdue">{overdue}</span> : 0}</td>
                      <td>{waiting.length}</td>
                    </tr>,
                    isOpen && (
                      <tr key={`${u.id}-detail`} className="detail-row">
                        <td colSpan={6}>
                          {active.length === 0 && waiting.length === 0 ? (
                            <Empty>Sin préstamos activos ni reservas. Historial: {loans.length} préstamo(s).</Empty>
                          ) : (
                            <ul className="list">
                              {active.map((l) => {
                                const st = dueStatus(l.dueDate, lib.now);
                                return (
                                  <li key={`l${l.id}`}>
                                    <BookLink id={l.bookId} />
                                    <span className={`status ${st.kind}`}>{st.label}</span>
                                  </li>
                                );
                              })}
                              {waiting.map((r) => (
                                <li key={`r${r.id}`}>
                                  <BookLink id={r.bookId} />
                                  <span className="status waiting">
                                    Turno {lib.queueOf(r.bookId).positionOf((x) => x.id === r.id)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
