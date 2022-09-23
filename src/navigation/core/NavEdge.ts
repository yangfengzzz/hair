import { Edge } from "../../graph/core/Edge";

/**
 * Class for representing navigation edges.
 */
export class NavEdge extends Edge {
  /**
   * Constructs a navigation edge.
   *
   * @param from - The index of the from node.
   * @param to - The index of the to node.
   * @param cost - The cost of this edge.
   */
  constructor(from: number = -1, to: number = -1, cost: number = 0) {
    super(from, to, cost);
  }
}
