import {
    BackgroundMode,
    Color,
    DirectLight,
    MeshRenderer,
    PrimitiveMesh, Script,
    UnlitMaterial,
    WebGLEngine
} from "oasis-engine";
import {ViewerBase} from "./ViewerBase";
import {SketchMode, SketchSelection} from "./sketch";

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
        purpleLightIntensity: 0.15
    }
    mainLightEntity = this.entity.createChild('mainLight');
    mainLight = this.mainLightEntity.addComponent(DirectLight);
    purpleLightEntity = this.entity.createChild('purpleLight');
    purpleLight = this.purpleLightEntity.addComponent(DirectLight);

    sketchSelection: SketchSelection = null;
    sketchState = {
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
        this.scene.background.solidColor = new Color(0, 0, 0, 0);
        this.scene.background.sky.material = this.skyMaterial;
        this.scene.background.sky.mesh = PrimitiveMesh.createCuboid(this.engine, 1, 1, 1);

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
        mainLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
        mainLightRenderer.setMaterial(new UnlitMaterial(engine));
        const purpleLightRenderer = this.purpleLightEntity.addComponent(MeshRenderer);
        purpleLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
        purpleLightRenderer.setMaterial(new UnlitMaterial(engine));
    }

    /**
     * @override
     */
    sceneGUI(lightFolder) {
        this.lightFolder.add(this.lightState, "lights").onChange((v) => {
            this.mainLight.enabled = this.purpleLight.enabled = v;
        });
        this.lightFolder.addColor(this.lightState, "mainLightColor").onChange((v) => {
            ViewerTest.guiToColor(v, this.mainLight.color);
        });
        this.lightFolder.addColor(this.lightState, "purpleLightColor").onChange((v) => {
            ViewerTest.guiToColor(v, this.purpleLight.color);
        });
        this.lightFolder.add(this.lightState, "mainLightIntensity", 0, 2).onChange((v) => {
            this.mainLight.intensity = v;
        });
        this.lightFolder.add(this.lightState, "purpleLightIntensity", 0, 2).onChange((v) => {
            this.purpleLight.intensity = v;
        });
    }

    private _addSketchGUI() {
        const {gui} = this;
        // Display controls.
        if (this.sketchFolder) {
            gui.removeFolder(this.sketchFolder);
        }
        this.sketchFolder = gui.addFolder("Sketch");
        this.sketchFolder.add(this.sketchSelection.sketch, "scale", 0, 0.3);
        this.sketchFolder.add(this.sketchState, "wireframeMode").onChange((v) => {
            this.sketchSelection.sketch.setSketchMode(SketchMode.Wireframe, v);
        });
        this.sketchFolder.addColor(this.sketchState, "wireframeBaseColor").onChange((v) => {
            this.sketchSelection.sketch.wireframeMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
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

        this.sketchFolder.addColor(this.sketchState, "normalColor").onChange((v) => {
            this.sketchSelection.sketch.normalMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
        });
        this.sketchFolder.addColor(this.sketchState, "tangentColor").onChange((v) => {
            this.sketchSelection.sketch.tangentMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
        });
        this.sketchFolder.addColor(this.sketchState, "bitangentColor").onChange((v) => {
            this.sketchSelection.sketch.biTangentMaterial.baseColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1.0);
        });

    }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();
rootEntity.addComponent(ViewerTest);

engine.run();