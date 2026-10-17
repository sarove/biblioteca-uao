/**
 * DATOS INICIALES (SEMILLA) DE LA BIBLIOTECA UNIVERSITARIA
 * ------------------------------------------------------------
 * Proyecto Final - Estructuras de Datos y Algoritmos II - UAO
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Este archivo lo usan:
 *   - el backend, para llenar la base de datos SQLite la primera vez;
 *   - el frontend, para el "modo local" cuando no hay backend disponible.
 *
 * Las fechas se calculan a partir de "now" para que siempre existan
 * préstamos vigentes, préstamos vencidos y reservas recientes.
 */

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export const LOAN_DAYS_DEFAULT = 15;
export const MAX_ACTIVE_LOANS = 5;

// ---------- Árbol de categorías (id, nombre, padre) ----------
export const seedCategories = [
  { id: 1, name: 'Biblioteca UAO', parentId: null, code: 'UAO' },
  { id: 2, name: 'Ingeniería', parentId: 1, code: 'ING' },
  { id: 3, name: 'Informática', parentId: 2, code: 'INF' },
  { id: 4, name: 'Programación', parentId: 3, code: 'PRG' },
  { id: 5, name: 'Estructuras de datos y algoritmos', parentId: 3, code: 'EDA' },
  { id: 6, name: 'Bases de datos', parentId: 3, code: 'BD' },
  { id: 7, name: 'Ingeniería de software', parentId: 3, code: 'ISW' },
  { id: 8, name: 'Electrónica', parentId: 2, code: 'ELE' },
  { id: 9, name: 'Ciencias Básicas', parentId: 1, code: 'CB' },
  { id: 10, name: 'Matemáticas', parentId: 9, code: 'MAT' },
  { id: 11, name: 'Física', parentId: 9, code: 'FIS' },
  { id: 12, name: 'Humanidades', parentId: 1, code: 'HUM' },
  { id: 13, name: 'Literatura colombiana', parentId: 12, code: 'LIT' },
  { id: 14, name: 'Filosofía', parentId: 12, code: 'FIL' },
  { id: 15, name: 'Ciencias Económicas', parentId: 1, code: 'CE' },
  { id: 16, name: 'Economía', parentId: 15, code: 'ECO' },
  { id: 17, name: 'Administración', parentId: 15, code: 'ADM' },
];

// ---------- Libros: [título, autor, año, editorial, categoría, ejemplares] ----------
const BOOKS = [
  ['Clean Code', 'Robert C. Martin', 2008, 'Prentice Hall', 4, 3],
  ['The Pragmatic Programmer', 'Andrew Hunt y David Thomas', 2019, 'Addison-Wesley', 4, 2],
  ['Eloquent JavaScript', 'Marijn Haverbeke', 2018, 'No Starch Press', 4, 2],
  ['Refactoring', 'Martin Fowler', 2018, 'Addison-Wesley', 4, 1],
  ['Design Patterns', 'Erich Gamma et al.', 1994, 'Addison-Wesley', 4, 1],
  ['Introduction to Algorithms', 'Thomas H. Cormen et al.', 2022, 'MIT Press', 5, 3],
  ['Algorithms', 'Robert Sedgewick y Kevin Wayne', 2011, 'Addison-Wesley', 5, 2],
  ['Learning JavaScript Data Structures and Algorithms', 'Loiane Groner', 2018, 'Packt Publishing', 5, 1],
  ['Grokking Algorithms', 'Aditya Bhargava', 2016, 'Manning', 5, 2],
  ['The Art of Computer Programming, Vol. 1', 'Donald E. Knuth', 1997, 'Addison-Wesley', 5, 1],
  ['Database System Concepts', 'Abraham Silberschatz et al.', 2019, 'McGraw-Hill', 6, 2],
  ['Fundamentos de sistemas de bases de datos', 'Ramez Elmasri y Shamkant Navathe', 2007, 'Pearson', 6, 1],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', 2017, "O'Reilly", 6, 1],
  ['Ingeniería del software', 'Ian Sommerville', 2011, 'Pearson', 7, 2],
  ['Clean Architecture', 'Robert C. Martin', 2017, 'Prentice Hall', 7, 1],
  ['The Art of Electronics', 'Paul Horowitz y Winfield Hill', 2015, 'Cambridge University Press', 8, 1],
  ['Circuitos microelectrónicos', 'Adel S. Sedra y Kenneth C. Smith', 2006, 'Oxford University Press', 8, 1],
  ['Cálculo de una variable', 'James Stewart', 2012, 'Cengage Learning', 10, 3],
  ['Álgebra lineal y sus aplicaciones', 'David C. Lay', 2012, 'Pearson', 10, 2],
  ['Matemáticas discretas y sus aplicaciones', 'Kenneth H. Rosen', 2004, 'McGraw-Hill', 10, 2],
  ['Física universitaria', 'Hugh D. Young y Roger A. Freedman', 2018, 'Pearson', 11, 2],
  ['Física para ciencias e ingeniería', 'Raymond A. Serway y John W. Jewett', 2018, 'Cengage Learning', 11, 1],
  ['Cien años de soledad', 'Gabriel García Márquez', 1967, 'Sudamericana', 13, 2],
  ['El amor en los tiempos del cólera', 'Gabriel García Márquez', 1985, 'Oveja Negra', 13, 1],
  ['Crónica de una muerte anunciada', 'Gabriel García Márquez', 1981, 'Oveja Negra', 13, 1],
  ['María', 'Jorge Isaacs', 1867, 'Panamericana Editorial', 13, 1],
  ['La vorágine', 'José Eustasio Rivera', 1924, 'Panamericana Editorial', 13, 1],
  ['El mundo de Sofía', 'Jostein Gaarder', 1991, 'Siruela', 14, 1],
  ['Ética para Amador', 'Fernando Savater', 1991, 'Ariel', 14, 1],
  ['Principios de economía', 'N. Gregory Mankiw', 2017, 'Cengage Learning', 16, 2],
  ['Administración', 'Stephen P. Robbins y Mary Coulter', 2018, 'Pearson', 17, 1],
];

