import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    DirectLight,
    Logger,
    MeshRenderer,
    Script,
    Shader,
    Vector3,
    WebGLEngine,
    UnlitMaterial,
    Texture2D,
    PrimitiveMesh
} from "oasis-engine";
import {HairMaterial} from "./HairMaterial";

Logger.enable();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

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
#include <common_frag>
#include <uv_share>
#include <normal_share>
#include <light_frag_define>
#include <worldpos_share>
#include <normal_get>

#ifdef NORMALTEXTURE
    uniform sampler2D u_normalTexture;
#endif
uniform float u_normalIntensity;

#ifdef USE_HAIR_TEXTURE
    uniform sampler2D u_hairTex;
#else
    uniform vec4 u_hairTex_ST;
#endif

#ifdef USE_SPECULAR_SHIFT_TEXTURE
    uniform sampler2D u_specularShift;
#else
    uniform float u_specularShift_ST;
#endif

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
#ifdef USE_SPECULAR_SHIFT_TEXTURE
	float shiftTex = texture2D(u_specularShift, v_uv).r;
#else
    float shiftTex = u_specularShift_ST;
#endif			 
    shiftTex -= 1.0;  

	vec3 t1 = shiftTangent(T, N, primaryShift + shiftTex);
	vec3 t2 = shiftTangent(T, N, secondaryShift + shiftTex);

	vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
	specular += primaryColor * hairStrandSpecular(t1, V, L, specPower);
	specular += secondaryColor * hairStrandSpecular(t2, V, L, specPower);

	return specular;
}

float getDiffuse(vec3 N, vec3 L) {
    return clamp(mix(0.25, 1.0, dot(N, L)), 0.0, 1.0);
}

void main() {
	mat3 tbn = getTBN();
    vec3 T = normalize(tbn[0]);
	vec3 B = normalize(tbn[1]);
    vec3 N = normalize(tbn[2]);
	#include <begin_viewdir_frag>
	
#ifdef USE_HAIR_TEXTURE
    vec4 hairColor = texture2D(u_hairTex, v_uv);
#else
    vec4 hairColor = u_hairTex_ST;
#endif
	
	for( int i = 0; i < O3_DIRECT_LIGHT_COUNT; i++ ) {
        vec3 lightDir = normalize(-u_directLightDirection[i]);
        vec3 lightColor = u_directLightColor[i];
        
        float diffuse = getDiffuse(N, lightDir);
        vec4 specular = getSpecular(u_primaryColor, u_primaryShift, 
                                    u_secondaryColor, u_secondaryShift, N, B, V, lightDir, u_specPower);
                                    
        glFragColor += (specular * u_specularScale + vec4(diffuse, diffuse, diffuse, 1.0) * hairColor) * vec4(lightColor, 1.0);
    }
    glFragColor.xyz += u_envMapLight.diffuseIntensity * u_envMapLight.diffuse; // add ambient light
    
	glFragColor.a = hairColor.a;
}
`);

const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(0.0, 0.5, 0.5, 1);
const rootEntity = scene.createRootEntity();

class Rotate extends Script {
    totalTime = 0;
    target = new Vector3();

    onUpdate(deltaTime: number) {
        this.totalTime += deltaTime / 1000;
        this.entity.transform.setPosition(2 * Math.sin(this.totalTime), 0,  2 * Math.cos(this.totalTime));
        this.entity.transform.lookAt(this.target);
    }
}

const directLightNode = rootEntity.createChild("dir_light");
const light = directLightNode.addComponent(DirectLight);
const renderer = directLightNode.addComponent(MeshRenderer);
renderer.mesh = PrimitiveMesh.createSphere(engine, 0.03);
renderer.setMaterial(new UnlitMaterial(engine));
directLightNode.addComponent(Rotate);
// directLightNode.transform.setPosition(0, 5, 0);
// directLightNode.transform.lookAt(new Vector3(), new Vector3(1, 0, 0));

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, -5);
cameraNode.transform.lookAt(new Vector3())
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

const hairMaterial = new HairMaterial(engine);
const hairEntity = rootEntity.createChild("hair");
const hairRenderer = hairEntity.addComponent(MeshRenderer);
hairRenderer.mesh = PrimitiveMesh.createSphere(engine, 1, 100);
hairRenderer.setMaterial(hairMaterial);

engine.resourceManager
    .load<Texture2D>("http://30.46.130.230:8000/shift.png")
    .then((shift) => {
        engine.resourceManager
            .load<Texture2D>("http://30.46.130.230:8000/Hair_01N.png")
            .then((normal) => {
                hairMaterial.hairColor.set(0, 0, 0, 1);
                hairMaterial.normalTexture = normal;
                hairMaterial.specularShiftTexture = shift;
                hairMaterial.specularWidth = 1.0;
                hairMaterial.specularScale = 1.0;
                hairMaterial.specularPower = 16.0;

                hairMaterial.primaryColor.set(1, 1, 1, 1);
                hairMaterial.primaryShift = 0;
                hairMaterial.secondaryColor.set(1, 1, 1, 1);
                hairMaterial.secondaryShift = 0;
                engine.run();
            })
    })