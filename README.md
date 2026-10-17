# 📚 Biblioteca UAO · Plataforma de biblioteca universitaria

Proyecto Final de **Estructuras de Datos y Algoritmos II** — Universidad Autónoma de Occidente (Santiago de Cali).

Plataforma web para la biblioteca universitaria: catálogo con buscador, préstamos, devoluciones, reservas con lista de espera y recomendaciones de lectura. La plataforma está construida sobre **seis estructuras de datos** implementadas en JavaScript, sin librerías, y sobre una **base de datos SQLite con transacciones**.

## 👥 Integrantes

| Integrante | Código | Rol | Ramas |
|---|---|---|---|
| **Salvador Rodriguez Velasco** | — | Desarrollo completo (backend, estructuras, frontend, documentación) | todas las ramas `feature/*` y `docs/*` |

## 🌐 Enlaces

| Servicio | Enlace |
|---|---|
| Repositorio Git | `https://github.com/<usuario>/biblioteca-uao` ⚠️ *reemplazar al subir el repositorio* |
| Frontend publicado (Netlify) | `https://<sitio>.netlify.app` ⚠️ *reemplazar al publicar* |
| Backend publicado (Render) | `https://biblioteca-uao-api.onrender.com/api/health` ⚠️ *reemplazar al publicar* |
| Documento final | [`docs/Proyecto_Final_Biblioteca_UAO_Salvador_Rodriguez_Velasco.docx`](docs/) |

Servicios usados para desplegar: **Netlify** (frontend estático, archivo `netlify.toml`) y **Render** (backend Node.js + SQLite, archivo `render.yaml`).

## 🧱 Estructuras de datos (rúbrica: 2 lineales + 2 árboles + grafo)

| Grupo de la rúbrica | Estructura | Dónde se usa | Archivo |
|---|---|---|---|
| Listas, Pilas o Colas | **Pila** (LIFO) | Carrito de devoluciones: se reubica primero el último libro devuelto | `frontend/src/structures/Stack.js` |
| Listas, Pilas o Colas | **Cola** (FIFO, con nodos enlazados) | Lista de espera de cada libro agotado | `frontend/src/structures/Queue.js` |
| Árboles, Tries o Heaps | **Trie** | Buscador con autocompletado de títulos y autores | `frontend/src/structures/Trie.js` |
| Árboles, Tries o Heaps | **Árbol N-ario** | Clasificación temática: facultad → área → materia | `frontend/src/structures/ArbolNario.js` |
| Árboles, Tries o Heaps | **Heap** (min y max) | Préstamos por vencer · libros más prestados | `frontend/src/structures/Heap.js` |
| Grafos | **Grafo ponderado** | Recomendaciones (mismo lector, autor, materia), BFS y camino más corto, dibujado con react-d3-graph | `frontend/src/structures/Graph.js` |

`frontend/src/data/buildLibrary.js` reconstruye las seis estructuras cada vez que cambia la base de datos.

## 🗄️ Base de datos y transacciones

- **SQLite** con el módulo nativo `node:sqlite` (Node.js ≥ 22.13). Tablas: `categories`, `books`, `users`, `loans`, `reservations`, `return_stack`.
- Las operaciones que tocan varias tablas son **transacciones** (`BEGIN IMMEDIATE … COMMIT / ROLLBACK`):
  - **Préstamo:** insertar préstamo + descontar ejemplar.
  - **Devolución:** cerrar préstamo + apilar en el carrito (push).
  - **Reubicar:** sacar la cima del carrito (pop) + atender al primero de la lista de espera (dequeue) y prestarle el libro, o devolver el ejemplar a la estantería.
  - **Reserva / cancelación**, **nuevo libro**, **nuevo usuario**.
- Restricciones `CHECK` en la base de datos: los ejemplares disponibles nunca son negativos ni superan el total.
- **Modo local:** si el frontend no encuentra el backend, usa las mismas reglas (`shared/rules.js`) con transacciones en memoria y guarda los datos en `localStorage`. Así la plataforma publicada en Netlify funciona siempre.

## 🏗️ Arquitectura

```
biblioteca-uao/
├── backend/            API REST (Express 5) + SQLite + transacciones + pruebas
├── frontend/           React 19 + Vite + React Router + react-d3-graph
│   └── src/structures/ las 6 estructuras de datos
├── shared/             datos de ejemplo y reglas de negocio comunes
├── docs/               documento final (Word)
├── netlify.toml        despliegue del frontend
├── render.yaml         despliegue del backend
└── ESTUDIANTE.txt
```

## ▶️ Ejecución local

Requisito: **Node.js 22.13 o superior** (recomendado 22 LTS).

```bash
npm run install:all          # instala backend y frontend

# Terminal 1: backend en http://localhost:3001/api
npm run dev:backend

# Terminal 2: frontend en http://localhost:5173
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:3001/api
npm run dev
```

Sin el backend, el frontend funciona igual en **modo local** (`npm run dev:frontend`, sin `.env`).

Pruebas (backend + estructuras): `npm test`

## 🚀 Despliegue

1. **Backend (Render):** *New › Blueprint* y elegir este repositorio (usa `render.yaml`). Probar con `https://<servicio>.onrender.com/api/health`.
2. **Frontend (Netlify):** *Add new site › Import from Git*; Netlify lee `netlify.toml` (base `frontend`, publica `dist`). En *Environment variables* agregar `VITE_API_URL=https://<servicio>.onrender.com/api` y volver a desplegar.
3. Copiar las dos URL en la tabla de **Enlaces** de este README.

> En el plan gratuito de Render el disco es efímero: al reiniciarse, el servicio vuelve a crear la base de datos con los datos de ejemplo. Para conservar los datos se puede agregar un *Persistent Disk* y apuntar `DATABASE_PATH` a él.

## 🔌 API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/state` | Todas las tablas |
| POST | `/api/books` | Nuevo libro |
| POST | `/api/users` | Nuevo usuario |
| POST | `/api/loans` | Préstamo (transacción) |
| POST | `/api/loans/:id/return` | Devolución → push a la pila |
| POST | `/api/returns/shelve` | Reubicar: pop de la pila + dequeue de la cola |
| POST | `/api/reservations` | Reserva → enqueue |
| DELETE | `/api/reservations/:id` | Cancelar reserva |
| POST | `/api/reset` | Restaurar datos de ejemplo |

## 🌿 Ramas

Cada funcionalidad se desarrolló en su propia rama y se mezcló en `main` con `--no-ff`:

| Rama | Contenido |
|---|---|
| `feature/backend-sqlite` | API REST, esquema SQLite, transacciones y pruebas |
| `feature/plataforma-base` | Repositorio API/local, contexto, diseño y componentes base |
| `feature/pila-cola` | Pila (devoluciones) y Cola (reservas) |
| `feature/trie-arbol` | Trie (buscador) y Árbol N-ario (categorías) |
| `feature/heap` | Heap (vencimientos y ranking) |
| `feature/grafo` | Grafo de recomendaciones con react-d3-graph |
| `feature/integracion` | Construcción de las estructuras, páginas y pruebas |
| `docs/documentacion` | README, documento final, ESTUDIANTE.txt y despliegue |

---
**Estudiante:** Salvador Rodriguez Velasco · Ingeniería Informática · UAO
