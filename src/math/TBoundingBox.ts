import { BoundingBox, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

export class TBoundingBox extends BoundingBox {
  private static vector = new Vector3();
  private static center = new Vector3();
  private static size = new Vector3();

  /**
   * Ensures the given point is inside this AABB and stores
   * the result in the given vector.
   * @param point - A point in 3D space.
   * @param result - The result vector.
   * @return The result vector.
   */
  clampPoint(point: Vector3, result: TVector3): TVector3 {
    (<TVector3>result.copyFrom(point)).clamp(this.min, this.max);
    return result;
  }

  /**
   * Returns true if the given point is inside this AABB.
   * @param point - A point in 3D space.
   * @return The result of the contain test.
   */
  containsPoint(point: Vector3): boolean {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y ||
      point.z < this.min.z ||
      point.z > this.max.z
    );
  }

  /**
   * Expands this AABB by the given point. So after this method call,
   * the given point lies inside the AABB.
   * @param point - A point in 3D space.
   * @return A reference to this AABB.
   */
  expand(point: Vector3): TBoundingBox {
    const { min, max } = this;
    Vector3.min(min, point, min);
    Vector3.max(max, point, max);
    return this;
  }

  /**
   * Returns the normal for a given point on this AABB's surface.
   *
   * @param point - The point on the surface
   * @param result - The result vector.
   * @return The result vector.
   */
  getNormalFromSurfacePoint(point: Vector3, result: Vector3): Vector3 {
    // from https://www.gamedev.net/forums/topic/551816-finding-the-aabb-surface-normal-from-an-intersection-point-on-aabb/
    const { center, size, vector } = TBoundingBox;
    result.set(0, 0, 0);

    let distance;
    let minDistance = Number.MAX_VALUE;

    this.getCenter(center);
    this.getExtent(size);

    // transform point into local space of AABB
    vector.copyFrom(point);
    Vector3.subtract(vector, center, vector);

    // x-axis
    distance = Math.abs(size.x - Math.abs(vector.x));
    if (distance < minDistance) {
      minDistance = distance;
      result.set(Math.sign(vector.x), 0, 0);
    }

    // y-axis
    distance = Math.abs(size.y - Math.abs(vector.y));
    if (distance < minDistance) {
      minDistance = distance;
      result.set(0, Math.sign(vector.y), 0);
    }

    // z-axis
    distance = Math.abs(size.z - Math.abs(vector.z));
    if (distance < minDistance) {
      result.set(0, 0, Math.sign(vector.z));
    }

    return result;
  }
}
