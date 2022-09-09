import { Vector2, Vector3 } from "@oasis-engine/math";
import {GLCapabilityType, Engine, ModelMesh, Vector4} from "oasis-engine";

/**
 * Used to generate common primitive meshes.
 */
export class PrimitiveMesh {
  private static tempVector = new Vector3();

  /**
   * Create a sphere mesh.
   * @param engine - Engine
   * @param radius - Sphere radius
   * @param segments - Number of segments
   * @param noLongerAccessible - No longer access the vertices of the mesh after creation
   * @returns Sphere model mesh
   */
  static createSphere(
    engine: Engine,
    radius: number = 0.5,
    segments: number = 18,
    noLongerAccessible: boolean = true
  ): ModelMesh {
    const mesh = new ModelMesh(engine);
    segments = Math.max(2, Math.floor(segments));

    const count = segments + 1;
    const vertexCount = count * count;
    const rectangleCount = segments * segments;
    const indices = PrimitiveMesh._generateIndices(engine, vertexCount, rectangleCount * 6);
    const thetaRange = Math.PI;
    const alphaRange = thetaRange * 2;
    const countReciprocal = 1.0 / count;
    const segmentsReciprocal = 1.0 / segments;

    const positions: Vector3[] = new Array(vertexCount);
    const normals: Vector3[] = new Array(vertexCount);
    const tangents: Vector4[] = new Array(vertexCount);
    const uvs: Vector2[] = new Array(vertexCount);

    for (let i = 0; i < vertexCount; ++i) {
      const x = i % count;
      const y = (i * countReciprocal) | 0;
      const u = x * segmentsReciprocal;
      const v = y * segmentsReciprocal;
      const alphaDelta = u * alphaRange;
      const thetaDelta = v * thetaRange;
      const sinTheta = Math.sin(thetaDelta);

      let posX = -radius * Math.cos(alphaDelta) * sinTheta;
      let posY = radius * Math.cos(thetaDelta);
      let posZ = radius * Math.sin(alphaDelta) * sinTheta;

      // Position
      positions[i] = new Vector3(posX, posY, posZ);
      // Normal
      normals[i] = new Vector3(posX, posY, posZ);
      // Tangent
      tangents[i] = new Vector4(0, 0, 0, 1);
      Vector3.cross(positions[i], new Vector3(0, -radius * 2, 0), PrimitiveMesh.tempVector);
      tangents[i].x = PrimitiveMesh.tempVector.x;
      tangents[i].y = PrimitiveMesh.tempVector.y;
      tangents[i].z = PrimitiveMesh.tempVector.z;
      // Texcoord
      uvs[i] = new Vector2(u, v);
    }

    let offset = 0;
    for (let i = 0; i < rectangleCount; ++i) {
      const x = i % segments;
      const y = (i * segmentsReciprocal) | 0;

      const a = y * count + x;
      const b = a + 1;
      const c = a + count;
      const d = c + 1;

      indices[offset++] = b;
      indices[offset++] = a;
      indices[offset++] = d;
      indices[offset++] = a;
      indices[offset++] = c;
      indices[offset++] = d;
    }

    const { bounds } = mesh;
    bounds.min.set(-radius, -radius, -radius);
    bounds.max.set(radius, radius, radius);

    PrimitiveMesh._initialize(mesh, positions, normals, tangents, uvs, indices, noLongerAccessible);
    return mesh;
  }

  private static _initialize(
    mesh: ModelMesh,
    positions: Vector3[],
    normals: Vector3[],
    tangents: Vector4[],
    uvs: Vector2[],
    indices: Uint16Array | Uint32Array,
    noLongerAccessible: boolean
  ) {
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setTangents(tangents);
    mesh.setUVs(uvs);
    mesh.setIndices(indices);

    mesh.uploadData(noLongerAccessible);
    mesh.addSubMesh(0, indices.length);
  }

  private static _generateIndices(engine: Engine, vertexCount: number, indexCount: number): Uint16Array | Uint32Array {
    let indices: Uint16Array | Uint32Array = null;
    if (vertexCount > 65535) {
      if (engine._hardwareRenderer.canIUse(GLCapabilityType.elementIndexUint)) {
        indices = new Uint32Array(indexCount);
      } else {
        throw Error("The vertex count is over limit.");
      }
    } else {
      indices = new Uint16Array(indexCount);
    }
    return indices;
  }
}
