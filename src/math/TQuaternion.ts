import { MathUtil, Quaternion } from "oasis-engine";

/**
 * Class representing a quaternion.
 */
export class TQuaternion extends Quaternion {
  /**
   * Computes the shortest angle between two rotation defined by this quaternion and the given one.
   *
   * @param q - The given quaternion.
   * @return The angle in radians.
   */
  angleTo(q: Quaternion): number {
    return 2 * Math.acos(Math.abs(MathUtil.clamp(this.dot(q), -1, 1)));
  }

  /**
   * Transforms this rotation defined by this quaternion towards the target rotation
   * defined by the given quaternion by the given angular step. The rotation will not overshoot.
   *
   * @param q - The target rotation.
   * @param step - The maximum step in radians.
   * @param tolerance - A tolerance value in radians to tweak the result
   * when both rotations are considered to be equal.
   * @return Whether the given quaternion already represents the target rotation.
   */
  rotateTo(q: Quaternion, step: number, tolerance: number = 0.0001): boolean {
    const angle = this.angleTo(q);
    if (angle < tolerance) return true;
    const t = Math.min(1, step / angle);
    Quaternion.slerp(this, q, t, this);
    return false;
  }
}
