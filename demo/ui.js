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
