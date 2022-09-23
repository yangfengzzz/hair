import { Plane, Vector3 } from "oasis-engine";

/**
 * Class representing a plane in 3D space. The plane is specified in Hessian normal form.
 */
export class TPlane extends Plane {
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
}
