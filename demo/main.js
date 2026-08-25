import * as THREE from 'three';
import { createRandomSeed } from '../src/random.js';
import { createAnalyticsController } from './analytics.js';
import { createCameraController, normalizeCameraStart } from './camera.js';
import { createLandscape } from './landscape.js';
import { applyURLSettings, createSettings, parseDemoSeed, createSettingsPanel } from './settings.js';
import { bindFocusHandling, bindKeyboardControls, bindResizeHandling } from './ui.js';
import { createWorld } from './world.js';

var INV_MAX_FPS = 1 / 100;

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
        demoStart = normalizeCameraStart(demoURL.searchParams.get('start')),
        demoInfluence = demoURL.searchParams.get('influence') === 'island' ? 'island' : null,
        demoStatic = demoURL.searchParams.get('static') === '1';
    if (demoSeed === null) demoSeed = createRandomSeed(nativeRandom);

    var scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({antialias: true}),
        clock = new THREE.Clock(false),
        paused = true,
        frameDelta = 0;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('tabindex', -1);

    var world = createWorld({scene: scene, renderer: renderer}),
        camera = createCameraController({scene: scene, renderer: renderer, start: demoStart}),
        analytics = createAnalyticsController(),
        heightmapImage = new Image(),
        heightmapCanvas = document.getElementById('heightmap'),
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
    world.skyLight.color.set(settings['Light color']);
    camera.setFlightMode(settings['Flight mode']);
    landscape.regenerate();

    /**
     * Draw the current library landscape.
     */
    function draw() {
        landscape.update(clock.elapsedTime, camera.getActiveCamera());
        renderer.render(scene, camera.getActiveCamera());
    }

    /**
     * Run one animation frame and fixed-rate simulation steps.
     */
    function animate() {
        if (paused) return;
        draw();
        frameDelta += clock.getDelta();
        while (frameDelta >= INV_MAX_FPS) {
            camera.update(INV_MAX_FPS);
            frameDelta -= INV_MAX_FPS;
        }
        requestAnimationFrame(animate);
    }

    /**
     * Start the demo animation loop.
     */
    function startAnimating() {
        if (paused) {
            paused = false;
            camera.controls.enabled = true;
            clock.start();
            requestAnimationFrame(animate);
        }
    }

    /**
     * Stop the demo animation loop.
     */
    function stopAnimating() {
        paused = true;
        camera.controls.enabled = false;
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
