import * as THREE from 'three';

var FEATHERING_FUNCTIONS = {
        Linear: 0,
        EaseIn: 1,
        EaseOut: 2,
        EaseInOut: 3,
        InEaseOut: 4,
        EaseInWeak: 5,
        EaseInStrong: 6,
    },
    BRUSH_SEGMENTS = 96,
    BRUSH_SURFACE_OFFSET = 1.5;

/**
 * Create the projected brush used by sculpt mode.
 *
 * The terrain is a local XY plane with Z as elevation. Keeping the brush in
 * that same coordinate system lets it inherit the terrain's presentation
 * rotation while the brush surface follows the edited height field.
 *
 * @return {THREE.Mesh}
 *   Transparent brush mesh with shader-controlled falloff.
 */
function createBrushMesh() {
    var geometry = new THREE.CircleGeometry(1, BRUSH_SEGMENTS),
        material = new THREE.ShaderMaterial({
            uniforms: {
                uFeathering: {value: FEATHERING_FUNCTIONS.EaseInOut},
                uHardness: {value: 0.5},
                uTerrainHalfSize: {value: new THREE.Vector2(512, 512)},
            },
            vertexShader: [
                'varying vec2 vBrushUv;',
                'varying vec2 vTerrainPosition;',
                'void main() {',
                '    vBrushUv = uv;',
                '    vTerrainPosition = position.xy;',
                '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}',
            ].join('\n'),
            fragmentShader: [
                'uniform int uFeathering;',
                'uniform float uHardness;',
                'uniform vec2 uTerrainHalfSize;',
                'varying vec2 vBrushUv;',
                'varying vec2 vTerrainPosition;',
                '',
                'float feather(float value) {',
                '    if (uFeathering == 1) return value * value;',
                '    if (uFeathering == 2) return -value * (value - 2.0);',
                '    if (uFeathering == 3) return value * value * (3.0 - 2.0 * value);',
                '    if (uFeathering == 4) {',
                '        float centered = 2.0 * value - 1.0;',
                '        return 0.5 * centered * centered * centered + 0.5;',
                '    }',
                '    if (uFeathering == 5) return pow(value, 1.55);',
                '    if (uFeathering == 6) return pow(value, 7.0);',
                '    return value;',
                '}',
                '',
                'void main() {',
                '    if (abs(vTerrainPosition.x) > uTerrainHalfSize.x ||',
                '        abs(vTerrainPosition.y) > uTerrainHalfSize.y) discard;',
                '    float radial = clamp(distance(vBrushUv, vec2(0.5)) * 2.0, 0.0, 1.0);',
                '    float hardness = clamp(uHardness, 0.0, 1.0);',
                '    float featherPosition = clamp((1.0 - radial) / max(0.001, 1.0 - hardness), 0.0, 1.0);',
                '    float fill = radial <= hardness ? 1.0 : feather(featherPosition);',
                '    float border = smoothstep(0.965, 0.995, radial);',
                '    vec3 yellow = vec3(1.0, 0.78, 0.08);',
                '    float fillAlpha = mix(0.035, 0.58, fill);',
                '    float alpha = mix(fillAlpha, 0.86, border);',
                '    gl_FragColor = vec4(yellow, alpha);',
                '}',
            ].join('\n'),
            transparent: true,
            // This is a cursor guide, not terrain geometry. Keep it legible
            // across steep faces where the sparse brush fan can otherwise
            // dip below a neighboring terrain triangle.
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
        }),
        mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    mesh.name = 'Sculpt brush';
    return mesh;
}

/**
 * Create pointer-driven terrain sculpting controls.
 *
 * @param {Object} options
 *   Renderer canvas, scene, camera controller, landscape, settings, and an
 *   optional callback for the end of a sculpt gesture.
 * @return {Object}
 *   Sculpt mode controller.
 */
