import {
    BlinnPhongMaterial,
    Camera,
    Color,
    DirectLight,
    MeshRenderer,
    MeshTopology,
    ModelMesh,
    PrimitiveMesh,
    Vector3,
    WebGLEngine,
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {NormalMaterial} from "./NormalMaterial";

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
const cube = cubeEntity.addComponent(MeshRenderer);
const cubeMesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
cube.setMaterial(new BlinnPhongMaterial(engine));
cube.mesh = cubeMesh;

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

const normalMaterial = new NormalMaterial(engine);
normalMaterial.mesh = cubeMesh;
const normalRenderer = cubeEntity.addComponent(MeshRenderer);
normalRenderer.setMaterial(normalMaterial);
normalRenderer.mesh = normalMesh;

// Run Engine
engine.run();