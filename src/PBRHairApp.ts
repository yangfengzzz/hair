import {OrbitControl} from "oasis-engine-toolkit";
import {
    AmbientLight,
    AssetType,
    Camera,
    DirectLight,
    GLTFResource,
    Layer,
    Logger,
    MeshRenderer,
    PBRMaterial,
    Script,
    UnlitMaterial,
    WebGLEngine,
    PrimitiveMesh
} from "oasis-engine";
import {Gizmo} from "./Gizmo";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(0.0, 0.5, 0.5, 1);
const rootEntity = scene.createRootEntity();

const mainLightEntity = rootEntity.createChild('mainLight');
const mainLight = mainLightEntity.addComponent(DirectLight);
const purpleLightEntity = rootEntity.createChild('purpleLight');
const purpleLight = purpleLightEntity.addComponent(DirectLight);

mainLightEntity.transform.setRotation(-22, 0, 0);
purpleLightEntity.transform.setRotation(0, 210, 0);
mainLight.intensity = 0.55;
purpleLight.intensity = 0.15;
purpleLight.color.set(189 / 255, 16 / 255, 224 / 255, 1.0);

//Create camera
const cameraNode = rootEntity.createChild("camera");
cameraNode.transform.setPosition(0, 0, 1);
const camera = cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

class RotateX extends Script {
    private _time: number = -30;

    onUpdate(deltaTime: number) {
        this._time += deltaTime / 100;
        if (this._time > 30) {
            this._time -= 60;
        }
        this.entity.transform.rotation.x = this._time;
    }
}

class RotateY extends Script {
    private _time: number = 0;

    onUpdate(deltaTime: number) {
        this._time += deltaTime / 100;
        if (this._time > 360) {
            this._time -= 360;
        }
        this.entity.transform.rotation.y = this._time;
    }
}

class RotateZ extends Script {
    private _time: number = -30;

    onUpdate(deltaTime: number) {
        this._time += deltaTime / 100;
        if (this._time > 30) {
            this._time -= 60;
        }
        this.entity.transform.rotation.z = this._time;
    }
}

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://30.46.128.40:8000/ant.glb")
        .then((gltf) => {
            gltf.defaultSceneRoot.transform.setPosition(0, -1.3, 0);
            // gltf.defaultSceneRoot.addComponent(RotateX);
            // gltf.defaultSceneRoot.addComponent(RotateY);
            // gltf.defaultSceneRoot.addComponent(RotateZ);

            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -0.2, 0);

            const box = entity.addComponent(MeshRenderer);
            box.mesh = PrimitiveMesh.createSphere(engine, 0.1);
            box.setMaterial(new UnlitMaterial(engine));
            rootEntity.addComponent(Gizmo);
            entity.layer = Layer.Layer20;

            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            const hairMaterial = <PBRMaterial>renderer.getMaterial();
            hairMaterial.anisotropy = -1;
        }),
    engine.resourceManager
        .load<AmbientLight>({
            type: AssetType.Env,
            url: 'https://gw.alipayobjects.com/os/bmw-prod/67b05052-ecf8-46f1-86ff-26d9abcc83ea.bin',
        })
        .then((ambientLight) => {
            ambientLight.diffuseIntensity = ambientLight.specularIntensity = 0.5;
            scene.ambientLight = ambientLight;
        })
]).then(() => {
    engine.run();
});