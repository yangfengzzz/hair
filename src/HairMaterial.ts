import {BaseMaterial, Color, Engine, Shader, Texture2D, Vector4} from "oasis-engine";

/**
 * Hair Material
 */
export class HairMaterial extends BaseMaterial {
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
     * Tiling and offset of main textures.
     */
    get tilingOffset(): Vector4 {
        return this.shaderData.getVector4(HairMaterial._tilingOffsetProp);
    }

    set tilingOffset(value: Vector4) {
        const tilingOffset = this.shaderData.getVector4(HairMaterial._tilingOffsetProp);
        if (value !== tilingOffset) {
            tilingOffset.copyFrom(value);
        }
    }

    /**
     * Normal texture.
     */
    get normalTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(HairMaterial._normalTextureProp);
    }

    set normalTexture(value: Texture2D) {
        this.shaderData.setTexture(HairMaterial._normalTextureProp, value);
        if (value) {
            this.shaderData.enableMacro(HairMaterial._normalTextureMacro);
        } else {
            this.shaderData.disableMacro(HairMaterial._normalTextureMacro);
        }
    }

    /**
     * Normal texture intensity.
     */
    get normalIntensity(): number {
        return this.shaderData.getFloat(HairMaterial._normalIntensityProp);
    }

    set normalIntensity(value: number) {
        this.shaderData.setFloat(HairMaterial._normalIntensityProp, value);
    }

    /**
     * hair texture
     */
    get hairTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(HairMaterial._hairTextureProp);
    }

    set hairTexture(value: Texture2D) {
        const shaderData = this.shaderData;
        shaderData.setTexture(HairMaterial._hairTextureProp, value);
        if (value !== null) {
            shaderData.enableMacro(HairMaterial._hairTextureMacro);
        } else {
            shaderData.disableMacro(HairMaterial._hairTextureMacro);
        }
    }

    /**
     * hair color
     */
    get hairColor(): Color {
        return this.shaderData.getColor(HairMaterial._hairColorProp);
    }

    set hairColor(value: Color) {
        const color = this.shaderData.getColor(HairMaterial._hairColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

    /**
     * specular shift texture
     */
    get specularShiftTexture(): Texture2D {
        return <Texture2D>this.shaderData.getTexture(HairMaterial._specularShiftTextureProp);
    }

    set specularShiftTexture(value: Texture2D) {
        const shaderData = this.shaderData;
        shaderData.setTexture(HairMaterial._specularShiftTextureProp, value);
        if (value !== null) {
            shaderData.enableMacro(HairMaterial._specularShiftTextureMacro);
        } else {
            shaderData.disableMacro(HairMaterial._specularShiftTextureMacro);
        }
    }

    /**
     * specular shift
     */
    get specularShift(): number {
        return this.shaderData.getFloat(HairMaterial._specularShiftProp);
    }

    set specularShift(value: number) {
        this.shaderData.setFloat(HairMaterial._specularShiftProp, value);
    }

    /**
     * primary color
     */
    get primaryColor(): Color {
        return this.shaderData.getColor(HairMaterial._primaryColorProp);
    }

    set primaryColor(value: Color) {
        const color = this.shaderData.getColor(HairMaterial._primaryColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

    /**
     * primary shift
     */
    get primaryShift(): number {
        return this.shaderData.getFloat(HairMaterial._primaryShiftProp);
    }

    set primaryShift(value: number) {
        this.shaderData.setFloat(HairMaterial._primaryShiftProp, value);
    }

    /**
     * secondary color
     */
    get secondaryColor(): Color {
        return this.shaderData.getColor(HairMaterial._secondaryColorProp);
    }

    set secondaryColor(value: Color) {
        const color = this.shaderData.getColor(HairMaterial._secondaryColorProp);
        if (color !== value) {
            color.copyFrom(value);
        }
    }

    /**
     * secondary shift
     */
    get secondaryShift(): number {
        return this.shaderData.getFloat(HairMaterial._secondaryShiftProp);
    }

    set secondaryShift(value: number) {
        this.shaderData.setFloat(HairMaterial._secondaryShiftProp, value);
    }

    /**
     * specular power
     */
    get specularPower(): number {
        return this.shaderData.getFloat(HairMaterial._specPowerProp);
    }

    set specularPower(value: number) {
        this.shaderData.setFloat(HairMaterial._specPowerProp, value);
    }

    /**
     * specular width
     */
    get specularWidth(): number {
        return this.shaderData.getFloat(HairMaterial._specularWidthProp);
    }

    set specularWidth(value: number) {
        this.shaderData.setFloat(HairMaterial._specularWidthProp, value);
    }

    /**
     * specular scale
     */
    get specularScale(): number {
        return this.shaderData.getFloat(HairMaterial._specularScaleProp);
    }

    set specularScale(value: number) {
        this.shaderData.setFloat(HairMaterial._specularScaleProp, value);
    }

    constructor(engine: Engine) {
        super(engine, Shader.find("hair"));

        const shaderData = this.shaderData;

        shaderData.enableMacro("O3_NEED_WORLDPOS");
        shaderData.enableMacro("O3_NEED_TILINGOFFSET");

        shaderData.setColor(HairMaterial._hairColorProp, new Color(1, 1, 1, 1));
        shaderData.setColor(HairMaterial._primaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setColor(HairMaterial._secondaryColorProp, new Color(1, 1, 1, 1));
        shaderData.setFloat(HairMaterial._specPowerProp, 16);

        shaderData.setFloat(HairMaterial._normalIntensityProp, 1);
        shaderData.setVector4(HairMaterial._tilingOffsetProp, new Vector4(1, 1, 0, 0));
    }
}