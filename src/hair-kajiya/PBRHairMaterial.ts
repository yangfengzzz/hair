import {Color, Engine, PBRBaseMaterial, Shader, Texture2D} from "oasis-engine";

/**
 * PBR Hair Material
 */
export class PBRHairMaterial extends PBRBaseMaterial {
    private static _metallicProp = Shader.getPropertyByName("u_metal");
    private static _roughnessProp = Shader.getPropertyByName("u_roughness");
    private static _roughnessMetallicTextureProp = Shader.getPropertyByName("u_roughnessMetallicTexture");

    private static _specularShiftTextureMacro = Shader.getMacroByName("USE_SPECULAR_SHIFT_TEXTURE");
    private static _specularShiftTextureProp = Shader.getPropertyByName("u_specularShift");
    private static _specularShiftProp = Shader.getPropertyByName("u_specularShift_ST");

    private static _primaryColorProp = Shader.getPropertyByName("u_primaryColor");
    private static _primaryShiftProp = Shader.getPropertyByName("u_primaryShift");
    private static _secondaryColorProp = Shader.getPropertyByName("u_secondaryColor");
    private static _secondaryShiftProp = Shader.getPropertyByName("u_secondaryShift");

    private static _specPowerProp = Shader.getPropertyByName("u_specPower");
    private static _specularWidthProp = Shader.getPropertyByName("u_specularWidth");
    private static _specularScaleProp = Shader.getPropertyByName("u_specularScale");

    /**
     * specular shift texture
     */
    get specularShiftTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(PBRHairMaterial._specularShiftTextureProp);
    }

    set specularShiftTexture(value: Texture2D) {
        const shaderData = this.shaderData;
        shaderData.setTexture(PBRHairMaterial._specularShiftTextureProp, value);
        if (value !== null && value !== undefined) {
            shaderData.enableMacro(PBRHairMaterial._specularShiftTextureMacro);
        } else {
            shaderData.disableMacro(PBRHairMaterial._specularShiftTextureMacro);
        }
    }

    /**
     * specular shift
     */
    get specularShift(): number {
        return this.shaderData.getFloat(PBRHairMaterial._specularShiftProp);
    }

    set specularShift(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._specularShiftProp, value);
    }

    /**
     * primary color
     */
    get primaryColor(): Color {
        return this.shaderData.getColor(PBRHairMaterial._primaryColorProp);
    }

    set primaryColor(value: Color) {
        const color = this.shaderData.getColor(PBRHairMaterial._primaryColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

    /**
     * primary shift
     */
    get primaryShift(): number {
        return this.shaderData.getFloat(PBRHairMaterial._primaryShiftProp);
    }

    set primaryShift(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._primaryShiftProp, value);
    }

    /**
     * secondary color
     */
    get secondaryColor(): Color {
        return this.shaderData.getColor(PBRHairMaterial._secondaryColorProp);
    }

    set secondaryColor(value: Color) {
        const color = this.shaderData.getColor(PBRHairMaterial._secondaryColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

    /**
     * secondary shift
     */
    get secondaryShift(): number {
        return this.shaderData.getFloat(PBRHairMaterial._secondaryShiftProp);
    }

    set secondaryShift(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._secondaryShiftProp, value);
    }

    /**
     * specular power
     */
    get specularPower(): number {
        return this.shaderData.getFloat(PBRHairMaterial._specPowerProp);
    }

    set specularPower(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._specPowerProp, value);
    }

    /**
     * specular width
     */
    get specularWidth(): number {
        return this.shaderData.getFloat(PBRHairMaterial._specularWidthProp);
    }

    set specularWidth(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._specularWidthProp, value);
    }

    /**
     * specular scale
     */
    get specularScale(): number {
        return this.shaderData.getFloat(PBRHairMaterial._specularScaleProp);
    }

    set specularScale(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._specularScaleProp, value);
    }

    /**
     * Metallic, default 1.0.
     */
    get metallic(): number {
        return this.shaderData.getFloat(PBRHairMaterial._metallicProp);
    }

    set metallic(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._metallicProp, value);
    }

    /**
     * Roughness, default 1.0.
     */
    get roughness(): number {
        return this.shaderData.getFloat(PBRHairMaterial._roughnessProp);
    }

    set roughness(value: number) {
        this.shaderData.setFloat(PBRHairMaterial._roughnessProp, value);
    }

    /**
     * Roughness metallic texture.
     * @remarks G channel is roughness, B channel is metallic
     */
    get roughnessMetallicTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(PBRHairMaterial._roughnessMetallicTextureProp);
    }

    set roughnessMetallicTexture(value: Texture2D) {
        this.shaderData.setTexture(PBRHairMaterial._roughnessMetallicTextureProp, value);
        if (value) {
            this.shaderData.enableMacro("ROUGHNESSMETALLICTEXTURE");
        } else {
            this.shaderData.disableMacro("ROUGHNESSMETALLICTEXTURE");
        }
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("hair"));

        const shaderData = this.shaderData;
        shaderData.setColor(PBRHairMaterial._primaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setColor(PBRHairMaterial._secondaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setFloat(PBRHairMaterial._specPowerProp, 64);
        shaderData.setFloat(PBRHairMaterial._specularScaleProp, 1);
        shaderData.setFloat(PBRHairMaterial._specularWidthProp, 1);
        shaderData.setFloat(PBRHairMaterial._specularShiftProp, 0);
        shaderData.setFloat(PBRHairMaterial._primaryShiftProp, 0);
        shaderData.setFloat(PBRHairMaterial._secondaryShiftProp, 0);

        shaderData.setFloat(PBRHairMaterial._metallicProp, 1);
        shaderData.setFloat(PBRHairMaterial._roughnessProp, 1);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

void addTotalHairRadiance(vec3 hairColor, vec3 viewDir, vec3 N, inout ReflectedLight reflectedLight) {
	mat3 tbn = getTBN();
    vec3 T = normalize(tbn[0]);
	vec3 B = normalize(tbn[1]);
	
	for( int i = 0; i < O3_DIRECT_LIGHT_COUNT; i++ ) {
        vec3 lightDir = normalize(-u_directLightDirection[i]);
        vec3 lightColor = u_directLightColor[i];
        
        float diffuse = getDiffuse(N, lightDir);
        vec4 specular = getSpecular(u_primaryColor, u_primaryShift, 
                                    u_secondaryColor, u_secondaryShift, N, B, viewDir, lightDir, u_specPower);
                                    
        reflectedLight.directSpecular += specular.xyz * u_specularScale * lightColor;
        reflectedLight.directDiffuse += diffuse * hairColor * lightColor;
    }
}

void main() {
    Geometry geometry;
    Material material;
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    
    initGeometry(geometry);
    initMaterial(material, geometry);
    
    // Direct Light
    addTotalHairRadiance(material.diffuseColor, geometry.viewDir, geometry.normal, reflectedLight);
    
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
