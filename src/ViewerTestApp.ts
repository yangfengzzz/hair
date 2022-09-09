import {WebGLEngine} from "oasis-engine";
import {ViewerTest} from "./ViewerTest";

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();
rootEntity.addComponent(ViewerTest);

engine.run();