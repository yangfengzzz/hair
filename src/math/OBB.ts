import {
  BoundingBox,
  BoundingSphere,
  MathUtil,
  Plane,
  Vector3,
} from "oasis-engine";
import { TVector3 } from "./TVector3";
import { TMatrix3x3 } from "./TMatrix3x3";
import { ConvexHull } from "./ConvexHull";
import { HalfEdge } from "./HalfEdge";

export class OBB {
  private static xAxis = new TVector3();
  private static yAxis = new TVector3();
  private static zAxis = new TVector3();
  private static v1 = new TVector3();
  private static closestPoint = new Vector3();
  private static unitary = new TMatrix3x3();
  private static diagonal = new TMatrix3x3();
  private static a: { c: Vector3; u: Array<TVector3>; e: number[] } = {
    c: null, // center
    u: [new TVector3(), new TVector3(), new TVector3()], // basis vectors
    e: [0, 0, 0], // half width
  };
  private static b: { c: Vector3; u: Array<TVector3>; e: number[] } = {
    c: null, // center
    u: [new TVector3(), new TVector3(), new TVector3()], // basis vectors
    e: [0, 0, 0], // half width
  };
  private static R = [[], [], []];
  private static AbsR = [[], [], []];
  private static t = [];

  /**
   * The center of this OBB.
   */
  center: Vector3;

  /**
   * The half sizes of the OBB (defines its width, height and depth).
   */
  halfSizes: TVector3;

  /**
   * The rotation of this OBB.
   */
  rotation: TMatrix3x3;

  /**
   * Constructs a new OBB with the given values.
   *
   * @param center - The center of this OBB.
   * @param halfSizes - The half sizes of the OBB (defines its width, height and depth).
   * @param rotation - The rotation of this OBB.
   */
  constructor(
    center: Vector3 = new Vector3(),
    halfSizes: TVector3 = new TVector3(),
    rotation: TMatrix3x3 = new TMatrix3x3()
  ) {
    this.center = center;
    this.halfSizes = halfSizes;
    this.rotation = rotation;
  }

  /**
   * Computes the size (width, height, depth) of this OBB and stores it into the given vector.
   *
   * @param {Vector3} result - The result vector.
   * @return {Vector3} The result vector.
   */
  getSize(result: TVector3): TVector3 {
    return (<TVector3>result.copyFrom(this.halfSizes)).multiplyScalar(2);
  }

  /**
   * Ensures the given point is inside this OBB and stores
   * the result in the given vector.
   *
   * Reference: Closest Point on OBB to Point in Real-Time Collision Detection
   * by Christer Ericson (chapter 5.1.4)
   *
   * @param point - A point in 3D space.
   * @param result - The result vector.
   * @return The result vector.
   */
  clampPoint(point: Vector3, result: Vector3): Vector3 {
    const { v1, xAxis, yAxis, zAxis } = OBB;
    const halfSizes = this.halfSizes;

    Vector3.subtract(point, this.center, v1);
    this.rotation.extractBasis(xAxis, yAxis, zAxis);

    // start at the center position of the OBB
    result.copyFrom(this.center);

    // project the target onto the OBB axes and walk towards that point
    const x = MathUtil.clamp(v1.dot(xAxis), -halfSizes.x, halfSizes.x);
    result.add(xAxis.multiplyScalar(x));
    const y = MathUtil.clamp(v1.dot(yAxis), -halfSizes.y, halfSizes.y);
    result.add(yAxis.multiplyScalar(y));
    const z = MathUtil.clamp(v1.dot(zAxis), -halfSizes.z, halfSizes.z);
    result.add(zAxis.multiplyScalar(z));

    return result;
  }

  /**
   * Returns true if the given point is inside this OBB.
   *
   * @param {Vector3} point - A point in 3D space.
   * @return {Boolean} Whether the given point is inside this OBB or not.
   */
  containsPoint(point: Vector3): boolean {
    const { v1, xAxis, yAxis, zAxis } = OBB;
    Vector3.subtract(point, this.center, v1);
    this.rotation.extractBasis(xAxis, yAxis, zAxis);

    // project v1 onto each axis and check if these points lie inside the OBB
    return (
      Math.abs(v1.dot(xAxis)) <= this.halfSizes.x &&
      Math.abs(v1.dot(yAxis)) <= this.halfSizes.y &&
      Math.abs(v1.dot(zAxis)) <= this.halfSizes.z
    );
  }

  /**
   * Returns true if the given AABB intersects this OBB.
   *
   * @param aabb - The AABB to test.
   * @return The result of the intersection test.
   */
  intersectsAABB(aabb: BoundingBox): boolean {
    return this.intersectsOBB(this.fromAABB(aabb));
  }

