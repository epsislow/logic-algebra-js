var ArkView = ArkView || {};

ArkView.PanelInteraction = function (engine, navigation) {
    this.engine = engine;
    this.navigation = navigation;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.startX = 0;
    this.startY = 0;

    this._bindEvents();
};

ArkView.PanelInteraction.prototype._bindEvents = function () {
    var self = this;

    window.addEventListener('mousedown', function (e) {
        self.startX = e.clientX;
        self.startY = e.clientY;
    });

    window.addEventListener('mouseup', function (e) {
        if (Math.abs(e.clientX - self.startX) > 4 || Math.abs(e.clientY - self.startY) > 4) {
            return;
        }

        self.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        self.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        self.raycaster.setFromCamera(self.mouse, self.engine.camera);
        var hits = self.raycaster.intersectObjects(self.engine.scene.children, true);

        for (var i = 0; i < hits.length; i++) {
            var obj = hits[i].object;
            if (obj.userData && obj.userData.estePanou) {
                self.navigation.flyTo(obj.userData.inaltimeY, obj.userData.numeEtaj);
                break;
            }
        }
    });
};
