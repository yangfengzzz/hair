import {
    BlinnPhongMaterial,
    Camera,
    Color,
    DirectLight,
    MeshRenderer,
    PrimitiveMesh,
    Vector3,
    WebGLEngine,
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {NormalWireframe} from "./NormalWireframe";
import * as dat from "dat.gui";

const gui = new dat.GUI();

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
const sceneEntity = rootEntity.createChild();
const renderer = sceneEntity.addComponent(MeshRenderer);
// const mesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
const mesh = PrimitiveMesh.createSphere(engine, 2, 20);
renderer.setMaterial(new BlinnPhongMaterial(engine));
renderer.mesh = mesh;

const wireframe = sceneEntity.addComponent(NormalWireframe);
wireframe.scale = 0.2;

openDebug();
engine.run();

function openDebug() {
    const info = {
        baseColor: [0, 0, 0],
    };

    gui.add(wireframe, "scale", 0, 1);
}