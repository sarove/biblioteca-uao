import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connectRepository } from '../services/repository.js';
import { buildLibrary } from '../data/buildLibrary.js';

/**
 * Contexto global de la plataforma.
 *   - Conecta con el repositorio (API o modo local) y carga el estado.
 *   - Reconstruye las estructuras de datos (buildLibrary) cada vez que el
 *     estado cambia.
 *   - Expone "run" para ejecutar operaciones y mostrar avisos.
 * Estudiante: Salvador Rodriguez Velasco
 */
const LibraryContext = createContext(null);

let toastId = 0;

export function LibraryProvider({ children }) {
  const [repo, setRepo] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [tick, setTick] = useState(() => Date.now());

  // Conexión inicial
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await connectRepository();
        const s = await r.getState();
        if (!alive) return;
        setRepo(r);
        setState(s);
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Las fechas "vencido / vence en" se recalculan cada minuto
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const lib = useMemo(() => (state ? buildLibrary(state, new Date(tick)) : null), [state, tick]);

  const notify = useCallback((message, type = 'success') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /**
   * Ejecuta una operación del repositorio. Si sale bien, actualiza el
   * estado (y por lo tanto todas las estructuras); si falla, muestra el
   * mensaje de la regla que se incumplió.
   */
  const run = useCallback(
    async (operation, successMessage) => {
      if (!repo) return null;
      setBusy(true);
      try {
        const { result, state: next } = await operation(repo);
        setState(next);
        setTick(Date.now());
        if (successMessage) {
          const msg = typeof successMessage === 'function' ? successMessage(result, next) : successMessage;
          if (msg) notify(msg, 'success');
        }
        return result ?? true;
      } catch (e) {
        notify(e.message, 'error');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [repo, notify]
  );

  const value = {
    ready: Boolean(lib),
    error,
    busy,
    mode: repo?.mode ?? null,
    modeReason: repo?.reason ?? null,
    apiUrl: repo?.baseUrl ?? null,
    state,
    lib,
    run,
    notify,
    toasts,
    dismiss,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary debe usarse dentro de <LibraryProvider>');
  return ctx;
}
