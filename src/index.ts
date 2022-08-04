import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    AmbientLight,
    AssetType,
    BackgroundMode,
    Camera,
    DirectLight,
    GLTFResource,
    Logger, MeshRenderer,
    PrimitiveMesh, Shader,
    SkyBoxMaterial, Vector3,
    WebGLEngine
} from "oasis-engine";
import {HairMaterial} from "./HairMaterial";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const {ambientLight, background} = scene;
const rootEntity = scene.createRootEntity();

const directLightNode = rootEntity.createChild("dir_light");
directLightNode.addComponent(DirectLight);
directLightNode.transform.setPosition(10, 10, 10);
directLightNode.transform.lookAt(new Vector3());

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 5, 15);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

// Create sky
const sky = background.sky;
const skyMaterial = new SkyBoxMaterial(engine);
background.mode = BackgroundMode.Sky;

sky.material = skyMaterial;
sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

Shader.create("hair",
    `
#include <common>
#include <common_vert>
#include <blendShape_input>
#include <uv_share>
#include <color_share>
#include <normal_share>
#include <worldpos_share>
#include <shadow_share>

#include <fog_share>

void main() {

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <uv_vert>
    #include <color_vert>
    #include <normal_vert>
    #include <worldpos_vert>
    #include <shadow_vert>
    #include <position_vert>

    #include <fog_vert>

}`,
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    `
vec3 shiftTangent(vec3 T, vec3 N, float shift) {
	return normalize(T + shift * N);
}

void main() {
	glFragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`);

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://192.168.31.217:8000/hair.glb")
        .then((gltf) => {
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -2, 0);

            const renderers: MeshRenderer[] = [];
            entity.getComponentsIncludeChildren(MeshRenderer, renderers);
            for (let i = 0, n = renderers.length; i < n; i++) {
                const renderer = renderers[i];
                renderer.setMaterial(new HairMaterial(engine));
            }
        }),
    engine.resourceManager
        .load<AmbientLight>({
            type: AssetType.Env,
            url: "https://gw.alipayobjects.com/os/bmw-prod/f369110c-0e33-47eb-8296-756e9c80f254.bin"
        })
        .then((ambientLight) => {
            scene.ambientLight = ambientLight;
            skyMaterial.textureCubeMap = ambientLight.specularTexture;
            skyMaterial.textureDecodeRGBM = true;
        })
]).then(() => {
    engine.run();
});