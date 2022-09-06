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
    SkinnedMeshRenderer
} from "oasis-engine";
import {NormalMaterial} from "./NormalMaterial";

export class NormalWireframe extends Script {
    private _normalRenderers: MeshRenderer[] = [];
    private _normalMaterials: NormalMaterial[] = [];
    private _scale = 0.2;
    private _color = new Color();

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

        const engine = this.engine;
        const normalMesh = new ModelMesh(engine);
        const vertexCount = mesh.vertexCount * 2;
        const indices = new Uint16Array(vertexCount);
        const positions: Vector3[] = new Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
            positions[i] = new Vector3();
        }
        normalMesh.setPositions(positions);
        normalMesh.setIndices(indices);
        normalMesh.uploadData(true);
        normalMesh.addSubMesh(0, vertexCount, MeshTopology.Lines);

        const normalMaterial = new NormalMaterial(engine);
        normalMaterial.mesh = mesh;
        normalMaterial.scale = this._scale;
        normalMaterial.worldMatrix = worldMatrix;
        this._normalMaterials.push(normalMaterial);

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
}