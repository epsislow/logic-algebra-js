var ArkView = ArkView || {};

ArkView.FluxNetwork = function (scene, pozitiiGlobale, legaturi, postProcessing) {
    this.scene = scene;
    this.pozitiiGlobale = pozitiiGlobale;
    this.legaturi = legaturi;
    this.postProcessing = postProcessing;

    this.grup = new THREE.Group();
    this.materiale = [];
    this.noduri = [];

    this._colorA = new THREE.Color();
    this._colorB = new THREE.Color();
    this._build();
    scene.add(this.grup);
};

ArkView.FluxNetwork.prototype._buildCurvedPath = function (p1, p2, seed) {
    var start = p1.clone();
    var end = p2.clone();
    var delta = new THREE.Vector3().subVectors(end, start);
    var distanta = delta.length();

    if (distanta < 0.001) {
        return new THREE.CatmullRomCurve3([start, end]);
    }

    var directie = delta.clone().normalize();
    var perpendiculara = new THREE.Vector3(-directie.z, directie.y * 0.25, directie.x);
    if (perpendiculara.lengthSq() < 0.0001) {
        perpendiculara.set(1, 0, 0);
    } else {
        perpendiculara.normalize();
    }

    var factorCurba = 0.22 + (seed % 100) / 100 * 0.38;
    var semn = (seed % 2 === 0) ? 1 : -1;
    var arcVertical = Math.abs(delta.y) * 0.12 + distanta * 0.06;

    var cp1 = start.clone()
        .add(directie.clone().multiplyScalar(distanta * 0.30))
        .add(perpendiculara.clone().multiplyScalar(distanta * factorCurba * semn))
        .add(new THREE.Vector3(0, arcVertical, 0));

    var cp2 = end.clone()
        .add(directie.clone().multiplyScalar(-distanta * 0.30))
        .add(perpendiculara.clone().multiplyScalar(distanta * factorCurba * semn * 0.75))
        .add(new THREE.Vector3(0, -arcVertical * 0.4, 0));

    var bezier = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
    var puncte = bezier.getPoints(ArkView.Config.FLUX.CURVE_POINTS);
    return new THREE.CatmullRomCurve3(puncte);
};

ArkView.FluxNetwork.prototype._offsetParallelPoints = function (puncte, indexLinie, totalLinii, spacing) {
    var offsetAmount = (indexLinie - (totalLinii - 1) / 2) * spacing;
    var up = new THREE.Vector3(0, 1, 0);
    var power = ArkView.Config.FLUX.CONVERGENCE_POWER;
    var rezultat = [];
    var ultimul = puncte.length - 1;

    for (var i = 0; i < puncte.length; i++) {
        var copie = puncte[i].clone();
        var tangenta;

        if (i === 0) {
            tangenta = puncte[1].clone().sub(puncte[0]).normalize();
        } else if (i === puncte.length - 1) {
            tangenta = puncte[i].clone().sub(puncte[i - 1]).normalize();
        } else {
            tangenta = puncte[i + 1].clone().sub(puncte[i - 1]).normalize();
        }

        var perpendiculara = new THREE.Vector3().crossVectors(tangenta, up);
        if (perpendiculara.lengthSq() < 0.0001) {
            perpendiculara = new THREE.Vector3().crossVectors(tangenta, new THREE.Vector3(1, 0, 0));
        }
        perpendiculara.normalize();

        var t = i / ultimul;
        var factorSpread = Math.pow(Math.sin(t * Math.PI), power);

        copie.add(perpendiculara.multiplyScalar(offsetAmount * factorSpread));
        rezultat.push(copie);
    }

    return rezultat;
};

ArkView.FluxNetwork.prototype._createTubeMaterial = function (viteza, culoareStart, culoareEnd, seed, faza) {
    var material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(ArkView.FluxTubeShader.uniforms),
        vertexShader: ArkView.FluxTubeShader.vertexShader,
        fragmentShader: ArkView.FluxTubeShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    material.uniforms.uColorStart.value = new THREE.Color(culoareStart);
    material.uniforms.uColorEnd.value = new THREE.Color(culoareEnd);
    material.uniforms.uSpeed.value = viteza;
    material.uniforms.uSeed.value = seed;
    material.uniforms.uPhase.value = faza;

    this.materiale.push(material);
    return material;
};

