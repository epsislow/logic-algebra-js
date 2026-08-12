var ArkView = ArkView || {};

ArkView.PanelBuilder = function (scene, dateProiect) {
    this.scene = scene;
    this.panouri = [];
    this.pozitiiGlobale = {};

    var step = ArkView.Config.FLOOR_HEIGHT_STEP;
    var self = this;

    dateProiect.etaje.forEach(function (etaj, indexEtaj) {
        var inaltimeY = indexEtaj * step;
        var etajGrup = new THREE.Group();
        etajGrup.position.y = inaltimeY;

        ArkView.FloorBuilder(etajGrup, etaj.culoare);

        etaj.functii.forEach(function (functie) {
            var panou = self._createPanel(functie, etaj, inaltimeY);
            etajGrup.add(panou);
            self.panouri.push(panou);
            self.pozitiiGlobale[functie.id] = new THREE.Vector3(functie.x, inaltimeY, functie.z);
        });

        scene.add(etajGrup);
    });
};

ArkView.PanelBuilder.prototype._createPanel = function (functie, etaj, inaltimeY) {
    var geom = new THREE.BoxGeometry(16, 0.4, 10);
    var mesh = new THREE.Mesh(geom, new THREE.MeshPhysicalMaterial({
        color: 0x050b1e,
        transparent: true,
        opacity: 0.85,
        roughness: 0.5,
        metalness: 0.1,
        transmission: 0.3,
        ior: 1.2,
        thickness: 0.5,
        clearcoat: 0.1,
        clearcoatRoughness: 0.5
    }));

    mesh.position.set(functie.x, 0, functie.z);

    var margine = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({
            color: etaj.culoare,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        })
    );
    mesh.add(margine);

    mesh.userData = {
        inaltimeY: inaltimeY,
        numeEtaj: etaj.nume + ' // ' + functie.nume,
        estePanou: true
    };

    return mesh;
};

ArkView.PanelBuilder.prototype.update = function (t) {
    this.panouri.forEach(function (panou, index) {
        panou.position.y = Math.sin(t * 1.5 + index) * 0.4;
    });
};
