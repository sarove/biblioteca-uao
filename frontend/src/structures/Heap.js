/**
 * HEAP BINARIO (montículo) con comparador
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Árbol binario COMPLETO guardado en un arreglo: los hijos del índice i
 * están en 2i + 1 y 2i + 2, y su padre en floor((i - 1) / 2). Cumple la
 * propiedad de heap: cada padre tiene MAYOR prioridad que sus hijos, así
 * que la raíz (índice 0) siempre es el elemento más prioritario.
 *
 *   push / pop: O(log n) (subir o bajar por una rama)
 *   peek:       O(1)
 *
 * compare(a, b) < 0 significa que "a" tiene más prioridad que "b".
 *   - Min-heap de fechas: (a, b) => a.fecha - b.fecha
 *   - Max-heap de conteos: (a, b) => b.total - a.total
 *
 * Uso en la biblioteca:
 *   - Min-heap de PRÉSTAMOS POR FECHA DE VENCIMIENTO (alertas de vencidos).
 *   - Max-heap de LIBROS MÁS PRESTADOS (ranking).
 */
export class Heap {
  constructor(compare = (a, b) => a - b, items = []) {
    this.compare = compare;
    this.data = [];
    items.forEach((item) => this.push(item));
  }

  size() {
    return this.data.length;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  peek() {
    return this.data.length ? this.data[0] : null;
  }

  // push: agrega al final y SUBE mientras tenga más prioridad que su padre
  push(value) {
    this.data.push(value);
    this.#siftUp(this.data.length - 1);
    return this.data.length;
  }

  // pop: saca la raíz, pone el último en la raíz y lo BAJA hasta su lugar
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  /**
   * Los k más prioritarios en orden, SIN modificar el heap
   * (se trabaja sobre una copia).
   */
  top(k = Infinity) {
    const copy = new Heap(this.compare);
    copy.data = this.data.slice();
    const result = [];
    while (!copy.isEmpty() && result.length < k) result.push(copy.pop());
    return result;
  }

  // Niveles del árbol (para dibujarlo): [[raíz], [hijo1, hijo2], ...]
  levels() {
    const levels = [];
    for (let start = 0, size = 1; start < this.data.length; start += size, size *= 2) {
      levels.push(this.data.slice(start, start + size));
    }
    return levels;
  }

  #siftUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[parent]) >= 0) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  #siftDown(i) {
    const n = this.data.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let best = i;
      if (left < n && this.compare(this.data[left], this.data[best]) < 0) best = left;
      if (right < n && this.compare(this.data[right], this.data[best]) < 0) best = right;
      if (best === i) return;
      [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
      i = best;
    }
  }
}
