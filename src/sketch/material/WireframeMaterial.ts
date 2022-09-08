import {BaseMaterial, Color, Engine, RenderFace, Shader} from "oasis-engine";
import {geometryTextureDefine, geometryTextureVert} from "./GeometryShader";

Shader.create("wireframeShader", `
   uniform float u_lineScale;
   uniform mat4 u_VPMat;
   uniform mat4 u_worldMatrix;
   uniform mat4 u_worldNormal;

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

${geometryTextureDefine}

varying vec3 v_baryCenter;

void main() {
    int indicesIndex = gl_VertexID / 3;
    int indicesRow = indicesIndex / int(u_indicesTextureWidth);
    int indicesCol = indicesIndex % int(u_indicesTextureWidth);
    vec3 triangleIndices = getIndicesElement(float(indicesRow), float(indicesCol));
    int subIndex = gl_VertexID % 3;
    v_baryCenter = vec3(0.0);
    v_baryCenter[subIndex] = 1.0;
    
    int pointIndex = int(triangleIndices[subIndex]);
    ${geometryTextureVert}

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <skinning_vert>
    
    gl_Position = position;
    #ifndef O3_HAS_SKIN
        gl_Position = u_worldMatrix * gl_Position; 
    #endif
    gl_Position = u_VPMat * gl_Position; 
}
`,`
varying vec3 v_baryCenter;

float edgeFactor(){
    vec3 d = fwidth(v_baryCenter);
    vec3 a3 = smoothstep(vec3(0.0), d * 1.5, v_baryCenter);
    return min(min(a3.x, a3.y), a3.z);
}

uniform vec4 u_baseColor;
void main() {
    if (gl_FrontFacing) {
        gl_FragColor = vec4(u_baseColor.xyz, 1.0 - edgeFactor());
    } else {
        // fade back face
        gl_FragColor = vec4(u_baseColor.xyz, (1.0 - edgeFactor()) * 0.3);
    }
}
`);

export class WireframeMaterial extends BaseMaterial {
    /**
     * Base color.
     */
    get baseColor(): Color {
        return this.shaderData.getColor(WireframeMaterial._baseColorProp);
    }

    set baseColor(value: Color) {
        const baseColor = this.shaderData.getColor(WireframeMaterial._baseColorProp);
        if (value !== baseColor) {
            baseColor.copyFrom(value);
        }
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("wireframeShader"));
        this.shaderData.setColor(WireframeMaterial._baseColorProp, new Color(0, 0, 0, 1));
        this.isTransparent = true;
        this.renderFace = RenderFace.Double;
    }
}