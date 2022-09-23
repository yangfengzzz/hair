import { MathUtil, Vector3 } from "oasis-engine";

/**
 * Class with various math helpers.
 */
export class TMathUtil extends MathUtil {
  private static lut: string[] = [];

  /**
   * Computes the signed area of a rectangle defined by three points.
   * This method can also be used to calculate the area of a triangle.
   * @param a - The first point in 3D space.
   * @param b - The second point in 3D space.
   * @param c - The third point in 3D space.
   * @return The signed area.
   */
  static area(a: Vector3, b: Vector3, c: Vector3): number {
    return (c.x - a.x) * (b.z - a.z) - (b.x - a.x) * (c.z - a.z);
  }

  /**
   * Returns the indices of the maximum values of the given array.
   *
   * @param array - The input array.
   * @return Array of indices into the array.
   */
  static argmax(array: number[]): number[] {
    const max = Math.max(...array);
    const indices = [];

    for (let i = 0, l = array.length; i < l; i++) {
      if (array[i] === max) indices.push(i);
    }

    return indices;
  }

  /**
   * Returns a random sample from a given array.
   *
   * @param array - The array that is used to generate the random sample.
   * @param probabilities - The probabilities associated with each entry. If not given, the sample assumes a uniform distribution over all entries.
   * @return The random sample value.
   */
  static choice<T>(array: T[], probabilities: number[] = null): T {
    const random = Math.random();
    if (probabilities === null) {
      return array[Math.floor(Math.random() * array.length)];
    } else {
      let probability = 0;
      const index = array
        .map((value, index) => {
          probability += probabilities[index];

          return probability;
        })
        .findIndex((probability) => probability >= random);

      return array[index];
    }
  }

  /**
   * Computes a RFC4122 Version 4 complied Universally Unique Identifier (UUID).
   * @return The UUID.
   */
  static generateUUID(): string {
    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/21963136#21963136
    const lut = TMathUtil.lut;
    if (lut.length === 0) {
      for (let i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? "0" : "") + i.toString(16);
      }
    }

    const d0 = (Math.random() * 0xffffffff) | 0;
    const d1 = (Math.random() * 0xffffffff) | 0;
    const d2 = (Math.random() * 0xffffffff) | 0;
    const d3 = (Math.random() * 0xffffffff) | 0;
    const uuid =
      lut[d0 & 0xff] +
      lut[(d0 >> 8) & 0xff] +
      lut[(d0 >> 16) & 0xff] +
      lut[(d0 >> 24) & 0xff] +
      "-" +
      lut[d1 & 0xff] +
      lut[(d1 >> 8) & 0xff] +
      "-" +
      lut[((d1 >> 16) & 0x0f) | 0x40] +
      lut[(d1 >> 24) & 0xff] +
      "-" +
      lut[(d2 & 0x3f) | 0x80] +
      lut[(d2 >> 8) & 0xff] +
      "-" +
      lut[(d2 >> 16) & 0xff] +
      lut[(d2 >> 24) & 0xff] +
      lut[d3 & 0xff] +
      lut[(d3 >> 8) & 0xff] +
      lut[(d3 >> 16) & 0xff] +
      lut[(d3 >> 24) & 0xff];

    return uuid.toUpperCase();
  }

  /**
   * Computes a random float value within a given min/max range.
   *
   * @param min - The min value.
   * @param max - The max value.
   * @return The random float value.
   */
  static randFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Computes a random integer value within a given min/max range.
   *
   * @param min - The min value.
   * @param max - The max value.
   * @return The random integer value.
   */
  static randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
