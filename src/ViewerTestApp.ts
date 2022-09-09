import {WebGLEngine} from "oasis-engine";
import {Viewer} from "./Viewer";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();

const viewer = rootEntity.addComponent(Viewer);

engine.run();