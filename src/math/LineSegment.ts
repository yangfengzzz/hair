import { MathUtil, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

export class LineSegment {
  private static p1 = new Vector3();
  private static p2 = new Vector3();

  /**
   * The start point of the line segment.
   */
  from: Vector3;

  /**
   * The end point of the line segment.
   */
  to: Vector3;

  /**
   * Constructs a new line segment with the given values.
   * @param from - The start point of the line segment.
   * @param to - The end point of the line segment.
   */
  constructor(from: Vector3 = new Vector3(), to: Vector3 = new Vector3()) {
    this.from = from;
    this.to = to;
  }

  /**
   * Computes the difference vector between the end and start point of this
   * line segment and stores the result in the given vector.
   *
   * @param result - The result vector.
   * @return The result vector.
   */
  delta(result: Vector3): Vector3 {
    Vector3.subtract(this.to, this.from, result);
    return result;
  }

  /**
   * Computes a position on the line segment according to the given t value
   * and stores the result in the given 3D vector. The t value has usually a range of
   * [0, 1] where 0 means start position and 1 the end position.
   *
   * @param t - A scalar value representing a position on the line segment.
   * @param result - The result vector.
   * @return The result vector.
   */
  at(t: number, result: TVector3): TVector3 {
    return <TVector3>(
      (<TVector3>this.delta(result)).multiplyScalar(t).add(this.from)
    );
  }

  /**
   * Computes the closest point on an infinite line defined by the line segment.
   * It's possible to clamp the closest point so it does not exceed the start and
   * end position of the line segment.
   *
   * @param {Vector3} point - A point in 3D space.
   * @param {Boolean} clampToLine - Indicates if the results should be clamped.
   * @param {Vector3} result - The result vector.
   * @return {Vector3} The closest point.
   */
  closestPointToPoint(
    point: Vector3,
    clampToLine: boolean,
    result: TVector3
  ): TVector3 {
    const t = this.closestPointToPointParameter(point, clampToLine);
    return this.at(t, result);
  }

  /**
   * Computes a scalar value which represents the closest point on an infinite line
   * defined by the line segment. It's possible to clamp this value so it does not
   * exceed the start and end position of the line segment.
   *
   * @param point - A point in 3D space.
   * @param clampToLine - Indicates if the results should be clamped.
   * @return A scalar representing the closest point.
   */
  closestPointToPointParameter(
    point: Vector3,
    clampToLine: boolean = true
  ): number {
    const { p1, p2 } = LineSegment;
    Vector3.subtract(point, this.from, p1);
    Vector3.subtract(this.to, this.from, p2);

    const dotP2P2 = Vector3.dot(p2, p2);
    const dotP2P1 = Vector3.dot(p2, p1);

    let t = dotP2P1 / dotP2P2;

    if (clampToLine) t = MathUtil.clamp(t, 0, 1);

    return t;
  }
}
