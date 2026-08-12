var ArkView = ArkView || {};

ArkView.VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        uOffset: { value: 0.95 },
        uDarkness: { value: 1.35 },
        uContrast: { value: 1.12 }
    },

    vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = uv;',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n'),

    fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float uOffset;',
        'uniform float uDarkness;',
        'uniform float uContrast;',
        'varying vec2 vUv;',
        'void main() {',
        '    vec4 color = texture2D(tDiffuse, vUv);',
        '    color.rgb = (color.rgb - 0.5) * uContrast + 0.5;',
        '    vec2 uv = vUv * (1.0 - vUv.yx);',
        '    float vig = uv.x * uv.y * 15.0;',
        '    vig = pow(vig, uDarkness);',
        '    color.rgb *= smoothstep(0.0, uOffset, vig);',
        '    gl_FragColor = color;',
        '}'
    ].join('\n')
};
