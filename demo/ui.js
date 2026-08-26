/**
 * Bind focus handling for the demo animation loop.
 *
 * @param {Object} options
 *   Animation callbacks and first-person controls.
 */
export function bindFocusHandling(options) {
    var blurred = false;
    window.addEventListener('focus', function() {
        if (blurred) {
            blurred = false;
            options.startAnimating();
            options.controls.enabled = true;
        }
    }, {passive: true});
    window.addEventListener('blur', function() {
        options.stopAnimating();
        blurred = true;
        options.controls.enabled = false;
    }, {passive: true});
}

/**
 * Bind the first-person freeze shortcut.
 *
 * @param {Object} options
 *   Camera controller state.
 */
export function bindKeyboardControls(options) {
    document.addEventListener('keyup', function(event) {
        if (event.key === 'q' && options.isFlightMode()) {
            options.controls.enabled = !options.controls.enabled;
        }
    }, {passive: true});
}

/**
 * Bind the browser resize event to the renderer and camera controller.
 *
 * @param {Object} options
 *   Renderer, camera controller, and draw callback.
 */
export function bindResizeHandling(options) {
    window.addEventListener('resize', function() {
        options.renderer.setSize(window.innerWidth, window.innerHeight);
        options.camera.resize();
        options.draw();
    }, {passive: true});
}

/**
 * Create a compact frame-rate display for the demo.
 *
 * The counter averages frames over a half-second window. This avoids making
 * the label flicker while still showing changes caused by terrain density,
 * decoration, or camera movement quickly enough to be useful during demos.
 *
 * @param {HTMLElement|null} element
 *   Element whose text should contain the current frame rate.
 * @return {Object}
 *   Object with an `update` method to call once per rendered frame.
 */
export function createFPSCounter(element) {
    var frameCount = 0,
        lastTime = performance.now();
    return {
        /**
         * Update the displayed average when the current sample window ends.
         */
        update: function() {
            if (!element) return;
            frameCount++;
            var now = performance.now(),
                elapsed = now - lastTime;
            if (elapsed < 500) return;
            var fps = frameCount * 1000 / elapsed;
            element.textContent = 'FPS: ' + (fps < 10 ? fps.toFixed(1) : Math.round(fps));
            frameCount = 0;
            lastTime = now;
        },
    };
}
