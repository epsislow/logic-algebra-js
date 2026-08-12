var ArkView = ArkView || {};

ArkView.FloorBuilder = function (etajGrup, culoare) {
    for (var r = 1; r <= 4; r++) {
        var geom = new THREE.RingGeometry(r * 15 - 0.3, r * 15, 64);
        geom.rotateX(-Math.PI / 2);
        etajGrup.add(new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
            color: culoare,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        })));
    }
};
