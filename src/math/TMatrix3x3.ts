import { Matrix3x3, Vector3 } from "oasis-engine";
import { TVector3 } from "./TVector3";

export class TMatrix3x3 extends Matrix3x3 {
  private static colVal = [2, 2, 1];
  private static rowVal = [1, 0, 0];
  private static m1 = new TMatrix3x3();
  private static m2 = new TMatrix3x3();

  /**
   * Multiplies the given scalar with this matrix.
   *
   * @param s - The scalar to multiply.
   * @return A reference to this matrix.
   */
  multiplyScalar(s: number): TMatrix3x3 {
    const e = this.elements;

    e[0] *= s;
    e[3] *= s;
    e[6] *= s;
    e[1] *= s;
    e[4] *= s;
    e[7] *= s;
    e[2] *= s;
    e[5] *= s;
    e[8] *= s;
    return this;
  }

  /**
   * Extracts the basis vectors and stores them to the given vectors.
   * @param xAxis - The first result vector for the x-axis.
   * @param yAxis - The second result vector for the y-axis.
   * @param zAxis - The third result vector for the z-axis.
   * @return A reference to this matrix.
   */
  extractBasis(xAxis: TVector3, yAxis: TVector3, zAxis: TVector3): TMatrix3x3 {
    xAxis.fromMatrix3Column(this, 0);
    yAxis.fromMatrix3Column(this, 1);
    zAxis.fromMatrix3Column(this, 2);

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
  makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): TMatrix3x3 {
    this.set(
      xAxis.x,
      yAxis.x,
      zAxis.x,
      xAxis.y,
      yAxis.y,
      zAxis.y,
      xAxis.z,
      yAxis.z,
      zAxis.z
    );

    return this;
  }

  /**
   * Computes the element index according to the given column and row.
   * @param column - Index of the column.
   * @param row - Index of the row.
   * @return The index of the element at the provided row and column.
   */
  getElementIndex(column: number, row: number): number {
    return column * 3 + row;
  }

  /**
   * Computes the frobenius norm. It's the squareroot of the sum of all
   * squared matrix elements.
   * @return The frobenius norm.
   */
  frobeniusNorm(): number {
    const e = this.elements;
    let norm = 0;

    for (let i = 0; i < 9; i++) {
      norm += e[i] * e[i];
    }

    return Math.sqrt(norm);
  }

  /**
   * Computes the  "off-diagonal" frobenius norm. Assumes the matrix is symmetric.
   *
   * @return {Number} The "off-diagonal" frobenius norm.
   */
  offDiagonalFrobeniusNorm(): number {
    const e = this.elements;
    let norm = 0;

    for (let i = 0; i < 3; i++) {
      const t =
        e[this.getElementIndex(TMatrix3x3.colVal[i], TMatrix3x3.rowVal[i])];
      norm += 2 * t * t; // multiply the result by two since the matrix is symmetric
    }

    return Math.sqrt(norm);
  }

  /**
   * Computes the eigenvectors and eigenvalues.
   *
   * Reference: https://github.com/AnalyticalGraphicsInc/cesium/blob/411a1afbd36b72df64d7362de6aa934730447234/Source/Core/Matrix3.js#L1141 (Apache License 2.0)
   *
   * The values along the diagonal of the diagonal matrix are the eigenvalues.
   * The columns of the unitary matrix are the corresponding eigenvectors.
   *
   * @param unitaryMatrix - unitary matrix which are matrices onto which to store the result.
   * @param diagonalMatrix - diagonal matrix which are matrices onto which to store the result.
   */
  eigenDecomposition(
    unitaryMatrix: TMatrix3x3,
    diagonalMatrix: TMatrix3x3
  ): void {
    const { m1, m2 } = TMatrix3x3;
    let count = 0;
    let sweep = 0;

    const maxSweeps = 10;

    unitaryMatrix.identity();
    diagonalMatrix.copyFrom(this);
    const epsilon = Number.EPSILON * diagonalMatrix.frobeniusNorm();

    while (
      sweep < maxSweeps &&
      diagonalMatrix.offDiagonalFrobeniusNorm() > epsilon
    ) {
      diagonalMatrix.shurDecomposition(m1);
      m2.copyFrom(m1).transpose();
      diagonalMatrix.multiply(m1);
      Matrix3x3.multiply(m2, this, diagonalMatrix);
      unitaryMatrix.multiply(m1);

      if (++count > 2) {
        sweep++;
        count = 0;
      }
    }
  }

  /**
   * Finds the largest off-diagonal term and then creates a matrix
   * which can be used to help reduce it.
   *
   * @param result - The result matrix.
   * @return The result matrix.
   */
  shurDecomposition(result: TMatrix3x3): TMatrix3x3 {
    let maxDiagonal = 0;
    let rotAxis = 1;

    // find pivot (rotAxis) based on largest off-diagonal term

    const e = this.elements;

    for (let i = 0; i < 3; i++) {
      const t = Math.abs(
        e[this.getElementIndex(TMatrix3x3.colVal[i], TMatrix3x3.rowVal[i])]
      );

      if (t > maxDiagonal) {
        maxDiagonal = t;
        rotAxis = i;
      }
    }

    let c = 1;
    let s = 0;

    const p = TMatrix3x3.rowVal[rotAxis];
    const q = TMatrix3x3.colVal[rotAxis];
    if (Math.abs(e[this.getElementIndex(q, p)]) > Number.EPSILON) {
      const qq = e[this.getElementIndex(q, q)];
      const pp = e[this.getElementIndex(p, p)];
      const qp = e[this.getElementIndex(q, p)];

      const tau = (qq - pp) / 2 / qp;

      let t;

      if (tau < 0) {
        t = -1 / (-tau + Math.sqrt(1 + tau * tau));
      } else {
        t = 1 / (tau + Math.sqrt(1.0 + tau * tau));
      }

      c = 1.0 / Math.sqrt(1.0 + t * t);
      s = t * c;
    }

    result.identity();

    result.elements[this.getElementIndex(p, p)] = c;
    result.elements[this.getElementIndex(q, q)] = c;
    result.elements[this.getElementIndex(q, p)] = s;
    result.elements[this.getElementIndex(p, q)] = -s;

    return result;
  }
}
