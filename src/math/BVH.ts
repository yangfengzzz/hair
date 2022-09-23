import { TBoundingBox } from "./TBoundingBox";
import { Vector3 } from "oasis-engine";
import { Triangle } from "./Triangle";
import { TRay } from "./TRay";
import { TVector3 } from "./TVector3";

export class BVH {
  private _branchingFactor: number;
  private _primitivesPerNode: number;
  private _depth: number;
  private readonly _root: BVHNode = null;

  /**
   * Root node
   */
  get root(): BVHNode {
    return this._root;
  }

  /**
   * Constructs a new BVH.
   * @param branchingFactor - The branching factor.
   * @param primitivesPerNode - The minimum amount of primitives per BVH node.
   * @param depth - The maximum hierarchical depth.
   */
  constructor(
    branchingFactor: number = 2,
    primitivesPerNode: number = 1,
    depth: number = 10
  ) {
    this._branchingFactor = branchingFactor;
    this._primitivesPerNode = primitivesPerNode;
    this._depth = depth;
    this._root = null;
  }

  /**
   * Executes the given callback for each node of the BVH.
   *
   * @param callback - The callback to execute.
   * @return A reference to this BVH.
   */
  traverse(callback: (node: BVHNode) => {}): BVH {
    this._root.traverse(callback);
    return this;
  }
}

/**
 * A single node in a bounding volume hierarchy (BVH).
 */
export class BVHNode {
  private static v1 = new Vector3();
  private static v2 = new Vector3();
  private static v3 = new Vector3();
  private static xAxis = new Vector3(1, 0, 0);
  private static yAxis = new Vector3(0, 1, 0);
  private static zAxis = new Vector3(0, 0, 1);
  private static triangle = new Triangle();
  private static intersection = new TVector3();
  private static intersections: Vector3[] = [];

  private _parent: BVHNode = null;
  private _children: BVHNode[] = [];
  private _boundingVolume = new TBoundingBox();
  private _primitives: number[] = [];
  private _centroids: number[] = [];

  /**
   * Returns true if this BVH node is a root node.
   */
  get isRoot(): boolean {
    return this._parent === null;
  }

  /**
   * Returns true if this BVH node is a leaf node.
   */
  get isLeaf(): boolean {
    return this._children.length === 0;
  }

  /**
   * Returns the depth of this BVH node in its hierarchy.
   */
  get depth(): number {
    let depth = 0;
    let parent = this._parent;
    while (parent !== null) {
      parent = parent._parent;
      depth++;
    }
    return depth;
  }

