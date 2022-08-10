import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    AmbientLight,
    AssetType,
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    PBRMaterial,
    Script,
    Texture2D,
    Vector3,
    WebGLEngine,
    BackgroundMode,
    PrimitiveMesh,
    UnlitMaterial
} from "oasis-engine";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(0.0, 0.5, 0.5, 1);
scene.background.mode = BackgroundMode.Sky;
const rootEntity = scene.createRootEntity();

class Rotate extends Script {
    totalTime = 0;
    target = new Vector3();

    onUpdate(deltaTime: number) {
        this.totalTime += deltaTime / 1000;
        this.entity.transform.setPosition(0.3 * Math.sin(this.totalTime), 0.3, 0.3 * Math.cos(this.totalTime));
        this.entity.transform.lookAt(this.target);
    }
}

const directLightNode = rootEntity.createChild("dir_light");
const light = directLightNode.addComponent(DirectLight);
light.color.set(1, 0.3, 0.3, 1);
const renderer = directLightNode.addComponent(MeshRenderer);
renderer.mesh = PrimitiveMesh.createSphere(engine, 0.03);
renderer.setMaterial(new UnlitMaterial(engine));
directLightNode.addComponent(Rotate);
// directLightNode.transform.setPosition(0.3, 0.3, 0.3);
// directLightNode.transform.lookAt(new Vector3());

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
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

            const renderers: MeshRenderer[] = [];
            entity.getComponentsIncludeChildren(MeshRenderer, renderers);
            renderers[1]._onDisable(); // remove yellow cover
        }),
    engine.resourceManager
        .load<AmbientLight>({
            type: AssetType.Env,
            url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin"
        })
        .then((ambientLight) => {
            scene.ambientLight = ambientLight;
            ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
            ambientLight.diffuseIntensity = 0.1;
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
                            hairMaterial.isTransparent = true;
                            hairMaterial.tilingOffset.set(1, 1, 0, -0.015);
                            hairMaterial.baseTexture = hair;
                            hairMaterial.normalTexture = normal;
                            hairMaterial.roughness = 0.5;
                            hairMaterial.metallic = 1.0;
                        })
                })
        })
]).then(() => {
    engine.run();
});