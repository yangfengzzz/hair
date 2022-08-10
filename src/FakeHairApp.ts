import {GizmoControls, GizmoState, OrbitControl} from "oasis-engine-toolkit";
import {
    AmbientLight,
    AssetType,
    Camera,
    DirectLight,
    GLTFResource,
    Logger,
    MeshRenderer,
    PBRMaterial,
    Script,
    Shader,
    Texture2D,
    UnlitMaterial,
    Vector3,
    WebGLEngine
} from "oasis-engine";
import {PBRFlowMaterial} from "./PBRFlowMaterial";
import {PrimitiveMesh} from "./PrimitiveMesh";

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

uniform float u_shiftU;
uniform float u_shiftV;
uniform sampler2D u_flowTexture;

vec4 flowColor() {    
    return texture2D(u_flowTexture, v_uv + vec2(u_shiftU, u_shiftV));    
}

#include <normal_get>

float computeSpecularOcclusion(float ambientOcclusion, float roughness, float dotNV ) {
    return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}

float getAARoughnessFactor(vec3 normal) {
    // Kaplanyan 2016, "Stable specular highlights"
    // Tokuyoshi 2017, "Error Reduction and Simplification for Shading Anti-Aliasing"
    // Tokuyoshi and Kaplanyan 2019, "Improved Geometric Specular Antialiasing"
    #ifdef HAS_DERIVATIVES
        vec3 dxy = max( abs(dFdx(normal)), abs(dFdy(normal)) );
        return 0.04 + max( max(dxy.x, dxy.y), dxy.z );
    #else
        return 0.04;
    #endif
}

void initGeometry(out Geometry geometry){
    geometry.position = v_pos;
    geometry.viewDir =  normalize(u_cameraPos - v_pos);

    #if defined(NORMALTEXTURE) || defined(HAS_CLEARCOATNORMALTEXTURE)
        mat3 tbn = getTBN();
    #endif

    #ifdef NORMALTEXTURE
        geometry.normal = getNormalByNormalTexture(tbn, u_normalTexture, u_normalIntensity, v_uv);
    #else
        geometry.normal = getNormal();
    #endif

    geometry.dotNV = saturate( dot(geometry.normal, geometry.viewDir) );


    #ifdef CLEARCOAT
        #ifdef HAS_CLEARCOATNORMALTEXTURE
            geometry.clearCoatNormal = getNormalByNormalTexture(tbn, u_clearCoatNormalTexture, u_normalIntensity, v_uv);
        #else
            geometry.clearCoatNormal = getNormal();
        #endif
        geometry.clearCoatDotNV = saturate( dot(geometry.clearCoatNormal, geometry.viewDir) );
    #endif

}

void initMaterial(out Material material, const in Geometry geometry){
        vec4 baseColor = u_baseColor;
        float metal = u_metal;
        float roughness = u_roughness;
        vec3 specularColor = u_PBRSpecularColor;
        float glossiness = u_glossiness;
        float alphaCutoff = u_alphaCutoff;

        #ifdef BASETEXTURE
            vec4 baseTextureColor = texture2D(u_baseTexture, v_uv);
            #ifndef OASIS_COLORSPACE_GAMMA
                baseTextureColor = gammaToLinear(baseTextureColor);
            #endif
            baseColor *= baseTextureColor;
        #endif
        baseColor += flowColor();

        #ifdef O3_HAS_VERTEXCOLOR
            baseColor *= v_color;
        #endif


        #ifdef ALPHA_CUTOFF
            if( baseColor.a < alphaCutoff ) {
                discard;
            }
        #endif

        #ifdef ROUGHNESSMETALLICTEXTURE
            vec4 metalRoughMapColor = texture2D( u_roughnessMetallicTexture, v_uv );
            roughness *= metalRoughMapColor.g;
            metal *= metalRoughMapColor.b;
        #endif

        #ifdef SPECULARGLOSSINESSTEXTURE
            vec4 specularGlossinessColor = texture2D(u_specularGlossinessTexture, v_uv );
            #ifndef OASIS_COLORSPACE_GAMMA
                specularGlossinessColor = gammaToLinear(specularGlossinessColor);
            #endif
            specularColor *= specularGlossinessColor.rgb;
            glossiness *= specularGlossinessColor.a;
        #endif


        #ifdef IS_METALLIC_WORKFLOW
            material.diffuseColor = baseColor.rgb * ( 1.0 - metal );
            material.specularColor = mix( vec3( 0.04), baseColor.rgb, metal );
            material.roughness = roughness;
        #else
            float specularStrength = max( max( specularColor.r, specularColor.g ), specularColor.b );
            material.diffuseColor = baseColor.rgb * ( 1.0 - specularStrength );
            material.specularColor = specularColor;
            material.roughness = 1.0 - glossiness;
        #endif

        material.roughness = max(material.roughness, getAARoughnessFactor(geometry.normal));

        #ifdef CLEARCOAT
            material.clearCoat = u_clearCoat;
            material.clearCoatRoughness = u_clearCoatRoughness;
            #ifdef HAS_CLEARCOATTEXTURE
                material.clearCoat *= texture2D( u_clearCoatTexture, v_uv ).r;
            #endif
            #ifdef HAS_CLEARCOATROUGHNESSTEXTURE
                material.clearCoatRoughness *= texture2D( u_clearCoatRoughnessTexture, v_uv ).g;
            #endif
            material.clearCoat = saturate( material.clearCoat );
            material.clearCoatRoughness = max(material.clearCoatRoughness, getAARoughnessFactor(geometry.clearCoatNormal));
        #endif

        material.opacity = baseColor.a;
}

// direct + indirect
#include <brdf>
#include <direct_irradiance_frag_define>
#include <ibl_frag_define>

void main() {
    #include <pbr_frag>
    #include <fog_frag>
}`);

class Flow extends Script {
    private _material: PBRFlowMaterial = null;
    private _up = new Vector3();

    set material(value: PBRFlowMaterial) {
        this._material = value;
    }

    onUpdate(deltaTime: number) {
        const up = this._up;
        this.entity.transform.getWorldUp(up);
        up.normalize();
        const sinTheta = Math.sqrt(1 - up.y * up.y);
        this._material.shiftU = up.x / sinTheta;
        this._material.shiftV = up.y;
    }
}

const hairMaterial = new PBRFlowMaterial(engine);

Promise.all([
    engine.resourceManager
        .load<GLTFResource>("http://30.46.128.40:8000//ant.glb")
        .then((gltf) => {
            gltf.defaultSceneRoot.transform.setPosition(0, -1.3, 0);
            const entity = rootEntity.createChild("hair");
            entity.addChild(gltf.defaultSceneRoot);
            entity.transform.setPosition(0, -0.2, 0);

            const box = entity.addComponent(MeshRenderer);
            box.mesh = PrimitiveMesh.createSphere(engine, 0.1);
            box.setMaterial(new UnlitMaterial(engine));
            const gizmo = entity.addComponent(GizmoControls);

            const renderer = gltf.defaultSceneRoot.findByName("Hair_16").getComponent(MeshRenderer);
            hairMaterial.normalTexture = (<PBRMaterial>renderer.getMaterial()).normalTexture;
            hairMaterial.roughness = (<PBRMaterial>renderer.getMaterial()).roughness;
            hairMaterial.metallic = (<PBRMaterial>renderer.getMaterial()).metallic;
            hairMaterial.baseColor = (<PBRMaterial>renderer.getMaterial()).baseColor;
            hairMaterial.baseTexture = (<PBRMaterial>renderer.getMaterial()).baseTexture;
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