import * as THREE from 'three';
import { createRandomSeed } from '../src/random.js';
import { createAnalyticsController } from './analytics.js';
import { createCameraController, normalizeCameraStart, parseCameraState } from './camera.js';
import { createLandscape } from './landscape.js';
import { applyURLSettings, createSettings, parseDemoSeed, createSettingsPanel, syncURLSettings } from './settings.js';
import { bindFocusHandling, bindKeyboardControls, bindResizeHandling, createFPSCounter } from './ui.js';
import { createWorld } from './world.js';

var INV_MAX_FPS = 1 / 100;

/**
 * Serialize a camera vector without putting unnecessary floating-point noise
 * into a shared demo URL.
 *
 * Six decimal places are more precise than a visible pixel at the demo's
 * scale, while keeping URLs short enough to copy and paste comfortably.
 *
 * @param {Array<number>} values
 *   Three camera coordinates or Euler angles.
 * @return {string}
 *   Comma-separated URL value.
 */
function serializeCameraVector(values) {
    return values.map(function(value) { return Number(value.toFixed(6)); }).join(',');
}

/**
 * Synchronize the reproducible demo state with the browser address bar.
 *
 * `replaceState` keeps camera movement from filling browser history while
 * still making the current view, seed, and GUI values immediately shareable.
 *
 * @param {Object} landscape
 *   Landscape controller exposing the current terrain and decoration seeds.
 * @param {Object} camera
 *   Camera controller exposing its active state.
 * @param {Object} settings
 *   Current dat.GUI settings.
 */
function syncDemoURL(landscape, camera, settings) {
    var url = new URL(window.location.href),
        cameraState = camera.getActiveState(),
        seeds = landscape.getSeeds();
    url.searchParams.set('seed', String(seeds.terrain >>> 0));
    url.searchParams.set('decorationSeed', String(seeds.decoration >>> 0));
    url.searchParams.delete('bushPreset');
    url.searchParams.set('cameraPosition', serializeCameraVector(cameraState.position));
    url.searchParams.set('cameraRotation', serializeCameraVector(cameraState.rotation));
    url.searchParams.set('cameraRotationOrder', cameraState.rotationOrder);
    syncURLSettings(settings, url);
    window.terrainDemoSeed = seeds.terrain;
    window.terrainDemoDecorationSeed = seeds.decoration;
    if (url.href !== window.location.href) window.history.replaceState(null, '', url.toString());
}

/**
 * Start the browser demo.
 *
 * The entry point wires browser services together. Library capability code
 * stays in `landscape.js`; camera, GUI, analytics, and world code stay in
 * their own modules.
 */
