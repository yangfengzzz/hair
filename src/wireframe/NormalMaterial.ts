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
   uniform mat4 u_MVPMat;
   
   vec4 getVertexElement(float row, float col) {
        float base = col / u_vertexCount;
        float hf = 0.5 / u_vertexCount;
        float v = base + hf;
        
        float rowWidth = 1.0 / float(ROW_COUNT);
        return texture2D(u_vertexSampler, vec2(rowWidth * 0.5 + rowWidth * row, v ));
   }
   
   vec2 getVec2(inout vec4[ROW_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        return vec2(x, y);
   }
   
   vec3 getVec3(inout vec4[ROW_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float z = rows[row_index][value_index];
        return vec3(x, y, z);
   }
   
   vec4 getVec4(inout vec4[ROW_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float z = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float w = rows[row_index][value_index];
        return vec4(x, y, z, w);
   }
   
   void main() {
        int col = gl_VertexID / 2;
        vec4 rows[ROW_COUNT];
        for( int i = 0; i < ROW_COUNT; i++ ) {
            rows[i] = getVertexElement(float(i), float(col));
        }
        
        vec3 position = vec3(rows[0].x, rows[0].y, rows[0].z);        
        int row_index = 0;
        int value_index = 2;
#ifdef O3_HAS_NORMAL 
        vec3 normal = getVec3(rows, row_index, value_index);
#endif

#ifdef O3_HAS_VERTEXCOLOR
        vec3 color = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_WEIGHT
        vec4 weight = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_JOINT
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float joint = rows[row_index][value_index];
#endif

#ifdef O3_HAS_TANGENT
        vec4 tangent = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_UV
        vec2 uv = getVec2(rows, row_index, value_index);
#endif
        
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
    private static _uvMacro = Shader.getMacroByName("O3_HAS_UV");
    private static _uv1Macro = Shader.getMacroByName("O3_HAS_UV1");
    private static _normalMacro = Shader.getMacroByName("O3_HAS_NORMAL");
    private static _tangentMacro = Shader.getMacroByName("O3_HAS_TANGENT");
    private static _weightMacro = Shader.getMacroByName("O3_HAS_WEIGHT");
    private static _jointMacro = Shader.getMacroByName("O3_HAS_JOINT");
    private static _vertexColorMacro = Shader.getMacroByName("O3_HAS_VERTEXCOLOR");

    protected static _vertexSamplerProp = Shader.getPropertyByName("u_vertexSampler");
    protected static _vertexCountProp = Shader.getPropertyByName("u_vertexCount");

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
                    shaderData.enableMacro(NormalMaterial._normalMacro);
                    break;
                case "COLOR_0":
                    elementCount += 4;
                    shaderData.enableMacro(NormalMaterial._vertexColorMacro);
                    break;
                case "WEIGHTS_0":
                    elementCount += 4;
                    shaderData.enableMacro(NormalMaterial._weightMacro);
                    break;
                case "JOINTS_0":
                    elementCount += 1;
                    shaderData.enableMacro(NormalMaterial._jointMacro);
                    break;
                case "TANGENT":
                    shaderData.enableMacro(NormalMaterial._tangentMacro);
                    elementCount += 4;
                    break;
                case "TEXCOORD_0":
                    shaderData.enableMacro(NormalMaterial._uvMacro);
                    elementCount += 2;
                    break;
                case "TEXCOORD_1":
                    shaderData.enableMacro(NormalMaterial._uv1Macro);
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
        this.shaderData.enableMacro("ROW_COUNT", rowCount.toString());
    }
}