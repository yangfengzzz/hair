import {BaseMaterial, Color, Engine, Shader} from "oasis-engine";
import {geometryTextureDefine, geometryTextureVert} from "./GeometryMaterial";

Shader.create("normalShader", `
   uniform float u_lineScale;
   uniform mat4 u_VPMat;
   uniform mat4 u_worldMatrix;
   
#ifdef O3_HAS_SKIN
#ifdef O3_USE_JOINT_TEXTURE
    uniform sampler2D u_jointSampler;
    uniform float u_jointCount;

    mat4 getJointMatrix(sampler2D smp, float index) {
        float base = index / u_jointCount;
        float hf = 0.5 / u_jointCount;
        float v = base + hf;

        vec4 m0 = texture2D(smp, vec2(0.125, v ));
        vec4 m1 = texture2D(smp, vec2(0.375, v ));
        vec4 m2 = texture2D(smp, vec2(0.625, v ));
        vec4 m3 = texture2D(smp, vec2(0.875, v ));

        return mat4(m0, m1, m2, m3);
    }
#else
    uniform mat4 u_jointMatrix[ O3_JOINTS_NUM ];
#endif
#endif

uniform mat4 u_localMat;
uniform mat4 u_modelMat;
uniform mat4 u_viewMat;
uniform mat4 u_projMat;
uniform mat4 u_MVMat;
uniform mat4 u_MVPMat;
uniform mat4 u_normalMat;
uniform vec3 u_cameraPos;
uniform vec4 u_tilingOffset;
#include <normal_share>

${geometryTextureDefine}

void main() {
    int pointIndex = gl_VertexID / 2;
    ${geometryTextureVert}

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <skinning_vert>

    if (gl_VertexID % 2 == 1) {
        position.xyz += normal * u_lineScale;
    }
    
    gl_Position = position;
    #ifndef O3_HAS_SKIN
        gl_Position = u_worldMatrix * gl_Position; 
    #endif
    gl_Position = u_VPMat * gl_Position; 
}
`, `
uniform vec4 u_baseColor;
void main() {
    gl_FragColor = u_baseColor;
}
`);

export class NormalMaterial extends BaseMaterial {
    /**
     * Base color.
     */
    get baseColor(): Color {
        return this.shaderData.getColor(NormalMaterial._baseColorProp);
    }

    set baseColor(value: Color) {
        const baseColor = this.shaderData.getColor(NormalMaterial._baseColorProp);
        if (value !== baseColor) {
            baseColor.copyFrom(value);
        }
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("normalShader"));
        this.shaderData.setColor(NormalMaterial._baseColorProp, new Color(1, 0, 0, 1));
    }
}