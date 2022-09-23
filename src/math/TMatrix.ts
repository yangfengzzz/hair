import { Matrix, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

export class TMatrix extends Matrix {
  /**
   * Multiplies the given scalar with this matrix.
   *
   * @param s - The scalar to multiply.
   * @return A reference to this matrix.
   */
  multiplyScalar(s: number): TMatrix {
    const e = this.elements;

    e[0] *= s;
    e[4] *= s;
    e[8] *= s;
    e[12] *= s;
    e[1] *= s;
    e[5] *= s;
    e[9] *= s;
    e[13] *= s;
    e[2] *= s;
    e[6] *= s;
    e[10] *= s;
    e[14] *= s;
    e[3] *= s;
    e[7] *= s;
    e[11] *= s;
    e[15] *= s;

    return this;
  }

  /**
   * Extracts the basis vectors and stores them to the given vectors.
   *
   * @param xAxis - The first result vector for the x-axis.
   * @param yAxis - The second result vector for the y-axis.
   * @param zAxis - The third result vector for the z-axis.
   * @return A reference to this matrix.
   */
  extractBasis(xAxis: TVector3, yAxis: TVector3, zAxis: TVector3): TMatrix {
    xAxis.fromMatrix4Column(this, 0);
    yAxis.fromMatrix4Column(this, 1);
    zAxis.fromMatrix4Column(this, 2);

    return this;
  }

  /**
   * Makes a basis from the given vectors.
   *
   * @param xAxis - The first basis vector for the x-axis.
   * @param yAxis - The second basis vector for the y-axis.
   * @param zAxis - The third basis vector for the z-axis.
   * @return A reference to this matrix.
   */
  makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): TMatrix {
    this.set(
      xAxis.x,
      yAxis.x,
      zAxis.x,
      0,
      xAxis.y,
      yAxis.y,
      zAxis.y,
      0,
      xAxis.z,
      yAxis.z,
      zAxis.z,
      0,
      0,
      0,
      0,
      1
    );
    return this;
  }

  /**
   * Sets the translation part of the 4x4 matrix to the given position vector.
   *
   * @param v - A 3D vector representing a position.
   * @return A reference to this matrix.
   */
  setPosition(v: Vector3): TMatrix {
    const e = this.elements;
    e[12] = v.x;
    e[13] = v.y;
    e[14] = v.z;
    return this;
  }

  /**
   * Computes the maximum scale value for all three axis.
   *
   * @return The maximum scale value.
   */
  getMaxScale(): number {
    const e = this.elements;
    const scaleXSq = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
    const scaleYSq = e[4] * e[4] + e[5] * e[5] + e[6] * e[6];
    const scaleZSq = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];
    return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
  }
}
