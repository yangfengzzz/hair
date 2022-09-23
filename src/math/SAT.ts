import { Polyhedron } from "./Polyhedron";
import { CollisionUtil, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";
import { HalfEdge } from "./HalfEdge";

/**
 * Implementation of the separating axis theorem (SAT). Used to detect intersections
 * between convex polyhedra. The code is based on the presentation
 * {@link http://twvideo01.ubm-us.net/o1/vault/gdc2013/slides/822403Gregorius_Dirk_TheSeparatingAxisTest.pdf The Separating Axis Test between convex polyhedra}
 * by Dirk Gregorius (Valve Software) from GDC 2013.
 */
export class SAT {
  private static normal = new TVector3();
  private static oppositeNormal = new TVector3();
  private static directionA = new Vector3();
  private static directionB = new Vector3();

  private static c = new TVector3();
  private static d = new TVector3();
  private static v = new Vector3();

  /**
   * Returns true if the given convex polyhedra intersect. A polyhedron is just
   * an array of {@link Polygon} objects.
   *
   * @param polyhedronA - The first convex polyhedron.
   * @param polyhedronB - The second convex polyhedron.
   * @return Whether there is an intersection or not.
   */
  static intersects(polyhedronA: Polyhedron, polyhedronB: Polyhedron): boolean {
    const resultAB = this._checkFaceDirections(polyhedronA, polyhedronB);

    if (resultAB) return false;

    const resultBA = this._checkFaceDirections(polyhedronB, polyhedronA);

    if (resultBA) return false;

    const resultEdges = this._checkEdgeDirections(polyhedronA, polyhedronB);

    if (resultEdges) return false;

    // no separating axis found, the polyhedra must intersect

    return true;
  }

  // check possible separating axes from the first given polyhedron. the axes
  // are derived from the respective face normals
  private static _checkFaceDirections(
    polyhedronA: Polyhedron,
    polyhedronB: Polyhedron
  ): boolean {
    const oppositeNormal = SAT.oppositeNormal;
    const faces = polyhedronA.faces;

    for (let i = 0, l = faces.length; i < l; i++) {
      const face = faces[i];
      const plane = face.plane;

      (<TVector3>oppositeNormal.copyFrom(plane.normal)).multiplyScalar(-1);

      const supportVertex = this._getSupportVertex(polyhedronB, oppositeNormal);
      const distance = CollisionUtil.distancePlaneAndPoint(
        plane,
        supportVertex
      );

      if (distance > 0) return true; // separating axis found
    }

    return false;
  }

  // check with possible separating axes computed via the cross product between
  // all edge combinations of both polyhedra
  private static _checkEdgeDirections(
    polyhedronA: Polyhedron,
    polyhedronB: Polyhedron
  ): boolean {
    const { directionA, directionB } = SAT;
    const edgesA = polyhedronA.edges;
    const edgesB = polyhedronB.edges;

    for (let i = 0, il = edgesA.length; i < il; i++) {
      const edgeA = edgesA[i];

      for (let j = 0, jl = edgesB.length; j < jl; j++) {
        const edgeB = edgesB[j];

        edgeA.getDirection(directionA);
        edgeB.getDirection(directionB);

        // edge pruning: only consider edges if they build a face on the minkowski difference

        if (this._minkowskiFace(edgeA, directionA, edgeB, directionB)) {
          // compute axis

          const distance = SAT._distanceBetweenEdges(
            edgeA,
            directionA,
            edgeB,
            directionB,
            polyhedronA
          );

          if (distance > 0) return true; // separating axis found
        }
      }
    }

    return false;
  }

  // return the most extreme vertex into a given direction
  private static _getSupportVertex(
    polyhedron: Polyhedron,
    direction: Vector3
  ): Vector3 {
    let maxProjection = -Number.MAX_VALUE;
    let supportVertex: Vector3 = null;

    // iterate over all polygons
    const vertices = polyhedron.vertices;

    for (let i = 0, l = vertices.length; i < l; i++) {
      const vertex = vertices[i];
      const projection = Vector3.dot(vertex, direction);

      // check vertex to find the best support point
      if (projection > maxProjection) {
        maxProjection = projection;
        supportVertex = vertex;
      }
    }

    return supportVertex;
  }

  // returns true if the given edges build a face on the minkowski difference
  private static _minkowskiFace(edgeA, directionA, edgeB, directionB): boolean {
    const { c, d } = SAT;
    // get face normals which define the vertices of the arcs on the gauss map
    const a: Vector3 = edgeA.polygon.plane.normal;
    const b: Vector3 = edgeA.twin.polygon.plane.normal;
    c.copyFrom(edgeB.polygon.plane.normal);
    d.copyFrom(edgeB.twin.polygon.plane.normal);

    // negate normals c and d to account for minkowski difference
    c.multiplyScalar(-1);
    d.multiplyScalar(-1);

    // compute triple products
    // it's not necessary to compute the cross product since edges of convex polyhedron
    // have same direction as the cross product between their adjacent face normals
    const cba = c.dot(directionA);
    const dba = d.dot(directionA);
    const adc = Vector3.dot(a, directionB);
    const bdc = Vector3.dot(b, directionB);

    // check signs of plane test
    return cba * dba < 0 && adc * bdc < 0 && cba * bdc > 0;
  }

  // use gauss map to compute the distance between two edges
  private static _distanceBetweenEdges(
    edgeA: HalfEdge,
    directionA: Vector3,
    edgeB: HalfEdge,
    directionB: Vector3,
    polyhedronA: Polyhedron
  ) {
    const { v, normal } = SAT;
    // skip parallel edges
    if (Math.abs(Vector3.dot(directionA, directionB)) === 1)
      return -Number.MAX_VALUE;

    // build plane through one edge
    Vector3.cross(directionA, directionB, normal);
    normal.normalize();

    // ensure normal points from polyhedron A to B
    Vector3.subtract(edgeA.vertex, polyhedronA.centroid, v);
    if (normal.dot(v) < 0) {
      normal.multiplyScalar(-1);
    }

    // compute the distance of any vertex on the other edge to that plane
    // no need to compute support points => O(1)
    Vector3.subtract(edgeB.vertex, edgeA.vertex, v);
    return normal.dot(v);
  }
}