export function initializeDemo() {
    var nativeRandom = Math.random,
        demoURL = new URL(window.location.href),
        demoSeed = parseDemoSeed(demoURL.searchParams.get('seed')),
        demoDecorationSeed = parseDemoSeed(demoURL.searchParams.get('decorationSeed')),
        demoStart = normalizeCameraStart(demoURL.searchParams.get('start')),
        demoCameraState = parseCameraState(demoURL),
        demoFlightMode = demoURL.searchParams.get('Flight mode') === 'true' || demoURL.searchParams.get('Flight mode') === '1',
        demoInfluence = demoURL.searchParams.get('influence') === 'island' ? 'island' : null,
        demoStatic = demoURL.searchParams.get('static') === '1';
    if (demoSeed === null) demoSeed = createRandomSeed(nativeRandom);

    var scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({antialias: true}),
        clock = new THREE.Clock(false),
        paused = true,
        frameDelta = 0,
        animationFrame = null,
        animationToken = 0;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('tabindex', -1);

    var world = createWorld({scene: scene, renderer: renderer}),
        camera = createCameraController({
            scene: scene,
            renderer: renderer,
            rotationOrder: demoFlightMode ? 'YXZ' : 'XYZ',
            start: demoStart,
            state: demoCameraState,
        }),
        analytics = createAnalyticsController(),
        heightmapImage = new Image(),
        heightmapCanvas = document.getElementById('heightmap'),
        fpsCounter = createFPSCounter(document.getElementById('fps')),
        settings = createSettings({
            flightMode: false,
            lightColor: '#' + world.skyLight.color.getHexString(),
        });
    heightmapImage.src = 'demo/img/heightmap.png';
    applyURLSettings(settings, demoURL, demoInfluence);

    var landscape = createLandscape({
        analytics: analytics,
        demoStatic: demoStatic,
        heightmapCanvas: heightmapCanvas,
        heightmapImage: heightmapImage,
        renderer: renderer,
        scene: scene,
        seed: demoSeed,
        decorationSeed: demoDecorationSeed,
        settings: settings,
        world: world,
    });
    var settingsPanel = createSettingsPanel({
        camera: camera,
        influence: demoInfluence,
        landscape: landscape,
        settings: settings,
        url: demoURL,
        world: world,
    });

    window.rebuild = settings.Regenerate;
    window.terrainDemoSeed = demoSeed;
    window.terrainDemoStart = demoStart;
    window.terrainDemoInfluence = demoInfluence;
    window.terrainDemoStatic = demoStatic;
    camera.controls.onFlightModeChange = function(enabled) {
        settings['Flight mode'] = enabled;
        if (settingsPanel.gui && settingsPanel.gui.updateDisplay) settingsPanel.gui.updateDisplay();
    };
    world.skyLight.color.set(settings['Light color']);
    camera.setFlightMode(settings['Flight mode'], false);
    landscape.regenerate();
    syncDemoURL(landscape, camera, settings);

    /**
     * Draw the current library landscape.
     */
    function draw(frameTime) {
        landscape.update(clock.elapsedTime, camera.getActiveCamera(), !camera.isFlightMode());
        renderer.render(scene, camera.getActiveCamera());
        fpsCounter.update(frameTime);
    }

    /**
     * Run one animation frame and fixed-rate simulation steps.
     *
     * @param {number} frameTime
     *   Browser animation timestamp.
     * @param {number} token
     *   Animation-loop generation used to reject stale callbacks.
     */
    function animate(frameTime, token) {
        if (paused || token !== animationToken) {
            animationFrame = null;
            return;
        }
        animationFrame = null;
        draw(frameTime);
        frameDelta += clock.getDelta();
        while (frameDelta >= INV_MAX_FPS) {
            camera.update(INV_MAX_FPS);
            frameDelta -= INV_MAX_FPS;
        }
        syncDemoURL(landscape, camera, settings);
        animationFrame = requestAnimationFrame(function(nextFrameTime) {
            animate(nextFrameTime, token);
        });
    }

    /**
     * Start the demo animation loop.
     */
    function startAnimating() {
        if (paused) {
            paused = false;
            camera.controls.enabled = true;
            if (camera.controls.updateOverlay) camera.controls.updateOverlay();
            if (fpsCounter.reset) fpsCounter.reset();
            clock.start();
            animationToken++;
            var token = animationToken;
            animationFrame = requestAnimationFrame(function(frameTime) {
                animate(frameTime, token);
            });
        }
    }

    /**
     * Stop the demo animation loop.
     */
    function stopAnimating() {
        paused = true;
        animationToken++;
        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        camera.controls.enabled = false;
        if (camera.controls.clearKeys) camera.controls.clearKeys();
        if (camera.controls.unlock) camera.controls.unlock();
        if (camera.controls.updateOverlay) camera.controls.updateOverlay();
        clock.stop();
    }

    bindFocusHandling({
        controls: camera.controls,
        startAnimating: startAnimating,
        stopAnimating: stopAnimating,
    });
    bindKeyboardControls({
        controls: camera.controls,
        isFlightMode: camera.isFlightMode,
    });
    bindResizeHandling({
        camera: camera,
        draw: draw,
        renderer: renderer,
    });
    startAnimating();
    return {
        camera: camera,
        landscape: landscape,
        renderer: renderer,
        scene: scene,
        settings: settingsPanel.settings,
        world: world,
    };
}

initializeDemo();
