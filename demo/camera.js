import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

var cameraStarts = {
    'default': {
        main: {
            position: [449, 311, 376],
            rotation: [-52 * Math.PI / 180, 35 * Math.PI / 180, 37 * Math.PI / 180],
        },
        fps: {
            position: [449, 311, 376],
            target: [0, 0, 0],
        },
    },
    'readme-screenshot-options': {
        main: {
            position: [420, 120, 420],
            target: [0, 25, 0],
        },
        fps: {
            position: [420, 120, 420],
            target: [0, 25, 0],
        },
    },
    'readme-screenshot-beach': {
        main: {
            position: [301, -13, -154],
            target: [260, -18, -210],
        },
        fps: {
            position: [301, -13, -154],
            target: [260, -18, -210],
        },
    },
};

/**
 * Normalize a camera start name from the demo URL.
 *
 * @param {string|null} value
 *   Requested camera start.
 * @return {string}
 *   Valid camera start name.
 */
export function normalizeCameraStart(value) {
    value = value || 'default';
    return cameraStarts[value] ? value : 'default';
}

/**
 * Apply a camera position and rotation or look-at target.
 *
 * @param {THREE.Camera} camera
 *   Camera receiving the pose.
 * @param {Object} pose
 *   Pose with `position` and either `rotation` or `target`.
 */
export function applyCameraPose(camera, pose) {
    camera.position.fromArray(pose.position);
    if (pose.rotation) camera.rotation.fromArray(pose.rotation);
    else if (pose.target) camera.lookAt(new THREE.Vector3().fromArray(pose.target));
}

/**
 * Create the main and first-person cameras used by the demo.
 *
 * @param {Object} options
 *   Scene, renderer, and selected camera start.
 * @return {Object}
 *   Camera accessors, controls, and viewport operations.
 */
export function createCameraController(options) {
    var scene = options.scene,
        renderer = options.renderer,
        start = cameraStarts[normalizeCameraStart(options.start)] || cameraStarts.default,
        camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000),
        fpsCamera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000),
        controls = new FirstPersonControls(fpsCamera, renderer.domElement),
        useFPS = false;

    scene.add(camera);
    scene.add(fpsCamera);
    applyCameraPose(camera, start.main);
    applyCameraPose(fpsCamera, start.fps);
    controls.enabled = false;
    controls.movementSpeed = 100;
    controls.lookSpeed = 0.075;
    controls.lookAt(new THREE.Vector3().fromArray(start.fps.target));

    /**
     * Change between orbit-style and first-person presentation cameras.
     *
     * @param {boolean} enabled
     *   True to use first-person controls.
     */
    function setFlightMode(enabled) {
        useFPS = !!enabled;
        applyCameraPose(fpsCamera, start.fps);
        controls.lookAt(new THREE.Vector3().fromArray(start.fps.target));
        controls.update(0);
        controls.enabled = false;
        var overlay = document.getElementById('fpscontrols');
        if (useFPS) {
            if (overlay) overlay.className = 'visible';
            setTimeout(function() {
                controls.enabled = true;
            }, 1000);
        }
        else if (overlay) {
            overlay.className = '';
        }
    }

    /**
     * Update camera projection matrices after a viewport change.
     */
    function resize() {
        var width = renderer.domElement.width,
            height = renderer.domElement.height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        fpsCamera.aspect = width / height;
        fpsCamera.updateProjectionMatrix();
    }

    /**
     * Update first-person controls for one animation step.
     *
     * @param {number} delta
     *   Elapsed seconds since the previous simulation step.
     */
    function update(delta) {
        if (controls.update) controls.update(delta);
    }

    return {
        camera: camera,
        fpsCamera: fpsCamera,
        controls: controls,
        getActiveCamera: function() { return useFPS ? fpsCamera : camera; },
        isFlightMode: function() { return useFPS; },
        resize: resize,
        setFlightMode: setFlightMode,
        update: update,
    };
}
