import {ViewerBase} from "./ViewerBase";
import {WebGLEngine, Color, BackgroundMode, PrimitiveMesh, DirectLight, Entity} from "oasis-engine";

export class Viewer extends ViewerBase {
    lightState = {
        lights: true,
        lightColor1: Viewer.colorToGui(new Color(1, 1, 1)),
        lightColor2: Viewer.colorToGui(new Color(1, 1, 1)),
        lightIntensity1: 1,
        lightIntensity2: 1
    }
    lightEntity1: Entity = this.entity.createChild("light1");
    lightEntity2: Entity = this.entity.createChild("light2");
    light1: DirectLight = this.lightEntity1.addComponent(DirectLight);
    light2: DirectLight = this.lightEntity2.addComponent(DirectLight);

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
        this.scene.background.sky.mesh = PrimitiveMesh.createCuboid(this.engine, 1, 1, 1);
    }

    sceneGUI(lightFolder) {
        this.lightFolder.add(this.state, "lights").onChange((v) => {
            this.light1.enabled = this.light2.enabled = v;
        });
        this.lightFolder.addColor(this.state, "lightColor1").onChange((v) => {
            Viewer.guiToColor(v, this.light1.color);
        });
        this.lightFolder.addColor(this.state, "lightColor2").onChange((v) => {
            Viewer.guiToColor(v, this.light2.color);
        });
        this.lightFolder.add(this.state, "lightIntensity1", 0, 2).onChange((v) => {
            this.light1.intensity = v;
        });
        this.lightFolder.add(this.state, "lightIntensity2", 0, 2).onChange((v) => {
            this.light2.intensity = v;
        });
    }
}