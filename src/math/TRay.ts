import { Ray, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";
import { BVH } from "./BVH";
import { Triangle } from "./Triangle";

/**
 * Class representing a ray in 3D space.
 */
export class TRay extends Ray {
  private static v1 = new Vector3();
  private static edge1 = new Vector3();
  private static edge2 = new Vector3();
  private static normal = new Vector3();

  /**
   * Computes a position on the ray according to the given t value
   * and stores the result in the given 3D vector. The t value has a range of
   * [0, Number.MAX_VALUE] where 0 means the position is equal with the origin of the ray.
   *
   * @param {Number} t - A scalar value representing a position on the ray.
   * @param {Vector3} result - The result vector.
   * @return {Vector3} The result vector.
   */
  at(t: number, result: TVector3): TVector3 {
    // t has to be zero or positive
    (<TVector3>result.copyFrom(this.direction)).multiplyScalar(t);
    Vector3.add(result, this.origin, result);
    return result;
  }

  /**
   * Performs a ray/triangle intersection test and stores the intersection point
   * to the given 3D vector. If no intersection is detected, *null* is returned.
   *
   * @param triangle - A triangle.
   * @param backfaceCulling - Whether back face culling is active or not.
   * @param result - The result vector.
   * @return The result vector.
   */
  intersectTriangle(
    triangle: Triangle,
    backfaceCulling: boolean,
    result: TVector3
  ): TVector3 {
    // reference: https://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
    const { edge1, edge2, normal, v1 } = TRay;
    const a = triangle.a;
    const b = triangle.b;
    const c = triangle.c;

    Vector3.subtract(b, a, edge1);
    Vector3.subtract(c, a, edge2);
    Vector3.cross(edge1, edge2, normal);

    let DdN = Vector3.dot(this.direction, normal);
    let sign;

    if (DdN > 0) {
      if (backfaceCulling) return null;
      sign = 1;
    } else if (DdN < 0) {
      sign = -1;
      DdN = -DdN;
    } else {
      return null;
    }

    Vector3.subtract(this.origin, a, v1);
    Vector3.cross(v1, edge2, edge2);
    const DdQxE2 = sign * Vector3.dot(this.direction, edge2);

    // b1 < 0, no intersection
    if (DdQxE2 < 0) {
      return null;
    }

    Vector3.cross(edge1, v1, edge1);
    const DdE1xQ = sign * Vector3.dot(this.direction, edge1);

    // b2 < 0, no intersection
    if (DdE1xQ < 0) {
      return null;
    }

    // b1 + b2 > 1, no intersection
    if (DdQxE2 + DdE1xQ > DdN) {
      return null;
    }

    // line intersects triangle, check if ray does
    const QdN = -sign * Vector3.dot(v1, normal);

    // t < 0, no intersection
    if (QdN < 0) {
      return null;
    }

    // ray intersects triangle
    return this.at(QdN / DdN, result);
  }

  /**
   * Performs a ray/BVH intersection test and stores the intersection point
   * to the given 3D vector. If no intersection is detected, *null* is returned.
   *
   * @param {BVH} bvh - A BVH.
   * @param {Vector3} result - The result vector.
   * @return {Vector3} The result vector.
   */
  intersectBVH(bvh: BVH, result: TVector3): TVector3 {
    return bvh.root.intersectRay(this, result);
  }

  /**
   * Performs a ray/BVH intersection test. Returns either true or false if
   * there is an intersection or not.
   *
   * @param {BVH} bvh - A BVH.
   * @return {boolean} Whether there is an intersection or not.
   */
  intersectsBVH(bvh: BVH): boolean {
    return bvh.root.intersectsRay(this);
  }
}
