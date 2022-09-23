import { Polyhedron } from "./Polyhedron";
import { Vector3 } from "oasis-engine";

/**
 * Class representing a convex hull. This is an implementation of the Quickhull algorithm
 * based on the presentation {@link http://media.steampowered.com/apps/valve/2014/DirkGregorius_ImplementingQuickHull.pdf Implementing QuickHull}
 * by Dirk Gregorius (Valve Software) from GDC 2014. The algorithm has an average runtime
 * complexity of O(nlog(n)), whereas in the worst case it takes O(n²).
 */
export class ConvexHull extends Polyhedron {
  private _mergeFaces: boolean = true;
  private _tolerance = -1;
  private _assigned = new VertexList();
  private _unassigned = new VertexList();
}

class Vertex {
  point: Vector3;
  prev = null;
  next = null;
  face = null; // the face that is able to see this vertex
  constructor(point: Vector3 = new Vector3()) {
    this.point = point;
  }
}

class VertexList {
  head = null;
  tail = null;
}
