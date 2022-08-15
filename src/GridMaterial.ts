import {BaseMaterial, Engine, ModelMesh, Shader, Vector3} from "oasis-engine";

/**
 * Create Mesh with position in clipped space.
 * @param engine Engine
 */
export function createGridPlane(engine: Engine): ModelMesh {
  const positions: Vector3[] = new Array(6);
  positions[0] = new Vector3(1, 1, 0);
  positions[1] = new Vector3(-1, -1, 0);
  positions[2] = new Vector3(-1, 1, 0);
  positions[3] = new Vector3(-1, -1, 0);
  positions[4] = new Vector3(1, 1, 0);
  positions[5] = new Vector3(1, -1, 0);

  const indices = new Uint8Array(6);
  indices[0] = 2;
  indices[1] = 1;
  indices[2] = 0;
  indices[3] = 5;
  indices[4] = 4;
  indices[5] = 3;

  const mesh = new ModelMesh(engine);
  mesh.setPositions(positions);
  mesh.setIndices(indices);
  mesh.uploadData(true);
  mesh.addSubMesh(0, 6);
  return mesh;
}

/**
 * Grid Material.
 */
export class GridMaterial extends BaseMaterial {
  private static _farClipProperty = Shader.getPropertyByName("u_far");
  private static _nearClipProperty = Shader.getPropertyByName("u_near");

  /**
   * Near clip plane - the closest point to the camera when rendering occurs.
   */
  get nearClipPlane(): number {
    return this.shaderData.getFloat(GridMaterial._nearClipProperty);
  }

  set nearClipPlane(value: number) {
    this.shaderData.setFloat(GridMaterial._nearClipProperty, value);
  }

  /**
   * Far clip plane - the furthest point to the camera when rendering occurs.
   */
  get farClipPlane(): number {
    return this.shaderData.getFloat(GridMaterial._farClipProperty);
  }

  set farClipPlane(value: number) {
    this.shaderData.setFloat(GridMaterial._farClipProperty, value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("grid"));
    this.isTransparent = true;
  }
}

Shader.create(
  "grid",
  `
#include <common_vert>
uniform mat4 u_viewInvMat;
uniform mat4 u_projInvMat;

varying vec3 nearPoint;
varying vec3 farPoint;

vec3 UnprojectPoint(float x, float y, float z) {
    vec4 unprojectedPoint =  u_viewInvMat * u_projInvMat * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}

void main() {
    nearPoint = UnprojectPoint(POSITION.x, POSITION.y, -1.0).xyz;// unprojecting on the near plane
    farPoint = UnprojectPoint(POSITION.x, POSITION.y, 1.0).xyz;// unprojecting on the far plane
    gl_Position = vec4(POSITION, 1.0);// using directly the clipped coordinates
}`,
  `
#include <common_frag>

uniform float u_far;
uniform float u_near;

varying vec3 nearPoint;
varying vec3 farPoint;
  
vec4 grid(vec3 fragPos3D, float scale, bool drawAxis) {
    vec2 coord = fragPos3D.xz * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.0);
    float minimumx = min(derivative.x, 1.0);
    vec4 color = vec4(0.2, 0.2, 0.2, 1.0 - min(line, 1.0));
    // z axis
    if (fragPos3D.x > -0.1 * minimumx && fragPos3D.x < 0.1 * minimumx)
        color.z = 1.0;
    // x axis
    if (fragPos3D.z > -0.1 * minimumz && fragPos3D.z < 0.1 * minimumz)
        color.x = 1.0;
    return color;
}

float computeDepth(vec3 pos) {
    vec4 clip_space_pos = u_projMat * u_viewMat * vec4(pos.xyz, 1.0);
    return (clip_space_pos.z / clip_space_pos.w) * 0.5 + 0.5;
}

float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = u_projMat * u_viewMat * vec4(pos.xyz, 1.0);
    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0;// put back between -1 and 1
    float linearDepth = (2.0 * u_near * u_far) / (u_far + u_near - clip_space_depth * (u_far - u_near));
    return linearDepth / u_far;// normalize
}

void main() {
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);

    gl_FragDepth = computeDepth(fragPos3D);

    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0.0, (0.5 - linearDepth));

    // adding multiple resolution for the grid
    gl_FragColor = (grid(fragPos3D, 10.0, true) + grid(fragPos3D, 1.0, true)) * float(t > 0.0);
    gl_FragColor.a *= fading;
}
`
);
