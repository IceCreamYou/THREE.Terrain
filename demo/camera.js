import * as THREE from 'three';

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
            position: [360, 120, 360],
            target: [0, 25, 0],
        },
        fps: {
            position: [360, 120, 360],
            target: [0, 25, 0],
        },
    },
    'readme-screenshot-beach': {
        main: {
            position: [220, -55, 320],
            target: [0, -35, 180],
        },
        fps: {
            position: [220, -55, 320],
            target: [0, -35, 180],
        },
    },
};

var flightMovementKeys = {
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: true,
    ArrowUp: true,
    KeyA: true,
    KeyC: true,
    KeyD: true,
    KeyE: true,
    KeyF: true,
    KeyQ: true,
    KeyR: true,
    KeyS: true,
    KeyW: true,
    KeyX: true,
    KeyZ: true,
    Space: true,
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
 * Parse a comma-separated camera vector from a URL query value.
 *
 * The demo stores positions and Euler rotations as three finite numbers. A
 * malformed value is ignored instead of allowing a bad shared URL to place
 * the camera at infinity or make the renderer produce invalid matrices.
 *
 * @param {string|null} value
 *   URL query value.
 * @return {Array<number>|null}
 *   Three finite numbers, or null when the value is invalid.
 */
function parseCameraVector(value) {
    if (!value) return null;
    var values = value.split(',').map(Number);
    if (values.length !== 3 || values.some(function(item) { return !Number.isFinite(item); })) return null;
    return values;
}

/**
 * Parse an optional camera position and orientation from a demo URL.
 *
 * @param {URL} url
 *   Demo URL containing `cameraPosition`, `cameraRotation`, and optionally
 *   `cameraRotationOrder`.
 * @return {Object|null}
 *   Camera state values, including an optional Euler order, or null when
 *   neither query value is valid.
 */
export function parseCameraState(url) {
    var position = parseCameraVector(url.searchParams.get('cameraPosition')),
        rotation = parseCameraVector(url.searchParams.get('cameraRotation')),
        rotationOrder = url.searchParams.get('cameraRotationOrder');
    if (!position && !rotation) return null;
    return {
        position: position,
        rotation: rotation,
        rotationOrder: rotationOrder === 'XYZ' || rotationOrder === 'YXZ' ? rotationOrder : null,
    };
}

/**
 * Apply a camera position and rotation or look-at target.
 *
 * @param {THREE.Camera} camera
 *   Camera receiving the pose.
 * @param {Object} pose
 *   Pose with `position` and either `rotation` or `target`. Rotation values
 *   use `rotationOrder` when supplied, or the camera's current order.
 */
export function applyCameraPose(camera, pose) {
    if (pose.position) camera.position.fromArray(pose.position);
    if (pose.rotation) {
        var rotation = new THREE.Euler(
            pose.rotation[0],
            pose.rotation[1],
            pose.rotation[2],
            pose.rotationOrder || camera.rotation.order
        );
        camera.quaternion.setFromEuler(rotation);
    }
    else if (pose.target) camera.lookAt(new THREE.Vector3().fromArray(pose.target));
}

/**
 * Create keyboard and pointer-lock flight controls for a camera.
 *
 * Pointer lock supplies relative mouse movement without requiring a drag.
 * Movement is intentionally kept in the horizontal plane so looking up or
 * down does not accidentally make forward flight climb or descend. Q/E turn
 * around the vertical axis, Z/X tilt the camera, and C/Space provide explicit
 * vertical movement.
 *
 * @param {THREE.Camera} camera
 *   Camera controlled by the flight input.
 * @param {HTMLCanvasElement} domElement
 *   Renderer canvas used for the pointer-lock request.
 * @return {Object}
 *   Flight control methods and mutable speed settings.
 */
function createFlightControls(camera, domElement) {
    var keys = {},
        pointerLocked = false,
        pointerLockPending = false,
        pointerLockBlocked = false,
        pitchLimit = Math.PI / 2 - 0.01,
        forward = new THREE.Vector3(),
        right = new THREE.Vector3(),
        up = new THREE.Vector3(0, 1, 0),
        overlay = null;

    camera.rotation.order = 'YXZ';

    /**
     * Request pointer lock without changing flight-mode state.
     *
     * The settings panel calls this from the checkbox's trusted click event.
     * Keeping the request separate from `setFlightMode` lets browsers retain
     * the user gesture after a previous Escape exit.
     */
    function requestPointerLock() {
        if (pointerLocked || pointerLockPending || pointerLockBlocked || !domElement.requestPointerLock) return;
        pointerLockPending = true;
        try {
            var request = domElement.requestPointerLock();
            // Some embedded browser surfaces reject pointer lock because the
            // canvas belongs to a wrapped document. Keep that limitation from
            // becoming an unhandled promise rejection.
            if (request && typeof request.catch === 'function') request.catch(function() {
                pointerLockPending = false;
                controls.updateOverlay();
            });
        }
        catch (error) {
            pointerLockPending = false;
            controls.updateOverlay();
        }
    }

    var controls = {
        enabled: false,
        flightMode: false,
        sculptMode: false,
        lookSpeed: 0.0025,
        movementSpeed: 100,
        onFlightModeChange: null,
        onPointerLockAvailabilityChange: null,
        onPointerLockExit: null,
        turnSpeed: 1.8,
        tiltSpeed: 1.2,

        /**
         * Update the compact flight-help overlay and its pointer-lock state.
         */
        updateOverlay: function() {
            if (!overlay) overlay = document.getElementById('fpscontrols');
            if (!overlay) return;
            var prompt = overlay.querySelector('.fpscontrols-prompt');
            overlay.className = controls.flightMode && controls.enabled ? 'visible' + (pointerLocked ? ' locked' : '') : '';
            if (prompt) prompt.textContent = pointerLocked ? 'Pointer locked' : 'Toggle Flight mode to look around';
        },

        /**
         * Request pointer lock from the user-initiated Flight mode change.
         */
        lock: function() {
            if (!controls.enabled || !controls.flightMode) return;
            requestPointerLock();
        },

        /**
         * Request pointer lock from a trusted UI gesture.
         *
         * This is separate from `lock` because the dat.GUI change callback
         * runs after the browser's gesture activation has been consumed.
         */
        requestPointerLock: function() {
            requestPointerLock();
        },

        /**
         * Return whether a new pointer-lock request is currently permitted.
         *
         * Browsers require a fresh user interaction after Escape releases
         * pointer lock. The settings panel disables its checkbox until that
         * interaction arrives.
         *
         * @return {boolean}
         *   True when a pointer-lock request may be made.
         */
        isPointerLockAvailable: function() {
            return !pointerLockBlocked;
        },

        /**
         * Restore pointer-lock availability after an outside interaction.
         *
         * Browsers require a fresh user interaction after Escape releases
         * pointer lock. The settings panel owns the Flight mode row and
         * decides which interaction counts as outside that row.
         */
        restorePointerLockAvailability: function() {
            if (!pointerLockBlocked) return;
            pointerLockBlocked = false;
            if (controls.onPointerLockAvailabilityChange) controls.onPointerLockAvailabilityChange(true);
        },

        /**
         * Release pointer lock when flight mode is disabled.
         */
        unlock: function() {
            pointerLockPending = false;
            if (document.pointerLockElement === domElement && document.exitPointerLock) {
                document.exitPointerLock();
            }
        },

        /**
         * Record a pressed navigation key.
         *
         * @param {KeyboardEvent} event
         *   Keyboard event from the document.
         * @return {boolean}
         *   True when the event belongs to navigation controls.
         */
        handleKeyDown: function(event) {
            if (!controls.enabled || (!controls.flightMode && !controls.sculptMode) ||
                !flightMovementKeys[event.code]) return false;
            keys[event.code] = true;
            return true;
        },

        /**
         * Release a navigation key.
         *
         * @param {KeyboardEvent} event
         *   Keyboard event from the document.
         * @return {boolean}
         *   True when the event belongs to navigation controls.
         */
        handleKeyUp: function(event) {
            if (!flightMovementKeys[event.code]) return false;
            delete keys[event.code];
            return true;
        },

        /**
         * Clear held keys after focus changes or mode changes.
         */
        clearKeys: function() {
            keys = {};
        },

        /**
         * Aim the flight camera at a world-space target.
         *
         * @param {THREE.Vector3} target
         *   Target point.
         * @return {Object}
         *   This controls object.
         */
        lookAt: function(target) {
            camera.lookAt(target);
            return controls;
        },

        /**
         * Set the flight camera pose from URL-compatible values.
         *
         * @param {Object} state
         *   Optional `position` and `rotation` arrays.
         */
        setState: function(state) {
            if (state.position) camera.position.fromArray(state.position);
            if (state.rotation) applyCameraPose(camera, state);
        },

        /**
         * Return whether the renderer currently owns the pointer lock.
         *
         * @return {boolean}
         *   True when pointer lock is active.
         */
        isLocked: function() {
            return pointerLocked;
        },

        /**
         * Enable keyboard navigation for sculpt mode without enabling mouse
         * look or requesting pointer lock.
         *
         * @param {boolean} value
         *   Whether sculpt navigation should be active.
         */
        setSculptMode: function(value) {
            controls.sculptMode = !!value;
            controls.clearKeys();
        },

        /**
         * Advance keyboard navigation for one simulation step.
         *
         * @param {number} delta
         *   Elapsed seconds since the previous step.
         */
        update: function(delta) {
            if (!controls.enabled || (!controls.flightMode && !controls.sculptMode)) return;
            var distance = controls.movementSpeed * delta;
            forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0;
            if (forward.lengthSq() < 0.000001) forward.set(0, 0, -1);
            else forward.normalize();
            right.crossVectors(forward, up).normalize();

            if (keys.KeyW || keys.ArrowUp) camera.position.addScaledVector(forward, distance);
            if (keys.KeyS || keys.ArrowDown) camera.position.addScaledVector(forward, -distance);
            if (keys.KeyA || keys.ArrowLeft) camera.position.addScaledVector(right, -distance);
            if (keys.KeyD || keys.ArrowRight) camera.position.addScaledVector(right, distance);
            if (keys.KeyC || keys.KeyF) camera.position.y -= distance;
            if (keys.Space || keys.KeyR) camera.position.y += distance;
            if (keys.KeyQ) camera.rotation.y += controls.turnSpeed * delta;
            if (keys.KeyE) camera.rotation.y -= controls.turnSpeed * delta;
            if (keys.KeyZ) camera.rotation.x += controls.tiltSpeed * delta;
            if (keys.KeyX) camera.rotation.x -= controls.tiltSpeed * delta;
            camera.rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, camera.rotation.x));
        },
    };

    /**
     * Handle relative mouse movement while the pointer is captured.
     *
     * @param {MouseEvent} event
     *   Pointer-lock mouse event.
     */
    function onMouseMove(event) {
        if (!controls.enabled || !controls.flightMode || !pointerLocked) return;
        camera.rotation.y -= event.movementX * controls.lookSpeed;
        camera.rotation.x -= event.movementY * controls.lookSpeed;
        camera.rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, camera.rotation.x));
    }

    /**
     * Refresh local pointer-lock state after the browser changes ownership.
     */
    function onPointerLockChange() {
        pointerLocked = document.pointerLockElement === domElement;
        if (pointerLocked) pointerLockPending = false;
        if (document.body) document.body.classList.toggle('pointer-locked', pointerLocked);
        if (!pointerLocked && !pointerLockPending && controls.flightMode && controls.onPointerLockExit) {
            pointerLockBlocked = true;
            if (controls.onPointerLockAvailabilityChange) controls.onPointerLockAvailabilityChange(false);
            controls.onPointerLockExit();
        }
        controls.updateOverlay();
    }

    /**
     * Clear a rejected pointer-lock request without leaving flight mode
     * enabled as if the camera were still captured.
     */
    function onPointerLockError() {
        pointerLockPending = false;
        controls.updateOverlay();
    }

    document.addEventListener('mousemove', onMouseMove, {passive: true});
    document.addEventListener('pointerlockchange', onPointerLockChange, {passive: true});
    document.addEventListener('pointerlockerror', onPointerLockError, {passive: true});
    controls.updateOverlay();
    return controls;
}

