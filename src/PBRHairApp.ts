import * as dat from "dat.gui";
import {OrbitControl} from "oasis-engine-toolkit";
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
    WebGLEngine,
} from "oasis-engine";

Logger.enable();
const gui = new dat.GUI();

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
    pause = true;
    private _time: number = 0;

    onUpdate(deltaTime: number) {
        if (!this.pause) {
            this._time += deltaTime / 20;
            if (this._time > 360) {
                this._time -= 360;
            }
            this.entity.transform.rotation.y = this._time;
        }
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

let rotate: RotateY;
let hairMaterial: PBRMaterial;

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("https://gw.alipayobjects.com/os/bmw-prod/e2369c5f-b1ce-41c4-8e82-78990336a6ae.gltf")
        .then((gltf) => {
            gltf.defaultSceneRoot.transform.setPosition(0, -1.3, 0);
            rotate = gltf.defaultSceneRoot.addComponent(RotateY);
            // gltf.defaultSceneRoot.addComponent(RotateX);
            // gltf.defaultSceneRoot.addComponent(RotateZ);

            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -0.2, 0);

            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            hairMaterial = <PBRMaterial>renderer.getMaterial();
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
    openDebug();
    engine.run();
});

function openDebug() {
    const info = {
        anisotropyDirectionX: 1,
        anisotropyDirectionY: 0,
        anisotropyDirectionZ: 0,

        baseColor: [0, 0, 0],
        pause: true,
        mainLightIntensity: 0.55,
        purpleLightIntensity: 0.15,
        ambientLightDiffuseIntensity: 0.5,
        ambientLightSpecularIntensity: 0.5,
    };

    gui.add(info, "pause").onChange((v) => {
        rotate.pause = !!v;
    });

    gui.add(hairMaterial, "anisotropy", -1, 1);
    gui.add(info, "anisotropyDirectionX").onChange((v) => {
        hairMaterial.anisotropyDirection.x = v;
    });
    gui.add(info, "anisotropyDirectionY").onChange((v) => {
        hairMaterial.anisotropyDirection.y = v;
    });
    gui.add(info, "anisotropyDirectionZ").onChange((v) => {
        hairMaterial.anisotropyDirection.z = v;
    });
    gui.addColor(info, "baseColor").onChange((v) => {
        hairMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    gui.add(hairMaterial, "roughness", 0, 1);
    gui.add(hairMaterial, "metallic", 0, 1);
    gui.add(hairMaterial, "normalTextureIntensity", 0, 1);
    gui.add(info, "mainLightIntensity").onChange((v) => {
        mainLight.intensity = v;
    });
    gui.add(info, "purpleLightIntensity").onChange((v) => {
        purpleLight.intensity = v;
    });
    gui.add(info, "ambientLightDiffuseIntensity").onChange((v) => {
        scene.ambientLight.diffuseIntensity = v;
    });
    gui.add(info, "ambientLightSpecularIntensity").onChange((v) => {
        scene.ambientLight.specularIntensity = v;
    });
}