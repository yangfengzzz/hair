import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    RenderFace,
    Script,
    Shader,
    Texture2D,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {HairMaterial} from "./HairMaterial";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const {ambientLight, background} = scene;
ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
background.solidColor.set(0, 0, 0, 1);
const rootEntity = scene.createRootEntity();

class Rotate extends Script {
    totalTime = 0;
    target = new Vector3();
    onUpdate(deltaTime: number) {
        this.totalTime += deltaTime / 1000;
        this.entity.transform.setPosition(10 * Math.sin(this.totalTime), 10, 10 * Math.cos(this.totalTime));
        this.entity.transform.lookAt(this.target);
    }
}

const directLightNode = rootEntity.createChild("dir_light");
directLightNode.addComponent(DirectLight);
directLightNode.addComponent(Rotate);
// directLightNode.transform.setPosition(-10, -1.5, -10);
// directLightNode.transform.lookAt(new Vector3());

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

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
#include <uv_share>
#include <normal_share>
#include <light_frag_define>
#include <worldpos_share>
#include <common_frag>
#include <normal_get>
uniform sampler2D u_hairTex;
uniform vec4 u_hairTex_ST;
uniform sampler2D u_specularShift;
uniform vec4 u_specularShift_ST;
    
uniform vec4 u_primaryColor;
uniform float u_primaryShift;
uniform vec4 u_secondaryColor;
uniform float u_secondaryShift;
    
uniform float u_specPower;
uniform float u_specularWidth;
uniform float u_specularScale;
    
vec3 shiftTangent(vec3 T, vec3 N, float shift) {
	return normalize(T + shift * N);
}

float hairStrandSpecular(vec3 T, vec3 V, vec3 L, float specPower) {
	vec3 H = normalize(V + L);

	float HdotT = dot(T, H);
	float sinTH = sqrt(1.0 - HdotT * HdotT);
	float dirAtten = smoothstep(-u_specularWidth, 0.0, HdotT);
	
	return dirAtten * clamp(pow(sinTH, specPower), 0.0, 1.0);
}

vec4 getSpecular(vec4 primaryColor, float primaryShift,
				   vec4 secondaryColor, float secondaryShift,
				   vec3 N, vec3 T, vec3 V, vec3 L, float specPower) {
	float shiftTex = texture2D(u_specularShift, v_uv).r;

	vec3 t1 = shiftTangent(T, N, primaryShift + shiftTex);
	vec3 t2 = shiftTangent(T, N, secondaryShift + shiftTex);

	vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
	specular += primaryColor * hairStrandSpecular(t1, V, L, specPower);
	specular += secondaryColor * hairStrandSpecular(t2, V, L, specPower);

	return specular;
}

vec4 getAmbientAndDiffuse(vec4 lightColor0, vec4 diffuseColor, vec3 N, vec3 L) {
    return clamp(mix(0.25, 1.0, dot(N, L)), 0.0, 1.0) * lightColor0 * diffuseColor;
}

void main() {
	mat3 tbn = getTBN();
    vec3 T = normalize(tbn[0]);
	vec3 B = normalize(tbn[1]);
	vec3 N = normalize(tbn[2]);
	#include <begin_viewdir_frag>
	vec3 L = normalize(u_directLightDirection[0]);
	vec3 H = normalize(L + V);
	vec4 u_lightColor0 = vec4(u_directLightColor[0], 1.0);

	vec4 ambientDiffuse = getAmbientAndDiffuse(u_lightColor0, vec4(u_envMapLight.diffuse, 1.0), N, L);
	vec4 specular = getSpecular(u_primaryColor, u_primaryShift, 
								u_secondaryColor, u_secondaryShift, N, B, V, L, u_specPower);
                
	glFragColor = (specular * u_specularScale + ambientDiffuse) * texture2D(u_hairTex, v_uv);
	glFragColor.a = 1.0;
}
`);

const hairMaterial = new HairMaterial(engine);

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("https://gw.alipayobjects.com/os/OasisHub/676000145/1682/Pocolov%252520Hair%25252016.gltf")
        .then((gltf) => {
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -1.5, 0);
            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            renderer.setMaterial(hairMaterial);

            const renderers:MeshRenderer[] = [];
            entity.getComponentsIncludeChildren(MeshRenderer, renderers);
            renderers[1]._onDisable(); // remove yellow cover
        }),
    engine.resourceManager
        .load<Texture2D>("http://30.46.128.43:8000/shift.png")
        .then((shift) => {
            engine.resourceManager
                .load<Texture2D>("https://gw.alipayobjects.com/zos/OasisHub/676000145/7692/Hair_01_Gray.png")
                .then((hair) => {
                    engine.resourceManager
                        .load<Texture2D>("http://30.46.128.43:8000/Hair_01N.png")
                        .then((normal) => {
                            hairMaterial.renderFace = RenderFace.Front;
                            hairMaterial.normalTexture = normal;
                            hairMaterial.specularShiftTexture = shift;
                            hairMaterial.hairTexture = hair;
                            hairMaterial.specularWidth = 1.0;
                            hairMaterial.specularScale = 0.5;
                            hairMaterial.specularPower = 16.0;

                            hairMaterial.primaryColor.set(1, 1, 1, 1);
                            hairMaterial.primaryShift = 0.2;
                            hairMaterial.secondaryColor.set(1, 1, 1, 1);
                            hairMaterial.secondaryShift = -0.1;
                        })
                })
        })
]).then(() => {
    engine.run();
});