import {
    Entity,
    IndexBufferBinding,
    IndexFormat,
    Matrix, MeshTopology,
    ModelMesh,
    Shader,
    SkinnedMeshRenderer, SubMesh,
    Texture2D,
    TextureFilterMode,
    TextureFormat,
    VertexBufferBinding,
    VertexElement
} from "oasis-engine";
import {SketchMode} from "./SketchMode";
import {NormalMaterial, WireframeMaterial} from "./material";

/**
 * Sketch Renderer
 */
export class SketchRenderer extends SkinnedMeshRenderer {
    private static _weightMacro = Shader.getMacroByName("O3_HAS_WEIGHT");
    private static _jointMacro = Shader.getMacroByName("O3_HAS_JOINT");

    private static _MAX_TEXTURE_ROWS = 512;
    private static _jointIndexBegin = -1;

    private static _verticesSamplerProp = Shader.getPropertyByName("u_verticesSampler");
    private static _verticesTextureHeightProp = Shader.getPropertyByName("u_verticesTextureHeight");
    private static _verticesTextureWidthProp = Shader.getPropertyByName("u_verticesTextureWidth");

    private static _indicesSamplerProp = Shader.getPropertyByName("u_indicesSampler");
    private static _indicesTextureHeightProp = Shader.getPropertyByName("u_indicesTextureHeight");
    private static _indicesTextureWidthProp = Shader.getPropertyByName("u_indicesTextureWidth");

    private static _lineScaleProp = Shader.getPropertyByName("u_lineScale");
    private static _worldMatrixProp = Shader.getPropertyByName("u_worldMatrix");

    private _targetMesh: ModelMesh = null;
    private _verticesTexture: Texture2D = null;
    private _indicesTexture: Texture2D = null;

    private readonly _wireframeMaterial: WireframeMaterial;
    private readonly _normalMaterial: NormalMaterial;

    /**
     * Line scale
     */
    set scale(value: number) {
        this.shaderData.setFloat(SketchRenderer._lineScaleProp, value);
    }

    /**
     * World matrix
     */
    set worldMatrix(value: Matrix) {
        this.shaderData.setMatrix(SketchRenderer._worldMatrixProp, value);
    }

    /**
     * Target mesh
     */
    set targetMesh(value: ModelMesh) {
        if (value !== this._targetMesh) {
            this._destroy();
            this._targetMesh = value;
            this._uploadVerticesBuffer(value);
            this._uploadIndicesBuffer(value);

            const mesh = this.mesh;
            mesh.clearSubMesh();
            mesh.addSubMesh(this._createTriangleSubMesh(value)); // wireframe
            mesh.addSubMesh(this._createLineSubMesh(value)); // normal
        }
    }

    /**
     * Material for wireframe shading
     */
    get wireframeMaterial(): WireframeMaterial {
        return this._wireframeMaterial;
    }

    /**
     * Material for normal shading
     */
    get normalMaterial(): NormalMaterial {
        return this._normalMaterial;
    }

    constructor(entity: Entity) {
        super(entity);
        const engine = this.engine;
        this.mesh = new ModelMesh(engine);
        this._wireframeMaterial = new WireframeMaterial(engine);
        this._normalMaterial = new NormalMaterial(engine);
    }

    /**
     * Set sketch mode
     * @param mode - The sketch mode
     * @param isShow - whether show the sketch
     */
    setSketchMode(mode: SketchMode, isShow: boolean) {
        switch (mode) {
            case SketchMode.Wireframe:
                if (isShow) {
                    this.setMaterial(0, this._wireframeMaterial);
                } else {
                    this.setMaterial(0, null);
                }
                break;
            case SketchMode.Normal:
                if (isShow) {
                    this.setMaterial(1, this._wireframeMaterial);
                } else {
                    this.setMaterial(1, null);
                }
                break;
            case SketchMode.Tangent:
                break;
            case SketchMode.BiTangent:
                break;
        }
    }

    clear() {
        this.setMaterial(0, null);
        this.setMaterial(1, null);
        // this.setMaterial(2, null);
        // this.setMaterial(3, null);
    }

    private _uploadIndicesBuffer(value: ModelMesh) {
        //@ts-ignore
        const indexBuffer = (<IndexBufferBinding>value._indexBufferBinding).buffer;
        const byteLength = indexBuffer.byteLength;
        const buffer = new Uint8Array(byteLength);
        indexBuffer.getData(buffer);

        //@ts-ignore
        const indexFormat = <IndexFormat>value._indicesFormat;
        let triangleCount = 0;
        switch (indexFormat) {
            case IndexFormat.UInt8: {
                triangleCount = byteLength / 3;
                const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
                const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
                this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

                const floatBuffer = new Float32Array(width * height * 4);
                for (let i = 0; i < triangleCount; i++) {
                    for (let j = 0; j < 3; j++) {
                        floatBuffer[i * 4 + j] = buffer[i * 3 + j];
                    }
                    floatBuffer[i * 4 + 3] = 0;
                }
                this._indicesTexture.setPixelBuffer(floatBuffer);
                this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
                this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
                this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
                break;
            }
            case IndexFormat.UInt16: {
                const uint16Buffer = new Uint16Array(buffer.buffer);

                triangleCount = byteLength / 6;
                const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
                const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
                this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

                const floatBuffer = new Float32Array(width * height * 4);
                for (let i = 0; i < triangleCount; i++) {
                    for (let j = 0; j < 3; j++) {
                        floatBuffer[i * 4 + j] = uint16Buffer[i * 3 + j];
                    }
                    floatBuffer[i * 4 + 3] = 0;
                }
                this._indicesTexture.setPixelBuffer(floatBuffer);
                this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
                this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
                this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
                break;
            }
            case IndexFormat.UInt32: {
                const uint32Buffer = new Uint32Array(buffer.buffer);

                triangleCount = byteLength / 12;
                const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
                const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
                this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

                const floatBuffer = new Float32Array(width * height * 4);
                for (let i = 0; i < triangleCount; i++) {
                    for (let j = 0; j < 3; j++) {
                        floatBuffer[i * 4 + j] = uint32Buffer[i * 3 + j];
                    }
                    floatBuffer[i * 4 + 3] = 0;
                }
                this._indicesTexture.setPixelBuffer(floatBuffer);
                this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
                this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
                this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
                break;
            }
        }
        this._indicesTexture.filterMode = TextureFilterMode.Point;
    }

