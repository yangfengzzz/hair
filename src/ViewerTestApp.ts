import {Camera, WebGLEngine} from "oasis-engine";
import {Viewer} from "./Viewer";
import {OrbitControl} from "@oasis-engine-toolkit/controls";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();

const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
cameraNode.addComponent(Camera);
const controller = cameraNode.addComponent(OrbitControl);

const viewer = rootEntity.addComponent(Viewer);
viewer.controller = controller;

engine.run();