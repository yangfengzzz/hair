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
    Vector3,
    WebGLEngine,
    AmbientLight,
    AssetType,
    PBRMaterial
} from "oasis-engine";
import {PBRFlowMaterial} from "./PBRFlowMaterial";

Logger.enable();
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

mainLightEntity.transform.setRotation(-22, 0, 0);
purpleLightEntity.transform.setRotation(0, 210, 0);
mainLight.intensity = 0.55;
purpleLight.intensity = 0.15;
purpleLight.color.set(189 / 255, 16 / 255, 224 / 255, 1.0);

//Create camera
const cameraNode = rootEntity.createChild("camera_node");
cameraNode.transform.setPosition(0, 0, 1);
cameraNode.addComponent(Camera);
cameraNode.addComponent(OrbitControl);

Shader.create("pbr-scan", `
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
    #include <position_vert>

    #include <fog_vert>
}
`,
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

uniform float u_time;
uniform float u_vel;
uniform vec4 u_flowColor;
uniform sampler2D u_flowTexture;
varying vec3 v_position;

vec4 flowColor() {
    vec2 offset = vec2(u_time * u_vel, 0.0);
    vec2 tiling = vec2(0.3, 1.0);
    vec2 uv = v_uv * tiling + offset;
    
    return texture2D(u_flowTexture, uv) * u_flowColor;    
}

void main() {
    Geometry geometry;
    Material material;
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    
    initGeometry(geometry);
    initMaterial(material, geometry);
    
    // Direct Light
    addTotalDirectRadiance(geometry, material, reflectedLight);
    
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
    vec3 emissiveRadiance = flowColor().rgb;
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
    
    #include <fog_frag>
}`);

class Flow extends Script {
    private _time: number = 0;
    private _material: PBRFlowMaterial = null;

    set material(value: PBRFlowMaterial) {
        this._material = value;
    }

    onUpdate(deltaTime: number) {
        this._material.time = 0;
    }
}

const hairMaterial = new PBRFlowMaterial(engine);

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://30.46.128.40:8000//ant.glb")
        .then((gltf) => {
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -1.5, 0);

            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            hairMaterial.normalTexture = (<PBRMaterial>renderer.getMaterial()).normalTexture;
            renderer.setMaterial(hairMaterial);
            renderer.entity.addComponent(Flow).material = hairMaterial;
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
        .load<Texture2D>("http://30.46.128.40:8000/hair-Hlight.jpg")
        .then((highlight) => {
            hairMaterial.flowTexture = highlight;
        })
]).then(() => {
    engine.run();
});