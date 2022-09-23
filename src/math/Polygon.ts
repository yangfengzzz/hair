import { Vector3 } from "oasis-engine";
import { TPlane } from "./TPlane";
import { HalfEdge } from "./HalfEdge";

/**
 * Class for representing a planar polygon with an arbitrary amount of edges.
 */
export class Polygon {
  /** @internal */
  centroid = new Vector3();
  /** @internal */
  edge: HalfEdge = null;
  /** @internal */
  plane: TPlane = new TPlane();
}