/**
 * Copy a camera pose through its quaternion instead of copying Euler values.
 *
 * The orbit camera and flight camera use different Euler orders. Copying the
 * three visible rotation numbers would therefore change the orientation even
 * though both cameras use the same world-space position. The quaternion is
 * independent of that representation and keeps a mode switch visually still.
 *
 * @param {THREE.Camera} source
 *   Camera whose world-space pose should be copied.
 * @param {THREE.Camera} target
 *   Camera receiving the pose.
 */
function copyCameraPose(source, target) {
    target.position.copy(source.position);
    target.quaternion.copy(source.quaternion);
}

/**
 * Merge an optional URL camera state over a named camera start pose.
 *
 * @param {Object} startPose
 *   Named starting pose.
 * @param {Object|null} state
 *   URL camera state.
 * @param {string} rotationOrder
 *   Fallback Euler order for URLs created before `cameraRotationOrder` was
 *   added.
 * @return {Object}
 *   Pose containing the selected position and orientation/target.
 */
function getInitialPose(startPose, state, rotationOrder) {
    if (!state) return startPose;
    return {
        position: state.position || startPose.position,
        rotation: state.rotation || startPose.rotation,
        rotationOrder: state.rotationOrder || rotationOrder,
        target: state.rotation ? null : startPose.target,
    };
}

