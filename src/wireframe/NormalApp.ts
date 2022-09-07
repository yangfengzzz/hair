import {
    AmbientLight, AssetType,
    Camera,
    Color,
    DirectLight,
    GLTFResource,
    PBRMaterial,
    RenderFace,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {NormalWireframe} from "./NormalWireframe";
import * as dat from "dat.gui";

const gui = new dat.GUI();

// Init Engine
const engine = new WebGLEngine("canvas");
// Adapter to screen
engine.canvas.resizeByClientSize();

// Get root entity of current scene
const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(1,1,1,1)
const rootEntity = scene.createRootEntity("root");

// Init Camera
const cameraEntity = rootEntity.createChild("camera_entity");
cameraEntity.transform.setPosition(0, 1, 3);
cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
const camera = cameraEntity.addComponent(Camera);
camera.enableFrustumCulling = false;
camera.farClipPlane = 1000;
cameraEntity.addComponent(OrbitControl).target.set(0, 1, 0);

// Create a entity to add light component
const lightEntity = rootEntity.createChild("light");

// Create light component
const directLight = lightEntity.addComponent(DirectLight);
directLight.color = new Color(1.0, 1.0, 1.0);
directLight.intensity = 0.5;

// Control light direction by entity's transform
lightEntity.transform.rotation = new Vector3(45, 45, 45);

// wireframe
const wireframe = rootEntity.addComponent(NormalWireframe);
wireframe.wireframeMode = true;

engine.resourceManager
    .load<GLTFResource>("https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb")
    .then((gltfResource) => {
        const {animations, defaultSceneRoot} = gltfResource;
        rootEntity.addChild(defaultSceneRoot);
        wireframe.addEntity(defaultSceneRoot);
        // const animator = defaultSceneRoot.getComponent(Animator);
        // const animationNames = animations.filter((clip) => !clip.name.includes("pose")).map((clip) => clip.name);
        // animator.play(animationNames[3]);

        for (let i = 0; i < gltfResource.materials.length; i++) {
            const pbr = <PBRMaterial>(gltfResource.materials[i]);
            pbr.baseColor.a = 0.2;
            pbr.isTransparent = true;
            pbr.renderFace = RenderFace.Double;
        }

        // Create Cube
        // const sceneEntity = rootEntity.createChild();
        // const renderer = sceneEntity.addComponent(MeshRenderer);
        // // const mesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
        // const mesh = PrimitiveMesh.createTorus(engine, 2, 5, 20);
        // const mtl = new BlinnPhongMaterial(engine);
        // mtl.isTransparent = true;
        // mtl.baseColor.set(1,0.5,0.5,0.2);
        // renderer.setMaterial(mtl);
        // renderer.mesh = mesh;
        // wireframe.addEntity(sceneEntity);

        openDebug();

        engine.resourceManager
            .load<AmbientLight>({
                type: AssetType.Env,
                url: "https://gw.alipayobjects.com/os/bmw-prod/09904c03-0d23-4834-aa73-64e11e2287b0.bin"
            })
            .then((ambientLight) => {
                scene.ambientLight = ambientLight;
                engine.run();
            })

        function openDebug() {
            const info = {
                baseColor: [0, 0, 0],
                pause: false
            };

            // gui.add(info, "pause").onChange((v) => {
            //     if (v) {
            //         animator.speed = 0;
            //     } else {
            //         animator.speed = 1;
            //     }
            // })
            gui.add(wireframe, "scale", 0, 1);
        }
    });