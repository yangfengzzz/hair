import {MeshRenderer, ModelMesh, MeshTopology, Vector3, Script} from "oasis-engine";
import {NormalMaterial} from "./NormalMaterial";

export class NormalWireframe extends Script {
    private _renderers: MeshRenderer[] = [];
    private _meshes: ModelMesh[] = [];

    private _normalRenderers: MeshRenderer[] = [];
    private _normalMaterials: NormalMaterial[] = [];
    private _scale = 0.2;

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

    onAwake() {
        const {_renderers: renderers, _meshes: meshes} = this;
        this.entity.getComponentsIncludeChildren(MeshRenderer, renderers);
        for (let i = 0; i < renderers.length; i++) {
            let renderer = renderers[i];
            const modelMesh = <ModelMesh>renderer.mesh;
            if (modelMesh !== null) {
                meshes.push(modelMesh);
            }
        }

        for (let i = 0; i < meshes.length; i++) {
            this._createNormalRenderer(meshes[i]);
        }
    }

    private _createNormalRenderer(mesh: ModelMesh) {
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
        this._normalMaterials.push(normalMaterial);

        const normalRenderer = this.entity.addComponent(MeshRenderer);
        normalRenderer.setMaterial(normalMaterial);
        normalRenderer.mesh = normalMesh;
        this._normalRenderers.push(normalRenderer);
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