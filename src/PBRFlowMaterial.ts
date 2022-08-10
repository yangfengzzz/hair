import {Engine, Shader, Texture2D, PBRBaseMaterial, Color} from "oasis-engine";

/**
 * PBR (Metallic-Roughness Workflow) Material with Flow.
 */
export class PBRFlowMaterial extends PBRBaseMaterial {
    private static _metallicProp = Shader.getPropertyByName("u_metal");
    private static _roughnessProp = Shader.getPropertyByName("u_roughness");
    private static _roughnessMetallicTextureProp = Shader.getPropertyByName("u_roughnessMetallicTexture");

    private static _velProp = Shader.getPropertyByName("u_vel");
    private static _timeProp = Shader.getPropertyByName("u_time");
    private static _flowColorProp = Shader.getPropertyByName("u_flowColor");
    private static _flowTextureProp = Shader.getPropertyByName("u_flowTexture");

    /**
     * velocity
     */
    get vel(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._velProp);
    }

    set vel(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._velProp, value);
    }

    /**
     * time
     */
    get time(): number {
        return this.shaderData.getFloat(PBRFlowMaterial._timeProp);
    }

    set time(value: number) {
        this.shaderData.setFloat(PBRFlowMaterial._timeProp, value);
    }

    /**
     * flow color
     */
    get flowColor(): Color {
        return this.shaderData.getColor(PBRFlowMaterial._flowColorProp);
    }

    set flowColor(value: Color) {
        const flowColor = this.shaderData.getColor(PBRFlowMaterial._flowColorProp);
        if (value !== flowColor) {
            flowColor.copyFrom(value);
        }
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

        this.shaderData.setFloat(PBRFlowMaterial._timeProp, 0);
        this.shaderData.setFloat(PBRFlowMaterial._velProp, 0);
        this.shaderData.setColor(PBRFlowMaterial._flowColorProp, new Color(0, 0, 0, 1));
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
