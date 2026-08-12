var ArkView = ArkView || {};

ArkView.Navigation = function (engine, breadcrumbUI) {
    this.engine = engine;
    this.breadcrumbUI = breadcrumbUI;
    this.stiva = [];
};

ArkView.Navigation.prototype.flyTo = function (tintaY, eticheta, salveazaIstoric) {
    if (salveazaIstoric !== false) {
        this.stiva.push({
            cPoz: this.engine.camera.position.clone(),
            cTinta: this.engine.controls.target.clone(),
            eticheta: eticheta
        });
        this.breadcrumbUI.push(eticheta);
    }

    var controls = this.engine.controls;
    controls.enabled = false;

    gsap.to(this.engine.camera.position, {
        x: 45,
        y: tintaY + 22,
        z: 55,
        duration: 1.4,
        ease: 'power3.inOut'
    });

    gsap.to(controls.target, {
        x: 0,
        y: tintaY,
        z: 0,
        duration: 1.4,
        ease: 'power3.inOut',
        onComplete: function () { controls.enabled = true; }
    });
};

ArkView.Navigation.prototype.goBack = function () {
    if (this.stiva.length === 0) return;

    var starea = this.stiva.pop();
    this.breadcrumbUI.pop();
    this.breadcrumbUI._render();

    var controls = this.engine.controls;
    controls.enabled = false;

    gsap.to(this.engine.camera.position, {
        x: starea.cPoz.x,
        y: starea.cPoz.y,
        z: starea.cPoz.z,
        duration: 1.4,
        ease: 'power3.inOut'
    });

    gsap.to(controls.target, {
        x: starea.cTinta.x,
        y: starea.cTinta.y,
        z: starea.cTinta.z,
        duration: 1.4,
        ease: 'power3.inOut',
        onComplete: function () { controls.enabled = true; }
    });
};
