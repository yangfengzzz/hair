import {SimpleDropzone} from "simple-dropzone";
import {
    AmbientLight,
    AnimationClip, Animator,
    AssetType, BackgroundMode, BoundingBox, Camera, Color, Entity, GLTFResource,
    Material, MeshRenderer,
    PBRBaseMaterial, PBRMaterial,
    PBRSpecularMaterial, Renderer,
    Script, SkyBoxMaterial,
    Texture2D,
    UnlitMaterial, Vector3, WebGLEngine
} from "oasis-engine";
import * as dat from "dat.gui";
import {OrbitControl} from "@oasis-engine-toolkit/controls";

const envList = {
    sunset: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin",
    pisa: "https://gw.alipayobjects.com/os/bmw-prod/6470ea5e-094b-4a77-a05f-4945bf81e318.bin",
    park: "https://gw.alipayobjects.com/os/bmw-prod/37f204c2-bc5b-4344-a368-8251bbeb0717.bin",
    foot_2K: "https://gw.alipayobjects.com/os/bmw-prod/23c1893a-fe29-4e91-bd6a-bb1c4201a876.bin"
};

export abstract class ViewerBase extends Script {
    static guiToColor(gui: number[], color: Color) {
        color.set(gui[0] / 255, gui[1] / 255, gui[2] / 255, color.a);
    }

    static colorToGui(color: Color = new Color(1, 1, 1)): number[] {
        const v = [];
        v[0] = color.r * 255;
        v[1] = color.g * 255;
        v[2] = color.b * 255;
        return v;
    }

    // drop loader
    dropEl = document.querySelector('#dropzone');
    inputEl = document.querySelector('#input');
    dropCtrl: SimpleDropzone;

    // gui
    gui = new dat.GUI();
    materialFolder = null;
    animationFolder = null;
    sceneFolder = null;
    lightFolder = null;
    state = {
        // Scene
        background: true,
        // Lights
        env: "park",
    };

    // resource
    skyMaterial: SkyBoxMaterial = new SkyBoxMaterial(this.engine);
    materials: Material[] = [];
    textures: Record<string, Texture2D> = {};
    env: Record<string, AmbientLight> = {};

    // entity
    cameraEntity: Entity = this.entity.createChild("camera");
    gltfRootEntity: Entity = this.entity.createChild("gltf");
    camera: Camera = this.cameraEntity.addComponent(Camera);
    controller: OrbitControl = this.cameraEntity.addComponent(OrbitControl);

    // bounds
    boundingBox: BoundingBox = new BoundingBox();
    center: Vector3 = new Vector3();
    extent: Vector3 = new Vector3();

    abstract initScene();

    abstract sceneGUI(lightFolder);

    gltfProcess(gltf: GLTFResource) {}

    //------------------------------------------------------------------------------------------------------------------
    onAwake() {
        this.gltfRootEntity = this.entity.createChild("gltf");

        this.dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
        this.dropCtrl.on('drop', ({files}) => {
            this._loadFileMaps(files);
        });

        this._loadEnv(this.state.env);
        this.initScene();
        this._addSceneGUI();
        window.onresize = () => {
            (<WebGLEngine>this.engine).canvas.resizeByClientSize();
        };
    }