/**
 * Create the main and first-person cameras used by the demo.
 *
 * @param {Object} options
 *   Scene, renderer, selected camera start, optional URL camera state, and
 *   the fallback order for an older URL camera rotation.
 * @return {Object}
 *   Camera accessors, controls, and viewport operations. Camera state
 *   rotations include their Euler order for URL round-tripping.
 */
export function createCameraController(options) {
    var scene = options.scene,
        renderer = options.renderer,
        start = cameraStarts[normalizeCameraStart(options.start)] || cameraStarts.default,
        camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000),
        fpsCamera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000),
        useFPS = false,
        initialState = options.state || null,
        initialRotationOrder = options.rotationOrder || 'XYZ',
        mainPose = getInitialPose(start.main, initialState, initialRotationOrder),
        fpsPose = getInitialPose(start.fps, initialState, initialRotationOrder),
        flightModeInitialized = false,
        controls;

    scene.add(camera);
    scene.add(fpsCamera);
    fpsCamera.rotation.order = 'YXZ';
    applyCameraPose(camera, mainPose);
    applyCameraPose(fpsCamera, fpsPose);
    controls = createFlightControls(fpsCamera, renderer.domElement);

    /**
     * Change between orbit-style and pointer-lock flight presentation.
     *
     * @param {boolean} enabled
     *   True to use first-person controls.
     * @param {boolean} requestPointerLock
     *   True when a user-initiated Flight mode change should capture the
     *   pointer immediately.
     */
    function setFlightMode(enabled, requestPointerLock) {
        var wasFlightMode = useFPS;
        useFPS = !!enabled;
        controls.clearKeys();
        controls.flightMode = useFPS;
        if (useFPS) {
            controls.sculptMode = false;
            if (!flightModeInitialized) applyCameraPose(fpsCamera, fpsPose);
            else if (!wasFlightMode) copyCameraPose(camera, fpsCamera);
            controls.enabled = true;
            if (requestPointerLock) controls.lock();
        }
        else {
            if (wasFlightMode) copyCameraPose(fpsCamera, camera);
            controls.enabled = controls.sculptMode;
            controls.unlock();
        }
        flightModeInitialized = true;
        controls.updateOverlay();
        if (controls.onFlightModeChange) controls.onFlightModeChange(useFPS);
    }

    /**
     * Change to the keyboard-navigation camera for sculpt mode without
     * changing Flight mode or requesting pointer lock.
     *
     * @param {boolean} enabled
     *   Whether sculpt navigation should use the flight camera pose.
     */
    function setSculptMode(enabled) {
        var next = !!enabled;
        if (next === controls.sculptMode) return;
        if (next && !useFPS) copyCameraPose(camera, fpsCamera);
        controls.setSculptMode(next);
        if (!next && !useFPS) copyCameraPose(fpsCamera, camera);
    }

    controls.onPointerLockExit = function() {
        setFlightMode(false, false);
    };

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
     * Update keyboard and pointer-lock controls for one animation step.
     *
     * @param {number} delta
     *   Elapsed seconds since the previous simulation step.
     */
    function update(delta) {
        controls.update(delta);
    }

    /**
     * Return the active camera pose in a URL-friendly structure.
     *
     * @return {Object}
     *   Active camera position, Euler rotation, and Euler order.
     */
    function getActiveState() {
        var activeCamera = useFPS || controls.sculptMode ? fpsCamera : camera;
        return {
            position: activeCamera.position.toArray(),
            rotation: activeCamera.rotation.toArray().slice(0, 3),
            rotationOrder: activeCamera.rotation.order,
        };
    }

    return {
        camera: camera,
        fpsCamera: fpsCamera,
        controls: controls,
        getActiveCamera: function() { return useFPS || controls.sculptMode ? fpsCamera : camera; },
        getActiveState: getActiveState,
        isFlightMode: function() { return useFPS; },
        isNavigationMode: function() { return useFPS || controls.sculptMode; },
        resize: resize,
        setSculptMode: setSculptMode,
        setFlightMode: setFlightMode,
        update: update,
    };
}
