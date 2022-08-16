import * as dat from "dat.gui";
import {
    Camera,
    GLTFResource,
    MathUtil,
    Matrix,
    Quaternion,
    Script,
    WebGLEngine,
    Vector3
} from "oasis-engine";
import {OrthoControl, OrbitControl} from "oasis-engine-toolkit";
import {GridControl} from "./GridMaterial";

const gui = new dat.GUI();

class CameraTransform extends Script {
    protected _camera: Camera = null;
    projMat = new Matrix();
    perspectiveMat = new Matrix();
    orthoMat = new Matrix();
    progress = 0;
    isInverse = false;

    /**
     * speed
     */
    speed = 10;

    onAwake() {
        this.enabled = false;
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

    onUpdate(deltaTime: number) {
        if (this.enabled) {
            this.progress += deltaTime / 1000;
            let percent = MathUtil.clamp(this.progress * this.speed, 0, 1);
            if (percent >= 1) {
                this.enabled = false;
            }

            if (this.isInverse) {
                percent = 1 - percent;
            }
            Matrix.lerp(this.perspectiveMat, this.orthoMat, percent, this.projMat);
            this._camera.projectionMatrix = this.projMat;
        }
    }

    onEnable() {
        this.progress = 0;
    }
}

class TwoThreeTransform extends Script {
    protected _camera: Camera = null;
    projMat = new Matrix();
    perspectiveMat = new Matrix();
    orthoMat = new Matrix();

    orbitControl: OrbitControl;
    orthoControl: OrthoControl;
    gridControl: GridControl;

    beginPos = new Vector3();
    targetPos = new Vector3(0, 0.01, 10);
    beginRot = new Quaternion();
    targetRot = new Quaternion();

    private _progress = 0;
    isInverse = false;

    /**
     * speed
     */
    speed = 6;

    onAwake() {
        this.enabled = false;
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

        this.orbitControl = this.entity.addComponent(OrbitControl);
        this.orbitControl.enabled = true;
        this.orthoControl = this.entity.addComponent(OrthoControl);
        this.orthoControl.enabled = false;
        this.gridControl = cameraEntity.addComponent(GridControl);
    }

    onUpdate(deltaTime: number) {
        if (this.enabled) {
            // make proj mat is exact 1;
            let crossOne = false;
            if (this._progress * this.speed <= 1 && (this._progress + deltaTime / 1000) * this.speed >= 1) {
                crossOne = true;
            }
            this._progress += deltaTime / 1000;
            let percent = MathUtil.clamp(this._progress * this.speed, 0, 2);
            if (crossOne) {
                percent = 1;
            }

            if (percent <= 1) {
                if (this.isInverse) {
                    this.orthoControl.enabled = false;
                    if (this.gridControl) {
                        this.gridControl.is2DGrid = false;
                        this.gridControl = null;
                    }
                } else {
                    this.orbitControl.enabled = false;
                    this._cameraTransform(percent);
                    this._projTransform(percent);
                }
            }

            if (percent > 1 && percent <= 2) {
                if (this.isInverse) {
                    this._cameraTransform(percent - 1);
                    this._projTransform(percent - 1);
                } else {
                    if (this.gridControl) {
                        this.gridControl.is2DGrid = true;
                        this.gridControl = null;
                    }
                }
            }

            if (percent >= 2) {
                this.enabled = false;
                if (this.isInverse) {
                    this.orbitControl.enabled = false;
                } else {
                    this.orthoControl.enabled = true;
                }
            }
        }
    }

    onEnable() {
        this._progress = 0;
        this.gridControl = this.entity.getComponent(GridControl);

        const transform = this.entity.transform;
        this.beginRot.copyFrom(transform.worldRotationQuaternion);
        this.beginPos.copyFrom(transform.worldPosition);

        if (!this.isInverse) {
            const rotMat = new Matrix();
            const worldPos = transform.worldPosition.clone();
            worldPos.z += 10;
            worldPos.y -= 0.01;
            Matrix.lookAt(transform.worldPosition, worldPos, new Vector3(0, 1, 0), rotMat);
            rotMat.getRotation(this.targetRot);
            this.targetPos.set(0, 0.01, Math.sign(this.beginPos.z) * this.beginPos.length());
        }
    }

    private _cameraTransform(percent: number) {
        if (this.isInverse) {
            percent = 1 - percent;
        }

        if (!this.isInverse) {
            const worldQuat = this.entity.transform.worldRotationQuaternion;
            Quaternion.lerp(this.beginRot, this.targetRot, percent, worldQuat);
            Vector3.lerp(this.beginPos, this.targetPos, percent, this.entity.transform.worldPosition);
        }
    }

    private _projTransform(percent: number) {
        if (this.isInverse) {
            percent = 1 - percent;
        }
        Matrix.lerp(this.perspectiveMat, this.orthoMat, percent, this.projMat);
        this._camera.projectionMatrix = this.projMat;
    }
}

class Debug extends Script {
    onUpdate(deltaTime: number) {
        const worldQuat = this.entity.transform.worldRotationQuaternion;
        console.log(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
    }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
engine.sceneManager.activeScene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
const camera = cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(3, 3, -3);
cameraEntity.transform.lookAt(new Vector3())
const cameraTransform = cameraEntity.addComponent(CameraTransform);
const twoThree = cameraEntity.addComponent(TwoThreeTransform);
cameraEntity.addComponent(Debug);

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
            cameraTransform.isInverse = false;
            cameraTransform.enabled = true;
        } else {
            cameraTransform.isInverse = true;
            cameraTransform.enabled = true;
        }
    });

    gui.add(info, "isTwo").onChange((v) => {
        camera.isOrthographic = !!v;
        if (v) {
            twoThree.isInverse = false;
            twoThree.enabled = true;
        } else {
            twoThree.isInverse = true;
            twoThree.enabled = true;
        }
    });

    gui.addColor(info, "backgroundColor").onChange((v) => {
        engine.sceneManager.activeScene.background.solidColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });

    gui.add(twoThree.gridControl, "speed", 0, 10);
    gui.add(twoThree.gridControl.material, "nearClipPlane", 0, 1);
    gui.add(twoThree.gridControl.material, "farClipPlane", 0, 100);
    gui.add(twoThree.gridControl.material, "primaryScale", 0, 100, 1);
    gui.add(twoThree.gridControl.material, "secondaryScale", 0, 10, 1);
    gui.add(twoThree.gridControl.material, "gridIntensity", 0, 1);
    gui.add(twoThree.gridControl.material, "axisIntensity", 0, 1);
    gui.add(twoThree.gridControl.material, "flipProgress", 0, 1);

    gui.add(cameraTransform, "speed", 0, 10);
    gui.add(twoThree, "speed", 0, 10);
}