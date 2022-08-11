import * as dat from "dat.gui";
import {OrbitControl} from "@oasis-engine-toolkit/controls";
import {
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    Script,
    Shader,
    Texture2D,
    WebGLEngine,
    AmbientLight,
    AssetType,
    PBRMaterial,
    PrimitiveMesh,
    UnlitMaterial
} from "oasis-engine";
import {PBRHairMaterial} from "./PBRHairMaterial";

Logger.enable();
const gui = new dat.GUI();

//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
scene.background.solidColor.set(0.0, 0.5, 0.5, 1);
const rootEntity = scene.createRootEntity();

const mainLightEntity = rootEntity.createChild('mainLight');
const mainLight = mainLightEntity.addComponent(DirectLight);
const purpleLightEntity = rootEntity.createChild('purpleLight');
const purpleLight = purpleLightEntity.addComponent(DirectLight);

mainLightEntity.transform.setPosition(0, 0, 0.5);
mainLightEntity.transform.setRotation(-22, 0, 0);
purpleLightEntity.transform.setPosition(0, 0, -0.5);
purpleLightEntity.transform.setRotation(0, 210, 0);
mainLight.intensity = 0.55;
purpleLight.intensity = 0.15;
purpleLight.color.set(189 / 255, 16 / 255, 224 / 255, 1.0);

const mainLightRenderer = mainLightEntity.addComponent(MeshRenderer);
mainLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
mainLightRenderer.setMaterial(new UnlitMaterial(engine));
const purpleLightRenderer = purpleLightEntity.addComponent(MeshRenderer);
purpleLightRenderer.mesh = PrimitiveMesh.createCuboid(engine, 0.01, 0.01, 0.01);
purpleLightRenderer.setMaterial(new UnlitMaterial(engine));

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

class RotateX extends Script {
    private _time: number = -30;

    onUpdate(deltaTime: number) {
        this._time += deltaTime / 100;
        if (this._time > 30) {
            this._time -= 60;
        }
        this.entity.transform.rotation.x = this._time;
    }
}

class RotateY extends Script {
    pause = false;
    private _time: number = 0;

    onUpdate(deltaTime: number) {
        if (!this.pause) {
            this._time += deltaTime / 20;
            if (this._time > 360) {
                this._time -= 360;
            }
            this.entity.transform.rotation.y = this._time;
        }
    }
}

class RotateZ extends Script {
    private _time: number = -30;

    onUpdate(deltaTime: number) {
        this._time += deltaTime / 100;
        if (this._time > 30) {
            this._time -= 60;
        }
        this.entity.transform.rotation.z = this._time;
    }
}

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
#define IS_METALLIC_WORKFLOW
#include <common>
#include <common_frag>

#include <fog_share>

#include <uv_share>
#include <normal_share>
#include <color_share>
#include <worldpos_share>

#include <light_frag_define>

#include <pbr_frag_define>
#include <pbr_helper>

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

float hairStrandSpecular(vec3 N, vec3 T, vec3 V, vec3 L, float specPower) {
	vec3 H = normalize(V + L);

	float HdotT = dot(T, H);
	float scale = smoothstep(0.0, 1.0, dot(N, L)); // prevent back light
	float sinTH = sqrt(1.0 - HdotT * HdotT);
	float dirAtten = smoothstep(-u_specularWidth, 0.0, HdotT);
	
	return scale * dirAtten * clamp(pow(sinTH, specPower), 0.0, 1.0);
}

vec4 getSpecular(vec4 primaryColor, float primaryShift,
				   vec4 secondaryColor, float secondaryShift,
				   vec3 N, vec3 T, vec3 V, vec3 L, float specPower) {
#ifdef USE_SPECULAR_SHIFT_TEXTURE
	float shiftTex = texture2D(u_specularShift, v_uv).r;
#else
    float shiftTex = u_specularShift_ST;
#endif		
    shiftTex -= 0.5;	   

	vec3 t1 = shiftTangent(T, N, primaryShift + shiftTex);
	vec3 t2 = shiftTangent(T, N, secondaryShift + shiftTex);

	vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);
	specular += primaryColor * hairStrandSpecular(N, t1, V, L, specPower);
	specular += secondaryColor * hairStrandSpecular(N, t2, V, L, specPower);

	return specular;
}

