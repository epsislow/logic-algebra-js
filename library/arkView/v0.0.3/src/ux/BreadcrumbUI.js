var ArkView = ArkView || {};

ArkView.BreadcrumbUI = function () {
    this.istoric = [];
    this.elBreadcrumbs = document.getElementById('breadcrumbs');
    this.elBack = document.getElementById('btn-back');
};

ArkView.BreadcrumbUI.prototype.getLast = function () {
    if (this.istoric.length === 0) return null;
    return this.istoric[this.istoric.length - 1];
};

ArkView.BreadcrumbUI.prototype.push = function (eticheta) {
    this.istoric.push(eticheta);
    this._render();
};

ArkView.BreadcrumbUI.prototype.pop = function () {
    return this.istoric.pop();
};

ArkView.BreadcrumbUI.prototype.hasHistory = function () {
    return this.istoric.length > 0;
};

ArkView.BreadcrumbUI.prototype._render = function () {
    this.elBack.style.display = this.istoric.length > 0 ? 'block' : 'none';

    var text = '<span id="btn-home" class="crumb-home">SYS_CORE // HOME</span>';
    this.istoric.forEach(function (pas) {
        text += ' &gt; ' + pas;
    });
    this.elBreadcrumbs.innerHTML = text;
};

ArkView.BreadcrumbUI.prototype.onHome = function (callback) {
    this.elBreadcrumbs.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'btn-home') {
            callback();
        }
    });
};

ArkView.BreadcrumbUI.prototype.onBack = function (callback) {
    this.elBack.addEventListener('click', callback);
};