ArkView.FluxNetwork.prototype._createTube = function (curba, material) {
    var cfg = ArkView.Config.FLUX;
    var geometry = new THREE.TubeGeometry(
        curba,
        cfg.TUBE_SEGMENTS,
        cfg.TUBE_RADIUS,
        cfg.TUBE_RADIAL,
        false
    );
    var mesh = new THREE.Mesh(geometry, material);
    this.postProcessing.enableBloom(mesh);
    return mesh;
};

ArkView.FluxNetwork.prototype._createNode = function (pozitie, culoare) {
    var grup = new THREE.Group();
    grup.position.copy(pozitie);
    grup.userData.fazaPuls = Math.random() * Math.PI * 2;
    grup.userData.vitezaPuls = 2.5 + Math.random() * 3.5;
    grup.userData.esteNodFlux = true;

    var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 16, 16),
        new THREE.MeshBasicMaterial({
            color: culoare,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );

    var mid = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 12, 12),
        new THREE.MeshBasicMaterial({
            color: culoare,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );

    var core = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 10),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );

    grup.add(halo, mid, core);
    this.postProcessing.enableBloom(grup);
    this.noduri.push(grup);
    return grup;
};

ArkView.FluxNetwork.prototype._build = function () {
    var cfg = ArkView.Config.FLUX;
    var paleta = ArkView.Config.PALETTE;
    var self = this;

    this.legaturi.forEach(function (legatura, indexLegatura) {
        var p1 = self.pozitiiGlobale[legatura.deLa];
        var p2 = self.pozitiiGlobale[legatura.la];
        if (!p1 || !p2) return;

        var culori = paleta[indexLegatura % paleta.length];
        var seedCurba = indexLegatura * 137 + legatura.deLa.length * 23 + legatura.la.length * 11;
        var curbaBaza = self._buildCurvedPath(p1, p2, seedCurba);
        var puncteBaza = curbaBaza.getPoints(cfg.CURVE_POINTS);

        self.grup.add(self._createNode(p1, culori.start));
        self.grup.add(self._createNode(p2, culori.end));

        for (var linie = 0; linie < cfg.FILAMENT_COUNT; linie++) {
            var puncteOffset = self._offsetParallelPoints(
                puncteBaza,
                linie,
                cfg.FILAMENT_COUNT,
                cfg.FILAMENT_SPACING
            );
            var curbaFilament = new THREE.CatmullRomCurve3(puncteOffset);

            var mixLinie = linie / Math.max(cfg.FILAMENT_COUNT - 1, 1);
            self._colorA.set(culori.start).lerp(self._colorB.set(culori.end), mixLinie * 0.25);
            self._colorB.set(culori.start).lerp(new THREE.Color(culori.end), 0.45 + mixLinie * 0.55);

            var material = self._createTubeMaterial(
                0.7 + Math.random() * 1.6,
                self._colorA.getHex(),
                self._colorB.getHex(),
                Math.random() * 1000 + indexLegatura * 47 + linie * 13,
                Math.random() * 12
            );

            self.grup.add(self._createTube(curbaFilament, material));
        }
    });
};

ArkView.FluxNetwork.prototype.update = function (t) {
    this.materiale.forEach(function (mat) {
        mat.uniforms.uTime.value = t;
    });

    this.noduri.forEach(function (nod) {
        var unda = Math.sin(t * nod.userData.vitezaPuls + nod.userData.fazaPuls);
        var scale = 0.75 + unda * 0.28;
        nod.scale.setScalar(scale);

        nod.children.forEach(function (part, idx) {
            if (idx === 0) part.material.opacity = 0.08 + unda * 0.12;
            if (idx === 1) part.material.opacity = 0.28 + unda * 0.35;
            if (idx === 2) part.material.opacity = 0.75 + unda * 0.25;
        });
    });
};
