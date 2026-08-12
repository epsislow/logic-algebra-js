var ArkView = ArkView || {};

ArkView.bootstrap = function () {
    var canvas = document.getElementById('webgl-canvas');
    var engine = new ArkView.Engine(canvas);
    var postProcessing = new ArkView.PostProcessing(engine);

    var panelBuilder = new ArkView.PanelBuilder(engine.scene, ArkView.ProjectData);
    var fluxNetwork = new ArkView.FluxNetwork(
        engine.scene,
        panelBuilder.pozitiiGlobale,
        ArkView.ProjectData.legaturi,
        postProcessing
    );
    var particles = new ArkView.ParticleField(engine.scene);

    var breadcrumbUI = new ArkView.BreadcrumbUI();
    var navigation = new ArkView.Navigation(engine, breadcrumbUI);

    new ArkView.PanelInteraction(engine, navigation);
    breadcrumbUI.onBack(function () { navigation.goBack(); });

    engine.addUpdatable(panelBuilder);
    engine.addUpdatable(fluxNetwork);
    engine.addUpdatable(particles);

    engine.start(function () {
        postProcessing.render();
    });
};

document.addEventListener('DOMContentLoaded', ArkView.bootstrap);
