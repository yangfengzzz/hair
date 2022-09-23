import { MathUtil, Vector3 } from "oasis-engine";

/**
 * Class representing a 3D vector, extent from @oasis-engine/math.
 */
export class TVector3 extends Vector3 {
  private static v1 = new TVector3();

  /**
   * Adds the given scalar to this 3D vector.
   * @param s - The scalar to add.
   * @return A reference to this vector.
   */
  addScalar(s: number): TVector3 {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }

  /**
   * Subtracts the given scalar from this 3D vector.
   * @param s - The scalar to subtract.
   * @return A reference to this vector.
   */
  subScalar(s: number): TVector3 {
    this.x -= s;
    this.y -= s;
    this.z -= s;
    return this;
  }

  /**
   * Multiplies the given scalar with this 3D vector.
   * @param s - The scalar to multiply.
   * @return A reference to this vector.
   */
  multiplyScalar(s: number): TVector3 {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  /**
   * Divides the given scalar through this 3D vector.
   * @param s - The scalar to multiply.
   * @return A reference to this vector.
   */
  divideScalar(s: number): TVector3 {
    this.x /= s;
    this.y /= s;
    this.z /= s;
    return this;
  }

  /**
   * Reflects this vector along the given normal.
   * @param normal - The normal vector.
   * @return A reference to this vector.
   */
  reflect(normal: TVector3): TVector3 {
    // solve r = v - 2( v * n ) * n

    return <TVector3>(
      this.subtract(
        (<TVector3>TVector3.v1.copyFrom(normal)).multiplyScalar(
          2 * this.dot(normal)
        )
      )
    );
  }

  /**
   * Ensures this 3D vector lies in the given min/max range.
   * @param min - The min range.
   * @param max - The max range.
   * @return A reference to this vector.
   */
  clamp(min: Vector3, max: Vector3): TVector3 {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    this.z = Math.max(min.z, Math.min(max.z, this.z));
    return this;
  }

  /**
   * Computes the dot product of this and the given 3D vector.
   * @param v - The given 3D vector.
   * @return The results of the dor product.
   */
  dot(v: Vector3): number {
    return Vector3.dot(this, v);
  }

  /**
   * Computes the cross product of this and the given 3D vector and
   * stores the result in this 3D vector.
   * @param v - A 3D vector.
   * @return A reference to this vector.
   */
  cross(v: Vector3): TVector3 {
    Vector3.cross(this, v, this);
    return this;
  }

  /**
   * Computes the angle between this and the given vector.
   * @param v - A 3D vector.
   * @return The angle in radians.
   */
  angleTo(v: Vector3): number {
    const denominator = Math.sqrt(this.lengthSquared() * v.lengthSquared());
    if (denominator === 0) return 0;
    const theta = this.dot(v) / denominator;

    // clamp, to handle numerical problems
    return Math.acos(MathUtil.clamp(theta, -1, 1));
  }

  /**
   * Computes the manhattan length of this 3D vector.
   * @return The manhattan length of this 3D vector.
   */
  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  /**
   * Computes the euclidean distance between this 3D vector and the given one.
   * @param v - A 3D vector.
   * @return The euclidean distance between two 3D vectors.
   */
  distanceTo(v: Vector3): number {
    return Vector3.distance(this, v);
  }

  /**
   * Computes the squared euclidean distance between this 3D vector and the given one.
   * Calling this method is faster than calling {@link TVector3#distanceTo},
   * since it avoids computing a square root.
   * @param v - A 3D vector.
   * @return The squared euclidean distance between two 3D vectors.
   */
  distanceSquaredTo(v: Vector3): number {
    return Vector3.distanceSquared(this, v);
  }

  /**
   * Computes the manhattan distance between this 3D vector and the given one.
   * @param v - A 3D vector.
   * @return The manhattan distance between two 3D vectors.
   */
  manhattanDistanceTo(v: Vector3): number {
    const dx = this.x - v.x,
      dy = this.y - v.y,
      dz = this.z - v.z;

    return Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
  }

  /**
   * Sets the components of this 3D vector from a spherical coordinate.
   *
   * @param radius - The radius.
   * @param phi - The polar or inclination angle in radians. Should be in the range of (−π/2, +π/2].
   * @param theta - The azimuthal angle in radians. Should be in the range of (−π, +π].
   * @return A reference to this vector.
   */
  fromSpherical(radius: number, phi: number, theta: number): TVector3 {
    const sinPhiRadius = Math.sin(phi) * radius;

    this.x = sinPhiRadius * Math.sin(theta);
    this.y = Math.cos(phi) * radius;
    this.z = sinPhiRadius * Math.cos(theta);

    return this;
  }
}
