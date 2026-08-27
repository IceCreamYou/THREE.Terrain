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
 * Write the current dat.GUI values into a URL.
 *
 * Function-valued entries are the GUI actions and are deliberately skipped.
 * All other enumerable settings use their property names directly, so a
 * shared URL captures the same terrain, material, decoration, and flight
 * configuration that is visible in the panel.
 *
 * @param {Object} settings
 *   Mutable demo settings object.
 * @param {URL} url
 *   URL to update.
 * @return {URL}
 *   The updated URL.
 */
export function syncURLSettings(settings, url) {
    for (var property in settings) {
        if (!settings.hasOwnProperty(property) || typeof settings[property] === 'function') continue;
        url.searchParams.set(property, String(settings[property]));
    }
    return url;
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
        segments: 95,
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
        grassDensity: 1.0,
        grassHeightMin: 5,
        grassHeightMax: 9,
        grassWidthMin: 4,
        grassWidthMax: 7,
        grassSizeEasing: 'EaseInOut',
        grassAlphaTest: 0.65,
        grassMinimumLight: 0.58,
        grassLodDistance: 1200,
        grassMaxSlope: 0.7853981633974483,
        grassPositionJitter: 2.8,
        grassWindSpeed: 1.8,
        grassWindStrength: 5.5,
        grassTintLow: '#496b34',
        grassTintHigh: '#78934a',
        spread: 32,
        scattering: 'PerlinAltitude',
        sculptMode: false,
        sculptBrushRadius: 120,
        sculptHardness: 53,
        sculptFeathering: 'EaseInOut',
        sculptStrength: 48,
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
        world = options.world,
        sculpt = options.sculpt,
        regenerate = landscape.regenerate,
        scatterMeshes = landscape.scatterMeshes;
    applyURLSettings(settings, options.url, options.influence);
    settings.Regenerate = landscape.regenerateNewSeed;
    settings['Scatter meshes'] = landscape.scatterMeshesNewSeed;
    settings['Rebuild grass'] = landscape.rebuildGrass;

    var gui = new GUI(),
        heightmapFolder = gui.addFolder('Heightmap');
    heightmapFolder.add(settings, 'heightmap', ['Brownian', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Fault', 'heightmap.png', 'Hill', 'HillIsland', 'influences', 'Particles', 'Perlin', 'PerlinDiamond', 'PerlinLayers', 'Simplex', 'SimplexLayers', 'Value', 'Weierstrass', 'Worley']).onFinishChange(regenerate);
    heightmapFolder.add(settings, 'easing', ['Linear', 'EaseIn', 'EaseInWeak', 'EaseOut', 'EaseInOut', 'InEaseOut']).onFinishChange(regenerate);
    heightmapFolder.add(settings, 'smoothing', ['Conservative (0.5)', 'Conservative (1)', 'Conservative (10)', 'Gaussian (0.5, 7)', 'Gaussian (1.0, 7)', 'Gaussian (1.5, 7)', 'Gaussian (1.0, 5)', 'Gaussian (1.0, 11)', 'GaussianBox', 'Mean (0)', 'Mean (1)', 'Mean (8)', 'Median', 'None']).onChange(function(value) {
        landscape.applySmoothing(value, landscape.getLastOptions());
        landscape.scatterMeshes();
        landscape.updateHeightmap();
    });
    heightmapFolder.add(settings, 'segments', 7, 191).step(1).onFinishChange(regenerate);
    heightmapFolder.add(settings, 'steps', 1, 8).step(1).onFinishChange(regenerate);
    heightmapFolder.add(settings, 'turbulent').onFinishChange(regenerate);
    heightmapFolder.open();

    var sculptFolder = gui.addFolder('Sculpt'),
        sculptModeController = sculptFolder.add(settings, 'sculptMode').name('Enabled');
    sculptModeController.onChange(function(value) {
        if (value && camera.isFlightMode()) camera.setFlightMode(false, false);
        if (sculpt) sculpt.setEnabled(value);
    });
    sculptFolder.add(settings, 'sculptBrushRadius', 8, 256).step(4).name('Brush radius');
    sculptFolder.add(settings, 'sculptHardness', 0, 100).step(1).name('Hardness %');
    sculptFolder.add(settings, 'sculptFeathering', ['Linear', 'EaseIn', 'EaseInWeak', 'EaseOut', 'EaseInOut', 'InEaseOut', 'EaseInStrong']).name('Feathering');
    sculptFolder.add(settings, 'sculptStrength', 0, 200).step(1).name('Strength / sec');

    var decorationFolder = gui.addFolder('Decoration');
    decorationFolder.add(settings, 'texture', ['Blended', 'Grayscale', 'Wireframe']).onFinishChange(regenerate);
    decorationFolder.add(settings, 'scattering', ['Altitude', 'Linear', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Particles', 'Perlin', 'PerlinAltitude', 'Simplex', 'Value', 'Weierstrass', 'Worley']).onFinishChange(scatterMeshes);
    decorationFolder.add(settings, 'spread', 0, 100).step(1).onFinishChange(scatterMeshes);
    decorationFolder.addColor(settings, 'Light color').onChange(function(value) {
        world.skyLight.color.set(value);
    });

    var grassFolder = decorationFolder.addFolder('Grass');
    grassFolder.add(settings, 'grassEnabled').name('Enabled').onChange(scatterMeshes);
    grassFolder.add(settings, 'grassDensity', 0, 2).step(0.01).name('Density').onFinishChange(scatterMeshes);
    grassFolder.add(settings, 'grassHeightMin', 2, 32).step(1).name('Height min').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassHeightMax', 2, 32).step(1).name('Height max').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassWidthMin', 2, 32).step(1).name('Width min').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassWidthMax', 2, 32).step(1).name('Width max').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassSizeEasing', ['Linear', 'EaseIn', 'EaseInWeak', 'EaseOut', 'EaseInOut', 'InEaseOut', 'EaseInStrong']).name('Size easing').onFinishChange(scatterMeshes);
    grassFolder.add(settings, 'grassAlphaTest', 0.1, 0.95).step(0.01).name('Alpha test').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassMinimumLight', 0, 2).step(0.01).name('Min light').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassLodDistance', 0, 2000).step(50).name('LOD distance');
    grassFolder.add(settings, 'grassMaxSlope', 0.1, 1.57).step(0.01).name('Max slope').onFinishChange(scatterMeshes);
    grassFolder.add(settings, 'grassPositionJitter', 0, 3).step(0.05).name('Jitter / spacing').onFinishChange(scatterMeshes);
    grassFolder.add(settings, 'grassWindSpeed', 0, 3).step(0.05).name('Wind speed').onFinishChange(settings['Rebuild grass']);
    grassFolder.add(settings, 'grassWindStrength', 0, 12).step(0.1).name('Wind strength').onFinishChange(settings['Rebuild grass']);
    grassFolder.addColor(settings, 'grassTintLow').name('Tint low').onFinishChange(scatterMeshes);
    grassFolder.addColor(settings, 'grassTintHigh').name('Tint high').onFinishChange(scatterMeshes);
    grassFolder.open();

    var sizeFolder = gui.addFolder('Size');
    sizeFolder.add(settings, 'size', 1024, 3072).step(256).onFinishChange(regenerate);
    sizeFolder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(regenerate);
    sizeFolder.add(settings, 'widthLengthRatio', 0.2, 2).step(0.05).name('width:length ratio').onFinishChange(regenerate);

    var edgesFolder = gui.addFolder('Edges');
    edgesFolder.add(settings, 'edgeType', ['Box', 'Radial']).onFinishChange(regenerate);
    edgesFolder.add(settings, 'edgeDirection', ['Normal', 'Up', 'Down']).onFinishChange(regenerate);
    edgesFolder.add(settings, 'edgeCurve', ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut']).onFinishChange(regenerate);
    edgesFolder.add(settings, 'edgeDistance', 0, 512).step(32).onFinishChange(regenerate);

    var flightModeController = gui.add(settings, 'Flight mode');
    flightModeController.onChange(function(value) {
        // The pointer-lock request is made by the input's click listener
        // below. The dat.GUI change callback runs too late for reliable
        // re-entry after the user releases pointer lock with Escape.
        if (value && sculpt && sculpt.isEnabled()) {
            settings.sculptMode = false;
            sculpt.setEnabled(false);
        }
        camera.setFlightMode(value, false);
        if (gui.updateDisplay) gui.updateDisplay();
    });
    var flightModeInput = flightModeController.domElement.querySelector('input');
    var flightModeRow = flightModeController.domElement.closest ?
        flightModeController.domElement.closest('li') : flightModeController.domElement.parentElement.parentElement;
    var pointerLockRecoveryMessage = 'Flight mode is disabled after pointer lock was released. ' +
        'Click elsewhere in the scene or another control to re-enable it.';
    var flightModeTooltip = document.createElement('div');
    flightModeTooltip.className = 'flight-mode-tooltip';
    flightModeTooltip.id = 'flight-mode-tooltip';
    flightModeTooltip.setAttribute('role', 'tooltip');
    flightModeTooltip.setAttribute('aria-hidden', 'true');
    flightModeTooltip.textContent = pointerLockRecoveryMessage;
    document.body.appendChild(flightModeTooltip);
    if (flightModeInput) flightModeInput.setAttribute('aria-describedby', flightModeTooltip.id);
    if (flightModeRow) flightModeRow.setAttribute('aria-describedby', flightModeTooltip.id);
    /**
     * Place the Flight mode recovery tooltip beside its disabled row.
     *
     * The tooltip is attached to the document rather than the dat.GUI row,
     * because dat.GUI clips row contents to its fixed 27px height. Positioning
     * it from the row's viewport bounds also keeps the pointer-shaped marker
     * aligned when the panel is moved or the window is resized.
     */
    function positionFlightModeTooltip() {
        if (!flightModeRow || !flightModeTooltip) return;
        var rowBounds = flightModeRow.getBoundingClientRect(),
            tooltipBounds = flightModeTooltip.getBoundingClientRect(),
            left = Math.max(8, rowBounds.left - tooltipBounds.width - 14),
            top = rowBounds.top + (rowBounds.height - tooltipBounds.height) * 0.5;
        flightModeTooltip.style.left = left + 'px';
        flightModeTooltip.style.top = Math.max(8, Math.min(top, window.innerHeight - tooltipBounds.height - 8)) + 'px';
    }
    window.addEventListener('resize', positionFlightModeTooltip);
    /**
     * Enable or disable the Flight mode checkbox after pointer-lock changes.
     *
     * @param {boolean} available
     *   Whether the browser permits another pointer-lock request.
     */
    function updateFlightModeAvailability(available) {
        if (!flightModeInput) return;
        flightModeInput.disabled = !available;
        flightModeController.domElement.classList.toggle('pointer-lock-blocked', !available);
        flightModeTooltip.classList.toggle('visible', !available);
        flightModeTooltip.setAttribute('aria-hidden', available ? 'true' : 'false');
        if (!available) positionFlightModeTooltip();
    }
    if (camera.controls.onPointerLockAvailabilityChange !== undefined) {
        camera.controls.onPointerLockAvailabilityChange = updateFlightModeAvailability;
        if (camera.controls.isPointerLockAvailable) {
            updateFlightModeAvailability(camera.controls.isPointerLockAvailable());
        }
    }
    /**
     * Restore Flight mode after an interaction outside its dat.GUI row.
     *
     * The row is clickable and dat.GUI forwards a row click to its checkbox.
     * Treating that click as the browser interaction that re-enables the
     * checkbox would immediately request pointer lock again, while the user
     * is still trying to interact with the disabled row. An interaction on a
     * different control or in the scene is the deliberate recovery gesture.
     *
     * @param {MouseEvent|KeyboardEvent} event
     *   User interaction after pointer lock was released.
     */
    function restoreFlightModeAfterInteraction(event) {
        if (event.type === 'keydown' && (event.code === 'Escape' || event.key === 'Escape')) return;
        if (event.type === 'click' && flightModeRow && flightModeRow.contains(event.target)) {
            if (camera.controls.isPointerLockAvailable && !camera.controls.isPointerLockAvailable()) {
                // dat.GUI forwards a row click to the disabled checkbox. Stop
                // the original event so that synthetic click cannot toggle
                // the checkbox back on while the browser gesture is blocked.
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }
        if (camera.controls.restorePointerLockAvailability) camera.controls.restorePointerLockAvailability();
    }
    document.addEventListener('click', restoreFlightModeAfterInteraction, {capture: true});
    document.addEventListener('keydown', restoreFlightModeAfterInteraction, {capture: true, passive: true});
    if (flightModeInput) flightModeInput.addEventListener('click', function() {
        if (flightModeInput.checked && camera.controls.requestPointerLock) {
            camera.controls.requestPointerLock();
        }
    });
    gui.add(settings, 'Scatter meshes');
    gui.add(settings, 'Regenerate');
    return {gui: gui, settings: settings};
}
