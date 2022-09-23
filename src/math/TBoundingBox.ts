import { BoundingBox, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

class TBoundingBox extends BoundingBox {
  /**
   * Ensures the given point is inside this AABB and stores
   * the result in the given vector.
   * @param point - A point in 3D space.
   * @param result - The result vector.
   * @return The result vector.
   */
  clampPoint(point: Vector3, result: TVector3) {
    (<TVector3>result.copyFrom(point)).clamp(this.min, this.max);
    return result;
  }
}