export function createSculptController(options) {
    var canvas = options.canvas,
        scene = options.scene,
        camera = options.camera,
        landscape = options.landscape,
        settings = options.settings,
        onGestureEnd = options.onGestureEnd,
        raycaster = new THREE.Raycaster(),
        pointer = {x: 0, y: 0, inside: false},
        pointerHit = null,
        brushMesh = createBrushMesh(),
        brushParent = null,
        baseBrushPositions = new Float32Array(brushMesh.geometry.attributes.position.array),
        enabled = false,
        gestureActive = false,
        gesturePointerId = null,
        gestureDirection = 0,
        statusOverlay = document.getElementById('sculptcontrols');

    /**
     * Return whether the pointer is inside the renderer viewport.
     *
     * @param {PointerEvent} event
     *   Pointer event with client coordinates.
     * @return {boolean}
     *   True when the pointer can be projected into the renderer canvas.
     */
    function isInsideCanvas(event) {
        var bounds = canvas.getBoundingClientRect();
        return event.clientX >= bounds.left && event.clientX <= bounds.right &&
            event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    }

    /**
     * Keep the brush in the terrain mesh's local coordinate space after
     * regeneration. This makes its projected center use the same transform
     * as the raycast hit and the sculpt operation.
     */
    function syncBrushParent() {
        var terrainMesh = landscape.getTerrainMesh();
        if (terrainMesh === brushParent) return;
        if (brushMesh.parent) brushMesh.parent.remove(brushMesh);
        brushParent = terrainMesh;
        if (brushParent) brushParent.add(brushMesh);
    }

    /**
     * Update the raycast hit from the most recent pointer position.
     */
    function updatePointerHit() {
        pointerHit = null;
        if (!enabled || !pointer.inside) return;
        var terrainMesh = landscape.getTerrainMesh();
        if (!terrainMesh) return;
        scene.updateMatrixWorld(true);
        var bounds = canvas.getBoundingClientRect(),
            normalizedPointer = new THREE.Vector2(
                ((pointer.x - bounds.left) / bounds.width) * 2 - 1,
                -((pointer.y - bounds.top) / bounds.height) * 2 + 1
            ),
            intersections;
        raycaster.setFromCamera(normalizedPointer, camera.getActiveCamera());
        intersections = raycaster.intersectObject(terrainMesh, false);
        if (!intersections.length) return;
        var localPoint = intersections[0].point.clone();
        terrainMesh.worldToLocal(localPoint);
        pointerHit = localPoint;
    }

    /**
     * Update the brush mesh position and falloff uniforms.
     */
    function updateBrush() {
        syncBrushParent();
        if (!enabled || !pointerHit || !brushParent) {
            brushMesh.visible = false;
            return;
        }
        var terrainOptions = landscape.getLastOptions(),
            radius = Math.max(0.001, Number(settings.sculptBrushRadius) || 0),
            hardness = Math.max(0, Math.min(100, Number(settings.sculptHardness) || 0)) * 0.01,
            positions = brushMesh.geometry.attributes.position.array,
            material = brushMesh.material,
            terrainHalfX = (terrainOptions && terrainOptions.xSize ? terrainOptions.xSize : 1024) * 0.5,
            terrainHalfY = (terrainOptions && terrainOptions.ySize ? terrainOptions.ySize : 1024) * 0.5;
        for (var index = 0; index < positions.length; index += 3) {
            var x = pointerHit.x + baseBrushPositions[index] * radius,
                y = pointerHit.y + baseBrushPositions[index + 1] * radius;
            positions[index] = x;
            positions[index + 1] = y;
            positions[index + 2] = landscape.getTerrainHeight(x, y) + BRUSH_SURFACE_OFFSET;
        }
        brushMesh.geometry.attributes.position.needsUpdate = true;
        brushMesh.geometry.computeBoundingSphere();
        material.uniforms.uHardness.value = hardness;
        material.uniforms.uFeathering.value = FEATHERING_FUNCTIONS[settings.sculptFeathering] || 0;
        material.uniforms.uTerrainHalfSize.value.set(terrainHalfX, terrainHalfY);
        brushMesh.visible = true;
    }

    /**
     * Update the compact sculpting hint in the lower center of the viewport.
     */
    function updateStatusOverlay() {
        if (!statusOverlay) return;
        statusOverlay.className = enabled ? 'visible' : '';
        statusOverlay.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    }

    /**
     * Record the current pointer position and refresh the terrain hit.
     *
     * @param {PointerEvent} event
     *   Pointer event to record.
     * @param {boolean} allowOutside
     *   Keep receiving events while an active gesture is outside the canvas.
     */
    function updatePointer(event, allowOutside) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.inside = isInsideCanvas(event);
        if (!pointer.inside && !allowOutside) pointerHit = null;
        updatePointerHit();
        updateBrush();
    }

    /**
     * Finish a pointer gesture and rebuild decorations once.
     */
    function finishGesture() {
        if (!gestureActive) return;
        var pointerId = gesturePointerId;
        gestureActive = false;
        gesturePointerId = null;
        gestureDirection = 0;
        if (canvas.releasePointerCapture && canvas.hasPointerCapture &&
            canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
        if (onGestureEnd) onGestureEnd();
    }

    /**
     * Handle a pointer press over the renderer.
     *
     * @param {PointerEvent} event
     *   Pointer press.
     */
    function onPointerDown(event) {
        if (!enabled || (event.button !== 0 && event.button !== 2)) return;
        updatePointer(event, false);
        if (!pointerHit) return;
        event.preventDefault();
        gestureActive = true;
        gesturePointerId = event.pointerId;
        gestureDirection = event.button === 0 ? 1 : -1;
        if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    }

    /**
     * Track hover and active-stroke movement at the document level so a drag
     * continues when the pointer leaves the canvas edge.
     *
     * @param {PointerEvent} event
     *   Pointer movement.
     */
    function onPointerMove(event) {
        if (!enabled) return;
        if (!gestureActive && event.target !== canvas) {
            pointerHit = null;
            pointer.inside = false;
            updateBrush();
            return;
        }
        if (gestureActive && event.pointerId !== gesturePointerId) return;
        updatePointer(event, gestureActive);
    }

    /**
     * Finish the active gesture on mouse or pointer release.
     *
     * @param {PointerEvent} event
     *   Pointer release.
     */
    function onPointerUp(event) {
        if (!gestureActive || event.pointerId !== gesturePointerId) return;
        updatePointer(event, true);
        finishGesture();
    }

    /**
     * Prevent the browser context menu while right-click sculpting is active.
     *
     * @param {MouseEvent} event
     *   Context-menu event.
     */
    function onContextMenu(event) {
        if (!enabled) return;
        event.preventDefault();
    }

    /**
     * Release a gesture when the page loses focus before mouseup arrives.
     */
    function onWindowBlur() {
        finishGesture();
        pointerHit = null;
        updateBrush();
    }

    /**
     * Apply one time-based sculpting step and refresh the brush projection.
     *
     * @param {number} delta
     *   Seconds since the previous rendered frame.
     */
    function update(delta) {
        if (!enabled) return;
        updatePointerHit();
        if (gestureActive && pointerHit) {
            var strength = Math.max(0, Number(settings.sculptStrength) || 0);
            landscape.sculpt(
                pointerHit,
                Number(settings.sculptBrushRadius) || 0,
                Number(settings.sculptBrushRadius) *
                    Math.max(0, Math.min(100, Number(settings.sculptHardness) || 0)) * 0.01,
                settings.sculptFeathering,
                gestureDirection * strength * Math.max(0, delta || 0)
            );
        }
        updateBrush();
    }

    canvas.addEventListener('pointerdown', onPointerDown, {passive: false});
    document.addEventListener('pointermove', onPointerMove, {passive: false});
    document.addEventListener('pointerup', onPointerUp, {passive: false});
    document.addEventListener('pointercancel', onPointerUp, {passive: false});
    canvas.addEventListener('contextmenu', onContextMenu, {passive: false});
    window.addEventListener('blur', onWindowBlur, {passive: true});

    var controller = {
        /**
         * Enable or disable sculpt mode.
         *
         * @param {boolean} value
         *   Whether sculpt mode should be active.
         */
        setEnabled: function(value) {
            var next = !!value;
            if (enabled === next) {
                updateStatusOverlay();
                return;
            }
            if (!next) finishGesture();
            enabled = next;
            if (camera && camera.setSculptMode) camera.setSculptMode(enabled);
            if (document.body) document.body.classList.toggle('sculpt-mode', enabled);
            if (!enabled) {
                pointerHit = null;
                brushMesh.visible = false;
            }
            updateStatusOverlay();
            if (enabled) {
                syncBrushParent();
                updatePointerHit();
                updateBrush();
            }
        },

        /**
         * Return whether sculpt mode is active.
         *
         * @return {boolean}
         *   True when sculpt mode is enabled.
         */
        isEnabled: function() {
            return enabled;
        },

        /**
         * Update sculpting and brush state for one rendered frame.
         *
         * @param {number} delta
         *   Seconds since the previous rendered frame.
         */
        update: update,
    };

    controller.setEnabled(!!settings.sculptMode);
    return controller;
}
