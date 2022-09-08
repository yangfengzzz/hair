import {
    AmbientLight,
    AssetType,
    Camera,
    Color,
    DirectLight,
    GLTFResource,
    ModelMesh,
    PBRMaterial,
    PointerButton,
    RenderFace,
    Script, SkinnedMeshRenderer,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {FramebufferPicker} from "@oasis-engine-toolkit/framebuffer-picker";
import {SketchRenderer} from "./SketchRenderer";
import * as dat from "dat.gui";
import {SketchMode} from "./SketchMode";

class SketchSelection extends Script {
    private _sketch: SketchRenderer;
    private _framebufferPicker: FramebufferPicker;

    private _scale: number = 0.02;

    set camera(value: Camera) {
        this._framebufferPicker.camera = camera;
    }

    get scale(): number {
        return this._scale;
    }

    set scale(value: number) {
        this._scale = value;
        this._sketch.scale = value;
    }

    onAwake(): void {
        this._sketch = this.entity.addComponent(SketchRenderer);
        this._framebufferPicker = this.entity.addComponent(FramebufferPicker);

    }

    onUpdate(): void {
        const inputManager = this.engine.inputManager;
        if (inputManager.isPointerDown(PointerButton.Primary)) {
            const pointerPosition = inputManager.pointerPosition;
            this._framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((renderElement) => {
                if (renderElement) {
                    if (renderElement.mesh instanceof ModelMesh) {
                        const renderer = renderElement.component;
                        this._sketch.targetMesh = renderElement.mesh;
                        this._sketch.worldMatrix = renderer.entity.transform.worldMatrix;
                        this._sketch.setSketchMode(SketchMode.Wireframe, true);
                        this._sketch.wireframeMaterial.baseColor.set(0, 0, 0, 1);
                        if (renderer instanceof SkinnedMeshRenderer) {
                            // @ts-ignore
                            this._sketch._hasInitJoints = false;
                            this._sketch.skin = renderer.skin;
                        }
                    }
                } else {
                    this._sketch.skin = null;
                    this._sketch.clear();
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
cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
const camera = cameraEntity.addComponent(Camera);
camera.enableFrustumCulling = false;
camera.farClipPlane = 1000;
cameraEntity.addComponent(OrbitControl).target.set(0, 1, 0);

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

function openDebug() {
    const info = {
        baseColor: [0, 0, 0],
        pause: false
    };

    gui.add(sketchSelection, "scale", 0, 1);
}

engine.resourceManager
    .load<GLTFResource>("https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb")
    .then((gltfResource) => {
        const {animations, defaultSceneRoot} = gltfResource;
        rootEntity.addChild(defaultSceneRoot);
        // const animator = defaultSceneRoot.getComponent(Animator);
        // const animationNames = animations.filter((clip) => !clip.name.includes("pose")).map((clip) => clip.name);
        // animator.play(animationNames[3]);

        for (let i = 0; i < gltfResource.materials.length; i++) {
            const pbr = <PBRMaterial>(gltfResource.materials[i]);
            pbr.baseColor.a = 0.2;
            pbr.isTransparent = true;
            pbr.renderFace = RenderFace.Double;
        }

        // // Create Cube
        // const sceneEntity = rootEntity.createChild();
        // const renderer = sceneEntity.addComponent(MeshRenderer);
        // // const mesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
        // // const mesh = PrimitiveMesh.createCone(engine, 2, 2, 20);
        // // const mesh = PrimitiveMesh.createSphere(engine, 2, 20);
        // // const mesh = PrimitiveMesh.createCylinder(engine, 2, 2, 5, 20, 20);
        // // const mesh = PrimitiveMesh.createTorus(engine);
        // const mesh = PrimitiveMesh.createCapsule(engine, 2, 5, 20);
        // const mtl = new BlinnPhongMaterial(engine);
        // mtl.isTransparent = true;
        // mtl.baseColor.set(1,0.5,0.5,0.2);
        // renderer.setMaterial(mtl);
        // renderer.mesh = mesh;
        // sketch.addEntity(sceneEntity);

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