var ArkView = ArkView || {};

ArkView.Engine = function (canvas) {
    this.canvas = canvas;
    this.clock = 0;
    this.updatables = [];

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030508, 0.0028);

    this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    this.camera.position.set(90, 110, 130);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    this._setupLights();
    this._bindResize();
};

ArkView.Engine.prototype._setupLights = function () {
    this.scene.add(new THREE.AmbientLight(0x0a1128, 1.4));

    var lumina1 = new THREE.DirectionalLight(0x4488ff, 1.6);
    lumina1.position.set(1, 1, 1);
    this.scene.add(lumina1);

    var lumina2 = new THREE.DirectionalLight(0xcc44ff, 1.4);
    lumina2.position.set(-1, 1, -1);
    this.scene.add(lumina2);
};

ArkView.Engine.prototype.addUpdatable = function (obj) {
    if (obj && typeof obj.update === 'function') {
        this.updatables.push(obj);
    }
};

ArkView.Engine.prototype.onResize = function (callback) {
    this._resizeCallbacks = this._resizeCallbacks || [];
    this._resizeCallbacks.push(callback);
};

ArkView.Engine.prototype._bindResize = function () {
    var self = this;
    window.addEventListener('resize', function () {
        self.camera.aspect = window.innerWidth / window.innerHeight;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(window.innerWidth, window.innerHeight);
        if (self._resizeCallbacks) {
            self._resizeCallbacks.forEach(function (cb) { cb(); });
        }
    });
};

ArkView.Engine.prototype.start = function (renderFn) {
    var self = this;

    function loop() {
        requestAnimationFrame(loop);
        self.clock += 0.008;
        self.controls.update();
        self.updatables.forEach(function (item) {
            item.update(self.clock);
        });
        renderFn(self.clock);
    }

    loop();
};
