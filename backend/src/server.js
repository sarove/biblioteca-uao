/**
 * Punto de entrada del backend.
 *   PORT          puerto HTTP (por defecto 3001)
 *   DATABASE_PATH ruta del archivo SQLite (por defecto backend/data/biblioteca.db)
 *   ALLOW_RESET   "false" para deshabilitar POST /api/reset
 * Estudiante: Salvador Rodriguez Velasco
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3001);
const dbPath = process.env.DATABASE_PATH ?? join(here, '..', 'data', 'biblioteca.db');

const db = openDatabase(dbPath);
const app = createApp(db, { allowReset: process.env.ALLOW_RESET !== 'false' });

app.listen(port, () => {
  console.log(`API de la Biblioteca UAO en http://localhost:${port}/api`);
  console.log(`Base de datos SQLite: ${dbPath}`);
});
