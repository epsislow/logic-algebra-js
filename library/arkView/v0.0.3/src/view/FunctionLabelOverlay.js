var ArkView = ArkView || {};

ArkView.FunctionLabelOverlay = function (engine, panelBuilder, navigation) {
    this.engine = engine;
    this.panelBuilder = panelBuilder;
    this.navigation = navigation;

    this.overlay = document.getElementById('fui-overlay');
    this.svg = document.getElementById('fui-lines');
    this.labelsRoot = document.getElementById('fui-labels');

    this._worldPos = new THREE.Vector3();
    this.callouts = [];

    this._build();
};

ArkView.FunctionLabelOverlay.prototype._formatNume = function (nume) {
    return nume.replace(/\s/g, '').toUpperCase();
};

ArkView.FunctionLabelOverlay.prototype._build = function () {
    var self = this;

    this.panelBuilder.panouri.forEach(function (panou, index) {
        var culoare = panou.userData.culoareEtaj || 0x00e5ff;
        var hex = '#' + culoare.toString(16).padStart(6, '0');

        var callout = document.createElement('div');
        callout.className = 'fui-callout';
        callout.style.setProperty('--callout-color', hex);

        var panel = document.createElement('div');
        panel.className = 'fui-callout-panel';
        panel.textContent = self._formatNume(panou.userData.numeFunctie || 'NODE');
        callout.appendChild(panel);

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'fui-leader');
        line.style.stroke = hex;

        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('class', 'fui-anchor');
        dot.setAttribute('r', '3');
        dot.style.fill = hex;

        self.labelsRoot.appendChild(callout);
        self.svg.appendChild(line);
        self.svg.appendChild(dot);

        panel.addEventListener('click', function () {
            self.navigation.flyTo(panou, panou.userData.numeEtaj);
        });

        self.callouts.push({
            panou: panou,
            side: index % 2 === 0 ? 1 : -1,
            lift: (index % 4) * 14 - 20,
            el: callout,
            panel: panel,
            line: line,
            dot: dot
        });
    });
};

ArkView.FunctionLabelOverlay.prototype._project = function (panou) {
    this._worldPos.set(0, 0.6, 0);
    panou.localToWorld(this._worldPos);

    var projected = this._worldPos.clone().project(this.engine.camera);
    if (projected.z < -1 || projected.z > 1) {
        return null;
    }

    var w = window.innerWidth;
    var h = window.innerHeight;

    return {
        x: (projected.x * 0.5 + 0.5) * w,
        y: (-projected.y * 0.5 + 0.5) * h
    };
};

ArkView.FunctionLabelOverlay.prototype.update = function () {
    var w = window.innerWidth;
    var h = window.innerHeight;

    this.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);

    this.callouts.forEach(function (item) {
        var anchor = this._project(item.panou);

        if (!anchor || anchor.x < -40 || anchor.x > w + 40 || anchor.y < -40 || anchor.y > h + 40) {
            item.el.style.opacity = '0';
            item.line.style.opacity = '0';
            item.dot.style.opacity = '0';
            return;
        }

        item.el.style.opacity = '1';
        item.line.style.opacity = '1';
        item.dot.style.opacity = '1';

        var offsetX = item.side * 130;
        var labelX = anchor.x + offsetX;
        var labelY = anchor.y + item.lift;

        labelX = Math.max(12, Math.min(w - 12, labelX));
        labelY = Math.max(12, Math.min(h - 12, labelY));

        item.el.style.left = labelX + 'px';
        item.el.style.top = labelY + 'px';

        var panelRect = item.panel.getBoundingClientRect();
        var startX = item.side > 0
            ? panelRect.left
            : panelRect.right;
        var startY = panelRect.top + panelRect.height * 0.5;

        var elbowX = anchor.x + item.side * 36;
        var elbowY = startY;

        var d = 'M ' + startX + ' ' + startY +
            ' L ' + elbowX + ' ' + elbowY +
            ' L ' + anchor.x + ' ' + anchor.y;

        item.line.setAttribute('d', d);
        item.dot.setAttribute('cx', anchor.x);
        item.dot.setAttribute('cy', anchor.y);
    }, this);
};
