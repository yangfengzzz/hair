import {
    BaseMaterial,
    BlinnPhongMaterial,
    Camera,
    Color,
    DirectLight,
    MeshRenderer,
    MeshTopology,
    ModelMesh,
    PrimitiveMesh,
    Shader, Texture2D, TextureFilterMode, TextureFormat,
    Vector3,
    VertexBufferBinding,
    WebGLEngine
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {Engine} from "_oasis-engine@0.8.0-beta.14@oasis-engine";

// Init Engine
const engine = new WebGLEngine("canvas");
// Adapter to screen
engine.canvas.resizeByClientSize();

// Get root entity of current scene
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity("root");

// Init Camera
const cameraEntity = rootEntity.createChild("camera_entity");
cameraEntity.transform.position = new Vector3(0, 5, 10);
cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
cameraEntity.addComponent(OrbitControl);
cameraEntity.addComponent(Camera);

// Create a entity to add light component
const lightEntity = rootEntity.createChild("light");

// Create light component
const directLight = lightEntity.addComponent(DirectLight);
directLight.color = new Color(1.0, 1.0, 1.0);
directLight.intensity = 0.5;

// Control light direction by entity's transform
lightEntity.transform.rotation = new Vector3(45, 45, 45);

// Create Cube
const cubeEntity = rootEntity.createChild("cube");
// const cube = cubeEntity.addComponent(MeshRenderer);
const cubeMesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
// cube.setMaterial(new BlinnPhongMaterial(engine));
// cube.mesh = cubeMesh;

const normalMesh = new ModelMesh(engine);
const vertexCount = cubeMesh.vertexCount * 2;
const indices = new Uint16Array(vertexCount);
const positions: Vector3[] = new Array(vertexCount);
for (let i = 0; i < vertexCount; i++) {
    indices[i] = i;
    positions[i] = new Vector3();
}
normalMesh.setPositions(positions);
normalMesh.setIndices(indices);
normalMesh.uploadData(true);
normalMesh.addSubMesh(0, vertexCount, MeshTopology.Lines);

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
        vec4 row1 = getVertexElement(0, col);
        vec4 row2 = getVertexElement(1, col);
        
        gl_Position = vec4(row1.x, row1.y, row1.z, 1.0);
        if (gl_VertexID % 2 == 1) {
            gl_Position.y += 1.0;
        }
        gl_Position = u_MVPMat * gl_Position; 

   }
   
    `, `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    `);

class NormalMaterial extends BaseMaterial {
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
        const buffer = new Float32Array(8 * vertexCount);
        vertexBufferBinding.buffer.getData(buffer);
        this._createJointTexture(buffer, vertexCount);
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("normalShader"));
    }

    private _createJointTexture(vertexBuffer: ArrayBufferView, vertexCount: number) {
        const engine = this.engine;
        const rowCount = (3 + 3 + 2) / 4;
        this._meshTexture = new Texture2D(engine, rowCount, vertexCount, TextureFormat.R32G32B32A32, false);
        this._meshTexture.filterMode = TextureFilterMode.Point;
        this._meshTexture.setPixelBuffer(vertexBuffer);

        this.shaderData.setTexture(NormalMaterial._vertexSamplerProp, this._meshTexture);
        this.shaderData.setFloat(NormalMaterial._vertexCountProp, vertexCount);
        this.shaderData.setFloat(NormalMaterial._rowCountProp, rowCount);
    }
}

const normalMaterial = new NormalMaterial(engine);
normalMaterial.mesh = cubeMesh;
const normalRenderer = cubeEntity.addComponent(MeshRenderer);
normalRenderer.setMaterial(normalMaterial);
normalRenderer.mesh = normalMesh;

// Run Engine
engine.run();