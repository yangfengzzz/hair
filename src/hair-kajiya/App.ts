import * as dat from "dat.gui";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    Script,
    Texture2D,
    WebGLEngine,
    AmbientLight,
    AssetType,
    PBRMaterial,
    PrimitiveMesh,
    UnlitMaterial,
    Entity
} from "oasis-engine";
import {PBRHairMaterial} from "./PBRHairMaterial";
import {SimpleDropzone} from "simple-dropzone";

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

mainLightEntity.transform.setPosition(0, 0, 0.5);
mainLightEntity.transform.setRotation(-22, 0, 0);
purpleLightEntity.transform.setPosition(0, 0, -0.5);
purpleLightEntity.transform.setRotation(0, 210, 0);
mainLight.intensity = 0.55;
purpleLight.intensity = 0.15;
purpleLight.color.set(189 / 255, 16 / 255, 224 / 255, 1.0);

const mainLightRenderer = mainLightEntity.addComponent(MeshRenderer);
mainLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
mainLightRenderer.setMaterial(new UnlitMaterial(engine));
const purpleLightRenderer = purpleLightEntity.addComponent(MeshRenderer);
purpleLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
purpleLightRenderer.setMaterial(new UnlitMaterial(engine));

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

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

//----------------------------------------------------------------------------------------------------------------------
let hairMaterial: PBRHairMaterial = null;
let specularShiftTexture: Texture2D = null;

let rotate: RotateY = null;
let gltfRootEntity: Entity = null;

const dropEl = document.querySelector('#dropzone');
const inputEl = document.querySelector('#input');
const dropCtrl = new SimpleDropzone(dropEl, inputEl);
dropCtrl.on('drop', ({files}) => {
    loadFileMaps(files);
});

function loadFileMaps(files: Map<string, File>) {
    const modelReg = /\.(gltf|glb)$/i;
    const imgReg = /\.(jpg|jpeg|png)$/i;
    const envReg = /\.(hdr|hdri)$/i;

    let mainFile: File;
    let type = "gltf";

    const filesMap = {}; // [fileName]:LocalUrl
    const fileArray: any = Array.from(files); // ['/*/*.*',obj:File]

    fileArray.some((f) => {
        const file = f[1];
        if (modelReg.test(file.name)) {
            type = RegExp.$1;
            mainFile = file;
            return true;
        }

        return false;
    });

    fileArray.forEach((f) => {
        const file = f[1];
        if (!modelReg.test(file.name)) {
            const url = URL.createObjectURL(file);
            const fileName = file.name;
            filesMap[fileName] = url;
            if (imgReg.test(fileName)) {
                addTexture(fileName, url);
            } else if (envReg.test(fileName)) {
                // addEnv(fileName, url);
            }
        }
    });

    if (mainFile) {
        const url = URL.createObjectURL(mainFile);
        loadModel(url, filesMap, type as any);
    }
}

const textures: Record<string, Texture2D> = {};

function addTexture(name: string, url: string) {
    const repeat = Object.keys(textures).find((textureName) => textureName === name);
    if (repeat) {
        console.warn(`${name} 已经存在，请更换图片名字重新上传`);
        return;
    }
    engine.resourceManager
        .load<Texture2D>({
            type: AssetType.Texture2D,
            url
        })
        .then((texture) => {
            textures[name] = texture;
            specularShiftTexture = texture;
            if (hairMaterial) {
                hairMaterial.specularShiftTexture = texture;
            }
            console.log("图片上传成功！", name);
        });
}

function loadModel(url: string, filesMap: Record<string, string>, type: "gltf" | "glb") {
    destroyGLTF();

    // replace relative path
    if (type.toLowerCase() === "gltf") {
        engine.resourceManager
            .load({
                type: AssetType.JSON,
                url
            })
            .then((gltf: any) => {
                gltf.buffers.concat(gltf.images).forEach((item) => {
                    if (!item) return;
                    let {uri} = item;
                    if (uri) {
                        let index = uri.lastIndexOf("/");
                        if (index > -1) {
                            uri = uri.substr(index + 1);
                        }
                        if (filesMap[uri]) {
                            item.uri = filesMap[uri];
                        }
                    }
                });
                const blob = new Blob([JSON.stringify(gltf)]);
                const urlNew = URL.createObjectURL(blob);
                engine.resourceManager
                    .load<GLTFResource>({
                        type: AssetType.Prefab,
                        url: `${urlNew}#.gltf`
                    })
                    .then((asset) => {
                        handleGltfResource(asset);
                    })
                    .catch(() => {
                        console.log("Fail loader")
                    });
            });
    } else {
        engine.resourceManager
            .load<GLTFResource>({
                type: AssetType.Prefab,
                url: `${url}#.glb`
            })
            .then((asset) => {
                handleGltfResource(asset);
            })
            .catch(() => {
                console.log("Fail loader")
            });
    }
}

