/**
 * GRAFO NO DIRIGIDO Y PONDERADO - Lista de adyacencia
 * ------------------------------------------------------------
 * Estudiante: Salvador Rodriguez Velasco
 *
 * Basado en la Clase 10 - Grafos: lista de nodos + objeto de adyacencia,
 * con addNode, addEdge, searchNode, printAdjacency y printGraph. Aquí cada
 * entrada de la adyacencia guarda además un PESO y los MOTIVOS de la
 * relación; si se agrega dos veces la misma arista, el peso se acumula.
 *
 * Uso en la biblioteca: RECOMENDACIONES. Cada libro es un nodo; dos libros
 * se unen si los prestó el mismo usuario (+3), si son del mismo autor (+2)
 * o de la misma materia (+1). Los vecinos con mayor peso son las mejores
 * recomendaciones, y BFS encuentra libros relacionados a 2 saltos.
 */
export class Graph {
  constructor() {
    this.nodes = [];
    this.adjList = {}; // id -> { vecinoId: { weight, reasons: [] } }
  }

  addNode(node) {
    if (node?.id === undefined) throw new Error('El nodo debe tener un id');
    if (this.adjList[node.id]) return null;
    this.nodes.push(node);
    this.adjList[node.id] = {};
    return node;
  }

  // addEdge: arista no dirigida; si ya existe, acumula peso y motivo
  addEdge(id1, id2, weight = 1, reason = null) {
    if (!this.adjList[id1] || !this.adjList[id2]) throw new Error('Uno de los nodos no existe');
    if (id1 === id2) return false;
    for (const [a, b] of [
      [id1, id2],
      [id2, id1],
    ]) {
      const edge = this.adjList[a][b] ?? { weight: 0, reasons: [] };
      edge.weight += weight;
      if (reason && !edge.reasons.includes(reason)) edge.reasons.push(reason);
      this.adjList[a][b] = edge;
    }
    return true;
  }

  hasEdge(id1, id2) {
    return Boolean(this.adjList[id1]?.[id2]);
  }

  searchNode(id) {
    return this.nodes.find((n) => n.id === id) ?? null;
  }

  // Vecinos ordenados por peso (mayor primero)
  neighbors(id) {
    return Object.entries(this.adjList[id] ?? {})
      .map(([vecino, edge]) => ({ node: this.searchNode(Number.isNaN(Number(vecino)) ? vecino : Number(vecino)), ...edge }))
      .sort((a, b) => b.weight - a.weight);
  }

  degree(id) {
    return Object.keys(this.adjList[id] ?? {}).length;
  }

  edgeCount() {
    return Object.values(this.adjList).reduce((s, adj) => s + Object.keys(adj).length, 0) / 2;
  }

  printAdjacency(id) {
    if (!this.searchNode(id)) return null;
    console.log(this.adjList[id]);
    return this.adjList[id];
  }

  printGraph() {
    console.log(this.adjList);
    return this.adjList;
  }

  /**
   * BFS: nodos alcanzables desde "start" hasta "maxDepth" saltos,
   * con su distancia y el nodo por el que se llegó.
   */
  bfs(start, maxDepth = Infinity) {
    if (!this.adjList[start]) return [];
    const visited = new Map([[start, { distance: 0, via: null }]]);
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      const { distance } = visited.get(current);
      if (distance >= maxDepth) continue;
      for (const vecino of Object.keys(this.adjList[current])) {
        const key = Number.isNaN(Number(vecino)) ? vecino : Number(vecino);
        if (!visited.has(key)) {
          visited.set(key, { distance: distance + 1, via: current });
          queue.push(key);
        }
      }
    }
    return [...visited.entries()].map(([id, info]) => ({ id, ...info }));
  }

  // Camino con menos saltos entre dos nodos (BFS) o [] si no existe
  shortestPath(from, to) {
    const reach = new Map(this.bfs(from).map((r) => [r.id, r]));
    if (!reach.has(to)) return [];
    const path = [];
    for (let at = to; at !== null; at = reach.get(at).via) path.unshift(at);
    return path;
  }

  // Lista de aristas sin repetir
  edges() {
    const result = [];
    const seen = new Set();
    for (const [a, adj] of Object.entries(this.adjList)) {
      for (const [b, edge] of Object.entries(adj)) {
        const key = [a, b].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ source: Number(a), target: Number(b), ...edge });
      }
    }
    return result;
  }
}