  /**
   * Returns true if the given bounding sphere intersects this OBB.
   *
   * @param sphere - The bounding sphere to test.
   * @return The result of the intersection test.
   */
  intersectsBoundingSphere(sphere: BoundingSphere): boolean {
    // find the point on the OBB closest to the sphere center

    this.clampPoint(sphere.center, OBB.closestPoint);

    // if that point is inside the sphere, the OBB and sphere intersect

    return (
      Vector3.distanceSquared(OBB.closestPoint, sphere.center) <=
      sphere.radius * sphere.radius
    );
  }

  /**
   * Returns true if the given OBB intersects this OBB.
   *
   * Reference: OBB-OBB Intersection in Real-Time Collision Detection
   * by Christer Ericson (chapter 4.4.1)
   *
   * @param obb - The OBB to test.
   * @param epsilon - The epsilon (tolerance) value.
   * @return The result of the intersection test.
   */
  intersectsOBB(obb: OBB, epsilon: number = Number.EPSILON): boolean {
    const { a, b, v1, R, AbsR, t } = OBB;
    // prepare data structures (the code uses the same nomenclature as the reference)

    a.c = this.center;
    a.e[0] = this.halfSizes.x;
    a.e[1] = this.halfSizes.y;
    a.e[2] = this.halfSizes.z;
    this.rotation.extractBasis(a.u[0], a.u[1], a.u[2]);

    b.c = obb.center;
    b.e[0] = obb.halfSizes.x;
    b.e[1] = obb.halfSizes.y;
    b.e[2] = obb.halfSizes.z;
    obb.rotation.extractBasis(b.u[0], b.u[1], b.u[2]);

    // compute rotation matrix expressing b in a’s coordinate frame
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        R[i][j] = a.u[i].dot(b.u[j]);
      }
    }

    // compute translation vector
    Vector3.subtract(b.c, a.c, v1);

    // bring translation into a’s coordinate frame
    t[0] = v1.dot(a.u[0]);
    t[1] = v1.dot(a.u[1]);
    t[2] = v1.dot(a.u[2]);

    // compute common subexpressions. Add in an epsilon term to
    // counteract arithmetic errors when two edges are parallel and
    // their cross product is (near) null
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        AbsR[i][j] = Math.abs(R[i][j]) + epsilon;
      }
    }

    let ra: number, rb: number;

    // test axes L = A0, L = A1, L = A2
    for (let i = 0; i < 3; i++) {
      ra = a.e[i];
      rb = b.e[0] * AbsR[i][0] + b.e[1] * AbsR[i][1] + b.e[2] * AbsR[i][2];
      if (Math.abs(t[i]) > ra + rb) return false;
    }

    // test axes L = B0, L = B1, L = B2
    for (let i = 0; i < 3; i++) {
      ra = a.e[0] * AbsR[0][i] + a.e[1] * AbsR[1][i] + a.e[2] * AbsR[2][i];
      rb = b.e[i];
      if (Math.abs(t[0] * R[0][i] + t[1] * R[1][i] + t[2] * R[2][i]) > ra + rb)
        return false;
    }

    // test axis L = A0 x B0
    ra = a.e[1] * AbsR[2][0] + a.e[2] * AbsR[1][0];
    rb = b.e[1] * AbsR[0][2] + b.e[2] * AbsR[0][1];
    if (Math.abs(t[2] * R[1][0] - t[1] * R[2][0]) > ra + rb) return false;

    // test axis L = A0 x B1
    ra = a.e[1] * AbsR[2][1] + a.e[2] * AbsR[1][1];
    rb = b.e[0] * AbsR[0][2] + b.e[2] * AbsR[0][0];
    if (Math.abs(t[2] * R[1][1] - t[1] * R[2][1]) > ra + rb) return false;

    // test axis L = A0 x B2
    ra = a.e[1] * AbsR[2][2] + a.e[2] * AbsR[1][2];
    rb = b.e[0] * AbsR[0][1] + b.e[1] * AbsR[0][0];
    if (Math.abs(t[2] * R[1][2] - t[1] * R[2][2]) > ra + rb) return false;

    // test axis L = A1 x B0
    ra = a.e[0] * AbsR[2][0] + a.e[2] * AbsR[0][0];
    rb = b.e[1] * AbsR[1][2] + b.e[2] * AbsR[1][1];
    if (Math.abs(t[0] * R[2][0] - t[2] * R[0][0]) > ra + rb) return false;

    // test axis L = A1 x B1
    ra = a.e[0] * AbsR[2][1] + a.e[2] * AbsR[0][1];
    rb = b.e[0] * AbsR[1][2] + b.e[2] * AbsR[1][0];
    if (Math.abs(t[0] * R[2][1] - t[2] * R[0][1]) > ra + rb) return false;

    // test axis L = A1 x B2
    ra = a.e[0] * AbsR[2][2] + a.e[2] * AbsR[0][2];
    rb = b.e[0] * AbsR[1][1] + b.e[1] * AbsR[1][0];
    if (Math.abs(t[0] * R[2][2] - t[2] * R[0][2]) > ra + rb) return false;

    // test axis L = A2 x B0
    ra = a.e[0] * AbsR[1][0] + a.e[1] * AbsR[0][0];
    rb = b.e[1] * AbsR[2][2] + b.e[2] * AbsR[2][1];
    if (Math.abs(t[1] * R[0][0] - t[0] * R[1][0]) > ra + rb) return false;

    // test axis L = A2 x B1
    ra = a.e[0] * AbsR[1][1] + a.e[1] * AbsR[0][1];
    rb = b.e[0] * AbsR[2][2] + b.e[2] * AbsR[2][0];
    if (Math.abs(t[1] * R[0][1] - t[0] * R[1][1]) > ra + rb) return false;

    // test axis L = A2 x B2
    ra = a.e[0] * AbsR[1][2] + a.e[1] * AbsR[0][2];
    rb = b.e[0] * AbsR[2][1] + b.e[1] * AbsR[2][0];
    if (Math.abs(t[1] * R[0][2] - t[0] * R[1][2]) > ra + rb) return false;

    // since no separating axis is found, the OBBs must be intersecting
    return true;
  }

  /**
   * Returns true if the given plane intersects this OBB.
   *
   * Reference: Testing Box Against Plane in Real-Time Collision Detection
   * by Christer Ericson (chapter 5.2.3)
   *
   * @param plane - The plane to test.
   * @return The result of the intersection test.
   */
  intersectsPlane(plane: Plane): boolean {
    const { xAxis, yAxis, zAxis } = OBB;
    this.rotation.extractBasis(xAxis, yAxis, zAxis);

    // compute the projection interval radius of this OBB onto L(t) = this->center + t * p.normal;
    const r =
      this.halfSizes.x * Math.abs(Vector3.dot(plane.normal, xAxis)) +
      this.halfSizes.y * Math.abs(Vector3.dot(plane.normal, yAxis)) +
      this.halfSizes.z * Math.abs(Vector3.dot(plane.normal, zAxis));

    // compute distance of the OBB's center from the plane
    const d = Vector3.dot(plane.normal, this.center) - plane.distance;

    // Intersection occurs when distance d falls within [-r,+r] interval
    return Math.abs(d) <= r;
  }

  /**
   * Computes the OBB from an AABB.
   *
   * @param aabb - The AABB.
   * @return A reference to this OBB.
   */
  fromAABB(aabb: BoundingBox): OBB {
    aabb.getCenter(this.center);
    (<TVector3>aabb.getExtent(this.halfSizes)).multiplyScalar(0.5);
    this.rotation.identity();
    return this;
  }

  /**
   * Computes the minimum enclosing OBB for the given set of points. The method is an
   * implementation of {@link http://gamma.cs.unc.edu/users/gottschalk/main.pdf Collision Queries using Oriented Bounding Boxes}
   * by Stefan Gottschalk.
   * According to the dissertation, the quality of the fitting process varies from
   * the respective input. This method uses the best approach by computing the
   * covariance matrix based on the triangles of the convex hull (chapter 3.4.3).
   *
   * However, the implementation is susceptible to {@link https://en.wikipedia.org/wiki/Regular_polygon regular polygons}
   * like cubes or spheres. For such shapes, it's recommended to verify the quality
   * of the produced OBB. Consider to use an AABB or bounding sphere if the result
   * is not satisfying.
   *
   * @param points - An array of 3D vectors representing points in 3D space.
   * @return A reference to this OBB.
   */
  fromPoints(points: Vector3[]): OBB {
    const convexHull = new ConvexHull().fromPoints(points);

    // 1. iterate over all faces of the convex hull and triangulate
    const faces = convexHull.faces;
    const edges: HalfEdge[] = [];
    const triangles: number[] = [];

    for (let i = 0, il = faces.length; i < il; i++) {
      const face = faces[i];
      let edge = face.edge;

      edges.length = 0;

      // gather edges
      do {
        edges.push(edge);

        edge = edge.next;
      } while (edge !== face.edge);

      // triangulate
      const triangleCount = edges.length - 2;
      for (let j = 1, jl = triangleCount; j <= jl; j++) {
        const v1 = edges[0].vertex;
        const v2 = edges[j].vertex;
        const v3 = edges[j + 1].vertex;

        triangles.push(v1.x, v1.y, v1.z);
        triangles.push(v2.x, v2.y, v2.z);
        triangles.push(v3.x, v3.y, v3.z);
      }
    }

    // 2. build covariance matrix
    const p = new Vector3();
    const q = new Vector3();
    const r = new Vector3();

    const qp = new Vector3();
    const rp = new Vector3();

    const v = new TVector3();
    const mean = new TVector3();
    const weightedMean = new TVector3();
    let areaSum = 0;

    let cxx: number,
      cxy: number,
      cxz: number,
      cyy: number,
      cyz: number,
      czz: number;
    cxx = cxy = cxz = cyy = cyz = czz = 0;

    for (let i = 0, l = triangles.length; i < l; i += 9) {
      p.copyFromArray(triangles, i);
      q.copyFromArray(triangles, i + 3);
      r.copyFromArray(triangles, i + 6);

      mean.set(0, 0, 0);
      (<TVector3>mean.add(p).add(q).add(r)).divideScalar(3);

      Vector3.subtract(q, p, qp);
      Vector3.subtract(r, p, rp);
      Vector3.cross(qp, rp, v);
      const area = v.length() / 2; // .length() represents the frobenius norm here
      weightedMean.add((<TVector3>v.copyFrom(mean)).multiplyScalar(area));

      areaSum += area;

      cxx +=
        (9.0 * mean.x * mean.x + p.x * p.x + q.x * q.x + r.x * r.x) *
        (area / 12);
      cxy +=
        (9.0 * mean.x * mean.y + p.x * p.y + q.x * q.y + r.x * r.y) *
        (area / 12);
      cxz +=
        (9.0 * mean.x * mean.z + p.x * p.z + q.x * q.z + r.x * r.z) *
        (area / 12);
      cyy +=
        (9.0 * mean.y * mean.y + p.y * p.y + q.y * q.y + r.y * r.y) *
        (area / 12);
      cyz +=
        (9.0 * mean.y * mean.z + p.y * p.z + q.y * q.z + r.y * r.z) *
        (area / 12);
      czz +=
        (9.0 * mean.z * mean.z + p.z * p.z + q.z * q.z + r.z * r.z) *
        (area / 12);
    }

    weightedMean.divideScalar(areaSum);

    cxx /= areaSum;
    cxy /= areaSum;
    cxz /= areaSum;
    cyy /= areaSum;
    cyz /= areaSum;
    czz /= areaSum;

    cxx -= weightedMean.x * weightedMean.x;
    cxy -= weightedMean.x * weightedMean.y;
    cxz -= weightedMean.x * weightedMean.z;
    cyy -= weightedMean.y * weightedMean.y;
    cyz -= weightedMean.y * weightedMean.z;
    czz -= weightedMean.z * weightedMean.z;

    const covarianceMatrix = new TMatrix3x3();

    covarianceMatrix.elements[0] = cxx;
    covarianceMatrix.elements[1] = cxy;
    covarianceMatrix.elements[2] = cxz;
    covarianceMatrix.elements[3] = cxy;
    covarianceMatrix.elements[4] = cyy;
    covarianceMatrix.elements[5] = cyz;
    covarianceMatrix.elements[6] = cxz;
    covarianceMatrix.elements[7] = cyz;
    covarianceMatrix.elements[8] = czz;

    // 3. compute rotation, center and half sizes
    covarianceMatrix.eigenDecomposition(OBB.unitary, OBB.diagonal);
    const unitary = OBB.unitary;

    const v1 = new TVector3();
    const v2 = new TVector3();
    const v3 = new TVector3();

    unitary.extractBasis(v1, v2, v3);

    let u1 = -Number.MAX_VALUE;
    let u2 = -Number.MAX_VALUE;
    let u3 = -Number.MAX_VALUE;
    let l1 = Number.MAX_VALUE;
    let l2 = Number.MAX_VALUE;
    let l3 = Number.MAX_VALUE;

    for (let i = 0, l = points.length; i < l; i++) {
      const p = points[i];

      u1 = Math.max(v1.dot(p), u1);
      u2 = Math.max(v2.dot(p), u2);
      u3 = Math.max(v3.dot(p), u3);

      l1 = Math.min(v1.dot(p), l1);
      l2 = Math.min(v2.dot(p), l2);
      l3 = Math.min(v3.dot(p), l3);
    }

    v1.multiplyScalar(0.5 * (l1 + u1));
    v2.multiplyScalar(0.5 * (l2 + u2));
    v3.multiplyScalar(0.5 * (l3 + u3));

    // center
    this.center.add(v1).add(v2).add(v3);

    this.halfSizes.x = u1 - l1;
    this.halfSizes.y = u2 - l2;
    this.halfSizes.z = u3 - l3;

    // halfSizes
    this.halfSizes.multiplyScalar(0.5);

    // rotation
    this.rotation.copyFrom(unitary);
    return this;
  }
}