  /**
   * Executes the given callback for this BVH node and its ancestors.
   *
   * @param callback - The callback to execute.
   * @return A reference to this BVH node.
   */
  traverse(callback: (node: BVHNode) => {}): BVHNode {
    callback(this);
    const children = this._children;
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback);
    }
    return this;
  }

  /**
   * Builds this BVH node. That means the respective bounding volume
   * is computed and the node's primitives are distributed under new child nodes.
   * This only happens if the maximum hierarchical depth is not yet reached and
   * the node does contain enough primitives required for a split.
   * @param branchingFactor - The branching factor.
   * @param primitivesPerNode - The minimum amount of primitives per BVH node.
   * @param maxDepth - The maximum  hierarchical depth.
   * @param currentDepth - The current hierarchical depth.
   * @return A reference to this BVH node.
   */
  build(
    branchingFactor: number,
    primitivesPerNode: number,
    maxDepth: number,
    currentDepth: number
  ): BVHNode {
    this.computeBoundingVolume();

    // check depth and primitive count
    const primitiveCount = this._primitives.length / 9;
    const newPrimitiveCount = Math.floor(primitiveCount / branchingFactor);

    if (currentDepth <= maxDepth && newPrimitiveCount >= primitivesPerNode) {
      // split (distribute primitives on new child BVH nodes)
      this.split(branchingFactor);

      // proceed with build on the next hierarchy level
      for (let i = 0; i < branchingFactor; i++) {
        this._children[i].build(
          branchingFactor,
          primitivesPerNode,
          maxDepth,
          currentDepth + 1
        );
      }
    }
    return this;
  }

  /**
   * Computes the AABB for this BVH node.
   *
   * @return {BVHNode} A reference to this BVH node.
   */
  computeBoundingVolume(): BVHNode {
    const { _primitives: primitives, _boundingVolume: aabb } = this;
    const v1 = BVHNode.v1;

    // compute AABB
    aabb.min.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    aabb.max.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    for (let i = 0, l = primitives.length; i < l; i += 3) {
      v1.x = primitives[i];
      v1.y = primitives[i + 1];
      v1.z = primitives[i + 2];
      aabb.expand(v1);
    }
    return this;
  }

  /**
   * Computes the split axis. Right now, only the cardinal axes
   * are potential split axes.
   */
  computeSplitAxis(): Vector3 {
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    let maxZ = -Number.MAX_VALUE;
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let minZ = Number.MAX_VALUE;

    const centroids = this._centroids;
    for (let i = 0, l = centroids.length; i < l; i += 3) {
      const x = centroids[i];
      const y = centroids[i + 1];
      const z = centroids[i + 2];

      if (x > maxX) {
        maxX = x;
      }

      if (y > maxY) {
        maxY = y;
      }

      if (z > maxZ) {
        maxZ = z;
      }

      if (x < minX) {
        minX = x;
      }

      if (y < minY) {
        minY = y;
      }

      if (z < minZ) {
        minZ = z;
      }
    }

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const rangeZ = maxZ - minZ;

    if (rangeX > rangeY && rangeX > rangeZ) {
      return BVHNode.xAxis;
    } else if (rangeY > rangeZ) {
      return BVHNode.yAxis;
    } else {
      return BVHNode.zAxis;
    }
  }

  /**
   * Splits the node and distributes node's primitives over new child nodes.
   *
   * @param branchingFactor - The branching factor.
   * @return A reference to this BVH node.
   */
  split(branchingFactor: number): BVHNode {
    const { v1, v2, v3 } = BVHNode;
    const {
      _children: children,
      _centroids: centroids,
      _primitives: primitives,
    } = this;

    // create (empty) child BVH nodes
    for (let i = 0; i < branchingFactor; i++) {
      children[i] = new BVHNode();
      children[i]._parent = this;
    }

    // sort primitives along split axis

    const axis = this.computeSplitAxis();
    const sortedPrimitiveIndices: SortedPrimitive[] = [];

    for (let i = 0, l = centroids.length; i < l; i += 3) {
      v1.copyFromArray(centroids, i);

      // the result from the dot product is our sort criterion.
      // it represents the projection of the centroid on the split axis
      const p = Vector3.dot(BVHNode.v1, axis);
      const primitiveIndex = i / 3;
      sortedPrimitiveIndices.push({ index: primitiveIndex, p: p });
    }

    sortedPrimitiveIndices.sort(SortedPrimitive.sort);

    // distribute data
    const primitiveCount = sortedPrimitiveIndices.length;
    const primitivesPerChild = Math.floor(primitiveCount / branchingFactor);

    let childIndex = 0;
    let primitivesIndex = 0;
    for (let i = 0; i < primitiveCount; i++) {
      // selected child
      primitivesIndex++;

      // check if we try to add more primitives to a child than "primitivesPerChild" defines.
      // move primitives to the next child
      if (primitivesIndex > primitivesPerChild) {
        // ensure "childIndex" does not overflow (meaning the last child takes all remaining primitives)
        if (childIndex < branchingFactor - 1) {
          primitivesIndex = 1; // reset primitive index
          childIndex++; // raise child index
        }
      }

      const child = children[childIndex];

      // move data to the next level
      // 1. primitives
      const primitiveIndex = sortedPrimitiveIndices[i].index;
      const stride = primitiveIndex * 9; // remember the "primitives" array holds raw vertex data defining triangles

      v1.copyFromArray(primitives, stride);
      v2.copyFromArray(primitives, stride + 3);
      v3.copyFromArray(primitives, stride + 6);
      child._primitives.push(v1.x, v1.y, v1.z);
      child._primitives.push(v2.x, v2.y, v2.z);
      child._primitives.push(v3.x, v3.y, v3.z);

      // 2. centroid
      v1.copyFromArray(centroids, primitiveIndex * 3);
      child._centroids.push(v1.x, v1.y, v1.z);
    }
    // remove centroids/primitives after split from this node
    centroids.length = 0;
    primitives.length = 0;

    return this;
  }

  /**
   * Performs a ray/BVH node intersection test and stores the closest intersection point
   * to the given 3D vector. If no intersection is detected, *null* is returned.
   *
   * @param ray - The ray.
   * @param result - The result vector.
   * @return The result vector.
   */
  intersectRay(ray: TRay, result: TVector3): TVector3 {
    const { triangle, intersections } = BVHNode;

    // gather all intersection points along the hierarchy
    if (ray.intersectBox(this._boundingVolume) !== -1) {
      if (this.isLeaf === true) {
        const vertices = this._primitives;

        for (let i = 0, l = vertices.length; i < l; i += 9) {
          // remember: we assume primitives are triangles
          triangle.a.copyFromArray(vertices, i);
          triangle.b.copyFromArray(vertices, i + 3);
          triangle.c.copyFromArray(vertices, i + 6);

          if (ray.intersectTriangle(triangle, true, result) !== null) {
            intersections.push(result.clone());
          }
        }
      } else {
        // process children
        for (let i = 0, l = this._children.length; i < l; i++) {
          this._children[i].intersectRay(ray, result);
        }
      }
    }

    // determine the closest intersection point in the root node (so after
    // the hierarchy was processed)

    if (this.isRoot === true) {
      if (intersections.length > 0) {
        let minDistance = Infinity;

        for (let i = 0, l = intersections.length; i < l; i++) {
          const squaredDistance = Vector3.distanceSquared(
            ray.origin,
            intersections[i]
          );

          if (squaredDistance < minDistance) {
            minDistance = squaredDistance;
            result.copyFrom(intersections[i]);
          }
        }

        // reset array
        intersections.length = 0;

        // return closest intersection point
        return result;
      } else {
        // no intersection detected
        return null;
      }
    } else {
      // always return null for non-root nodes
      return null;
    }
  }

  /**
   * Performs a ray/BVH node intersection test. Returns either true or false if
   * there is an intersection or not.
   *
   * @param ray - The ray.
   * @return Whether there is an intersection or not.
   */
  intersectsRay(ray: TRay): boolean {
    const { triangle, intersection } = BVHNode;

    if (ray.intersectBox(this._boundingVolume) !== -1) {
      if (this.isLeaf === true) {
        const vertices = this._primitives;

        for (let i = 0, l = vertices.length; i < l; i += 9) {
          // remember: we assume primitives are triangles
          triangle.a.copyFromArray(vertices, i);
          triangle.b.copyFromArray(vertices, i + 3);
          triangle.c.copyFromArray(vertices, i + 6);

          if (ray.intersectTriangle(triangle, true, intersection) !== null) {
            return true;
          }
        }

        return false;
      } else {
        // process child BVH nodes
        for (let i = 0, l = this._children.length; i < l; i++) {
          if (this._children[i].intersectsRay(ray) === true) {
            return true;
          }
        }

        return false;
      }
    } else {
      return false;
    }
  }
}

class SortedPrimitive {
  index: number;
  p: number;

  static sort(a: SortedPrimitive, b: SortedPrimitive) {
    return a.p - b.p;
  }
}
