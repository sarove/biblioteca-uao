/**
 * Utilidades de formato y colores.
 * Estudiante: Salvador Rodriguez Velasco
 */
const DAY = 24 * 60 * 60 * 1000;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "06 oct 2026"
export const formatDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

// "vence en 3 días", "vence hoy", "vencido hace 5 días"
export function dueStatus(dueIso, now = new Date()) {
  const diff = new Date(dueIso).getTime() - now.getTime();
  const days = Math.ceil(diff / DAY);
  if (diff < 0) {
    const late = Math.max(1, Math.floor(-diff / DAY));
    return { kind: 'overdue', label: `Vencido hace ${late} día${late === 1 ? '' : 's'}` };
  }
  if (days <= 1) return { kind: 'soon', label: 'Vence hoy o mañana' };
  if (days <= 3) return { kind: 'soon', label: `Vence en ${days} días` };
  return { kind: 'ok', label: `Vence en ${days} días` };
}

export const timeAgo = (iso, now = new Date()) => {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
};

// Color por facultad (primer nivel del árbol de categorías)
export const FACULTY_COLORS = {
  ING: '#1d4ed8',
  CB: '#0f766e',
  HUM: '#9d174d',
  CE: '#b45309',
};

export function facultyOf(lib, categoryId) {
  const path = lib.categoryPath(categoryId);
  return path[1] ?? path[0] ?? null;
}

export function bookColor(lib, book) {
  const faculty = facultyOf(lib, book.categoryId);
  return FACULTY_COLORS[faculty?.code] ?? '#475569';
}

export const initials = (text) =>
  text
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