function destroyGLTF() {
    if (gltfRootEntity) {
        gltfRootEntity.destroy();
    }

    if (hairMaterial) {
        hairMaterial.destroy(true);
    }
}

function handleGltfResource(gltf: GLTFResource) {
    gltfRootEntity = gltf.defaultSceneRoot.clone();
    rotate = gltfRootEntity.addComponent(RotateY);
    // gltf.defaultSceneRoot.addComponent(RotateX);
    // gltf.defaultSceneRoot.addComponent(RotateZ);

    rootEntity.addChild(gltfRootEntity);
    gltfRootEntity.transform.setPosition(0, -1.5, 0);

    const renderer = gltfRootEntity.findByName("Hair_16").getComponent(MeshRenderer);
    const material = <PBRMaterial>renderer.getMaterial();

    hairMaterial = new PBRHairMaterial(engine);
    hairMaterial.roughness = material.roughness;
    hairMaterial.metallic = material.metallic;
    hairMaterial.baseColor = material.baseColor;
    hairMaterial.baseTexture = material.baseTexture;
    hairMaterial.normalTexture = material.normalTexture;
    hairMaterial.normalTextureIntensity = material.normalTextureIntensity;
    hairMaterial.occlusionTexture = material.occlusionTexture;
    hairMaterial.occlusionTextureIntensity = material.occlusionTextureIntensity;
    hairMaterial.occlusionTextureCoord = material.occlusionTextureCoord;

    hairMaterial.specularShiftTexture = specularShiftTexture;
    hairMaterial.specularWidth = 1.0;
    hairMaterial.specularScale = 0.15;
    hairMaterial.specularPower = 64.0;

    hairMaterial.primaryColor.set(1, 1, 1, 1);
    hairMaterial.primaryShift = 0.25;
    hairMaterial.secondaryColor.set(1, 1, 1, 1);
    hairMaterial.secondaryShift = 0.25;
    renderer.setMaterial(hairMaterial);

    openDebug();
}

Promise.all([
    engine.resourceManager
        .load<AmbientLight>({
            type: AssetType.Env,
            url: 'https://gw.alipayobjects.com/os/bmw-prod/67b05052-ecf8-46f1-86ff-26d9abcc83ea.bin',
        })
        .then((ambientLight) => {
            ambientLight.diffuseIntensity = ambientLight.specularIntensity = 0.5;
            scene.ambientLight = ambientLight;
        }),
    engine.resourceManager
        .load<Texture2D>({
            type: AssetType.Texture2D,
            url: 'https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*c0I7QbEzqYoAAAAAAAAAAAAAARQnAQ'
        })
        .then((shift) => {
            specularShiftTexture = shift;
        })
]).then(() => {
    engine.run();
});

function openDebug() {
    const info = {
        baseColor: [0, 0, 0],
        primaryColor: [255, 255, 255],
        secondaryColor: [255, 255, 255],
        pause: true,
        mainLightIntensity: 0.55,
        purpleLightIntensity: 0.15,
        ambientLightDiffuseIntensity: 0.5,
        ambientLightSpecularIntensity: 0.5,
    };

    gui.add(info, "pause").onChange((v) => {
        rotate.pause = !!v;
    });

    const materialFolder = gui.addFolder("Material");
    materialFolder.addColor(info, "baseColor").onChange((v) => {
        hairMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    materialFolder.add(hairMaterial, "specularWidth", 0, 1);
    materialFolder.add(hairMaterial, "specularScale", 0, 1);
    materialFolder.add(hairMaterial, "specularPower", 0, 100);
    materialFolder.add(hairMaterial, "primaryShift", -1, 1);
    materialFolder.addColor(info, "primaryColor").onChange((v) => {
        hairMaterial.primaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    materialFolder.add(hairMaterial, "secondaryShift", -1, 1);
    materialFolder.addColor(info, "secondaryColor").onChange((v) => {
        hairMaterial.secondaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    materialFolder.add(hairMaterial, "roughness", 0, 1);
    materialFolder.add(hairMaterial, "metallic", 0, 1);
    materialFolder.add(hairMaterial, "normalTextureIntensity", 0, 1);

    const sceneFolder = gui.addFolder("Scene Light");
    sceneFolder.add(info, "mainLightIntensity").onChange((v) => {
        mainLight.intensity = v;
    });
    sceneFolder.add(info, "purpleLightIntensity").onChange((v) => {
        purpleLight.intensity = v;
    });
    sceneFolder.add(info, "ambientLightDiffuseIntensity").onChange((v) => {
        scene.ambientLight.diffuseIntensity = v;
    });
    sceneFolder.add(info, "ambientLightSpecularIntensity").onChange((v) => {
        scene.ambientLight.specularIntensity = v;
    });
}