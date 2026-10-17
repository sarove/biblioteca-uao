import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';

/**
 * Estructura general: barra superior con navegación, contenido y pie.
 * Estudiante: Salvador Rodriguez Velasco
 */
const LINKS = [
  ['/', 'Inicio'],
  ['/catalogo', 'Catálogo'],
  ['/prestamos', 'Préstamos'],
  ['/devoluciones', 'Devoluciones'],
  ['/reservas', 'Reservas'],
  ['/recomendaciones', 'Recomendaciones'],
  ['/usuarios', 'Usuarios'],
  ['/estructuras', 'Estructuras'],
];

export default function Layout({ children }) {
  const { mode, lib, toasts, dismiss } = useLibrary();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const badge = (path) => {
    if (!lib) return null;
    if (path === '/prestamos' && lib.stats.overdue) return lib.stats.overdue;
    if (path === '/devoluciones' && lib.stats.toShelve) return lib.stats.toShelve;
    if (path === '/reservas' && lib.stats.waiting) return lib.stats.waiting;
    return null;
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              📚
            </span>
            <span className="brand-text">
              <strong>Biblioteca UAO</strong>
              <small>Plataforma de préstamos y catálogo</small>
            </span>
          </NavLink>

          <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menú">
            ☰
          </button>

          <nav className={open ? 'nav open' : 'nav'} aria-label="Principal">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {label}
                {badge(to) ? <span className="nav-badge">{badge(to)}</span> : null}
              </NavLink>
            ))}
          </nav>

          {mode && (
            <span className={`mode-pill ${mode}`} title={mode === 'api' ? 'Conectado al backend (SQLite)' : 'Datos guardados en este navegador'}>
              <span className="dot" />
              {mode === 'api' ? 'API · SQLite' : 'Modo local'}
            </span>
          )}
        </div>
      </header>

      <main className="container">{children}</main>

      <footer className="footer">
        <p>
          <strong>Salvador Rodriguez Velasco</strong> · Ingeniería Informática · Universidad Autónoma de Occidente
        </p>
        <p>Estructuras de Datos y Algoritmos II · Proyecto Final · Biblioteca universitaria</p>
      </footer>

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'error' ? '⚠️' : '✅'}</span>
            <p>{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