    private _loadFileMaps(files: Map<string, File>) {
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
                    this._addTexture(fileName, url);
                } else if (envReg.test(fileName)) {
                    // addEnv(fileName, url);
                }
            }
        });

        if (mainFile) {
            const url = URL.createObjectURL(mainFile);
            this._loadModel(url, filesMap, type as any);
        }
    }

    private _addTexture(name: string, url: string) {
        const repeat = Object.keys(this.textures).find((textureName) => textureName === name);
        if (repeat) {
            console.warn(`${name} 已经存在，请更换图片名字重新上传`);
            return;
        }
        this.engine.resourceManager
            .load<Texture2D>({
                type: AssetType.Texture2D,
                url
            })
            .then((texture) => {
                this.textures[name] = texture;
                this._addMaterialGUI();
                console.log("图片上传成功！", name);
            });
    }

    private _loadModel(url: string, filesMap: Record<string, string>, type: "gltf" | "glb") {
        this._destroyGLTF();

        // replace relative path
        if (type.toLowerCase() === "gltf") {
            this.engine.resourceManager
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
                    this.engine.resourceManager
                        .load<GLTFResource>({
                            type: AssetType.Prefab,
                            url: `${urlNew}#.gltf`
                        })
                        .then((asset) => {
                            this._handleGltfResource(asset);
                        })
                        .catch(() => {
                            console.log("Fail loader")
                        });
                });
        } else {
            this.engine.resourceManager
                .load<GLTFResource>({
                    type: AssetType.Prefab,
                    url: `${url}#.glb`
                })
                .then((asset) => {
                    this._handleGltfResource(asset);
                })
                .catch(() => {
                    console.log("Fail loader")
                });
        }
    }

    private _handleGltfResource(asset: GLTFResource) {
        const {defaultSceneRoot, materials, animations} = asset;
        console.log(asset);
        this.gltfRootEntity = defaultSceneRoot;
        this.entity.addChild(defaultSceneRoot);

        this.gltfProcess(asset);

        const meshRenderers = [];
        defaultSceneRoot.getComponentsIncludeChildren(MeshRenderer, meshRenderers);

        this._setCenter(meshRenderers);
        this._addMaterialGUI(materials);
        this._addAnimationGUI(animations);
    }

    private _destroyGLTF() {
        this.gltfRootEntity.destroy();
    }

    private _setCenter(renderers: Renderer[]) {
        const boundingBox = this.boundingBox;
        const center = this.center;
        const extent = this.extent;

        boundingBox.min.set(0, 0, 0);
        boundingBox.max.set(0, 0, 0);

        renderers.forEach((renderer) => {
            BoundingBox.merge(renderer.bounds, boundingBox, boundingBox);
        });
        boundingBox.getExtent(extent);
        const size = extent.length();

        boundingBox.getCenter(center);
        this.controller.target.set(center.x, center.y, center.z);
        this.controller.entity.transform.setPosition(center.x, center.y, size * 3);

        this.controller.camera.farClipPlane = size * 12;
        this.controller.camera.nearClipPlane = size / 100;

        this.controller.maxDistance = size * 10;
    }

    private _loadEnv(envName: string) {
        return new Promise((resolve) => {
            this.engine.resourceManager
                .load<AmbientLight>({
                    type: AssetType.Env,
                    url: envList[envName]
                })
                .then((env) => {
                    this.env[envName] = env;

                    this.scene.ambientLight = env;
                    this.skyMaterial.textureCubeMap = env.specularTexture;
                    this.skyMaterial.textureDecodeRGBM = true;
                    resolve(true);
                });
        });
    }

    //------------------------------------------------------------------------------------------------------------------
    private _addMaterialGUI(materials?: Material[]) {
        const {gui} = this;
        if (this.materialFolder) {
            gui.removeFolder(this.materialFolder);
            this.materialFolder = null;
        }

        const _materials = materials || this.materials;
        this.materials = _materials;
        if (!_materials.length) return;

        const folder = (this.materialFolder = gui.addFolder("Material"));
        const folderName = {};

        _materials.forEach((material) => {
            if (!(material instanceof PBRBaseMaterial) && !(material instanceof UnlitMaterial)) return;
            if (!material.name) {
                material.name = "default";
            }
            const state = {
                opacity: material.baseColor.a,
                baseColor: ViewerBase.colorToGui(material.baseColor),
                emissiveColor: ViewerBase.colorToGui((material as PBRBaseMaterial).emissiveColor),
                specularColor: ViewerBase.colorToGui((material as PBRSpecularMaterial).specularColor),
                baseTexture: material.baseTexture ? "origin" : "",
                roughnessMetallicTexture: (material as PBRMaterial).roughnessMetallicTexture ? "origin" : "",
                normalTexture: (material as PBRBaseMaterial).normalTexture ? "origin" : "",
                emissiveTexture: (material as PBRBaseMaterial).emissiveTexture ? "origin" : "",
                occlusionTexture: (material as PBRBaseMaterial).occlusionTexture ? "origin" : "",
                specularGlossinessTexture: (material as PBRSpecularMaterial).specularGlossinessTexture ? "origin" : ""
            };

            const originTexture = {
                baseTexture: material.baseTexture,
                roughnessMetallicTexture: (material as PBRMaterial).roughnessMetallicTexture,
                normalTexture: (material as PBRBaseMaterial).normalTexture,
                emissiveTexture: (material as PBRBaseMaterial).emissiveTexture,
                occlusionTexture: (material as PBRBaseMaterial).occlusionTexture,
                specularGlossinessTexture: (material as PBRSpecularMaterial).specularGlossinessTexture
            };

            const f = folder.addFolder(
                folderName[material.name] ? `${material.name}_${folderName[material.name] + 1}` : material.name
            );

            folderName[material.name] = folderName[material.name] == null ? 1 : folderName[material.name] + 1;

            // metallic
            if (material instanceof PBRMaterial) {
                const mode1 = f.addFolder("Metallic-Roughness props");
                mode1.add(material, "metallic", 0, 1).step(0.01);
                mode1.add(material, "roughness", 0, 1).step(0.01);
                mode1
                    .add(state, "roughnessMetallicTexture", ["None", "origin", ...Object.keys(this.textures)])
                    .onChange((v) => {
                        material.roughnessMetallicTexture =
                            v === "None" ? null : this.textures[v] || originTexture.roughnessMetallicTexture;
                    });
                mode1.open();
            }
            // specular
            else if (material instanceof PBRSpecularMaterial) {
                const mode2 = f.addFolder("Specular-Glossiness props");
                mode2.add(material, "glossiness", 0, 1).step(0.01);
                mode2.addColor(state, "specularColor").onChange((v) => {
                    ViewerBase.guiToColor(v, material.specularColor);
                });
                mode2
                    .add(state, "specularGlossinessTexture", ["None", "origin", ...Object.keys(this.textures)])
                    .onChange((v) => {
                        material.specularGlossinessTexture =
                            v === "None" ? null : this.textures[v] || originTexture.specularGlossinessTexture;
                    });
                mode2.open();
            } else if (material instanceof UnlitMaterial) {
                f.add(state, "baseTexture", ["None", "origin", ...Object.keys(this.textures)]).onChange((v) => {
                    material.baseTexture = v === "None" ? null : this.textures[v] || originTexture.baseTexture;
                });

                f.addColor(state, "baseColor").onChange((v) => {
                    ViewerBase.guiToColor(v, material.baseColor);
                });
            }

            // common
            if (!(material instanceof UnlitMaterial)) {
                const common = f.addFolder("Common props");

                common
                    .add(state, "opacity", 0, 1)
                    .step(0.01)
                    .onChange((v) => {
                        material.baseColor.a = v;
                    });
                common.add(material, "isTransparent");
                common.add(material, "alphaCutoff", 0, 1).step(0.01);

                common.addColor(state, "baseColor").onChange((v) => {
                    ViewerBase.guiToColor(v, material.baseColor);
                });
                common.addColor(state, "emissiveColor").onChange((v) => {
                    ViewerBase.guiToColor(v, material.emissiveColor);
                });
                common.add(state, "baseTexture", ["None", "origin", ...Object.keys(this.textures)]).onChange((v) => {
                    material.baseTexture = v === "None" ? null : this.textures[v] || originTexture.baseTexture;
                });
                common.add(state, "normalTexture", ["None", "origin", ...Object.keys(this.textures)]).onChange((v) => {
                    material.normalTexture = v === "None" ? null : this.textures[v] || originTexture.normalTexture;
                });
                common.add(state, "emissiveTexture", ["None", "origin", ...Object.keys(this.textures)]).onChange((v) => {
                    material.emissiveTexture = v === "None" ? null : this.textures[v] || originTexture.emissiveTexture;
                });
                common.add(state, "occlusionTexture", ["None", "origin", ...Object.keys(this.textures)]).onChange((v) => {
                    material.occlusionTexture = v === "None" ? null : this.textures[v] || originTexture.occlusionTexture;
                });
                common.open();
            }
        });

        folder.open();
    }

    private _addAnimationGUI(animations: AnimationClip[]) {
        if (this.animationFolder) {
            this.gui.removeFolder(this.animationFolder);
            this.animationFolder = null;
        }

        if (animations?.length) {
            this.animationFolder = this.gui.addFolder("Animation");
            this.animationFolder.open();
            const animator = this.gltfRootEntity.getComponent(Animator);
            animator.play(animations[0].name);
            const state = {
                animation: animations[0].name
            };
            this.animationFolder
                .add(state, "animation", ["None", ...animations.map((animation) => animation.name)])
                .onChange((name) => {
                    if (name === "None") {
                        animator.speed = 0;
                    } else {
                        animator.speed = 1;
                        animator.play(name);
                    }
                });
        }
    }

    private _addSceneGUI() {
        const {gui} = this;
        // Display controls.
        if (this.sceneFolder) {
            gui.removeFolder(this.sceneFolder);
        }
        if (this.sceneFolder) {
            gui.removeFolder(this.lightFolder);
        }
        this.sceneFolder = gui.addFolder("Scene");
        this.sceneFolder.add(this.state, "background").onChange((v: boolean) => {
            if (v) {
                this.scene.background.mode = BackgroundMode.Sky;
            } else {
                this.scene.background.mode = BackgroundMode.SolidColor;
            }
        });

        // Lighting controls.
        this.lightFolder = gui.addFolder("Lighting");
        this.lightFolder
            .add(this.state, "env", [...Object.keys(envList)])
            .name("IBL")
            .onChange((v) => {
                this._loadEnv(v);
            });
        this.sceneGUI(this.lightFolder);

        this.sceneFolder.open();
        this.lightFolder.open();
    }
}

