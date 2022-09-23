import { CollisionUtil, Logger, Plane, Vector3 } from "oasis-engine";
import { TPlane } from "./TPlane";
import { HalfEdge } from "./HalfEdge";
import { TVector3 } from "./TVector3";
import { TMathUtil } from "./TMathUtil";

/**
 * Class for representing a planar polygon with an arbitrary amount of edges.
 */
export class Polygon {
  /** @internal */
  centroid = new TVector3();
  /** @internal */
  edge: HalfEdge = null;
  /** @internal */
  plane: TPlane = new TPlane();

  /**
   * Creates the polygon based on the given array of points in 3D space.
   * The method assumes the contour (the sequence of points) is defined
   * in CCW order.
   * @param points - The array of points.
   * @return A reference to this polygon.
   */
  fromContour(points: Vector3[]): Polygon {
    const edges: HalfEdge[] = [];

    if (points.length < 3) {
      Logger.error(
        "YUKA.Polygon: Unable to create polygon from contour. It needs at least three points."
      );
      return this;
    }

    for (let i = 0, l = points.length; i < l; i++) {
      const edge = new HalfEdge(points[i]);
      edges.push(edge);
    }

    // link edges
    for (let i = 0, l = edges.length; i < l; i++) {
      let current, prev, next;

      if (i === 0) {
        current = edges[i];
        prev = edges[l - 1];
        next = edges[i + 1];
      } else if (i === l - 1) {
        current = edges[i];
        prev = edges[i - 1];
        next = edges[0];
      } else {
        current = edges[i];
        prev = edges[i - 1];
        next = edges[i + 1];
      }

      current.prev = prev;
      current.next = next;
      current.polygon = this;
    }

    this.edge = edges[0];
    Plane.fromPoints(points[0], points[1], points[2], this.plane);
    return this;
  }

  /**
   * Computes the centroid for this polygon.
   *
   * @return {Polygon} A reference to this polygon.
   */
  computeCentroid(): Polygon {
    const centroid = this.centroid;
    let edge = this.edge;
    let count = 0;

    centroid.set(0, 0, 0);
    do {
      centroid.add(edge.vertex);
      count++;
      edge = edge.next;
    } while (edge !== this.edge);

    centroid.divideScalar(count);

    return this;
  }

  /**
   * Returns true if the polygon contains the given point.
   *
   * @param point - The point to test.
   * @param epsilon - A tolerance value.
   * @return Whether this polygon contain the given point or not.
   */
  contains(point: Vector3, epsilon: number = 1e-3): boolean {
    const plane = this.plane;
    let edge = this.edge;

    // convex test
    do {
      const v1 = edge.tail;
      const v2 = edge.head;

      if (TMathUtil.area(v1, v2, point) < 0) {
        return false;
      }

      edge = edge.next;
    } while (edge !== this.edge);

    // ensure the given point lies within a defined tolerance range
    const distance = CollisionUtil.distancePlaneAndPoint(plane, point);
    return Math.abs(distance) <= epsilon;
  }

  /**
   * Returns true if the polygon is convex.
   *
   * @param ccw - Whether the winding order is CCW or not.
   * @return Whether this polygon is convex or not.
   */
  convex(ccw: boolean = true): boolean {
    let edge = this.edge;

    do {
      const v1 = edge.tail;
      const v2 = edge.head;
      const v3 = edge.next.head;

      if (ccw) {
        if (TMathUtil.area(v1, v2, v3) < 0) return false;
      } else {
        if (TMathUtil.area(v3, v2, v1) < 0) return false;
      }

      edge = edge.next;
    } while (edge !== this.edge);

    return true;
  }

  /**
   * Returns true if the polygon is coplanar.
   *
   * @param epsilon - A tolerance value.
   * @return Whether this polygon is coplanar or not.
   */
  coplanar(epsilon: number = 1e-3): boolean {
    const plane = this.plane;
    let edge = this.edge;

    do {
      const distance = CollisionUtil.distancePlaneAndPoint(plane, edge.vertex);

      if (Math.abs(distance) > epsilon) {
        return false;
      }

      edge = edge.next;
    } while (edge !== this.edge);

    return true;
  }

  /**
   * Computes the signed distance from the given 3D vector to this polygon. The method
   * uses the polygon's plane abstraction in order to compute this value.
   *
   * @param point - A point in 3D space.
   * @return The signed distance from the given point to this polygon.
   */
  distanceToPoint(point: Vector3): number {
    return CollisionUtil.distancePlaneAndPoint(this.plane, point);
  }

  /**
   * Determines the contour (sequence of points) of this polygon and
   * stores the result in the given array.
   *
   * @param result - The result array.
   * @return The result array.
   */
  getContour(result: Vector3[]): Vector3[] {
    let edge = this.edge;

    result.length = 0;
    do {
      result.push(edge.vertex);

      edge = edge.next;
    } while (edge !== this.edge);

    return result;
  }
}
