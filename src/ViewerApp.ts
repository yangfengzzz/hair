import {
  AssetType,
  BackgroundMode,
  Color,
  DirectLight,
  Entity,
  GLTFResource,
  MeshRenderer,
  PBRMaterial,
  PrimitiveMesh,
  Script,
  Texture2D,
  UnlitMaterial,
  WebGLEngine,
} from "oasis-engine";
import { ViewerBase } from "./ViewerBase";
import { SketchMode, SketchSelection } from "./sketch";
import { PBRHairMaterial } from "./hair-kajiya/PBRHairMaterial";

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

export class ViewerTest extends ViewerBase {
  lightState = {
    lights: true,
    mainLightColor: ViewerTest.colorToGui(new Color(1, 1, 1)),
    purpleLightColor: ViewerTest.colorToGui(new Color(1, 1, 1)),
    mainLightIntensity: 0.55,
    purpleLightIntensity: 0.15,
  };
  mainLightEntity = this.entity.createChild("mainLight");
  mainLight = this.mainLightEntity.addComponent(DirectLight);
  purpleLightEntity = this.entity.createChild("purpleLight");
  purpleLight = this.purpleLightEntity.addComponent(DirectLight);

  sketchSelection: SketchSelection = null;
  sketchState = {
    wireframeMode: false,
    wireframeBaseColor: [0, 0, 0],
    normalMode: false,
    normalColor: [255, 0, 0],
    tangentMode: false,
    tangentColor: [0, 255, 0],
    bitangentMode: false,
    bitangentColor: [0, 0, 255],
  };
  sketchFolder = null;

  rotate: RotateY = null;
  specularShiftTexture: Texture2D = null;
  hairMaterial = new PBRHairMaterial(this.engine);
  hairFolder = null;

  onAwake() {
    super.onAwake();
    this.sketchSelection = this.entity.addComponent(SketchSelection);
    this.sketchSelection.camera = this.camera;
    this._addSketchGUI();
  }

  /**
   * @override
   */
  gltfProcess(gltf: GLTFResource) {
    const gltfRootEntity = gltf.defaultSceneRoot;
    this.rotate = gltfRootEntity.addComponent(RotateY);
    gltfRootEntity.transform.setPosition(0, -1.5, 0);

    const hairMaterial = this.hairMaterial;
    const hair = this._findHair(gltfRootEntity);
    if (hair) {
      this.sketchSelection.specificEntity = hair;
      const renderer = hair.getComponent(MeshRenderer);
      const material = <PBRMaterial>renderer.getMaterial();

      hairMaterial.roughness = material.roughness;
      hairMaterial.metallic = material.metallic;
      hairMaterial.baseColor = material.baseColor;
      hairMaterial.baseTexture = material.baseTexture;
      hairMaterial.normalTexture = material.normalTexture;
      hairMaterial.normalTextureIntensity = material.normalTextureIntensity;
      hairMaterial.occlusionTexture = material.occlusionTexture;
      hairMaterial.occlusionTextureIntensity =
        material.occlusionTextureIntensity;
      hairMaterial.occlusionTextureCoord = material.occlusionTextureCoord;

      hairMaterial.specularShiftTexture = this.specularShiftTexture;
      hairMaterial.specularWidth = 1.0;
      hairMaterial.specularScale = 0.15;
      hairMaterial.specularPower = 64.0;

      hairMaterial.primaryColor.set(1, 1, 1, 1);
      hairMaterial.primaryShift = 0.25;
      hairMaterial.secondaryColor.set(1, 1, 1, 1);
      hairMaterial.secondaryShift = 0.25;
      renderer.setMaterial(hairMaterial);
      this._addHairGUI();
    } else {
      console.log("dont' find hair entity");
    }
  }

