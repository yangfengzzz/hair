import { Vector3 } from "oasis-engine";
import { TPlane } from "./TPlane";
import { HalfEdge } from "./HalfEdge";

/**
 * Class for representing a planar polygon with an arbitrary amount of edges.
 */
export class Polygon {
  private _centroid = new Vector3();
  private _edge: HalfEdge = null;
  private _plane: TPlane = new TPlane();
}
