import { OrbitControl } from "@oasis-engine-toolkit/controls";
import {
	AmbientLight,
	AssetType,
	BackgroundMode,
	Camera,
	DirectLight,
	GLTFResource,
	Logger,
	PrimitiveMesh,
	SkyBoxMaterial, Vector3,
	WebGLEngine
} from "oasis-engine";
Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const { ambientLight, background } = scene;
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

Promise.all([
	engine.resourceManager
		.load<GLTFResource>("http://192.168.31.217:8000/hair.glb")
		.then((gltf) => {
			const entity = rootEntity.createChild("hair");
			entity.addChild(gltf.defaultSceneRoot);
			entity.transform.setPosition(0, -2, 0);
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