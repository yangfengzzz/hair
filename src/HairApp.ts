import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    PBRMaterial,
    Script,
    Texture2D,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {HairMaterial} from "./HairMaterial";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const {ambientLight, background} = scene;
ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
background.solidColor.set(0.0, 0.5, 0.5, 1);
const rootEntity = scene.createRootEntity();

class Rotate extends Script {
    totalTime = 0;
    target = new Vector3();
    onUpdate(deltaTime: number) {
        this.totalTime += deltaTime / 1000;
        this.entity.transform.setPosition(10 * Math.sin(this.totalTime), -1.5, 10 * Math.cos(this.totalTime));
        this.entity.transform.lookAt(this.target);
    }
}

const directLightNode = rootEntity.createChild("dir_light");
directLightNode.addComponent(DirectLight);
directLightNode.addComponent(Rotate);
// directLightNode.transform.setPosition(-10, -1.5, -10);
// directLightNode.transform.lookAt(new Vector3());

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, -1);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

let hairMaterial: PBRMaterial = null;

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/676000145/1682/Pocolov%252520Hair%25252016.gltf")
        .then((gltf) => {
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -1.5, 0);
            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            hairMaterial = <PBRMaterial>renderer.getMaterial();

            const renderers:MeshRenderer[] = [];
            entity.getComponentsIncludeChildren(MeshRenderer, renderers);
            renderers[1]._onDisable(); // remove yellow cover
        }),
    engine.resourceManager
        .load<Texture2D>("http://30.46.128.43:8000/shift.png")
        .then((shift) => {
            engine.resourceManager
                .load<Texture2D>("https://gw.alipayobjects.com/zos/OasisHub/676000145/7692/Hair_01_Gray.png")
                .then((hair) => {
                    engine.resourceManager
                        .load<Texture2D>("http://30.46.128.43:8000/Hair_01N.png")
                        .then((normal) => {
                            hairMaterial.baseTexture = hair;
                            hairMaterial.normalTexture = normal;
                        })
                })
        })
]).then(() => {
    engine.run();
});