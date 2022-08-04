import {BaseMaterial, Engine, Shader} from "oasis-engine";

/**
 * Hair Material
 */
export class HairMaterial extends BaseMaterial {
    constructor(engine: Engine) {
        super(engine, Shader.find("hair"));
    }
}