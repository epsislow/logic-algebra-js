var ArkView = ArkView || {};

ArkView.FluxTubeShader = {
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: null },
        uColorEnd: { value: null },
        uSpeed: { value: 1 },
        uSeed: { value: 0 },
        uPhase: { value: 0 }
    },

    vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = uv;',
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n'),

    fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uColorStart;',
        'uniform vec3 uColorEnd;',
        'uniform float uSpeed;',
        'uniform float uSeed;',
        'uniform float uPhase;',
        'varying vec2 vUv;',
        'float hash(float n) { return fract(sin(n) * 43758.5453123); }',
        'float impulsDirectional(float t, float time, float speed, float seed) {',
        '    float cell = floor(time * speed * 0.55 + seed * 0.17);',
        '    float hActiv = hash(cell * 17.0 + seed);',
        '    if (hActiv < 0.38) return 0.0;',
        '    float hViteza = hash(cell * 31.0 + seed);',
        '    float progress = fract(time * speed * (0.35 + hViteza * 0.55) + hash(cell + seed));',
        '    float latime = 0.035 + hash(cell * 53.0 + seed) * 0.11;',
        '    float dist = abs(t - progress);',
        '    float forma = smoothstep(latime, 0.0, dist);',
        '    return forma * (0.6 + hash(cell * 71.0 + seed) * 0.4);',
        '}',
        'void main() {',
        '    float t = clamp(vUv.x, 0.0, 1.0);',
        '    vec3 baseColor = mix(uColorStart, uColorEnd, t);',
        '    float time = uTime + uPhase;',
        '    float pulse = impulsDirectional(t, time, uSpeed, uSeed);',
        '    pulse += impulsDirectional(t, time * 1.18 + 2.4, uSpeed * 0.85, uSeed + 41.0) * 0.5;',
        '    pulse = min(pulse, 1.0);',
        '    vec3 coloredPulse = mix(baseColor, uColorEnd, 0.35);',
        '    vec3 whiteCore = vec3(1.0, 0.98, 1.0);',
        '    vec3 pulseColor = mix(coloredPulse, whiteCore, pulse * 0.82);',
        '    vec3 finalColor = mix(baseColor, pulseColor, pulse * 0.88);',
        '    float core = smoothstep(0.55, 1.0, pulse);',
        '    finalColor = mix(finalColor, whiteCore, core * 0.75);',
        '    float brightness = 0.18 + pulse * 1.45;',
        '    float alpha = 0.14 + pulse * 0.86;',
        '    gl_FragColor = vec4(finalColor * brightness, alpha);',
        '}'
    ].join('\n')
};
