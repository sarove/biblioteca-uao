/**
 * TRIE (árbol de prefijos)
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Cada nodo representa un carácter y tiene un mapa de hijos. Las claves
 * que comparten prefijo comparten el camino desde la raíz, así que
 * encontrar todas las claves que empiezan por un prefijo cuesta O(m) para
 * llegar al nodo del prefijo (m = largo del prefijo) más el recorrido del
 * subárbol, sin revisar todo el catálogo.
 *
 * Uso en la biblioteca: BUSCADOR CON AUTOCOMPLETADO de títulos y autores.
 * Se ignoran mayúsculas y tildes ("algebra" encuentra "Álgebra").
 */

// "Álgebra Lineal" -> "algebra lineal"
export const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Palabras significativas de un texto (se omiten conectores cortos)
const STOP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'para', 'sus', 'the', 'of', 'to', 'and', 'et', 'al', 'una', 'un']);
export const words = (text) => normalize(text).split(' ').filter((w) => w.length > 1 && !STOP.has(w));

class TrieNode {
  constructor() {
    this.children = new Map(); // carácter -> TrieNode
    this.values = []; // valores guardados cuando aquí termina una clave
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
    this.keyCount = 0;
    this.nodeCount = 1;
  }

  // insert: recorre/crea un nodo por carácter y guarda el valor al final. O(m)
  insert(key, value) {
    const k = normalize(key);
    if (!k) return;
    let node = this.root;
    for (const ch of k) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
        this.nodeCount++;
      }
      node = node.children.get(ch);
    }
    if (node.values.length === 0) this.keyCount++;
    if (!node.values.includes(value)) node.values.push(value);
  }

  // nodo donde termina un prefijo (o null)
  #find(prefix) {
    let node = this.root;
    for (const ch of normalize(prefix)) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }

  // search: valores de la clave EXACTA
  search(key) {
    return this.#find(key)?.values.slice() ?? [];
  }

  // startsWith: ¿existe alguna clave con ese prefijo?
  startsWith(prefix) {
    return this.#find(prefix) !== null;
  }

  /**
   * collect: valores de TODAS las claves que empiezan por el prefijo
   * (recorrido en profundidad del subárbol del prefijo).
   */
  collect(prefix, limit = Infinity) {
    const start = this.#find(prefix);
    if (!start) return [];
    const result = [];
    const seen = new Set();
    const dfs = (node) => {
      for (const v of node.values) {
        const id = typeof v === 'object' ? JSON.stringify(v) : v;
        if (!seen.has(id)) {
          seen.add(id);
          result.push(v);
          if (result.length >= limit) return true;
        }
      }
      // hijos en orden alfabético para resultados estables
      for (const ch of [...node.children.keys()].sort()) {
        if (dfs(node.children.get(ch))) return true;
      }
      return false;
    };
    dfs(start);
    return result;
  }

  // Camino de caracteres recorrido para un prefijo (para visualizarlo)
  path(prefix) {
    const steps = [];
    let node = this.root;
    for (const ch of normalize(prefix)) {
      node = node.children.get(ch);
      if (!node) {
        steps.push({ ch, found: false, branches: 0 });
        break;
      }
      steps.push({ ch, found: true, branches: node.children.size });
    }
    return steps;
  }
}
