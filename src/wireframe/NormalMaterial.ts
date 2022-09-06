import {
    BaseMaterial, Engine,
    ModelMesh,
    Shader,
    Texture2D, TextureFilterMode, TextureFormat,
    VertexBufferBinding, VertexElement
} from "oasis-engine";

Shader.create("normalShader",
    `
   uniform sampler2D u_vertexSampler;
   uniform float u_vertexCount;
   uniform float u_rowCount;
   uniform mat4 u_MVPMat;
   vec4 getVertexElement(float row, float col) {
        float base = col / u_vertexCount;
        float hf = 0.5 / u_vertexCount;
        float v = base + hf;
        
        float rowWidth = 1.0 / u_rowCount;
        return texture2D(u_vertexSampler, vec2(rowWidth * 0.5 + rowWidth * row, v ));
   }
   
   void main() {
        int col = gl_VertexID / 2;
        vec4 row1 = getVertexElement(0.0, float(col));
        vec4 row2 = getVertexElement(1.0, float(col));
        
        vec3 position = vec3(row1.x, row1.y, row1.z);
        vec3 normal = vec3(row1.w, row2.x, row2.y);
        if (gl_VertexID % 2 == 1) {
            position += normal;
        }
        gl_Position = u_MVPMat * vec4(position, 1.0); 

   }
   
    `, `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    `);

export class NormalMaterial extends BaseMaterial {
    protected static _vertexSamplerProp = Shader.getPropertyByName("u_vertexSampler");
    protected static _vertexCountProp = Shader.getPropertyByName("u_vertexCount");
    protected static _rowCountProp = Shader.getPropertyByName("u_rowCount");

    private _modelMesh: ModelMesh;
    private _meshTexture: Texture2D;

    set mesh(value: ModelMesh) {
        this._modelMesh = value;
        //@ts-ignore
        const vertexBufferBinding = <VertexBufferBinding>value._vertexBufferBindings[0];
        const vertexCount = value.vertexCount;
        const elementCount = this._meshElement(value);
        const buffer = new Float32Array(elementCount * vertexCount);
        vertexBufferBinding.buffer.getData(buffer);

        const alignElementCount = Math.ceil(elementCount / 4) * 4;
        const extraElementCount = alignElementCount - elementCount;
        if (extraElementCount > 0) {
            const alignBuffer = new Float32Array(alignElementCount * vertexCount);
            for (let i = 0; i < vertexCount; i++) {
                for (let j = 0; j < elementCount; j++) {
                    alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j];
                }
            }
            this._createMeshTexture(buffer, vertexCount, alignElementCount / 4);
        } else {
            this._createMeshTexture(buffer, vertexCount, elementCount / 4);
        }
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("normalShader"));
    }

    private _meshElement(value: ModelMesh): number {
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
                    break;
                case "COLOR_0":
                    elementCount += 4;
                    break;
                case "WEIGHTS_0":
                    elementCount += 4;
                    break;
                case "JOINTS_0":
                    elementCount += 1;
                    break;
                case "TANGENT":
                    elementCount += 4;
                    break;
                case "TEXCOORD_0":
                    elementCount += 2;
                    break;
                case "TEXCOORD_1":
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

    private _createMeshTexture(vertexBuffer: ArrayBufferView, vertexCount: number, rowCount: number) {
        const engine = this.engine;
        this._meshTexture = new Texture2D(engine, rowCount, vertexCount, TextureFormat.R32G32B32A32, false);
        this._meshTexture.filterMode = TextureFilterMode.Point;
        this._meshTexture.setPixelBuffer(vertexBuffer);

        this.shaderData.setTexture(NormalMaterial._vertexSamplerProp, this._meshTexture);
        this.shaderData.setFloat(NormalMaterial._vertexCountProp, vertexCount);
        this.shaderData.setFloat(NormalMaterial._rowCountProp, rowCount);
    }
}