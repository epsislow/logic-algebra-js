/** @namespace ArkView global */
var ArkView = ArkView || {};

ArkView.Config = {
    BLOOM_LAYER: 1,

    FLUX: {
        FILAMENT_COUNT: 8,
        FILAMENT_SPACING: 0.22,
        TUBE_RADIUS: 0.045,
        TUBE_SEGMENTS: 64,
        TUBE_RADIAL: 6,
        CURVE_POINTS: 56,
        CONVERGENCE_POWER: 2.2
    },

    BLOOM: {
        strength: 1.65,
        radius: 0.5,
        threshold: 0.08
    },

    VIGNETTE: {
        offset: 0.95,
        darkness: 1.35,
        contrast: 1.12
    },

    PALETTE: [
        { start: 0x00e5ff, end: 0xb026ff },
        { start: 0x00ccff, end: 0xff44cc },
        { start: 0x44eeff, end: 0x8844ff },
        { start: 0x00d4ff, end: 0xcc22ff },
        { start: 0x66ddff, end: 0xff00aa }
    ],

    FLOOR_HEIGHT_STEP: 45
};
