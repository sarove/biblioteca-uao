/**
 * COLA (Queue) - FIFO: First In, First Out - implementada con NODOS ENLAZADOS
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Combina la Clase 03 (listas enlazadas: nodo con value y next, head y
 * tail) con la Clase 06 (métodos de la cola). A diferencia de la versión
 * con arreglo, dequeue no usa shift(): solo mueve "head" al siguiente
 * nodo, así que enqueue y dequeue son O(1).
 *
 * Uso en la biblioteca: LISTA DE ESPERA (RESERVAS) de cada libro. Cuando
 * se reubica un ejemplar devuelto, se atiende al primero de la cola.
 */
class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

export class Queue {
  constructor() {
    this.head = null; // frente: de aquí se atiende
    this.tail = null; // final: aquí se encola
    this.length = 0;
  }

  // enqueue: agrega al final. O(1)
  enqueue(value) {
    const node = new QueueNode(value);
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.length++;
    return this.length;
  }

  // dequeue: saca y retorna el frente (o null). O(1)
  dequeue() {
    if (!this.head) return null;
    const node = this.head;
    this.head = node.next;
    if (!this.head) this.tail = null;
    this.length--;
    return node.value;
  }

  // peek: retorna el frente sin sacarlo. O(1)
  peek() {
    return this.head ? this.head.value : null;
  }

  size() {
    return this.length;
  }

  isEmpty() {
    return this.length === 0;
  }

  // positionOf: turno (1, 2, ...) del primer elemento que cumple la condición. O(n)
  positionOf(condition) {
    let current = this.head;
    let position = 1;
    while (current) {
      if (condition(current.value)) return position;
      current = current.next;
      position++;
    }
    return -1;
  }

  // print / toArray: del frente al final. O(n)
  print(log = false) {
    const values = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    if (log) values.forEach((v) => console.log(v));
    return values;
  }

  toArray() {
    return this.print(false);
  }
}
