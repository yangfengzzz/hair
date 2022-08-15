import * as dat from "dat.gui";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {Camera, GLTFResource, MeshRenderer, WebGLEngine} from "oasis-engine";
import {GridMaterial, createGridPlane} from "./GridMaterial";

const gui = new dat.GUI();

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
const camera = cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, 3);
cameraEntity.addComponent(OrbitControl);

const gridRenderer = rootEntity.addComponent(MeshRenderer);
gridRenderer.mesh = createGridPlane(engine);
const gridMaterial = new GridMaterial(engine);
gridMaterial.nearClipPlane = camera.nearClipPlane;
gridMaterial.farClipPlane = camera.farClipPlane;
gridRenderer.setMaterial(gridMaterial);

engine.resourceManager
    .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/267000040/9994/%25E5%25BD%2592%25E6%25A1%25A3.gltf")
    .then((gltf) => {
        rootEntity.addChild(gltf.defaultSceneRoot);
    });

openDebug();
engine.run();

function openDebug() {
    gui.add(gridMaterial, "nearClipPlane", 0, 1);
    gui.add(gridMaterial, "farClipPlane", 0, 100);
    gui.add(gridMaterial, "primaryScale", 0, 100, 1);
    gui.add(gridMaterial, "secondaryScale", 0, 10, 1);
}