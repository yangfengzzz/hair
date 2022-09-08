import {
    AmbientLight, Animator,
    AssetType,
    BlinnPhongMaterial,
    Camera,
    Color,
    DirectLight,
    GLTFResource,
    ModelMesh,
    PBRMaterial,
    PointerButton,
    Script,
    SkinnedMeshRenderer,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {FreeControl} from "@oasis-engine-toolkit/controls";
import {FramebufferPicker} from "@oasis-engine-toolkit/framebuffer-picker";
import {SketchRenderer} from "./SketchRenderer";
import {SketchMode} from "./SketchMode";
import * as dat from "dat.gui";

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

    private _scale: number = 0.02;

    set camera(value: Camera) {
        this._framebufferPicker.camera = camera;
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
                            mtl.baseColor.a = 0.4;
                            mtl.isTransparent = true;

                            const renderer = renderElement.component;
                            sketch.targetMesh = renderElement.mesh;
                            sketch.worldMatrix = renderer.entity.transform.worldMatrix;
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
cameraEntity.transform.setPosition(6, 5, 0);
cameraEntity.transform.lookAt(new Vector3(0, 3, 0));
const camera = cameraEntity.addComponent(Camera);
camera.enableFrustumCulling = false;
camera.farClipPlane = 1000;
cameraEntity.addComponent(FreeControl).floorMock = false;

// Create an entity to add light component
const lightEntity = rootEntity.createChild("light");

// Create light component
const directLight = lightEntity.addComponent(DirectLight);
directLight.color = new Color(1.0, 1.0, 1.0);
directLight.intensity = 0.5;

// Control light direction by entity's transform
lightEntity.transform.rotation = new Vector3(45, 45, 45);

// sketch selection
const sketchSelection = rootEntity.addComponent(SketchSelection);
sketchSelection.camera = camera;

let animator: Animator = null;

function openDebug() {
    const info = {
        pause: false,
        wireframeMode: true,
        normalMode: false,
    };

    gui.add(info, "pause").onChange((v) => {
        if (v) {
            animator && (animator.speed = 0);
        } else {
            animator && (animator.speed = 1);
        }
    });
    gui.add(sketchSelection.sketch, "scale", 0, 1);
    gui.add(info, "wireframeMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.Wireframe, v);
    });
    gui.add(info, "normalMode").onChange((v) => {
        sketchSelection.sketch.setSketchMode(SketchMode.Normal, v);
    });
}

engine.resourceManager
    .load([
        {
            url: "https://gw.alipayobjects.com/os/bmw-prod/ca50859b-d736-4a3e-9fc3-241b0bd2afef.gltf",
            type: AssetType.Prefab
        },
        {
            url: "https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb",
            type: AssetType.Prefab
        }
    ])
    .then((resources: Object[]) => {
        const sponza = <GLTFResource>resources[0];
        rootEntity.addChild(sponza.defaultSceneRoot);

        const human = <GLTFResource>resources[1];
        const {animations, defaultSceneRoot} = human;
        human.defaultSceneRoot.transform.setPosition(-3, 0, 0);
        human.defaultSceneRoot.transform.setRotation(0, 90, 0);
        rootEntity.addChild(human.defaultSceneRoot);

        animator = defaultSceneRoot.getComponent(Animator);
        const animationNames = animations.filter((clip) => !clip.name.includes("pose")).map((clip) => clip.name);
        animator.play(animationNames[3]);

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