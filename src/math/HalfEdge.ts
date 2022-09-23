import { Vector3 } from "oasis-engine";
import { Polygon } from "./Polygon";

/**
 * Implementation of a half-edge data structure, also known as
 * {@link https://en.wikipedia.org/wiki/Doubly_connected_edge_list Doubly connected edge list}.
 */
export class HalfEdge {
  private _vertex: Vector3;
  private _next: HalfEdge = null;
  private _prev: HalfEdge = null;
  private _twin: HalfEdge = null;
  private _polygon: Polygon = null;

  /**
   * Constructs a new half-edge.
   * @param vertex - The vertex of this half-edge. It represents the head/destination of the respective full edge.
   */
  constructor(vertex: Vector3 = new Vector3()) {
    this._vertex = vertex;
  }
}
