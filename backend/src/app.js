/**
 * API REST DE LA BIBLIOTECA (Express)
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 *   GET    /api/health                 estado del servicio
 *   GET    /api/state                  todas las tablas (el frontend arma
 *                                      las estructuras de datos con esto)
 *   POST   /api/books                  agregar libro
 *   POST   /api/users                  agregar usuario
 *   POST   /api/loans                  préstamo (transacción)
 *   POST   /api/loans/:id/return       devolución -> push a la pila
 *   POST   /api/returns/shelve         reubicar: pop de la pila + dequeue de la cola
 *   POST   /api/reservations           reservar -> enqueue
 *   DELETE /api/reservations/:id       cancelar reserva
 *   POST   /api/reset                  restaurar datos de ejemplo (demo)
 */
import express from 'express';
import cors from 'cors';
import { createLibrary } from './library.js';
import { seedDatabase } from './db.js';
import { LibraryError } from '../../shared/rules.js';

export function createApp(db, { clock, allowReset = true } = {}) {
  const library = createLibrary(db, { clock });
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  // Envuelve cada ruta: responde con el estado actualizado de la biblioteca
  const handle = (fn, status = 200) => (req, res, next) => {
    try {
      const result = fn(req);
      res.status(status).json({ result, state: library.state() });
    } catch (error) {
      next(error);
    }
  };

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'biblioteca-uao-api', time: new Date().toISOString() }));
  app.get('/api/state', (req, res) => res.json(library.state()));

  app.post('/api/books', handle((req) => library.addBook(req.body ?? {}), 201));
  app.post('/api/users', handle((req) => library.addUser(req.body ?? {}), 201));
  app.post('/api/loans', handle((req) => library.createLoan(req.body ?? {}), 201));
  app.post('/api/loans/:id/return', handle((req) => library.returnLoan(req.params.id)));
  app.post('/api/returns/shelve', handle(() => library.shelveTop()));
  app.post('/api/reservations', handle((req) => library.reserve(req.body ?? {}), 201));
  app.delete('/api/reservations/:id', handle((req) => library.cancelReservation(req.params.id)));

  app.post('/api/reset', (req, res, next) => {
    if (!allowReset) return res.status(403).json({ error: 'El reinicio está deshabilitado.' });
    try {
      seedDatabase(db, clock ? clock() : new Date());
      res.json({ result: { reset: true }, state: library.state() });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // Errores: los de negocio llevan su código HTTP; los demás son 500
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof LibraryError) return res.status(error.status).json({ error: error.message });
    if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}
