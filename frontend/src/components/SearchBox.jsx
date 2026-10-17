import { useId, useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';

/**
 * BUSCADOR CON AUTOCOMPLETADO (Trie)
 * Mientras se escribe, suggest(prefijo) recorre el subárbol del prefijo en
 * el Trie y propone títulos y autores. Se navega con ↑ ↓ Enter y Esc.
 * Estudiante: Salvador Rodriguez Velasco
 */
export default function SearchBox({ value, onChange, onSubmit, onPickBook, autoFocus = false }) {
  const { lib } = useLibrary();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const lastWord = value.split(/\s+/).at(-1) ?? '';
  const suggestions = value.trim().length >= 2 ? lib.suggest(value.trim(), 8) : [];
  // Si la frase completa no tiene sugerencias, se completa la última palabra
  const items = suggestions.length || lastWord.length < 2 ? suggestions : lib.suggest(lastWord, 8);

  const pick = (item) => {
    setOpen(false);
    setActive(-1);
    if (item.type === 'title' && onPickBook) onPickBook(item.bookId);
    else {
      onChange(item.label);
      onSubmit?.(item.label);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && items[active]) pick(items[active]);
      else {
        setOpen(false);
        onSubmit?.(value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search">
      <span className="search-icon" aria-hidden="true">
        🔎
      </span>
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        placeholder="Buscar por título o autor (p. ej. «algo», «garcía», «clean mar»)"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Buscar en el catálogo"
      />
      {open && items.length > 0 && (
        <ul className="suggestions" id={listId} role="listbox">
          {items.map((item, i) => (
            <li
              key={`${item.type}-${item.label}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
            >
              <span className={`sug-type ${item.type}`}>{item.type === 'title' ? 'Libro' : 'Autor'}</span>
              {item.label}
            </li>
          ))}
          <li className="sug-foot" aria-hidden="true">
            Sugerencias del Trie · {lib.suggestTrie.nodeCount} nodos
          </li>
        </ul>
      )}
    </div>
  );
}
