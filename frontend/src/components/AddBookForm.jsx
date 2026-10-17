import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';

/**
 * Formulario para agregar un libro: se guarda en la base de datos y, al
 * recibir el nuevo estado, el libro entra al Trie, al Árbol (su categoría)
 * y al Grafo de recomendaciones.
 * Estudiante: Salvador Rodriguez Velasco
 */
const EMPTY = { title: '', author: '', year: '', publisher: '', categoryId: '', totalCopies: '1' };

export default function AddBookForm({ defaultCategory, onDone }) {
  const { lib, run, busy } = useLibrary();
  const [form, setForm] = useState({ ...EMPTY, categoryId: defaultCategory ?? '' });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Solo materias (hojas del árbol) y áreas: no la raíz
  const options = lib.categoryTree
    .dfs()
    .filter(({ nivel }) => nivel > 0)
    .map(({ nodo, nivel }) => ({ id: nodo.valor.id, label: `${'— '.repeat(nivel - 1)}${nodo.valor.name}` }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.year || !form.categoryId) {
      setError('Complete título, autor, año y categoría.');
      return;
    }
    setError(null);
    const result = await run(
      (repo) =>
        repo.addBook({
          ...form,
          year: Number(form.year),
          totalCopies: Number(form.totalCopies),
          categoryId: Number(form.categoryId),
        }),
      `Libro «${form.title.trim()}» agregado al catálogo.`
    );
    if (result) {
      setForm({ ...EMPTY, categoryId: form.categoryId });
      onDone?.(result.id);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <label className="field span-2">
        <span>Título</span>
        <input value={form.title} onChange={set('title')} placeholder="Ej: Structure and Interpretation of Computer Programs" />
      </label>
      <label className="field span-2">
        <span>Autor(es)</span>
        <input value={form.author} onChange={set('author')} placeholder="Ej: Harold Abelson y Gerald Jay Sussman" />
      </label>
      <label className="field">
        <span>Año</span>
        <input value={form.year} onChange={set('year')} inputMode="numeric" placeholder="1996" />
      </label>
      <label className="field">
        <span>Ejemplares</span>
        <input value={form.totalCopies} onChange={set('totalCopies')} inputMode="numeric" />
      </label>
      <label className="field">
        <span>Editorial</span>
        <input value={form.publisher} onChange={set('publisher')} placeholder="MIT Press" />
      </label>
      <label className="field">
        <span>Categoría</span>
        <select value={form.categoryId} onChange={set('categoryId')}>
          <option value="">Seleccione…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="error span-2">{error}</p>}
      <div className="span-2 form-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Guardar libro
        </button>
      </div>
    </form>
  );
}
