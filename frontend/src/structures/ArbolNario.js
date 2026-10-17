/**
 * ÁRBOL N-ARIO
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Basado en la Clase 09 - Árboles: Nodo con valor, hijos y agregarHijo,
 * y los recorridos DFS (recursivo) y BFS (con cola).
 *
 * Uso en la biblioteca: CLASIFICACIÓN TEMÁTICA. Biblioteca -> facultades
 * -> áreas -> materias. Filtrar por una categoría incluye a todos sus
 * descendientes (p. ej. "Informática" incluye Programación, Bases de datos…).
 */
export class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.hijos = [];
  }

  agregarHijo(nodo) {
    this.hijos.push(nodo);
    return nodo;
  }

  esHoja() {
    return this.hijos.length === 0;
  }
}

export class ArbolNario {
  constructor(raiz = null) {
    this.raiz = raiz;
  }

  // DFS en preorden (recursivo): nodo y luego sus hijos
  dfs(visitar = () => {}, nodo = this.raiz, nivel = 0, resultado = []) {
    if (!nodo) return resultado;
    visitar(nodo, nivel);
    resultado.push({ nodo, nivel });
    nodo.hijos.forEach((hijo) => this.dfs(visitar, hijo, nivel + 1, resultado));
    return resultado;
  }

  // BFS por niveles (con una cola)
  bfs(visitar = () => {}) {
    const resultado = [];
    if (!this.raiz) return resultado;
    const cola = [{ nodo: this.raiz, nivel: 0 }];
    while (cola.length) {
      const actual = cola.shift();
      visitar(actual.nodo, actual.nivel);
      resultado.push(actual);
      actual.nodo.hijos.forEach((h) => cola.push({ nodo: h, nivel: actual.nivel + 1 }));
    }
    return resultado;
  }

  buscar(condicion, nodo = this.raiz) {
    if (!nodo) return null;
    if (condicion(nodo.valor)) return nodo;
    for (const hijo of nodo.hijos) {
      const r = this.buscar(condicion, hijo);
      if (r) return r;
    }
    return null;
  }

  // Camino raíz -> nodo (migas de pan)
  rutaHasta(condicion, nodo = this.raiz, camino = []) {
    if (!nodo) return [];
    const nuevo = [...camino, nodo];
    if (condicion(nodo.valor)) return nuevo;
    for (const hijo of nodo.hijos) {
      const r = this.rutaHasta(condicion, hijo, nuevo);
      if (r.length) return r;
    }
    return [];
  }

  // Valores de un nodo y todos sus descendientes (subárbol)
  subarbol(nodo) {
    if (!nodo) return [];
    return this.dfs(() => {}, nodo).map(({ nodo: n }) => n.valor);
  }

  tamano(nodo = this.raiz) {
    if (!nodo) return 0;
    return 1 + nodo.hijos.reduce((s, h) => s + this.tamano(h), 0);
  }

  altura(nodo = this.raiz) {
    if (!nodo) return -1;
    if (nodo.esHoja()) return 0;
    return 1 + Math.max(...nodo.hijos.map((h) => this.altura(h)));
  }

  hojas() {
    return this.dfs().filter(({ nodo }) => nodo.esHoja()).map(({ nodo }) => nodo);
  }

  /**
   * Suma recursiva sobre el subárbol: valorDe(nodo) + suma de los hijos.
   * Se usa para contar los libros de una categoría y sus subcategorías.
   */
  sumar(valorDe, nodo = this.raiz) {
    if (!nodo) return 0;
    return valorDe(nodo.valor) + nodo.hijos.reduce((s, h) => s + this.sumar(valorDe, h), 0);
  }

  /**
   * Construye el árbol a partir de filas { id, parentId } (como vienen de
   * la base de datos). Retorna el árbol con la raíz (parentId = null).
   */
  static desdeFilas(filas, { id = 'id', padre = 'parentId' } = {}) {
    const nodos = new Map(filas.map((f) => [f[id], new Nodo(f)]));
    let raiz = null;
    filas.forEach((f) => {
      const nodo = nodos.get(f[id]);
      if (f[padre] === null || f[padre] === undefined) raiz = nodo;
      else nodos.get(f[padre])?.agregarHijo(nodo);
    });
    return new ArbolNario(raiz);
  }
}
