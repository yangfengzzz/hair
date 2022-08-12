import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {Camera, GLTFResource, MeshRenderer, WebGLEngine} from "oasis-engine";
import {GridMaterial, createGridPlane} from "./GridMaterial";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, 3);
cameraEntity.addComponent(OrbitControl);

const gridRenderer = rootEntity.addComponent(MeshRenderer);
gridRenderer.mesh = createGridPlane(engine);
gridRenderer.setMaterial(new GridMaterial(engine));

engine.resourceManager
    .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/267000040/9994/%25E5%25BD%2592%25E6%25A1%25A3.gltf")
    .then((gltf) => {
        rootEntity.addChild(gltf.defaultSceneRoot);
    });

engine.run();