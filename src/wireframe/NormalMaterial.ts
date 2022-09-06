import {
    BaseMaterial, Engine, Matrix,
    ModelMesh,
    Shader,
    Texture2D, TextureFilterMode, TextureFormat,
    VertexBufferBinding, VertexElement
} from "oasis-engine";

Shader.create("normalShader",
    `
   uniform sampler2D u_vertexSampler;
   uniform float u_textureWidth;
   uniform float u_textureHeight;
   
   uniform float u_lineScale;
   uniform mat4 u_VPMat;
   uniform mat4 u_worldMatrix;
   
#ifdef O3_USE_JOINT_TEXTURE
    uniform sampler2D u_jointSampler;
    uniform float u_jointCount;

    mat4 getJointMatrix(sampler2D smp, float index) {
        float base = index / u_jointCount;
        float hf = 0.5 / u_jointCount;
        float v = base + hf;

        vec4 m0 = texture2D(smp, vec2(0.125, v ));
        vec4 m1 = texture2D(smp, vec2(0.375, v ));
        vec4 m2 = texture2D(smp, vec2(0.625, v ));
        vec4 m3 = texture2D(smp, vec2(0.875, v ));

        return mat4(m0, m1, m2, m3);
    }
#else
    uniform mat4 u_jointMatrix[ O3_JOINTS_NUM ];
#endif
   
   vec4 getVertexElement(float row, float col) {
        return texture2D(u_vertexSampler, vec2((row + 0.5) / u_textureWidth, (col + 0.5) / u_textureHeight ));
   }
   
   vec2 getVec2(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        return vec2(x, y);
   }
   
   vec3 getVec3(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
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
   
   vec4 getVec4(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
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
        int pointIndex = gl_VertexID / 2;
        int col = pointIndex % int(u_textureHeight);
        int row = pointIndex / int(u_textureHeight) + (col > 0? 1 : 0);
        
        vec4 rows[ELEMENT_COUNT];
        for( int i = 0; i < ELEMENT_COUNT; i++ ) {
            rows[i] = getVertexElement(float(row * ELEMENT_COUNT + i), float(col));
        }
        
        vec3 POSITION = vec3(rows[0].x, rows[0].y, rows[0].z);        
        int row_index = 0;
        int value_index = 2;
#ifdef O3_HAS_NORMAL 
        vec3 NORMAL = getVec3(rows, row_index, value_index);
#endif

#ifdef O3_HAS_VERTEXCOLOR
        vec4 COLOR_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_WEIGHT
        vec4 WEIGHTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_JOINT
        vec4 JOINTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_TANGENT
        vec4 TANGENT = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_UV
        vec2 TEXCOORD_0 = getVec2(rows, row_index, value_index);
#endif

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <skinning_vert>
        
        if (gl_VertexID % 2 == 1) {
            position.xyz += normal * u_lineScale;
        }
        
        #ifndef O3_HAS_SKIN
            gl_Position = u_worldMatrix * position; 
        #endif
        gl_Position = u_VPMat * position; 
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

    private static _vertexSamplerProp = Shader.getPropertyByName("u_vertexSampler");
    private static _textureHeightProp = Shader.getPropertyByName("u_textureHeight");
    private static _textureWidthProp = Shader.getPropertyByName("u_textureWidth");
    private static _lineScaleProp = Shader.getPropertyByName("u_lineScale");
    private static _worldMatrixProp = Shader.getPropertyByName("u_worldMatrix");
    private static _MAX_TEXTURE_ROWS = 4096;
    private static _jointIndexBegin = -1;

    private _modelMesh: ModelMesh;
    private _meshTexture: Texture2D;

    set worldMatrix(value: Matrix) {
        this.shaderData.setMatrix(NormalMaterial._worldMatrixProp, value);
    }

    set scale(value: number) {
        this.shaderData.setFloat(NormalMaterial._lineScaleProp, value);
    }

    set mesh(value: ModelMesh) {
        this._modelMesh = value;
        //@ts-ignore
        const vertexBufferBinding = <VertexBufferBinding>value._vertexBufferBindings[0];
        const vertexCount = value.vertexCount;
        const elementCount = this._meshElement(value);
        const jointIndexBegin = NormalMaterial._jointIndexBegin;
        let newElementCount = elementCount;
        if (jointIndexBegin !== -1) {
            newElementCount += 3;
        }

        const buffer = new Float32Array(elementCount * vertexCount);
        vertexBufferBinding.buffer.getData(buffer);
        const uint8Buffer = new Uint8Array(buffer.buffer);

        const alignElementCount = Math.ceil(newElementCount / 4) * 4;
        this.shaderData.enableMacro("ELEMENT_COUNT", (alignElementCount / 4).toString());

        const width = Math.ceil(vertexCount / NormalMaterial._MAX_TEXTURE_ROWS) * alignElementCount;
        const height = Math.min(vertexCount, NormalMaterial._MAX_TEXTURE_ROWS);
        const alignBuffer = new Float32Array(width * height);

        for (let i = 0; i < vertexCount; i++) {
            for (let j = 0; j < elementCount; j++) {
                if (jointIndexBegin !== -1 && j === jointIndexBegin) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 1) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 1];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 2) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 2];
                } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 3) {
                    alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 3];
                } else {
                    alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j];
                }
            }
        }
        this._createMeshTexture(alignBuffer, width / 4, height);
        NormalMaterial._jointIndexBegin = -1;
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("normalShader"));
    }

    private _createMeshTexture(vertexBuffer: ArrayBufferView, width: number, height: number) {
        this._meshTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);
        this._meshTexture.filterMode = TextureFilterMode.Point;
        this._meshTexture.setPixelBuffer(vertexBuffer);

        this.shaderData.setTexture(NormalMaterial._vertexSamplerProp, this._meshTexture);
        this.shaderData.setFloat(NormalMaterial._textureWidthProp, width);
        this.shaderData.setFloat(NormalMaterial._textureHeightProp, height);
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
                    NormalMaterial._jointIndexBegin = elementCount;
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
}