  private _findHair(gltfRootEntity: Entity): Entity {
    if (
      gltfRootEntity.name == "hair" ||
      gltfRootEntity.name == "Hair" ||
      gltfRootEntity.name == "hair_16" ||
      gltfRootEntity.name == "Hair_16"
    ) {
      return gltfRootEntity;
    }

    let hair = gltfRootEntity.findByName("hair");
    if (hair) {
      return hair;
    }

    hair = gltfRootEntity.findByName("Hair");
    if (hair) {
      return hair;
    }

    hair = gltfRootEntity.findByName("hair_16");
    if (hair) {
      return hair;
    }

    hair = gltfRootEntity.findByName("Hair_16");
    if (hair) {
      return hair;
    }
    return null;
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
    this.scene.background.solidColor = new Color(0, 0, 0, 0);
    this.scene.background.sky.material = this.skyMaterial;
    this.scene.background.sky.mesh = PrimitiveMesh.createCuboid(
      this.engine,
      1,
      1,
      1
    );

    if (!this.lightState.lights) {
      this.mainLight.enabled = this.purpleLight.enabled = false;
    }
    this.mainLight.intensity = this.lightState.mainLightIntensity;
    this.purpleLight.intensity = this.lightState.purpleLightIntensity;
    this.mainLightEntity.transform.setPosition(0, 0, 0.5);
    this.mainLightEntity.transform.setRotation(-22, 0, 0);
    this.purpleLightEntity.transform.setPosition(0, 0, -0.5);
    this.purpleLightEntity.transform.setRotation(0, 210, 0);
    this.purpleLight.color.set(189 / 255, 16 / 255, 224 / 255, 1.0);

    const mainLightRenderer = this.mainLightEntity.addComponent(MeshRenderer);
    mainLightRenderer.mesh = PrimitiveMesh.createCuboid(
      engine,
      0.01,
      0.01,
      0.01
    );
    mainLightRenderer.setMaterial(new UnlitMaterial(engine));
    const purpleLightRenderer =
      this.purpleLightEntity.addComponent(MeshRenderer);
    purpleLightRenderer.mesh = PrimitiveMesh.createCuboid(
      engine,
      0.01,
      0.01,
      0.01
    );
    purpleLightRenderer.setMaterial(new UnlitMaterial(engine));

    engine.resourceManager
      .load<Texture2D>({
        type: AssetType.Texture2D,
        url: "https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*c0I7QbEzqYoAAAAAAAAAAAAAARQnAQ",
      })
      .then((shift) => {
        this.specularShiftTexture = shift;
        this.textures["defaultHairShift"] = shift;
        this._addHairGUI();
      });
  }

  /**
   * @override
   */
  laterOnTextureLoader() {
    this._addHairGUI();
  }

  /**
   * @override
   */
  sceneGUI(lightFolder) {
    this.lightFolder.add(this.lightState, "lights").onChange((v) => {
      this.mainLight.enabled = this.purpleLight.enabled = v;
    });
    this.lightFolder
      .addColor(this.lightState, "mainLightColor")
      .onChange((v) => {
        ViewerTest.guiToColor(v, this.mainLight.color);
      });
    this.lightFolder
      .addColor(this.lightState, "purpleLightColor")
      .onChange((v) => {
        ViewerTest.guiToColor(v, this.purpleLight.color);
      });
    this.lightFolder
      .add(this.lightState, "mainLightIntensity", 0, 2)
      .onChange((v) => {
        this.mainLight.intensity = v;
      });
    this.lightFolder
      .add(this.lightState, "purpleLightIntensity", 0, 2)
      .onChange((v) => {
        this.purpleLight.intensity = v;
      });
  }

