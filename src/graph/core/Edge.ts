/**
 * Base class for graph edges.
 */
export class Edge {
  /**
   * The index of the *from* node.
   */
  from: number;

  /**
   * The index of the *to* node.
   */
  to: number;

  /**
   * The cost of this edge. This could be for example a distance or time value.
   */
  cost: number;

  /**
   * Constructs a new edge.
   *
   * @param from - The index of the from node.
   * @param to - The index of the to node.
   * @param cost - The cost of this edge.
   */
  constructor(from: number = -1, to: number = -1, cost: number = 0) {
    this.from = from;
    this.to = to;
    this.cost = cost;
  }

  /**
   * Copies all values from the given edge to this edge.
   *
   * @param edge - The edge to copy.
   * @return A reference to this edge.
   */
  copy(edge: Edge): Edge {
    this.from = edge.from;
    this.to = edge.to;
    this.cost = edge.cost;

    return this;
  }

  /**
   * Creates a new edge and copies all values from this edge.
   *
   * @return A new edge.
   */
  clone(): Edge {
    const edge = new Edge();
    return this.copy(edge);
  }
}
