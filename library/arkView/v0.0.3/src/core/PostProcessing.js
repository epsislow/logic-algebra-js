var ArkView = ArkView || {};

ArkView.PostProcessing = function (engine) {
    this.engine = engine;
    this.bloomLayer = ArkView.Config.BLOOM_LAYER;
    this._bloomMask = new THREE.Layers();
    this._bloomMask.set(this.bloomLayer);
    this.darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.materialsCache = {};

    var size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    var bloomCfg = ArkView.Config.BLOOM;
    var vigCfg = ArkView.Config.VIGNETTE;

    this.renderPass = new THREE.RenderPass(engine.scene, engine.camera);

    this.bloomPass = new THREE.UnrealBloomPass(size, bloomCfg.strength, bloomCfg.radius, bloomCfg.threshold);

    this.bloomComposer = new THREE.EffectComposer(engine.renderer);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(this.renderPass);
    this.bloomComposer.addPass(this.bloomPass);

    this.finalComposer = new THREE.EffectComposer(engine.renderer);
    this.finalComposer.addPass(this.renderPass);

    this.mixPass = new THREE.ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D baseTexture;',
                'uniform sampler2D bloomTexture;',
                'varying vec2 vUv;',
                'void main() {',
                '    vec4 base = texture2D(baseTexture, vUv);',
                '    vec4 bloom = texture2D(bloomTexture, vUv);',
                '    gl_FragColor = base + bloom * 1.35;',
                '}'
            ].join('\n')
        }),
        'baseTexture'
    );
    this.finalComposer.addPass(this.mixPass);

    this.vignettePass = new THREE.ShaderPass(ArkView.VignetteShader);
    this.vignettePass.uniforms.uOffset.value = vigCfg.offset;
    this.vignettePass.uniforms.uDarkness.value = vigCfg.darkness;
    this.vignettePass.uniforms.uContrast.value = vigCfg.contrast;
    this.vignettePass.renderToScreen = true;
    this.finalComposer.addPass(this.vignettePass);

    var self = this;
    engine.onResize(function () {
        var w = window.innerWidth;
        var h = window.innerHeight;
        self.bloomComposer.setSize(w, h);
        self.finalComposer.setSize(w, h);
        self.bloomPass.resolution.set(w, h);
    });
};

ArkView.PostProcessing.prototype._darkenNonBloomed = function (obj) {
    if (obj.isMesh && !this._isBloomLayer(obj)) {
        this.materialsCache[obj.uuid] = obj.material;
        obj.material = this.darkMaterial;
    }
};

ArkView.PostProcessing.prototype._restoreMaterial = function (obj) {
    if (this.materialsCache[obj.uuid]) {
        obj.material = this.materialsCache[obj.uuid];
        delete this.materialsCache[obj.uuid];
    }
};

ArkView.PostProcessing.prototype._isBloomLayer = function (obj) {
    return obj.layers && obj.layers.test(this._bloomMask);
};

ArkView.PostProcessing.prototype.render = function () {
    var scene = this.engine.scene;
    var renderer = this.engine.renderer;

    scene.traverse(this._darkenNonBloomed.bind(this));
    this.bloomComposer.render();
    scene.traverse(this._restoreMaterial.bind(this));

    this.finalComposer.render();
};

ArkView.PostProcessing.prototype.enableBloom = function (object) {
    object.traverse(function (child) {
        if (child.isMesh) {
            child.layers.enable(ArkView.Config.BLOOM_LAYER);
        }
    });
};
