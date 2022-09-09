import {
    BlinnPhongMaterial,
    Camera,
    ModelMesh,
    PBRMaterial,
    PointerButton,
    Script,
    SkinnedMeshRenderer
} from "oasis-engine";
import {SketchRenderer} from "./SketchRenderer";
import {FramebufferPicker} from "@oasis-engine-toolkit/framebuffer-picker";
import {SketchMode} from "./SketchMode";

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

export class SketchSelection extends Script {
    sketch: SketchRenderer;
    private _framebufferPicker: FramebufferPicker;
    private _selection: SelectionInfo = new SelectionInfo();

    set camera(value: Camera) {
        this._framebufferPicker.camera = value;
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
                            mtl.baseColor.a = 0.6;
                            mtl.baseColor.set(1,1,1,0.6);
                            mtl.isTransparent = true;

                            const renderer = renderElement.component;
                            sketch.targetMesh = renderElement.mesh;
                            sketch.worldTransform = renderer.entity.transform;
                            sketch.skin = null;
                            sketch.shaderData.disableMacro("O3_HAS_SKIN");
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