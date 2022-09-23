import { Vector3 } from "oasis-engine";
import { Polygon } from "./Polygon";

/**
 * Implementation of a half-edge data structure, also known as
 * {@link https://en.wikipedia.org/wiki/Doubly_connected_edge_list Doubly connected edge list}.
 */
export class HalfEdge {
  private readonly _vertex: Vector3;
  private _prev: HalfEdge = null;
  private _twin: HalfEdge = null;

  /**
   * A reference to the next half-edge.
   */
  next: HalfEdge = null;

  /**
   * A reference to its polygon/face.
   */
  polygon: Polygon = null;

  get vertex(): Vector3 {
    return this._vertex;
  }

  get prev(): HalfEdge {
    return this._prev;
  }

  get twin(): HalfEdge {
    return this._twin;
  }

  /**
   * Returns the tail of this half-edge. That's a reference to the previous
   * half-edge vertex.
   * @return The tail vertex.
   */
  get tail(): Vector3 {
    return this._prev ? this._prev._vertex : null;
  }

  /**
   * Returns the head of this half-edge. That's a reference to the own vertex.
   * @return The head vertex.
   */
  get head(): Vector3 {
    return this._vertex;
  }

  /**
   * Constructs a new half-edge.
   * @param vertex - The vertex of this half-edge. It represents the head/destination of the respective full edge.
   */
  constructor(vertex: Vector3 = new Vector3()) {
    this._vertex = vertex;
  }

  /**
   * Computes the length of this half-edge.
   * @return The length of this half-edge.
   */
  length(): number {
    const tail = this.tail;
    const head = this.head;
    if (tail !== null) {
      return Vector3.distance(tail, head);
    }
    return -1;
  }

  /**
   * Computes the squared length of this half-edge.
   *
   * @return The squared length of this half-edge.
   */
  lengthSquared(): number {
    const tail = this.tail;
    const head = this.head;
    if (tail !== null) {
      return Vector3.distanceSquared(tail, head);
    }
    return -1;
  }

  /**
   * Links the given opponent half edge with this one.
   * @param edge - The opponent edge to link.
   * @return A reference to this half edge.
   */
  linkOpponent(edge: HalfEdge): HalfEdge {
    this._twin = edge;
    edge._twin = this;

    return this;
  }

  /**
   * Computes the direction of this half edge. The method assumes the half edge
   * has a valid reference to a previous half edge.
   * @param result - The result vector.
   * @return The result vector.
   */
  getDirection(result: Vector3): Vector3 {
    Vector3.subtract(this._vertex, this._prev._vertex, result);
    return result.normalize();
  }
}