  private _addHairGUI() {
    const { gui } = this;
    if (this.hairFolder) {
      gui.removeFolder(this.hairFolder);
      this.hairFolder = null;
    }

    const hairMaterial = this.hairMaterial;
    const folder = (this.hairFolder = gui.addFolder("Hair"));

    const state = {
      pause: true,
      primaryColor: ViewerBase.colorToGui(hairMaterial.primaryColor),
      secondaryColor: ViewerBase.colorToGui(hairMaterial.secondaryColor),
      shiftTexture: hairMaterial.specularShiftTexture ? "defaultHairShift" : "",

      opacity: hairMaterial.baseColor.a,
      baseColor: ViewerBase.colorToGui(hairMaterial.baseColor),
      emissiveColor: ViewerBase.colorToGui(hairMaterial.emissiveColor),
      baseTexture: hairMaterial.baseTexture ? "origin" : "",
      roughnessMetallicTexture: hairMaterial.roughnessMetallicTexture
        ? "origin"
        : "",
      normalTexture: hairMaterial.normalTexture ? "origin" : "",
      emissiveTexture: hairMaterial.emissiveTexture ? "origin" : "",
      occlusionTexture: hairMaterial.occlusionTexture ? "origin" : "",
    };

    const originTexture = {
      baseTexture: hairMaterial.baseTexture,
      roughnessMetallicTexture: hairMaterial.roughnessMetallicTexture,
      normalTexture: hairMaterial.normalTexture,
      emissiveTexture: hairMaterial.emissiveTexture,
      occlusionTexture: hairMaterial.occlusionTexture,
    };

    // metallic
    const mode1 = folder.addFolder("Metallic-Roughness props");
    mode1.add(hairMaterial, "metallic", 0, 1).step(0.01);
    mode1.add(hairMaterial, "roughness", 0, 1).step(0.01);
    mode1
      .add(state, "roughnessMetallicTexture", [
        "None",
        "origin",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.roughnessMetallicTexture =
          v === "None"
            ? null
            : this.textures[v] || originTexture.roughnessMetallicTexture;
      });

    // common
    const common = folder.addFolder("Common props");
    common
      .add(state, "opacity", 0, 1)
      .step(0.01)
      .onChange((v) => {
        hairMaterial.baseColor.a = v;
      });
    common.add(hairMaterial, "isTransparent");
    common.add(hairMaterial, "alphaCutoff", 0, 1).step(0.01);

    common.addColor(state, "baseColor").onChange((v) => {
      ViewerBase.guiToColor(v, hairMaterial.baseColor);
    });
    common.addColor(state, "emissiveColor").onChange((v) => {
      ViewerBase.guiToColor(v, hairMaterial.emissiveColor);
    });
    common
      .add(state, "baseTexture", [
        "None",
        "origin",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.baseTexture =
          v === "None" ? null : this.textures[v] || originTexture.baseTexture;
      });
    common
      .add(state, "normalTexture", [
        "None",
        "origin",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.normalTexture =
          v === "None" ? null : this.textures[v] || originTexture.normalTexture;
      });
    common
      .add(state, "emissiveTexture", [
        "None",
        "origin",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.emissiveTexture =
          v === "None"
            ? null
            : this.textures[v] || originTexture.emissiveTexture;
      });
    common
      .add(state, "occlusionTexture", [
        "None",
        "origin",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.occlusionTexture =
          v === "None"
            ? null
            : this.textures[v] || originTexture.occlusionTexture;
      });

    // common
    const specularFolder = folder.addFolder("Specular props");
    specularFolder.add(state, "pause").onChange((v) => {
      this.rotate.pause = !!v;
    });
    specularFolder.add(hairMaterial, "specularWidth", 0, 1);
    specularFolder.add(hairMaterial, "specularScale", 0, 1);
    specularFolder.add(hairMaterial, "specularPower", 0, 100);
    specularFolder.add(hairMaterial, "primaryShift", -1, 1);
    specularFolder.addColor(state, "primaryColor").onChange((v) => {
      hairMaterial.primaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    specularFolder.add(hairMaterial, "secondaryShift", -1, 1);
    specularFolder.addColor(state, "secondaryColor").onChange((v) => {
      hairMaterial.secondaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    specularFolder
      .add(state, "shiftTexture", [
        "None",
        "defaultHairShift",
        ...Object.keys(this.textures),
      ])
      .onChange((v) => {
        hairMaterial.specularShiftTexture =
          v === "None"
            ? null
            : this.textures[v] || originTexture.occlusionTexture;
      });
    specularFolder.open();

    folder.open();
  }

  private _addSketchGUI() {
    const { gui } = this;
    // Display controls.
    if (this.sketchFolder) {
      gui.removeFolder(this.sketchFolder);
    }
    this.sketchFolder = gui.addFolder("Sketch");
    this.sketchFolder.add(this.sketchSelection.sketch, "scale", 0, 0.3);
    this.sketchFolder.add(this.sketchState, "wireframeMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Wireframe, v);
    });
    this.sketchFolder
      .addColor(this.sketchState, "wireframeBaseColor")
      .onChange((v) => {
        this.sketchSelection.sketch.wireframeMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });

    this.sketchFolder.add(this.sketchState, "normalMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Normal, v);
    });
    this.sketchFolder.add(this.sketchState, "tangentMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.Tangent, v);
    });
    this.sketchFolder.add(this.sketchState, "bitangentMode").onChange((v) => {
      this.sketchSelection.sketch.setSketchMode(SketchMode.BiTangent, v);
    });

    this.sketchFolder
      .addColor(this.sketchState, "normalColor")
      .onChange((v) => {
        this.sketchSelection.sketch.normalMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });
    this.sketchFolder
      .addColor(this.sketchState, "tangentColor")
      .onChange((v) => {
        this.sketchSelection.sketch.tangentMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });
    this.sketchFolder
      .addColor(this.sketchState, "bitangentColor")
      .onChange((v) => {
        this.sketchSelection.sketch.biTangentMaterial.baseColor.set(
          v[0] / 255,
          v[1] / 255,
          v[2] / 255,
          1.0
        );
      });
    this.sketchFolder.open();
  }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();
rootEntity.addComponent(ViewerTest);

engine.run();
