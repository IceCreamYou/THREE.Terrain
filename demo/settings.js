import { GUI } from 'dat.gui';

/**
 * Parse an optional unsigned 32-bit demo seed.
 *
 * @param {string|null} value
 *   URL query value.
 * @return {number|null}
 *   Normalized seed or null for invalid input.
 */
export function parseDemoSeed(value) {
    if (!value || !/^(?:0x[0-9a-f]+|\d+)$/i.test(value)) return null;
    var seed = Number(value);
    return Number.isSafeInteger(seed) ? seed >>> 0 : null;
}

/**
 * Parse a boolean supplied through a URL query parameter.
 *
 * @param {string} value
 *   URL value.
 * @return {boolean|null}
 *   Parsed boolean or null for invalid input.
 */
function parseURLBoolean(value) {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return null;
}

/**
 * Apply URL settings to a settings object.
 *
 * URL names match enumerable settings properties directly. The island
 * influence remains a compatibility shorthand for radial edge settings.
 *
 * @param {Object} settings
 *   Demo settings object.
 * @param {URL} url
 *   Demo URL.
 * @param {string|null} influence
 *   Optional compatibility influence name.
 */
export function applyURLSettings(settings, url, influence) {
    for (var property in settings) {
        if (!settings.hasOwnProperty(property) || typeof settings[property] === 'function') continue;
        var value = url.searchParams.get(property);
        if (value === null) continue;
        if (typeof settings[property] === 'boolean') {
            var booleanValue = parseURLBoolean(value);
            if (booleanValue !== null) settings[property] = booleanValue;
        }
        else if (typeof settings[property] === 'number') {
            var numberValue = Number(value);
            if (Number.isFinite(numberValue)) settings[property] = numberValue;
        }
        else {
            settings[property] = value;
        }
    }
    if (influence === 'island') {
        if (!url.searchParams.has('edgeType')) settings.edgeType = 'Radial';
        if (!url.searchParams.has('edgeDirection')) settings.edgeDirection = 'Down';
        if (!url.searchParams.has('edgeCurve')) settings.edgeCurve = 'EaseInOut';
        if (!url.searchParams.has('edgeDistance')) settings.edgeDistance = 320;
    }
}

/**
 * Create the settings used by the terrain and decoration controls.
 *
 * @param {Object} options
 *   Initial flight-mode and light-color values.
 * @return {Object}
 *   Mutable settings object.
 */
export function createSettings(options) {
    return {
        easing: 'Linear',
        heightmap: 'PerlinDiamond',
        smoothing: 'None',
        maxHeight: 200,
        segments: 63,
        steps: 1,
        turbulent: false,
        size: 1024,
        sky: true,
        texture: 'Blended',
        edgeDirection: 'Normal',
        edgeType: 'Box',
        edgeDistance: 480,
        edgeCurve: 'EaseInOut',
        widthLengthRatio: 1.0,
        'Flight mode': !!options.flightMode,
        'Light color': options.lightColor,
        grassEnabled: true,
        grassDensity: 0.75,
        grassHeight: 7,
        grassWidth: 5,
        grassAlphaTest: 0.65,
        grassMinimumLight: 0.58,
        grassLodDistance: 1200,
        grassMaxSlope: 0.7853981633974483,
        grassPositionJitter: 2.8,
        grassWindSpeed: 1.15,
        grassWindStrength: 3.5,
        grassTintLow: '#496b34',
        grassTintHigh: '#78934a',
        spread: 32,
        scattering: 'PerlinAltitude',
        bushPreset: 'Bush 1',
    };
}

/**
 * Create dat.GUI controls for the terrain demonstration.
 *
 * @param {Object} options
 *   Settings, URL, landscape controller, camera controller, and world.
 * @return {Object}
 *   GUI instance and settings object.
 */
