import {Color, Engine, PBRBaseMaterial, Shader, Texture2D, Vector4} from "oasis-engine";

/**
 * PBR Hair Material
 */
export class PBRHairMaterial extends PBRBaseMaterial {
    private static _metallicProp = Shader.getPropertyByName("u_metal");
    private static _roughnessProp = Shader.getPropertyByName("u_roughness");
    private static _roughnessMetallicTextureProp = Shader.getPropertyByName("u_roughnessMetallicTexture");

    private static _hairTextureMacro = Shader.getMacroByName("USE_HAIR_TEXTURE");
    private static _specularShiftTextureMacro = Shader.getMacroByName("USE_SPECULAR_SHIFT_TEXTURE");

    private static _hairTextureProp = Shader.getPropertyByName("u_hairTex");
    private static _hairColorProp = Shader.getPropertyByName("u_hairTex_ST");
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
     * hair texture
     */
    get hairTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(PBRHairMaterial._hairTextureProp);
    }

    set hairTexture(value: Texture2D) {
        const shaderData = this.shaderData;
        shaderData.setTexture(PBRHairMaterial._hairTextureProp, value);
        if (value !== null && value !== undefined) {
            shaderData.enableMacro(PBRHairMaterial._hairTextureMacro);
        } else {
            shaderData.disableMacro(PBRHairMaterial._hairTextureMacro);
        }
    }

    /**
     * hair color
     */
    get hairColor(): Color {
        return this.shaderData.getColor(PBRHairMaterial._hairColorProp);
    }

    set hairColor(value: Color) {
        const color = this.shaderData.getColor(PBRHairMaterial._hairColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

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
        shaderData.setColor(PBRHairMaterial._hairColorProp, new Color(1, 1, 1, 1));
        shaderData.setColor(PBRHairMaterial._primaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setColor(PBRHairMaterial._secondaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setFloat(PBRHairMaterial._specPowerProp, 16);

        shaderData.setFloat(PBRHairMaterial._metallicProp, 1);
        shaderData.setFloat(PBRHairMaterial._roughnessProp, 1);
    }
}