// ---------- Usuarios ----------
export const seedUsers = [
  { id: 1, code: '2195012', name: 'Salvador Rodriguez Velasco', program: 'Ingeniería Informática', role: 'Estudiante' },
  { id: 2, code: '2201345', name: 'Ana María Gómez', program: 'Ingeniería Informática', role: 'Estudiante' },
  { id: 3, code: '2187654', name: 'Carlos Rojas', program: 'Ingeniería Electrónica', role: 'Estudiante' },
  { id: 4, code: '2210987', name: 'Valentina Cárdenas', program: 'Ingeniería Informática', role: 'Estudiante' },
  { id: 5, code: '2176543', name: 'Julián Zapata', program: 'Economía', role: 'Estudiante' },
  { id: 6, code: '2199876', name: 'Laura Ortiz', program: 'Comunicación Social', role: 'Estudiante' },
  { id: 7, code: 'D-1023', name: 'Mariana Ríos', program: 'Facultad de Ingeniería', role: 'Docente' },
  { id: 8, code: '2205432', name: 'Santiago Mejía', program: 'Ingeniería Mecatrónica', role: 'Estudiante' },
];

const bookId = (title) => {
  const i = BOOKS.findIndex((b) => b[0] === title);
  if (i < 0) throw new Error(`Libro de la semilla no encontrado: ${title}`);
  return i + 1;
};

// Préstamos: [usuario, libro, díasDesdePréstamo, díasHastaVencer, díasDesdeDevolución | null]
const LOANS = [
  // Préstamos ACTIVOS (sin devolver)
  [2, 'Introduction to Algorithms', 10, 5, null],
  [1, 'Learning JavaScript Data Structures and Algorithms', 12, 3, null],
  [4, 'Clean Code', 20, -5, null], // vencido
  [3, 'The Art of Electronics', 8, 7, null],
  [5, 'Principios de economía', 16, -1, null], // vencido
  [6, 'Cien años de soledad', 3, 12, null],
  [1, 'Grokking Algorithms', 5, 10, null],
  [8, 'Cálculo de una variable', 13, 2, null],
  [7, 'Designing Data-Intensive Applications', 25, -10, null], // vencido
  [2, 'Algorithms', 1, 14, null],
  // HISTORIAL (devueltos y ya reubicados)
  [1, 'Clean Code', 60, -45, 50],
  [1, 'Introduction to Algorithms', 80, -65, 66],
  [1, 'Eloquent JavaScript', 40, -25, 30],
  [1, 'Database System Concepts', 100, -85, 90],
  [1, 'Refactoring', 35, -20, 24],
  [2, 'Clean Code', 70, -55, 60],
  [2, 'Eloquent JavaScript', 50, -35, 42],
  [2, 'Grokking Algorithms', 90, -75, 80],
  [2, 'The Pragmatic Programmer', 45, -30, 33],
  [3, 'Física universitaria', 75, -60, 62],
  [3, 'Circuitos microelectrónicos', 45, -30, 35],
  [3, 'Cálculo de una variable', 120, -105, 110],
  [4, 'Introduction to Algorithms', 55, -40, 41],
  [4, 'Algorithms', 70, -55, 58],
  [4, 'Clean Architecture', 30, -15, 18],
  [4, 'Design Patterns', 85, -70, 72],
  [5, 'Administración', 65, -50, 52],
  [5, 'Cálculo de una variable', 95, -80, 81],
  [6, 'El amor en los tiempos del cólera', 50, -35, 38],
  [6, 'María', 80, -65, 70],
  [6, 'La vorágine', 110, -95, 99],
  [6, 'El mundo de Sofía', 30, -15, 16],
  [7, 'Database System Concepts', 60, -45, 47],
  [7, 'Fundamentos de sistemas de bases de datos', 90, -75, 76],
  [7, 'Ingeniería del software', 40, -25, 27],
  [8, 'Álgebra lineal y sus aplicaciones', 50, -35, 36],
  [8, 'Física para ciencias e ingeniería', 70, -55, 58],
  [8, 'Matemáticas discretas y sus aplicaciones', 85, -70, 71],
];

