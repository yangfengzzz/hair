import { Node } from "./Node";
import { Edge } from "./Edge";

/**
 * Class representing a sparse graph implementation based on adjacency lists.
 * A sparse graph can be used to model many different types of graphs like navigation
 * graphs (pathfinding), dependency graphs (e.g. technology trees) or state graphs
 * (a representation of every possible state in a game).
 */
export class Graph {
  private _nodes: Map<number, Node> = new Map(); // contains all nodes in a map: (nodeIndex => node)
  private _edges: Map<number, Edge[]> = new Map(); // adjacency list for each node: (nodeIndex => edges)

  /**
   * Whether this graph is directed or not.
   */
  digraph = false;

  /**
   * Adds a node to the graph.
   *
   * @param {Node} node - The node to add.
   * @return {Graph} A reference to this graph.
   */
  addNode(node: Node): Graph {
    const index = node.index;
    this._nodes.set(index, node);
    this._edges.set(index, []);

    return this;
  }

  /**
   * Adds an edge to the graph. If the graph is undirected, the method
   * automatically creates the opponent edge.
   *
   * @param edge - The edge to add.
   * @return A reference to this graph.
   */
  addEdge(edge: Edge): Graph {
    let edges: Edge[];

    edges = this._edges.get(edge.from);
    edges.push(edge);

    if (this.digraph === false) {
      const oppositeEdge = edge.clone();

      oppositeEdge.from = edge.to;
      oppositeEdge.to = edge.from;

      edges = this._edges.get(edge.to);
      edges.push(oppositeEdge);
    }

    return this;
  }

  /**
   * Returns a node for the given node index. If no node is found,
   * *null* is returned.
   *
   * @param index - The index of the node.
   * @return The requested node.
   */
  getNode(index: number): Node {
    return this._nodes.get(index) || null;
  }

  /**
   * Returns an edge for the given *from* and *to* node indices.
   * If no node is found, *null* is returned.
   *
   * @param from - The index of the from node.
   * @param to - The index of the to node.
   * @return The requested edge.
   */
  getEdge(from: number, to: number): Edge {
    if (this.hasNode(from) && this.hasNode(to)) {
      const edges = this._edges.get(from);

      for (let i = 0, l = edges.length; i < l; i++) {
        const edge = edges[i];

        if (edge.to === to) {
          return edge;
        }
      }
    }

    return null;
  }

  /**
   * Gathers all nodes of the graph and stores them into the given array.
   *
   * @param result - The result array.
   * @return The result array.
   */
  getNodes(result: Node[]): Node[] {
    result.length = 0;
    result.push(...this._nodes.values());

    return result;
  }

  /**
   * Gathers all edges leading from the given node index and stores them
   * into the given array.
   *
   * @param index - The node index.
   * @param result - The result array.
   * @return The result array.
   */
  getEdgesOfNode(index: number, result: Edge[]): Edge[] {
    const edges = this._edges.get(index);

    if (edges !== undefined) {
      result.length = 0;
      result.push(...edges);
    }
    return result;
  }

  /**
   * Returns the node count of the graph.
   *
   * @return The amount of nodes.
   */
  getNodeCount(): number {
    return this._nodes.size;
  }

  /**
   * Returns the edge count of the graph.
   *
   * @return The amount of edges.
   */
  getEdgeCount(): number {
    let count = 0;

    for (const edges of this._edges.values()) {
      count += edges.length;
    }
    return count;
  }

  /**
   * Removes the given node from the graph and all edges which are connected
   * with this node.
   *
   * @param node - The node to remove.
   * @return A reference to this graph.
   */
  removeNode(node: Node): Graph {
    this._nodes.delete(node.index);

    if (this.digraph === false) {
      // if the graph is not directed, remove all edges leading to this node
      const edges = this._edges.get(node.index);

      for (const edge of edges) {
        const edgesOfNeighbor = this._edges.get(edge.to);

        for (let i = edgesOfNeighbor.length - 1; i >= 0; i--) {
          const edgeNeighbor = edgesOfNeighbor[i];

          if (edgeNeighbor.to === node.index) {
            const index = edgesOfNeighbor.indexOf(edgeNeighbor);
            edgesOfNeighbor.splice(index, 1);

            break;
          }
        }
      }
    } else {
      // if the graph is directed, remove the edges the slow way
      for (const edges of this._edges.values()) {
        for (let i = edges.length - 1; i >= 0; i--) {
          const edge = edges[i];

          if (!this.hasNode(edge.to) || !this.hasNode(edge.from)) {
            const index = edges.indexOf(edge);
            edges.splice(index, 1);
          }
        }
      }
    }

    // delete edge list of node (edges leading from this node)
    this._edges.delete(node.index);
    return this;
  }

  /**
   * Removes the given edge from the graph. If the graph is undirected, the
   * method also removes the opponent edge.
   *
   * @param edge - The edge to remove.
   * @return A reference to this graph.
   */
  removeEdge(edge: Edge): Graph {
    // delete the edge from the node's edge list
    const edges = this._edges.get(edge.from);

    if (edges !== undefined) {
      const index = edges.indexOf(edge);
      edges.splice(index, 1);

      // if the graph is not directed, delete the edge connecting the node in the opposite direction
      if (this.digraph === false) {
        const edges = this._edges.get(edge.to);

        for (let i = 0, l = edges.length; i < l; i++) {
          const e = edges[i];

          if (e.to === edge.from) {
            const index = edges.indexOf(e);
            edges.splice(index, 1);
            break;
          }
        }
      }
    }

    return this;
  }

  /**
   * Return true if the graph has the given node index.
   *
   * @param index - The node index to test.
   * @return Whether this graph has the node or not.
   */
  hasNode(index: number): boolean {
    return this._nodes.has(index);
  }

  /**
   * Return true if the graph has an edge connecting the given
   * *from* and *to* node indices.
   *
   * @param from - The index of the from node.
   * @param to - The index of the to node.
   * @return Whether this graph has the edge or not.
   */
  hasEdge(from: number, to: number): boolean {
    if (this.hasNode(from) && this.hasNode(to)) {
      const edges = this._edges.get(from);

      for (let i = 0, l = edges.length; i < l; i++) {
        const edge = edges[i];

        if (edge.to === to) {
          return true;
        }
      }

      return false;
    } else {
      return false;
    }
  }

  /**
   * Removes all nodes and edges from this graph.
   *
   * @return A reference to this graph.
   */
  clear(): Graph {
    this._nodes.clear();
    this._edges.clear();

    return this;
  }
}
