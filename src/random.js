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

/**
 * Create an unsigned 32-bit seed from a cryptographically random source.
 *
 * The fallback exists for environments without `crypto.getRandomValues` and
 * is deliberately passed in by the caller. This keeps the library from
 * replacing or mutating the process-wide `Math.random` function.
 *
 * @param {Function} [fallbackRandom=Math.random]
 *   Function returning values in the half-open range [0, 1).
 * @return {number}
 *   An unsigned 32-bit seed.
 */
function createRandomSeed(fallbackRandom) {
    var random = typeof fallbackRandom === 'function' ? fallbackRandom : Math.random,
        cryptoSource = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (cryptoSource && typeof cryptoSource.getRandomValues === 'function') {
        var value = new Uint32Array(1);
        cryptoSource.getRandomValues(value);
        return value[0];
    }
    return Math.floor(random() * 4294967296) >>> 0;
}

/**
 * Create a deterministic pseudo-random number stream.
 *
 * Xorshift32 uses only integer bit operations, so the same unsigned seed
 * produces the same sequence in browsers and in Node without changing the
 * global random source. A non-zero fallback state avoids the generator's
 * all-zero fixed point.
 *
 * @param {number} seed
 *   Unsigned 32-bit initial state.
 * @return {Function}
 *   Function returning values in the half-open range [0, 1).
 */
function createSeededRandom(seed) {
    var state = seed >>> 0;
    if (!state) state = 0x6d2b79f5;
    return function() {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
    };
}

export { createRandomSeed, createSeededRandom, getRandom };
