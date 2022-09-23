import { CollisionUtil, Plane, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

/**
 * Class representing a plane in 3D space. The plane is specified in Hessian normal form.
 */
export class TPlane extends Plane {
  private static v1 = new TVector3();
  private static v2 = new Vector3();
  private static d = new Vector3();

  /**
   * Sets the values of the plane from the given normal vector and a coplanar point.
   *
   * @param normal - A normalized vector.
   * @param point - A coplanar point.
   * @return A reference to this plane.
   */
  fromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): Plane {
    this.normal.copyFrom(normal);
    this.distance = -Vector3.dot(point, this.normal);
    return this;
  }

  /**
   * Projects the given point onto the plane. The result is written
   * to the given vector.
   * @param point - The point to project onto the plane.
   * @param result - The projected point.
   * @return The projected point.
   */
  projectPoint(point: Vector3, result: Vector3): Vector3 {
    (<TVector3>TPlane.v1.copyFrom(this.normal)).multiplyScalar(
      CollisionUtil.distancePlaneAndPoint(this, point)
    );

    Vector3.subtract(point, TPlane.v1, result);
    return result;
  }

  /**
   * Performs a plane/plane intersection test and stores the intersection point
   * to the given 3D vector. If no intersection is detected, *null* is returned.
   *
   * Reference: Intersection of Two Planes in Real-Time Collision Detection
   * by Christer Ericson (chapter 5.4.4)
   *
   * @param plane - The plane to test.
   * @param result - The result vector.
   * @return The result vector.
   */
  intersectPlane(plane: Plane, result: TVector3): TVector3 {
    const { v1, v2, d } = TPlane;
    // compute direction of intersection line
    Vector3.cross(this.normal, plane.normal, d);

    // if d is zero, the planes are parallel (and separated)
    // or coincident, so they’re not considered intersecting
    const denom = TPlane.d.lengthSquared();
    if (denom === 0) return null;

    // compute point on intersection line
    (<TVector3>v1.copyFrom(plane.normal)).multiplyScalar(this.distance);
    (<TVector3>v2.copyFrom(this.normal)).multiplyScalar(plane.distance);

    Vector3.subtract(v1, v2, v1);
    Vector3.cross(v1, d, result);
    return result.divideScalar(denom);
  }

  /**
   * Returns true if the given plane intersects this plane.
   *
   * @param {Plane} plane - The plane to test.
   * @return {Boolean} The result of the intersection test.
   */
  intersectsPlane(plane: Plane): boolean {
    const d = Vector3.dot(this.normal, plane.normal);
    return Math.abs(d) !== 1;
  }
}
