var ArkView = ArkView || {};

ArkView.ParticleField = function (scene) {
    var pozitii = [];
    for (var p = 0; p < 400; p++) {
        pozitii.push((Math.random() - 0.5) * 250);
        pozitii.push(Math.random() * 160 - 20);
        pozitii.push((Math.random() - 0.5) * 250);
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pozitii, 3));

    this.mesh = new THREE.Points(geom, new THREE.PointsMaterial({
        color: 0x9944cc,
        size: 1.2,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    }));

    scene.add(this.mesh);
};

ArkView.ParticleField.prototype.update = function () {
    this.mesh.rotation.y += 0.0003;
};