    private _uploadVerticesBuffer(value: ModelMesh) {
        //@ts-ignore
        const vertexBufferBinding = <VertexBufferBinding>value._vertexBufferBindings[0];
        const vertexCount = value.vertexCount;
        const elementCount = this._meshElement(value);
        const jointIndexBegin = SketchRenderer._jointIndexBegin;
        let newElementCount = elementCount;
        if (jointIndexBegin !== -1) {
            newElementCount += 3;
        }

        const buffer = new Float32Array(elementCount * vertexCount);
        vertexBufferBinding.buffer.getData(buffer);
        const uint8Buffer = new Uint8Array(buffer.buffer);

        const alignElementCount = Math.ceil(newElementCount / 4) * 4;
        this.shaderData.enableMacro("ELEMENT_COUNT", (alignElementCount / 4).toString());

        const width = Math.min(vertexCount, SketchRenderer._MAX_TEXTURE_ROWS) * alignElementCount;
        const height = Math.ceil(vertexCount / SketchRenderer._MAX_TEXTURE_ROWS);
        const alignBuffer = new Float32Array(width * height);

        for (let i = 0; i < vertexCount; i++) {
            for (let j = 0; j < newElementCount; j++) {
                if (jointIndexBegin !== -1 && j === jointIndexBegin) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 1) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 1];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 2) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 2];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 3) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 3];
                } else {
                    if (j > jointIndexBegin + 3) {
                        alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j - 3];
                    } else {
                        alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j];
                    }
                }
            }
        }
        this._createVerticesTexture(alignBuffer, width / 4, height);
        SketchRenderer._jointIndexBegin = -1;
    }

    private _createVerticesTexture(vertexBuffer: ArrayBufferView, width: number, height: number) {
        this._verticesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);
        this._verticesTexture.filterMode = TextureFilterMode.Point;
        this._verticesTexture.setPixelBuffer(vertexBuffer);

        this.shaderData.setTexture(SketchRenderer._verticesSamplerProp, this._verticesTexture);
        this.shaderData.setFloat(SketchRenderer._verticesTextureWidthProp, width);
        this.shaderData.setFloat(SketchRenderer._verticesTextureHeightProp, height);
    }

    private _meshElement(value: ModelMesh): number {
        const shaderData = this.shaderData;
        let elementCount = 0;
        //@ts-ignore
        const vertexElements = <VertexElement[]>value._vertexElements;
        for (let i = 0, n = vertexElements.length; i < n; i++) {
            const {semantic} = vertexElements[i];
            switch (semantic) {
                case "POSITION":
                    elementCount += 3;
                    break;
                case "NORMAL":
                    elementCount += 3;
                    //@ts-ignore
                    shaderData.enableMacro(SketchRenderer._normalMacro);
                    break;
                case "COLOR_0":
                    elementCount += 4;
                    //@ts-ignore
                    shaderData.enableMacro(SketchRenderer._vertexColorMacro);
                    break;
                case "WEIGHTS_0":
                    elementCount += 4;
                    shaderData.enableMacro(SketchRenderer._weightMacro);
                    break;
                case "JOINTS_0":
                    SketchRenderer._jointIndexBegin = elementCount;
                    elementCount += 1;
                    shaderData.enableMacro(SketchRenderer._jointMacro);
                    break;
                case "TANGENT":
                    //@ts-ignore
                    shaderData.enableMacro(SketchRenderer._tangentMacro);
                    elementCount += 4;
                    break;
                case "TEXCOORD_0":
                    //@ts-ignore
                    shaderData.enableMacro(SketchRenderer._uvMacro);
                    elementCount += 2;
                    break;
                case "TEXCOORD_1":
                    //@ts-ignore
                    shaderData.enableMacro(SketchRenderer._uv1Macro);
                    elementCount += 2;
                    break;
                case "TEXCOORD_2":
                    elementCount += 2;
                    break;
                case "TEXCOORD_3":
                    elementCount += 2;
                    break;
                case "TEXCOORD_4":
                    elementCount += 2;
                    break;
                case "TEXCOORD_5":
                    elementCount += 2;
                    break;
                case "TEXCOORD_6":
                    elementCount += 2;
                    break;
                case "TEXCOORD_7":
                    elementCount += 2;
                    break;
            }
        }
        return elementCount;
    }

    private _createLineSubMesh(mesh: ModelMesh): SubMesh {
        return new SubMesh(0, mesh.vertexCount * 2, MeshTopology.Lines);
    }

    private _createTriangleSubMesh(mesh: ModelMesh): SubMesh {
        let triangleCount = 0;
        const subMeshes = mesh.subMeshes;
        for (let i = 0; i < subMeshes.length; i++) {
            const subMesh = subMeshes[i];
            triangleCount += subMesh.count / 3;
        }
        return new SubMesh(0, triangleCount * 3);
    }

    private _destroy() {
        this._indicesTexture && this._indicesTexture.destroy();
        this._verticesTexture && this._verticesTexture.destroy();
    }
}