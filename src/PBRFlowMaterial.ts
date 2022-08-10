import {Engine, Shader, Texture2D, PBRBaseMaterial, Color} from "oasis-engine";

/**
 * PBR (Metallic-Roughness Workflow) Material with Flow.
 */
export class PBRFlowMaterial extends PBRBaseMaterial {
    private static _metallicProp = Shader.getPropertyByName("u_metal");
    private static _roughnessProp = Shader.getPropertyByName("u_roughness");
    private static _roughnessMetallicTextureProp = Shader.getPropertyByName("u_roughnessMetallicTexture");

    private static _shiftUProp = Shader.getPropertyByName("u_shiftU");
    private static _shiftVProp = Shader.getPropertyByName("u_shiftV");
    private static _flowTextureProp = Shader.getPropertyByName("u_flowTexture");

    /**
     * shift U
     */
    get shiftU(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._shiftUProp);
    }

    set shiftU(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._shiftUProp, value);
    }

    /**
     * shift V
     */
    get shiftV(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._shiftVProp);
    }

    set shiftV(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._shiftVProp, value);
    }

    /**
     * flow texture
     */
    get flowTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(PBRFlowMaterial._flowTextureProp);
    }

    set flowTexture(value: Texture2D) {
        this.shaderData.setTexture(PBRFlowMaterial._flowTextureProp, value);
    }

    /**
     * Metallic, default 1.0.
     */
    get metallic(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._metallicProp);
    }

    set metallic(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._metallicProp, value);
    }

    /**
     * Roughness, default 1.0.
     */
    get roughness(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._roughnessProp);
    }

    set roughness(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._roughnessProp, value);
    }

    /**
     * Roughness metallic texture.
     * @remarks G channel is roughness, B channel is metallic
     */
    get roughnessMetallicTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(PBRFlowMaterial._roughnessMetallicTextureProp);
    }

    set roughnessMetallicTexture(value: Texture2D) {
        this.shaderData.setTexture(PBRFlowMaterial._roughnessMetallicTextureProp, value);
        if (value) {
            this.shaderData.enableMacro("ROUGHNESSMETALLICTEXTURE");
        } else {
            this.shaderData.disableMacro("ROUGHNESSMETALLICTEXTURE");
        }
    }

    /**
     * Create a pbr metallic-roughness workflow material instance.
     * @param engine - Engine to which the material belongs
     */
    constructor(engine: Engine) {
        super(engine, Shader.find("pbr-scan"));
        this.shaderData.setFloat(PBRFlowMaterial._metallicProp, 1);
        this.shaderData.setFloat(PBRFlowMaterial._roughnessProp, 1);

        this.shaderData.setFloat(PBRFlowMaterial._shiftUProp, 0);
        this.shaderData.setFloat(PBRFlowMaterial._shiftVProp, 0);
    }

    /**
     * @override
     */
    clone(): PBRFlowMaterial {
        const dest = new PBRFlowMaterial(this._engine);
        this.cloneTo(dest);
        return dest;
    }
}
