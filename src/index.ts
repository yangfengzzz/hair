import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera, Color,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    PBRMaterial,
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

#include <normal_get>

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
	
	return dirAtten * clamp(pow(sinTH, specPower), 0.0, 1.0) * u_specularScale;
}

vec4 getAmbientAndDiffuse(vec4 lightColor0, vec4 diffuseColor, vec3 N, vec3 L, vec2 uv) {
	return (lightColor0 * diffuseColor * clamp(dot(N, L), 0.0, 1.0) + vec4(0.2, 0.2, 0.2, 1.0)) * u_hairTex_ST;
}

vec4 getSpecular(vec4 lightColor0, 
				   vec4 primaryColor, float primaryShift,
				   vec4 secondaryColor, float secondaryShift,
				   vec3 N, vec3 T, vec3 V, vec3 L, float specPower, vec2 uv) {
	float shiftTex = texture2D(u_specularShift, uv).r - 0.5;

	vec3 t1 = shiftTangent(T, N, primaryShift + shiftTex);
	vec3 t2 = shiftTangent(T, N, secondaryShift + shiftTex);

	vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
	specular += primaryColor * hairStrandSpecular(t1, V, L, specPower) * u_specularScale;;
	specular += secondaryColor * hairStrandSpecular(t2, V, L, specPower) * u_specularScale;

	return specular;
}

void main() {
	mat3 tbn = getTBN();
    vec3 N = tbn[2];
    vec3 T = tbn[0];
	vec3 B = tbn[1];
	vec3 V = normalize(v_pos);
	vec3 L = normalize(u_directLightDirection[0]);
	vec3 H = normalize(L + V);
	vec4 u_lightColor0 = vec4(u_directLightColor[0], 1.0);

	vec4 ambientdiffuse = getAmbientAndDiffuse(u_lightColor0, vec4(u_envMapLight.diffuse, 1.0), N, L, v_uv);
	vec4 specular = getSpecular(u_lightColor0, u_primaryColor, u_primaryShift, 
								u_secondaryColor, u_secondaryShift, N, B, V, L, u_specPower, v_uv);
                
	glFragColor = ambientdiffuse + specular;
}
`);

const leftHair = new HairMaterial(engine);
const leftHairColor = new Color();
const rightHair = new HairMaterial(engine);
const rightHairColor = new Color();

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://30.46.128.43:8000/hair.glb")
        .then((gltf) => {
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -2, 0);

            const renderers: MeshRenderer[] = [];
            entity.getComponentsIncludeChildren(MeshRenderer, renderers);
            leftHairColor.copyFrom((<PBRMaterial>gltf.materials[0]).baseColor);
            renderers[0].setMaterial(leftHair);
            renderers[1].setMaterial(leftHair);
            renderers[2].setMaterial(leftHair);

            rightHairColor.copyFrom((<PBRMaterial>gltf.materials[1]).baseColor);
            renderers[3].setMaterial(rightHair);
            renderers[4].setMaterial(rightHair);
            renderers[5].setMaterial(rightHair);
        }),
    engine.resourceManager
        .load<Texture2D>("http://30.46.128.43:8000/shift.png")
        .then((tex) => {
            leftHair.specularShiftTexture = tex;
            leftHair.hairColor = leftHairColor;
            leftHair.primaryColor.set(1, 0, 0, 1);
            leftHair.primaryShift = 1;

            rightHair.specularShiftTexture = tex;
            rightHair.hairColor = rightHairColor;
        })
]).then(() => {
    engine.run();
});