float getDiffuse(vec3 N, vec3 L) {
    return clamp(mix(0.25, 1.0, dot(N, L)), 0.0, 1.0);
}

void addTotalHairRadiance(inout ReflectedLight reflectedLight) {
	mat3 tbn = getTBN();
    vec3 T = normalize(tbn[0]);
	vec3 B = normalize(tbn[1]);
#ifdef NORMALTEXTURE
    vec3 N = getNormalByNormalTexture(tbn, u_normalTexture, u_normalIntensity, v_uv);
#else
    vec3 N = getNormal();
#endif	
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
                                    
        reflectedLight.directSpecular += specular.xyz * u_specularScale * lightColor;
        reflectedLight.directDiffuse += diffuse * hairColor.xyz * lightColor;
    }
}

void main() {
    Geometry geometry;
    Material material;
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    
    initGeometry(geometry);
    initMaterial(material, geometry);
    
    // Direct Light
    addTotalHairRadiance(reflectedLight);
    
    // IBL diffuse
    #ifdef O3_USE_SH
        vec3 irradiance = getLightProbeIrradiance(u_env_sh, geometry.normal);
        #ifdef OASIS_COLORSPACE_GAMMA
            irradiance = linearToGamma(vec4(irradiance, 1.0)).rgb;
        #endif
        irradiance *= u_envMapLight.diffuseIntensity;
    #else
       vec3 irradiance = u_envMapLight.diffuse * u_envMapLight.diffuseIntensity;
       irradiance *= PI;
    #endif
    
    reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
    
    // IBL specular
    vec3 radiance = getLightProbeRadiance(geometry.viewDir, geometry.normal, material.roughness, int(u_envMapLight.mipMapLevel), u_envMapLight.specularIntensity);
    float radianceAttenuation = 1.0;
    
    #ifdef CLEARCOAT
        vec3 clearCoatRadiance = getLightProbeRadiance( geometry.viewDir, geometry.clearCoatNormal, material.clearCoatRoughness, int(u_envMapLight.mipMapLevel), u_envMapLight.specularIntensity );
    
        reflectedLight.indirectSpecular += clearCoatRadiance * material.clearCoat * envBRDFApprox(vec3( 0.04 ), material.clearCoatRoughness, geometry.clearCoatDotNV);
        radianceAttenuation -= material.clearCoat * F_Schlick(geometry.clearCoatDotNV);
    #endif
    
    reflectedLight.indirectSpecular += radianceAttenuation * radiance * envBRDFApprox(material.specularColor, material.roughness, geometry.dotNV );
    
    
    // Occlusion
    #ifdef OCCLUSIONTEXTURE
        vec2 aoUV = v_uv;
        #ifdef O3_HAS_UV1
            if(u_occlusionTextureCoord == 1.0){
                aoUV = v_uv1;
            }
        #endif
        float ambientOcclusion = (texture2D(u_occlusionTexture, aoUV).r - 1.0) * u_occlusionIntensity + 1.0;
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #ifdef O3_USE_SPECULAR_ENV
            reflectedLight.indirectSpecular *= computeSpecularOcclusion(ambientOcclusion, material.roughness, geometry.dotNV);
        #endif
    #endif
    
    
    // Emissive
    vec3 emissiveRadiance = u_emissiveColor;
    #ifdef EMISSIVETEXTURE
        vec4 emissiveColor = texture2D(u_emissiveTexture, v_uv);
        #ifndef OASIS_COLORSPACE_GAMMA
            emissiveColor = gammaToLinear(emissiveColor);
        #endif
        emissiveRadiance *= emissiveColor.rgb;
    #endif
    
    // Total
    vec3 totalRadiance =    reflectedLight.directDiffuse + 
                            reflectedLight.indirectDiffuse + 
                            reflectedLight.directSpecular + 
                            reflectedLight.indirectSpecular + 
                            emissiveRadiance;
    
    vec4 targetColor =vec4(totalRadiance, material.opacity);
    #ifndef OASIS_COLORSPACE_GAMMA
        targetColor = linearToGamma(targetColor);
    #endif
    gl_FragColor = targetColor;
}`);

const hairMaterial = new PBRHairMaterial(engine);
let rotate: RotateY;

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://30.46.128.46:8000/ant-t.gltf")
        .then((gltf) => {
            gltf.defaultSceneRoot.transform.setPosition(0, -1.3, 0);
            rotate = gltf.defaultSceneRoot.addComponent(RotateY);
            // gltf.defaultSceneRoot.addComponent(RotateX);
            // gltf.defaultSceneRoot.addComponent(RotateZ);

            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -0.2, 0);

            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            const material = <PBRMaterial>renderer.getMaterial();
            hairMaterial.roughness = material.roughness;
            hairMaterial.metallic = material.metallic;
            hairMaterial.baseColor = material.baseColor;
            hairMaterial.baseTexture = material.baseTexture;
            hairMaterial.normalTexture = material.normalTexture;
            hairMaterial.normalTextureIntensity = material.normalTextureIntensity;

            hairMaterial.hairTexture = material.baseTexture;
            hairMaterial.hairColor = material.baseColor;
            renderer.setMaterial(hairMaterial);
        }),
    engine.resourceManager
        .load<AmbientLight>({
            type: AssetType.Env,
            url: 'https://gw.alipayobjects.com/os/bmw-prod/67b05052-ecf8-46f1-86ff-26d9abcc83ea.bin',
        })
        .then((ambientLight) => {
            ambientLight.diffuseIntensity = ambientLight.specularIntensity = 0.5;
            scene.ambientLight = ambientLight;
        }),
    engine.resourceManager
        .load<Texture2D>("http://30.46.128.46:8000/hair-Anisotropic-4.jpg")
        .then((shift) => {
            hairMaterial.specularShiftTexture = shift;
            hairMaterial.specularWidth = 1.0;
            hairMaterial.specularScale = 0.15;
            hairMaterial.specularPower = 64.0;

            hairMaterial.primaryColor.set(1, 1, 1, 1);
            hairMaterial.primaryShift = 0.25;
            hairMaterial.secondaryColor.set(1, 1, 1, 1);
            hairMaterial.secondaryShift = 0.25;
        })
]).then(() => {
    openDebug();
    engine.run();
});

function openDebug() {
    const info = {
        hairColor: [0, 0, 0],
        primaryColor: [255, 255, 255],
        secondaryColor: [255, 255, 255],
        pause: false,
        mainLightIntensity: 0.55,
        purpleLightIntensity: 0.15,
        ambientLightDiffuseIntensity: 0.5,
        ambientLightSpecularIntensity: 0.5,
    };

    gui.add(info, "pause").onChange((v) => {
        rotate.pause = !!v;
    });
    gui.addColor(info, "hairColor").onChange((v) => {
        hairMaterial.hairColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    gui.add(hairMaterial, "specularWidth", 0, 1);
    gui.add(hairMaterial, "specularScale", 0, 1);
    gui.add(hairMaterial, "specularPower", 0, 100);
    gui.add(hairMaterial, "primaryShift", -1, 1);
    gui.addColor(info, "primaryColor").onChange((v) => {
        hairMaterial.primaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });
    gui.add(hairMaterial, "secondaryShift", -1, 1);
    gui.addColor(info, "secondaryColor").onChange((v) => {
        hairMaterial.secondaryColor.set(v[0] / 255, v[1] / 255, v[2] / 255, 1);
    });

    gui.add(hairMaterial, "roughness", 0, 1);
    gui.add(hairMaterial, "metallic", 0, 1);
    gui.add(hairMaterial, "normalTextureIntensity", 0, 1);
    gui.add(info, "mainLightIntensity").onChange((v) => {
        mainLight.intensity = v;
    });
    gui.add(info, "purpleLightIntensity").onChange((v) => {
        purpleLight.intensity = v;
    });
    gui.add(info, "ambientLightDiffuseIntensity").onChange((v) => {
        scene.ambientLight.diffuseIntensity = v;
    });
    gui.add(info, "ambientLightSpecularIntensity").onChange((v) => {
        scene.ambientLight.specularIntensity = v;
    });
}