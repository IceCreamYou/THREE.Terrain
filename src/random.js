/**
 * Return the random-number source supplied for a terrain operation.
 *
 * Library operations use the native source by default, while applications
 * that need reproducible output can pass a function through `options.random`.
 * Keeping the source in the options object avoids changing the process-wide
 * `Math.random` function.
 *
 * @param {Object} [options]
 *   Operation options that may contain a `random` function.
 * @return {Function}
 *   A function that returns a uniformly distributed value from 0 to 1.
 */
function getRandom(options) {
    return options && typeof options.random === 'function' ? options.random : Math.random;
}

export { getRandom };
