import { Vector3 } from "oasis-engine";
import { Polygon } from "./Polygon";
import { HalfEdge } from "./HalfEdge";

/**
 * Base class for polyhedra. It is primarily designed for the internal usage in Yuka.
 * Objects of this class are always build up from faces. The edges, vertices and
 * the polyhedron's centroid have to be derived from a valid face definition with the
 * respective methods.
 */
export class Polyhedron {
  /** @internal */
  faces: Polygon[] = [];
  /** @internal */
  edges: HalfEdge[] = [];
  /** @internal */
  vertices: Vector3[] = [];
  /** @internal */
  centroid = new Vector3();
}
