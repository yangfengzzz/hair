import {
    AmbientLight, Animator,
    AssetType,
    BlinnPhongMaterial,
    Camera,
    Color,
    DirectLight, GLTFResource,
    ModelMesh,
    PBRMaterial,
    PointerButton,
    Script,
    SkinnedMeshRenderer,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {FramebufferPicker} from "@oasis-engine-toolkit/framebuffer-picker";
import {SketchRenderer} from "./SketchRenderer";
import {SketchMode} from "./SketchMode";
import * as dat from "dat.gui";

class Rotation extends Script {
    private _total = 0;
    pause = false;

    onUpdate(deltaTime: number) {
        if (!this.pause) {
            this._total += deltaTime / 10;
            this.entity.transform.setRotation(this._total, this._total / 4, -this._total / 2);
        }
    }
}

class SelectionInfo {
    mesh: ModelMesh;

    private _material: PBRMaterial | BlinnPhongMaterial;
    private _alpha: number;
    private _isTransparent: boolean;

    set material(value: PBRMaterial | BlinnPhongMaterial) {
        this._material = value;
        this._alpha = value.baseColor.r;
        this._isTransparent = value.isTransparent;
    }

    restore() {
        const material = this._material;
        material && (material.baseColor.a = this._alpha);
        material && (material.isTransparent = this._isTransparent);
    }
}

class SketchSelection extends Script {
    sketch: SketchRenderer;
    private _framebufferPicker: FramebufferPicker;
    private _selection: SelectionInfo = new SelectionInfo();

    set camera(value: Camera) {
        this._framebufferPicker.camera = value;
    }

    onAwake(): void {
        this._framebufferPicker = this.entity.addComponent(FramebufferPicker);
        this.sketch = this.entity.addComponent(SketchRenderer);
        this.sketch.setSketchMode(SketchMode.Wireframe, true);
    }

    onUpdate(): void {
        const {_selection: selection, sketch} = this;
        const inputManager = this.engine.inputManager;
        if (inputManager.isPointerDown(PointerButton.Primary)) {
            const pointerPosition = inputManager.pointerPosition;
            this._framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((renderElement) => {
                if (renderElement) {
                    if (renderElement.mesh instanceof ModelMesh) {
                        if (selection.mesh !== renderElement.mesh) {
                            selection.restore();
                            selection.mesh = renderElement.mesh;

                            const mtl = <PBRMaterial>renderElement.material;
                            selection.material = mtl;
                            mtl.baseColor.a = 0.6;
                            mtl.baseColor.set(1,1,1,0.6);
                            mtl.isTransparent = true;

                            const renderer = renderElement.component;
                            sketch.targetMesh = renderElement.mesh;
                            sketch.worldTransform = renderer.entity.transform;
                            sketch.skin = null;
                            sketch.shaderData.disableMacro("O3_HAS_SKIN");
                            if (renderer instanceof SkinnedMeshRenderer) {
                                // @ts-ignore
                                sketch._hasInitJoints = false;
                                sketch.skin = renderer.skin;
                            }
                        }
                    }
                }
            });
        }
    }
}

const gui = new dat.GUI();

// Init Engine
const engine = new WebGLEngine("canvas");
// Adapter to screen
engine.canvas.resizeByClientSize();

// Get root entity of current scene
const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(1, 1, 1, 1)
const rootEntity = scene.createRootEntity("root");

// Init Camera
const cameraEntity = rootEntity.createChild("camera_entity");
cameraEntity.transform.setPosition(0, 1, 3);
const camera = cameraEntity.addComponent(Camera);
camera.enableFrustumCulling = false;
cameraEntity.addComponent(OrbitControl).target.set(0, 1, 0);

// Create an entity to add light component
const lightEntity = rootEntity.createChild("light");
lightEntity.transform.setRotation(45, 45, 45);
const directLight = lightEntity.addComponent(DirectLight);
directLight.color = new Color(1.0, 1.0, 1.0);

// sketch selection
const sketchSelection = rootEntity.addComponent(SketchSelection);
sketchSelection.camera = camera;

let animator: Animator = null;
let rotation: Rotation = null;

function openDebug() {
    const info = {
        pause: false,
        wireframeMode: true,
        wireframeBaseColor: [0, 0, 0],
        normalMode: false,
        normalColor: [255, 0, 0],
        tangentMode: false,
        tangentColor: [0, 255, 0],
        bitangentMode: false,
        bitangentColor: [0, 0, 255],
    };

    gui.add(info, "pause").onChange((v) => {
        if (v) {
            animator && (animator.speed = 0);
            rotation && (rotation.pause = true);
        } else {
            animator && (animator.speed = 1);
            rotation && (rotation.pause = false);
        }
    });
    gui.add(sketchSelection.sketch, "scale", 0, 1);
    gui.add(info, "wireframeMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.Wireframe, v);
    });
    gui.addColor(info, "wireframeBaseColor").onChange((v) => {
        sketchSelection.sketch.wireframeMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
    });

    gui.add(info, "normalMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.Normal, v);
    });
    gui.add(info, "tangentMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.Tangent, v);
    });
    gui.add(info, "bitangentMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.BiTangent, v);
    });

    gui.addColor(info, "normalColor").onChange((v) => {
        sketchSelection.sketch.normalMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
    });
    gui.addColor(info, "tangentColor").onChange((v) => {
        sketchSelection.sketch.tangentMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
    });
    gui.addColor(info, "bitangentColor").onChange((v) => {
        sketchSelection.sketch.biTangentMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
    });
}

engine.resourceManager
    .load([
        {
            url: "http://30.46.128.52:8000/hair.gltf",
            type: AssetType.Prefab
        }
    ])
    .then((resources: Object[]) => {
        const hair = <GLTFResource>resources[0];
        // hair.defaultSceneRoot.transform.setPosition(0, -1.5, 0);
        rootEntity.addChild(hair.defaultSceneRoot);

        engine.resourceManager
            .load<AmbientLight>({
                type: AssetType.Env,
                url: "https://gw.alipayobjects.com/os/bmw-prod/09904c03-0d23-4834-aa73-64e11e2287b0.bin"
            })
            .then((ambientLight) => {
                scene.ambientLight = ambientLight;
                openDebug();
                engine.run();
            })
    });