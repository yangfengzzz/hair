import {
  AmbientLight,
  Animator,
  AssetType,
  Camera,
  Color,
  DirectLight,
  GLTFResource,
  MeshRenderer,
  PBRMaterial,
  PrimitiveMesh,
  Script,
  Vector3,
  WebGLEngine,
} from "oasis-engine";
import { FreeControl } from "@oasis-engine-toolkit/controls";
import { SketchMode } from "./SketchMode";
import * as dat from "dat.gui";
import { SketchSelection } from "./SketchSelection";

class Rotation extends Script {
  private _total = 0;
  pause = false;

  onUpdate(deltaTime: number) {
    if (!this.pause) {
      this._total += deltaTime / 10;
      this.entity.transform.setRotation(
        this._total,
        this._total / 4,
        -this._total / 2
      );
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
scene.background.solidColor.set(1, 1, 1, 1);
const rootEntity = scene.createRootEntity("root");

// Init Camera
const cameraEntity = rootEntity.createChild("camera_entity");
cameraEntity.transform.setPosition(3, 2, 0.5);
cameraEntity.transform.lookAt(new Vector3(0, 2, 0.5));
const camera = cameraEntity.addComponent(Camera);
camera.enableFrustumCulling = false;
camera.farClipPlane = 1000;
cameraEntity.addComponent(FreeControl).floorMock = false;

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
    sketchSelection.sketch.wireframeMaterial.baseColor.set(
      v[0] / 255,
      v[1] / 255,
      v[2] / 255,
      1.0
    );
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
    sketchSelection.sketch.normalMaterial.baseColor.set(
      v[0] / 255,
      v[1] / 255,
      v[2] / 255,
      1.0
    );
  });
  gui.addColor(info, "tangentColor").onChange((v) => {
    sketchSelection.sketch.tangentMaterial.baseColor.set(
      v[0] / 255,
      v[1] / 255,
      v[2] / 255,
      1.0
    );
  });
  gui.addColor(info, "bitangentColor").onChange((v) => {
    sketchSelection.sketch.biTangentMaterial.baseColor.set(
      v[0] / 255,
      v[1] / 255,
      v[2] / 255,
      1.0
    );
  });
}

engine.resourceManager
  .load([
    {
      url: "https://gw.alipayobjects.com/os/bmw-prod/ca50859b-d736-4a3e-9fc3-241b0bd2afef.gltf",
      type: AssetType.Prefab,
    },
    {
      url: "https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb",
      type: AssetType.Prefab,
    },
  ])
  .then((resources: Object[]) => {
    const primitiveEntity = rootEntity.createChild();
    rotation = primitiveEntity.addComponent(Rotation);
    primitiveEntity.transform.setPosition(-7, 4, 0);
    const renderer = primitiveEntity.addComponent(MeshRenderer);
    // const mesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
    // const mesh = PrimitiveMesh.createCone(engine, 2, 2, 20);
    // const mesh = PrimitiveMesh.createSphere(engine, 2, 20);
    const mesh = PrimitiveMesh.createCylinder(engine, 0.5, 0.5, 1, 20, 20);
    // const mesh = PrimitiveMesh.createTorus(engine);
    // const mesh = PrimitiveMesh.createCapsule(engine, 0.5, 1, 20);
    const mtl = new PBRMaterial(engine);
    mtl.baseColor.set(1, 1, 1, 1.0);
    mtl.metallic = 0.5;
    mtl.roughness = 0.5;
    renderer.setMaterial(mtl);
    renderer.mesh = mesh;

    const sponza = <GLTFResource>resources[0];
    rootEntity.addChild(sponza.defaultSceneRoot);

    const human = <GLTFResource>resources[1];
    const { animations, defaultSceneRoot } = human;
    human.defaultSceneRoot.transform.setPosition(-3, 0, 0);
    human.defaultSceneRoot.transform.setRotation(0, 90, 0);
    rootEntity.addChild(human.defaultSceneRoot);

    animator = defaultSceneRoot.getComponent(Animator);
    const animationNames = animations
      .filter((clip) => !clip.name.includes("pose"))
      .map((clip) => clip.name);
    animator.play(animationNames[3]);

    engine.resourceManager
      .load<AmbientLight>({
        type: AssetType.Env,
        url: "https://gw.alipayobjects.com/os/bmw-prod/09904c03-0d23-4834-aa73-64e11e2287b0.bin",
      })
      .then((ambientLight) => {
        scene.ambientLight = ambientLight;
        openDebug();
        engine.run();
      });
  });
