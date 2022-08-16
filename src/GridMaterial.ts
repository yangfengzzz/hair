import {BaseMaterial, Camera, Engine, MathUtil, MeshRenderer, ModelMesh, Script, Shader, Vector3} from "oasis-engine";

/**
 * Grid Control
 */
export class GridControl extends Script {
    private _camera: Camera;
    private _material: GridMaterial;
    private _progress = 0;
    private _is2DGrid = false;
    private _flipGrid = false;

    /**
     * Create Mesh with position in clipped space.
     * @param engine Engine
     */
    static createGridPlane(engine: Engine): ModelMesh {
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

        const {bounds} = mesh;
        bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        return mesh;
    }

    /**
     * Flip speed
     */
    speed = 10.0;

    /**
     * Grid Material.
     */
    get material(): GridMaterial {
        return this._material;
    }

    /**
     * Is 2D Grid.
     */
    get is2DGrid(): boolean {
        return this._is2DGrid;
    }

    set is2DGrid(value: boolean) {
        this._is2DGrid = value;
        this._progress = 0;
        this._flipGrid = true;
    }

    /**
     * @override
     */
    onAwake() {
        const {engine: engine, entity: entity} = this;
        this._camera = entity.getComponent(Camera);

        const gridRenderer = entity.addComponent(MeshRenderer);
        gridRenderer.mesh = GridControl.createGridPlane(engine);
        this._material = new GridMaterial(engine);
        gridRenderer.setMaterial(this._material);
    }

    /**
     * @override
     */
    onUpdate(deltaTime: number) {
        const {_material: material, _camera: camera} = this;
        material.nearClipPlane = camera.nearClipPlane;
        material.farClipPlane = camera.farClipPlane;

        if (this._flipGrid) {
            this._progress += deltaTime / 1000;
            let percent = MathUtil.clamp(this._progress * this.speed, 0, 1);
            if (percent >= 1) {
                this._flipGrid = false;
            }

            if (!this._is2DGrid) {
                percent = 1 - percent;
            }
            material.flipProgress = percent
        }
    }
}

/**
 * Grid Material.
 */
export class GridMaterial extends BaseMaterial {
    private static _farClipProperty = Shader.getPropertyByName("u_far");
    private static _nearClipProperty = Shader.getPropertyByName("u_near");
    private static _primaryScaleProperty = Shader.getPropertyByName("u_primaryScale");
    private static _secondaryScaleProperty = Shader.getPropertyByName("u_secondaryScale");
    private static _gridIntensityProperty = Shader.getPropertyByName("u_gridIntensity");
    private static _axisIntensityProperty = Shader.getPropertyByName("u_axisIntensity");
    private static _flipProgressProperty = Shader.getPropertyByName("u_flipProgress");

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

    /**
     * Primary Scale
     */
    get primaryScale(): number {
        return this.shaderData.getFloat(GridMaterial._primaryScaleProperty);
    }

    set primaryScale(value: number) {
        this.shaderData.setFloat(GridMaterial._primaryScaleProperty, value);
    }

    /**
     * Secondary Scale
     */
    get secondaryScale(): number {
        return this.shaderData.getFloat(GridMaterial._secondaryScaleProperty);
    }

    set secondaryScale(value: number) {
        this.shaderData.setFloat(GridMaterial._secondaryScaleProperty, value);
    }

    /**
     * Grid Intensity
     */
    get gridIntensity(): number {
        return this.shaderData.getFloat(GridMaterial._gridIntensityProperty);
    }

    set gridIntensity(value: number) {
        this.shaderData.setFloat(GridMaterial._gridIntensityProperty, value);
    }

    /**
     * Axis Intensity
     */
    get axisIntensity(): number {
        return this.shaderData.getFloat(GridMaterial._axisIntensityProperty);
    }

    set axisIntensity(value: number) {
        this.shaderData.setFloat(GridMaterial._axisIntensityProperty, value);
    }

    /**
     * Flip Progress
     */
    get flipProgress(): number {
        return this.shaderData.getFloat(GridMaterial._flipProgressProperty);
    }

    set flipProgress(value: number) {
        this.shaderData.setFloat(GridMaterial._flipProgressProperty, MathUtil.clamp(value, 0, 1));
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("grid"));
        this.isTransparent = true;

        const shaderData = this.shaderData;
        shaderData.setFloat(GridMaterial._nearClipProperty, 0.1);
        shaderData.setFloat(GridMaterial._farClipProperty, 100);
        shaderData.setFloat(GridMaterial._primaryScaleProperty, 10);
        shaderData.setFloat(GridMaterial._secondaryScaleProperty, 1);
        shaderData.setFloat(GridMaterial._gridIntensityProperty, 0.2);
        shaderData.setFloat(GridMaterial._axisIntensityProperty, 0.1);
        shaderData.setFloat(GridMaterial._flipProgressProperty, 0.0);
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
uniform float u_primaryScale;
uniform float u_secondaryScale;
uniform float u_gridIntensity;
uniform float u_axisIntensity;
uniform float u_flipProgress;

varying vec3 nearPoint;
varying vec3 farPoint;
  
vec4 grid(vec3 fragPos3D, float scale, bool drawAxis) {
    vec2 coord = mix(fragPos3D.xz, fragPos3D.xy, u_flipProgress) * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.0);
    float minimumx = min(derivative.x, 1.0);
    vec4 color = vec4(u_gridIntensity, u_gridIntensity, u_gridIntensity, 1.0 - min(line, 1.0));
    // z-axis
    if (fragPos3D.x > -u_axisIntensity * minimumx && fragPos3D.x < u_axisIntensity * minimumx)
        color.z = 1.0;
    // x-axis or y-axis
    float xy = mix(fragPos3D.z, fragPos3D.y, u_flipProgress);
    if (xy > -u_axisIntensity * minimumz && xy < u_axisIntensity * minimumz)
        color.x = 1.0;
    return color;
}

float computeDepth(vec3 pos) {
    vec4 clip_space_pos = u_projMat * u_viewMat * vec4(pos.xyz, 1.0);
    // map to 0-1
    return (clip_space_pos.z / clip_space_pos.w) * 0.5 + 0.5;
}

float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = u_projMat * u_viewMat * vec4(pos.xyz, 1.0);
    float clip_space_depth = clip_space_pos.z / clip_space_pos.w;
    float linearDepth = (2.0 * u_near * u_far) / (u_far + u_near - clip_space_depth * (u_far - u_near));
    return linearDepth / u_far;// normalize
}

void main() {
    float ty = -nearPoint.y / (farPoint.y - nearPoint.y);
    float tz = -nearPoint.z / (farPoint.z - nearPoint.z);
    float t = mix(ty, tz, u_flipProgress);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);

    gl_FragDepth = computeDepth(fragPos3D);

    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0.0, (0.5 - linearDepth));

    // adding multiple resolution for the grid
    gl_FragColor = (grid(fragPos3D, u_primaryScale, true) + grid(fragPos3D, u_secondaryScale, true));
    gl_FragColor.a *= fading;
}
`
);
