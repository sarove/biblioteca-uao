/**
 * PILA (Stack) - LIFO: Last In, First Out
 * ------------------------------------------------------------
 * Proyecto Final - Estructuras de Datos y Algoritmos II - UAO
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Basada en la Clase 06 - Pilas y Colas. Se usa un arreglo interno:
 * el final del arreglo es la CIMA.
 *
 * Uso en la biblioteca: CARRITO DE DEVOLUCIONES. Cada libro devuelto se
 * apila en el carrito (push) y el bibliotecario reubica siempre el que
 * quedó encima (pop), como una pila de libros real.
 */
export class Stack {
  constructor() {
    this.items = [];
  }

  // push: agrega en la cima. O(1)
  push(value) {
    this.items.push(value);
    return this.items.length;
  }

  // pop: saca y retorna la cima (o null si está vacía). O(1)
  pop() {
    return this.items.length > 0 ? this.items.pop() : null;
  }

  // peek: retorna la cima sin sacarla. O(1)
  peek() {
    return this.items.length > 0 ? this.items[this.items.length - 1] : null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  // print: de la cima a la base, sin modificar la pila. O(n)
  print(log = false) {
    const fromTop = this.items.slice().reverse();
    if (log) fromTop.forEach((item) => console.log(item));
    return fromTop;
  }
}