export function createSettingsPanel(options) {
    var settings = options.settings,
        landscape = options.landscape,
        camera = options.camera,
        world = options.world;
    applyURLSettings(settings, options.url, options.influence);
    settings.Regenerate = landscape.regenerate;
    settings['Scatter meshes'] = landscape.scatterMeshes;
    settings['Rebuild grass'] = landscape.rebuildGrass;

    var gui = new GUI(),
        heightmapFolder = gui.addFolder('Heightmap');
    heightmapFolder.add(settings, 'heightmap', ['Brownian', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Fault', 'heightmap.png', 'Hill', 'HillIsland', 'influences', 'Particles', 'Perlin', 'PerlinDiamond', 'PerlinLayers', 'Simplex', 'SimplexLayers', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings.Regenerate);
    heightmapFolder.add(settings, 'easing', ['Linear', 'EaseIn', 'EaseInWeak', 'EaseOut', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
    heightmapFolder.add(settings, 'smoothing', ['Conservative (0.5)', 'Conservative (1)', 'Conservative (10)', 'Gaussian (0.5, 7)', 'Gaussian (1.0, 7)', 'Gaussian (1.5, 7)', 'Gaussian (1.0, 5)', 'Gaussian (1.0, 11)', 'GaussianBox', 'Mean (0)', 'Mean (1)', 'Mean (8)', 'Median', 'None']).onChange(function(value) {
        landscape.applySmoothing(value, landscape.getLastOptions());
        landscape.scatterMeshes();
        landscape.updateHeightmap();
    });
    heightmapFolder.add(settings, 'segments', 7, 127).step(1).onFinishChange(settings.Regenerate);
    heightmapFolder.add(settings, 'steps', 1, 8).step(1).onFinishChange(settings.Regenerate);
    heightmapFolder.add(settings, 'turbulent').onFinishChange(settings.Regenerate);
    heightmapFolder.open();

    var decorationFolder = gui.addFolder('Decoration');
    decorationFolder.add(settings, 'texture', ['Blended', 'Grayscale', 'Wireframe']).onFinishChange(settings.Regenerate);
    decorationFolder.add(settings, 'scattering', ['Altitude', 'Linear', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Particles', 'Perlin', 'PerlinAltitude', 'Simplex', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings['Scatter meshes']);
    decorationFolder.add(settings, 'spread', 0, 100).step(1).onFinishChange(settings['Scatter meshes']);
    decorationFolder.add(settings, 'bushPreset', ['None', 'Bush 1', 'Bush 2', 'Bush 3']).name('Bush preset').onFinishChange(settings['Scatter meshes']);
    decorationFolder.addColor(settings, 'Light color').onChange(function(value) {
        world.skyLight.color.set(value);
    });

    var grassFolder = decorationFolder.addFolder('Grass');
    grassFolder.add(settings, 'grassEnabled').name('Enabled').onChange(settings['Scatter meshes']);
    grassFolder.add(settings, 'grassDensity', 0, 2).step(0.01).name('Density').onFinishChange(settings['Scatter meshes']);
    grassFolder.add(settings, 'grassHeight', 4, 24).step(1).name('Height').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassWidth', 4, 32).step(1).name('Width').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassAlphaTest', 0.1, 0.95).step(0.01).name('Alpha test').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassMinimumLight', 0, 2).step(0.01).name('Min light').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassLodDistance', 0, 2000).step(50).name('LOD distance');
    grassFolder.add(settings, 'grassMaxSlope', 0.1, 1.57).step(0.01).name('Max slope').onFinishChange(settings['Scatter meshes']);
    grassFolder.add(settings, 'grassPositionJitter', 0, 3).step(0.05).name('Jitter / spacing').onFinishChange(settings['Scatter meshes']);
    grassFolder.add(settings, 'grassWindSpeed', 0, 3).step(0.05).name('Wind speed').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassWindStrength', 0, 12).step(0.1).name('Wind strength').onFinishChange(settings['Rebuild grass']);
    grassFolder.addColor(settings, 'grassTintLow').name('Tint low').onFinishChange(settings['Scatter meshes']);
    grassFolder.addColor(settings, 'grassTintHigh').name('Tint high').onFinishChange(settings['Scatter meshes']);
    grassFolder.open();

    var sizeFolder = gui.addFolder('Size');
    sizeFolder.add(settings, 'size', 1024, 3072).step(256).onFinishChange(settings.Regenerate);
    sizeFolder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(settings.Regenerate);
    sizeFolder.add(settings, 'widthLengthRatio', 0.2, 2).step(0.05).name('width:length ratio').onFinishChange(settings.Regenerate);

    var edgesFolder = gui.addFolder('Edges');
    edgesFolder.add(settings, 'edgeType', ['Box', 'Radial']).onFinishChange(settings.Regenerate);
    edgesFolder.add(settings, 'edgeDirection', ['Normal', 'Up', 'Down']).onFinishChange(settings.Regenerate);
    edgesFolder.add(settings, 'edgeCurve', ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut']).onFinishChange(settings.Regenerate);
    edgesFolder.add(settings, 'edgeDistance', 0, 512).step(32).onFinishChange(settings.Regenerate);

    gui.add(settings, 'Flight mode').onChange(camera.setFlightMode);
    gui.add(settings, 'Scatter meshes');
    gui.add(settings, 'Regenerate');
    return {gui: gui, settings: settings};
}
