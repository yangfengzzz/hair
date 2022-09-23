import { BoundingSphere, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

export class TBoundingSphere extends BoundingSphere {
  /**
   * Ensures the given point is inside this bounding sphere and stores
   * the result in the given vector.
   * @param point - A point in 3D space.
   * @param result - The result vector.
   * @return The result vector.
   */
  clampPoint(point: Vector3, result: TVector3): TVector3 {
    result.copyFrom(point);
    const { center, radius } = this;
    const squaredDistance = Vector3.distanceSquared(center, point);
    if (squaredDistance > radius * radius) {
      Vector3.subtract(result, center, result);
      result.normalize();
      result.multiplyScalar(radius).add(center);
    }

    return result;
  }

  /**
   * Returns true if the given point is inside this bounding sphere.
   *
   * @param point - A point in 3D space.
   * @return The result of the containments test.
   */
  containsPoint(point: Vector3): boolean {
    return (
      Vector3.distanceSquared(point, this.center) <= this.radius * this.radius
    );
  }

  /**
   * Returns the normal for a given point on this bounding sphere's surface.
   *
   * @param point - The point on the surface
   * @param result - The result vector.
   * @return The result vector.
   */
  getNormalFromSurfacePoint(point: Vector3, result: Vector3): Vector3 {
    Vector3.subtract(point, this.center, result);
    return result.normalize();
  }
}
