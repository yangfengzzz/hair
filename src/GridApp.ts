import * as dat from "dat.gui";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    GLTFResource,
    MathUtil,
    Matrix,
    MeshRenderer,
    Quaternion,
    Script,
    WebGLEngine,
    Vector3
} from "oasis-engine";
import {GridMaterial, createGridPlane} from "./GridMaterial";

const gui = new dat.GUI();

class CameraChange extends Script {
    protected _camera: Camera = null;
    projMat = new Matrix();
    perspectiveMat = new Matrix();
    orthoMat = new Matrix();
    progress = 0;
    total = 1;

    onAwake() {
        this._camera = this.entity.getComponent(Camera);
        const camera = this._camera;
        Matrix.perspective(
            MathUtil.degreeToRadian(camera.fieldOfView),
            camera.aspectRatio,
            camera.nearClipPlane,
            camera.farClipPlane,
            this.perspectiveMat
        );
        const width = camera.orthographicSize * camera.aspectRatio;
        const height = camera.orthographicSize;
        Matrix.ortho(-width, width, -height, height, camera.nearClipPlane, camera.farClipPlane, this.orthoMat);
    }

    onEnable() {
        this.progress = 0;
    }
}

class PerspToOrtho extends CameraChange {
    onUpdate(deltaTime: number) {
        if (this.enabled) {
            this.progress += deltaTime / 1000;
            Matrix.lerp(this.perspectiveMat, this.orthoMat, this.progress / this.total, this.projMat);
            this._camera.projectionMatrix = this.projMat;
            if (this.progress / this.total > 1) {
                this.enabled = false;
            }
        }
    }
}

class OrthoToPersp extends CameraChange {
    onUpdate(deltaTime: number) {
        if (this.enabled) {
            this.progress += deltaTime / 1000;
            Matrix.lerp(this.orthoMat, this.perspectiveMat, this.progress / this.total, this.projMat);
            this._camera.projectionMatrix = this.projMat;
            if (this.progress / this.total > 1) {
                this.enabled = false;
            }
        }
    }
}

class TwoThreeTransform extends Script {
    target = new Quaternion();
    progress = new Quaternion();

    onUpdate(deltaTime: number) {
        if (this.enabled) {
            Quaternion.lerp(this.entity.transform.worldRotationQuaternion, this.target, 0.1, this.progress);
            this.entity.transform.worldRotationQuaternion = this.progress;
        }
    }

    onEnable() {
        const transform = this.entity.transform;
        const target = transform.worldPosition.clone();
        target.z *= 2;
        const rotMat = new Matrix();
        Matrix.lookAt(transform.worldPosition, target, new Vector3(0, 1, 0), rotMat);
        rotMat.getRotation(this.target);
    }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
const camera = cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, 3);
cameraEntity.addComponent(OrbitControl);
const perspToOrtho = cameraEntity.addComponent(PerspToOrtho);
perspToOrtho.enabled = false;
const orthoToPersp = cameraEntity.addComponent(OrthoToPersp);
orthoToPersp.enabled = false;
const twoThree = cameraEntity.addComponent(TwoThreeTransform);
twoThree.enabled = false;

const gridRenderer = rootEntity.addComponent(MeshRenderer);
gridRenderer.mesh = createGridPlane(engine);
const gridMaterial = new GridMaterial(engine);
gridMaterial.nearClipPlane = camera.nearClipPlane;
gridMaterial.farClipPlane = camera.farClipPlane;
gridRenderer.setMaterial(gridMaterial);

engine.resourceManager
    .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/267000040/9994/%25E5%25BD%2592%25E6%25A1%25A3.gltf")
    .then((gltf) => {
        rootEntity.addChild(gltf.defaultSceneRoot);
    });

openDebug();
engine.run();

function openDebug() {
    const info = {
        backgroundColor: [0, 0, 0],
        isOrthographic: false,
        isTwo: false,
    }
    gui.add(info, "isOrthographic").onChange((v) => {
        camera.isOrthographic = !!v;
        if (v) {
            perspToOrtho.enabled = true;
        } else {
            orthoToPersp.enabled = true;
        }
    });

    gui.add(info, "isTwo").onChange((v) => {
        if (v) {
            twoThree.enabled = true;
        } else {
            orthoToPersp.enabled = true;
        }
    });

    gui.addColor(info, "backgroundColor").onChange((v) => {
        engine.sceneManager.activeScene.background.solidColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });

    gui.add(gridMaterial, "nearClipPlane", 0, 1);
    gui.add(gridMaterial, "farClipPlane", 0, 100);
    gui.add(gridMaterial, "primaryScale", 0, 100, 1);
    gui.add(gridMaterial, "secondaryScale", 0, 10, 1);
    gui.add(gridMaterial, "gridIntensity", 0, 1);
    gui.add(gridMaterial, "axisIntensity", 0, 1);
}