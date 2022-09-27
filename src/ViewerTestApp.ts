import {
  BackgroundMode,
  Color,
  DirectLight,
  Entity,
  PrimitiveMesh,
  WebGLEngine,
} from "oasis-engine";
import { ViewerBase } from "./ViewerBase";
import { SketchMode, SketchSelection } from "./sketch";

export class ViewerTest extends ViewerBase {
  lightState = {
    lights: true,
    lightColor1: ViewerTest.colorToGui(new Color(1, 1, 1)),
    lightColor2: ViewerTest.colorToGui(new Color(1, 1, 1)),
    lightIntensity1: 1,
    lightIntensity2: 1,
  };
  lightEntity1: Entity = this.entity.createChild("light1");
  lightEntity2: Entity = this.entity.createChild("light2");
  light1: DirectLight = this.lightEntity1.addComponent(DirectLight);
  light2: DirectLight = this.lightEntity2.addComponent(DirectLight);

  sketchSelection: SketchSelection = null;
  sketchInfo = {
    wireframeMode: true,
    wireframeBaseColor: [0, 0, 0],
    normalMode: false,
    normalColor: [255, 0, 0],
    tangentMode: false,
    tangentColor: [0, 255, 0],
    bitangentMode: false,
    bitangentColor: [0, 0, 255],
  };
  sketchFolder = null;

  onAwake() {
    super.onAwake();
    this.sketchSelection = this.entity.addComponent(SketchSelection);
    this.sketchSelection.camera = this.camera;
    this._addSketchGUI();
  }

  /**
   * @override
   */
  initScene() {
    (<WebGLEngine>this.engine).canvas.resizeByClientSize();
    this.controller.minDistance = 0;

    if (this.state.background) {
      this.scene.background.mode = BackgroundMode.Sky;
    }
    if (!this.lightState.lights) {
      this.light1.enabled = this.light2.enabled = false;
    }
    this.light1.intensity = this.lightState.lightIntensity1;
    this.light2.intensity = this.lightState.lightIntensity2;
    this.lightEntity1.transform.setRotation(-45, 0, 0);
    this.lightEntity2.transform.setRotation(-45, 180, 0);
    this.scene.background.solidColor = new Color(0, 0, 0, 0);
    this.scene.background.sky.material = this.skyMaterial;
    this.scene.background.sky.mesh = PrimitiveMesh.createCuboid(
      this.engine,
      1,
      1,
      1
    );
  }

  /**
   * @override
   */
  sceneGUI(lightFolder) {
    this.lightFolder.add(this.lightState, "lights").onChange((v) => {
      this.light1.enabled = this.light2.enabled = v;
    });
    this.lightFolder.addColor(this.lightState, "lightColor1").onChange((v) => {
      ViewerTest.guiToColor(v, this.light1.color);
    });
    this.lightFolder.addColor(this.lightState, "lightColor2").onChange((v) => {
      ViewerTest.guiToColor(v, this.light2.color);
    });
    this.lightFolder
      .add(this.lightState, "lightIntensity1", 0, 2)
      .onChange((v) => {
        this.light1.intensity = v;
      });
    this.lightFolder
      .add(this.lightState, "lightIntensity2", 0, 2)
      .onChange((v) => {
        this.light2.intensity = v;
      });
  }

  private _addSketchGUI() {
    const { gui } = this;
    // Display controls.
    if (this.sketchFolder) {
      gui.removeFolder(this.sketchFolder);
    }
    this.sketchFolder = gui.addFolder("Sketch");
    this.sketchFolder.add(this.sketchSelection.sketch, "scale", 0, 0.3);
    this.sketchFolder.add(this.sketchInfo, "wireframeMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Wireframe, v);
    });
    this.sketchFolder
      .addColor(this.sketchInfo, "wireframeBaseColor")
      .onChange((v) => {
        this.sketchSelection.sketch.wireframeMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });

    this.sketchFolder.add(this.sketchInfo, "normalMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Normal, v);
    });
    this.sketchFolder.add(this.sketchInfo, "tangentMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Tangent, v);
    });
    this.sketchFolder.add(this.sketchInfo, "bitangentMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.BiTangent, v);
    });

    this.sketchFolder.addColor(this.sketchInfo, "normalColor").onChange((v) => {
      this.sketchSelection.sketch.normalMaterial.baseColor.set(
        v[0] / 255,
        v[1] / 255,
        v[2] / 255,
        1.0
      );
    });
    this.sketchFolder
      .addColor(this.sketchInfo, "tangentColor")
      .onChange((v) => {
        this.sketchSelection.sketch.tangentMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });
    this.sketchFolder
      .addColor(this.sketchInfo, "bitangentColor")
      .onChange((v) => {
        this.sketchSelection.sketch.biTangentMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });
  }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();
rootEntity.addComponent(ViewerTest);

engine.run();
