/**
 * Bind focus handling for the demo animation loop.
 *
 * @param {Object} options
 *   Animation callbacks and first-person controls.
 */
export function bindFocusHandling(options) {
    var unfocused = false;

    /**
     * Pause rendering and release transient input state.
     */
    function pause() {
        if (unfocused) return;
        unfocused = true;
        options.stopAnimating();
        options.controls.enabled = false;
        if (options.controls.clearKeys) options.controls.clearKeys();
        if (options.controls.updateOverlay) options.controls.updateOverlay();
    }

    /**
     * Resume rendering after the page becomes the focused visible document.
     */
    function resume() {
        if (!unfocused || document.hidden) return;
        unfocused = false;
        options.startAnimating();
        options.controls.enabled = true;
        if (options.controls.updateOverlay) options.controls.updateOverlay();
    }

    window.addEventListener('focus', resume, {passive: true});
    window.addEventListener('blur', pause, {passive: true});
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) pause();
        else if (document.hasFocus()) resume();
    }, {passive: true});
}

/**
 * Bind keyboard movement for flight and sculpt navigation controls.
 *
 * @param {Object} options
 *   Camera controller state and navigation-mode predicate.
 */
export function bindKeyboardControls(options) {
    var isNavigationMode = typeof options.isNavigationMode === 'function' ?
        options.isNavigationMode : options.isFlightMode;
    document.addEventListener('keydown', function(event) {
        if (typeof isNavigationMode !== 'function' || !isNavigationMode() || !options.controls.handleKeyDown) return;
        if (options.controls.handleKeyDown(event)) event.preventDefault();
    }, {passive: false});
    document.addEventListener('keyup', function(event) {
        if (typeof isNavigationMode !== 'function' || !isNavigationMode() || !options.controls.handleKeyUp) return;
        if (options.controls.handleKeyUp(event)) event.preventDefault();
    }, {passive: false});
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
 * The counter samples complete one-second intervals and applies the same
 * exponentially weighted smoothing as MainLoop.js. This keeps the label from
 * flickering while still reflecting changes caused by terrain density,
 * decoration, or camera movement.
 *
 * @param {HTMLElement|null} element
 *   Element whose text should contain the current frame rate.
 * @return {Object}
 *   Object with an `update` method to call once per rendered frame.
 */
export function createFPSCounter(element) {
    var framesThisSecond = 0,
        lastFpsUpdate = performance.now(),
        fps = 0;
    return {
        /**
         * Reset the sample window before rendering resumes.
         */
        reset: function() {
            framesThisSecond = 0;
            lastFpsUpdate = performance.now();
        },

        /**
         * Update the displayed FPS using the MainLoop.js smoothing formula.
         *
         * @param {number|undefined} frameTime
         *   Browser animation timestamp, or the current performance time when
         *   called outside requestAnimationFrame.
         */
        update: function(frameTime) {
            if (!element) return;
            var now = typeof frameTime === 'number' ? frameTime : performance.now();
            framesThisSecond++;
            if (now - lastFpsUpdate < 1000) return;
            fps = 0.25 * (framesThisSecond / Math.floor((now - lastFpsUpdate) / 1000)) + 0.75 * fps;
            element.textContent = 'FPS: ' + (fps < 10 ? fps.toFixed(1) : Math.round(fps));
            framesThisSecond = 0;
            lastFpsUpdate = now;
        },
    };
}
