import {
    MeshRenderer,
    ModelMesh,
    MeshTopology,
    Vector3,
    Script,
    Matrix,
    Entity,
    Color,
    Skin,
    SkinnedMeshRenderer, Pointer
} from "oasis-engine";
import {NormalMaterial} from "./NormalMaterial";

export class NormalWireframe extends Script {
    private _normalRenderers: MeshRenderer[] = [];
    private _normalMaterials: NormalMaterial[] = [];
    private _scale = 0.02;
    private _color = new Color();
    private _wireframeMode = false;

    /**
     * wireframe mode.
     */
    get wireframeMode(): boolean {
        return this._wireframeMode;
    }

    set wireframeMode(value: boolean) {
        this._wireframeMode = value;
        const normalMaterials = this._normalMaterials;
        for (let i = 0; i < normalMaterials.length; i++) {
            if (value) {
                normalMaterials[i].shaderData.enableMacro("WIREFRAME_MODE");
            } else {
                normalMaterials[i].shaderData.disableMacro("WIREFRAME_MODE");
            }
        }
    }

    /**
     * line length scale.
     */
    get scale(): number {
        return this._scale;
    }

    set scale(value: number) {
        this._scale = value;
        const normalMaterials = this._normalMaterials;
        for (let i = 0; i < normalMaterials.length; i++) {
            normalMaterials[i].scale = value;
        }
    }

    /**
     * line length color.
     */
    get color(): Color {
        return this._color;
    }

    set color(value: Color) {
        if (value !== this._color) {
            this._color.copyFrom(value);
        }
    }

    addEntity(entity: Entity) {
        const renderers: MeshRenderer[] = [];
        entity.getComponentsIncludeChildren(MeshRenderer, renderers);
        for (let i = 0; i < renderers.length; i++) {
            this.addMeshRenderer(renderers[i]);
        }
    }

    addMeshRenderer(renderer: MeshRenderer) {
        const mesh = <ModelMesh>renderer.mesh;
        if (mesh === null) {
            throw "Only support ModelMesh.";
        }
        const worldMatrix = renderer.entity.transform.worldMatrix;

        let normalMesh: ModelMesh;
        if (this._wireframeMode) {
            normalMesh = this._createTriangleMesh(mesh);
        } else {
            normalMesh = this._createLineMesh(mesh);
        }

        const normalMaterial = new NormalMaterial(this.engine);
        normalMaterial.mesh = mesh;
        normalMaterial.scale = this._scale;
        normalMaterial.worldMatrix = worldMatrix;
        this._normalMaterials.push(normalMaterial);

        if (this._wireframeMode) {
            normalMaterial.shaderData.enableMacro("WIREFRAME_MODE");
        }

        const skinMeshRenderer = <SkinnedMeshRenderer>renderer;
        if (skinMeshRenderer !== null) {
            const normalRenderer = this.entity.addComponent(SkinnedMeshRenderer);
            normalRenderer.setMaterial(normalMaterial);
            normalRenderer.mesh = normalMesh;
            normalRenderer.skin = skinMeshRenderer.skin;
            this._normalRenderers.push(normalRenderer);
        } else {
            const normalRenderer = this.entity.addComponent(MeshRenderer);
            normalRenderer.setMaterial(normalMaterial);
            normalRenderer.mesh = normalMesh;
            this._normalRenderers.push(normalRenderer);
        }
    }

    onDisable() {
        const normalRenderers = this._normalRenderers;
        for (let i = 0; i < normalRenderers.length; i++) {
            normalRenderers[i]._onDisable();
        }
    }

    onEnable() {
        const normalRenderers = this._normalRenderers;
        for (let i = 0; i < normalRenderers.length; i++) {
            normalRenderers[i]._onEnable();
        }
    }

    private _createLineMesh(mesh: ModelMesh): ModelMesh {
        const normalMesh = new ModelMesh(this.engine);
        const vertexCount = mesh.vertexCount * 2;
        const indices = new Uint32Array(vertexCount);
        const positions: Vector3[] = new Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
            positions[i] = new Vector3();
        }
        normalMesh.setPositions(positions);
        normalMesh.setIndices(indices);
        normalMesh.uploadData(true);
        normalMesh.addSubMesh(0, vertexCount, MeshTopology.Lines);
        return normalMesh;
    }

    private _createTriangleMesh(mesh: ModelMesh): ModelMesh {
        const normalMesh = new ModelMesh(this.engine);

        let triangleCount = 0;
        const subMeshes = mesh.subMeshes;
        for (let i = 0; i < subMeshes.length; i++) {
            const subMesh = subMeshes[i];
            triangleCount += subMesh.count / 3;
        }
        const indices = new Uint32Array(triangleCount * 3);
        const positions: Vector3[] = new Array(triangleCount * 3);
        for (let i = 0; i < triangleCount; i++) {
            for (let j = 0; j < 3; j++) {
                positions[i * 3 + j] = new Vector3();
                indices[i * 3 + j] = i * 3 + j;
            }
        }
        normalMesh.setPositions(positions);
        normalMesh.setIndices(indices);
        normalMesh.uploadData(true);
        normalMesh.addSubMesh(0, triangleCount * 3);
        return normalMesh;
    }
}