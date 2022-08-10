import { Camera, Entity, Layer, PointerButton, Script } from "oasis-engine";
import {
  FramebufferPicker,
  GizmoControls,
  OrbitControl,
} from "oasis-engine-toolkit";

export class Gizmo extends Script {
  private camera: Camera;
  private rootEntity: Entity;
  private framebufferPicker;
  private gizmoLayer: Layer = Layer.Layer22;
  private EntityLayer: Layer = Layer.Layer20;
  private gizmoControls;
  private isGizmoStarted = false;

  private orbitControl;

  constructor(entity: Entity) {
    super(entity);

    // 场景相机
    this.rootEntity =
      this.entity.engine.sceneManager.activeScene.getRootEntity(0);
    this.camera = this.rootEntity.findByName("camera").getComponent(Camera);

    // orbit Controls
    // this.orbitControl = this.camera.entity.addComponent(OrbitControl);
    // this.orbitControl.enableDamping = true;

    // FramebufferPicker
    this.framebufferPicker = entity.addComponent(FramebufferPicker);
    this.framebufferPicker.camera = this.camera;

    // GizmoControls
    const gizmoEntity = this.entity.createChild("editor-gizmo");
    gizmoEntity.layer = this.gizmoLayer;
    this.gizmoControls = gizmoEntity.addComponent(GizmoControls);
    this.gizmoControls.initGizmoControl(this.camera);
    this.gizmoControls.onGizmoChange("rotate");
    this.gizmoControls.entity.isActive = false;
  }

  _selectHandler(result) {
    const selectedEntity = result?.component?.entity;
    switch (selectedEntity?.layer) {
      case this.gizmoLayer:
        this.isGizmoStarted = true;
        this.gizmoControls.triggerGizmoStart(selectedEntity.name);
        break;
      case this.EntityLayer:
        this.gizmoControls.onEntitySelected(selectedEntity);
        this.gizmoControls.entity.isActive = true;
        break;
      case undefined: {
        this.gizmoControls.onEntitySelected(null);
        this.gizmoControls.entity.isActive = false;
        break;
      }
    }
  }

  _dragHandler(result) {
    const hoverEntity = result?.component?.entity;
    if (hoverEntity?.layer === this.gizmoLayer) {
      this.gizmoControls.onGizmoHoverEnd();
      this.gizmoControls.onGizmoHoverStart(hoverEntity.name);
    } else {
      this.gizmoControls.onGizmoHoverEnd();
    }
  }

  onUpdate(deltaTime: number): void {
    const { engine } = this;
    const { inputManager } = engine;
    // Handle select.
    if (inputManager.isPointerDown(PointerButton.Primary)) {
      const pointerPosition = inputManager.pointerPosition;
      this.framebufferPicker
        .pick(pointerPosition.x, pointerPosition.y)
        .then((result) => {
          this._selectHandler(result);
        });
    }
    if (inputManager.isPointerUp(PointerButton.Primary)) {
      if (this.isGizmoStarted) {
        this.isGizmoStarted = false;
        this.gizmoControls.triggerGizmoEnd();
        this.orbitControl.enabled = true;
      }
    }

    // Handler drag.
    const pointerMovingDelta = inputManager.pointerMovingDelta;
    if (pointerMovingDelta.x !== 0 || pointerMovingDelta.y !== 0) {
      if (inputManager.isPointerHeldDown(PointerButton.Primary)) {
        if (this.isGizmoStarted) {
          this.gizmoControls.onGizmoMove();
          this.orbitControl.enabled = false;
        }
      } else {
        const pointerPosition = inputManager.pointerPosition;
        this.framebufferPicker
          .pick(pointerPosition.x, pointerPosition.y)
          .then((result) => {
            this._dragHandler(result);
          });
      }
    }
  }
}