// Devoluciones recientes que siguen en la PILA (carrito) sin reubicar.
// [usuario, libro, díasDesdePréstamo, horasDesdeDevolución] en orden de llegada (base -> cima)
const PENDING_RETURNS = [
  [5, 'Ética para Amador', 14, 26],
  [3, 'Matemáticas discretas y sus aplicaciones', 9, 5],
  [8, 'Grokking Algorithms', 15, 1],
];

// Reservas en espera (COLA por libro): [usuario, libro, horasDesdeReserva]
const RESERVATIONS = [
  [4, 'Learning JavaScript Data Structures and Algorithms', 48],
  [3, 'Learning JavaScript Data Structures and Algorithms', 20],
  [8, 'The Art of Electronics', 70],
  [2, 'Grokking Algorithms', 96],
  [4, 'Grokking Algorithms', 30],
  [6, 'Grokking Algorithms', 12],
  [1, 'Designing Data-Intensive Applications', 140],
];

/**
 * Crea el estado inicial completo de la biblioteca.
 * @param {Date} now  fecha de referencia
 */
export function createSeed(now = new Date()) {
  const t = now.getTime();
  const iso = (ms) => new Date(ms).toISOString();

  const categories = seedCategories.map((c) => ({ ...c }));
  const catCode = Object.fromEntries(categories.map((c) => [c.id, c.code]));
  const perCategory = {};

  const books = BOOKS.map(([title, author, year, publisher, categoryId, copies], i) => {
    perCategory[categoryId] = (perCategory[categoryId] ?? 0) + 1;
    return {
      id: i + 1,
      code: `${catCode[categoryId]}-${String(perCategory[categoryId]).padStart(3, '0')}`,
      title,
      author,
      year,
      publisher,
      categoryId,
      totalCopies: copies,
      availableCopies: copies,
      createdAt: iso(t - 365 * DAY),
    };
  });
  const book = (title) => books[bookId(title) - 1];

  const loans = [];
  LOANS.forEach(([userId, title, sinceDays, dueInDays, returnedDaysAgo]) => {
    const b = book(title);
    loans.push({
      id: loans.length + 1,
      bookId: b.id,
      userId,
      loanDate: iso(t - sinceDays * DAY),
      dueDate: iso(t + dueInDays * DAY),
      returnDate: returnedDaysAgo === null ? null : iso(t - returnedDaysAgo * DAY),
    });
    if (returnedDaysAgo === null) b.availableCopies -= 1;
  });

  // Devoluciones pendientes de reubicar: el ejemplar no está disponible todavía
  const returnStack = [];
  PENDING_RETURNS.forEach(([userId, title, sinceDays, hoursAgo]) => {
    const b = book(title);
    const loan = {
      id: loans.length + 1,
      bookId: b.id,
      userId,
      loanDate: iso(t - sinceDays * DAY),
      dueDate: iso(t - sinceDays * DAY + LOAN_DAYS_DEFAULT * DAY),
      returnDate: iso(t - hoursAgo * HOUR),
    };
    loans.push(loan);
    b.availableCopies -= 1;
    returnStack.push({
      id: returnStack.length + 1,
      loanId: loan.id,
      bookId: b.id,
      pushedAt: loan.returnDate,
      shelvedAt: null,
    });
  });

  const reservations = RESERVATIONS.map(([userId, title, hoursAgo], i) => ({
    id: i + 1,
    bookId: book(title).id,
    userId,
    createdAt: iso(t - hoursAgo * HOUR),
    status: 'waiting',
  }));

  books.forEach((b) => {
    if (b.availableCopies < 0) throw new Error(`Semilla inconsistente: ${b.title}`);
  });

  return {
    categories,
    books,
    users: seedUsers.map((u) => ({ ...u })),
    loans,
    reservations,
    returnStack,
  };
}
