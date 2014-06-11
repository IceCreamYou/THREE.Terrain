/**
 * A utility for generating heightmap functions by additive composition.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} [options]
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Object[]} passes
 *   Determines which heightmap functions to compose to create a new one.
 *   Consists of an array of objects with the following properties:
 *   - `method`: Contains something that will be passed around as an
 *     `options.heightmap` (a heightmap-generating function or a heightmap image)
 *   - `amplitude`: A multiplier for the heightmap of the pass. Applied before
 *     the result of the pass is added to the result of previous passes.
 *   - `frequency`: For terrain generation methods that support it (Perlin,
 *     Simplex, and Worley) the octave of randomness. This basically controls
 *     how big features of the terrain will be (higher frequencies result in
 *     smaller features). Often running multiple generation functions with
 *     different frequencies and amplitudes results in nice detail.
 */
THREE.Terrain.MultiPass = function(g, options, passes) {
    var clonedOptions = {};
    for (var opt in options) {
        if (options.hasOwnProperty(opt)) {
            clonedOptions[opt] = options[opt];
        }
    }
    var range = options.maxHeight - options.minHeight;
    for (var i = 0, l = passes.length; i < l; i++) {
        var amp = typeof passes[i].amplitude === 'undefined' ? 1 : passes[i].amplitude,
            move = 0.5 * (range - range * amp);
        clonedOptions.maxHeight = options.maxHeight - move;
        clonedOptions.minHeight = options.minHeight + move;
        clonedOptions.frequency = typeof passes[i].frequency === 'undefined' ? options.frequency : passes[i].frequency;
        passes[i].method(g, clonedOptions);
    }
};

/**
 * Generate random terrain using the Diamond-Square method.
 *
 * Based on https://github.com/srchea/Terrain-Generation/blob/master/js/classes/TerrainGeneration.js
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 */
THREE.Terrain.DiamondSquare = function(g, options) {
    // Set the segment length to the smallest power of 2 that is greater than
    // the number of vertices in either dimension of the plane
    var segments = Math.max(options.xSegments, options.ySegments) + 1, n;
    for (n = 1; Math.pow(2, n) < segments; n++) {}
    segments = Math.pow(2, n);

    // Initialize heightmap
    var size = segments + 1,
        heightmap = [],
        smoothing = (options.maxHeight - options.minHeight),
        i,
        j,
        xl = options.xSegments + 1,
        yl = options.ySegments + 1;
    for (i = 0; i <= segments; i++) {
        heightmap[i] = new Float32Array(segments+1);
    }

    // Generate heightmap
    for (var l = segments; l >= 2; l /= 2) {
        var half = Math.round(l*0.5), whole = Math.round(l), x, y, avg, d, e;
        smoothing /= 2;
        // square
        for (x = 0; x < segments; x += whole) {
            for (y = 0; y < segments; y += whole) {
                d = Math.random() * smoothing * 2 - smoothing;
                avg = heightmap[x][y] +    // top left
                      heightmap[x+whole][y] +  // top right
                      heightmap[x][y+whole] +  // bottom left
                      heightmap[x+whole][y+whole]; // bottom right
                avg *= 0.25;
                heightmap[x+half][y+half] = avg + d;
            }
        }
        // diamond
        for (x = 0; x < segments; x += half) {
            for (y = (x+half) % l; y < segments; y += l) {
                d = Math.random() * smoothing * 2 - smoothing;
                avg = heightmap[(x-half+size)%size][y] + // middle left
                      heightmap[(x+half)%size][y] +      // middle right
                      heightmap[x][(y+half)%size] +      // middle top
                      heightmap[x][(y-half+size)%size];  // middle bottom
                avg *= 0.25;
                avg += d;
                heightmap[x][y] = avg;
                // top and right edges
                if (x === 0) heightmap[segments][y] = avg;
                if (y === 0) heightmap[x][segments] = avg;
            }
        }
    }

    // Apply heightmap
    for (i = 0; i < xl; i++) {
        for (j = 0; j < yl; j++) {
            g[j * xl + i].z += heightmap[i][j];
        }
    }
};

/**
 * Generate random terrain using the Perlin Noise method.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.Perlin = function(g, options) {
    noise.seed(Math.random());
    var range = (options.maxHeight - options.minHeight) * 0.5,
        divisor = (Math.min(options.xSegments, options.ySegments) + 1) / options.frequency;
    for (var i = 0, xl = options.xSegments + 1; i < xl; i++) {
        for (var j = 0, yl = options.ySegments + 1; j < yl; j++) {
            g[j * xl + i].z += noise.perlin(i / divisor, j / divisor) * range;
        }
    }
};

/**
 * Generate random terrain using the Perlin and Diamond-Square methods composed.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.PerlinDiamond = function(g, options) {
    THREE.Terrain.MultiPass(g, options, [
        { method: THREE.Terrain.Perlin },
        { method: THREE.Terrain.DiamondSquare, amplitude: 0.75 },
        { method: function(g, o) { return THREE.Terrain.Smooth(g, o, 1); } },
    ]);
};

/**
 * Generate random terrain using layers of Perlin noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.PerlinLayers = function(g, options) {
    THREE.Terrain.MultiPass(g, options, [
        { method: THREE.Terrain.Perlin,                  frequency:  1.25 },
        { method: THREE.Terrain.Perlin, amplitude: 0.05, frequency:  2.5  },
        { method: THREE.Terrain.Perlin, amplitude: 0.35, frequency:  5    },
        { method: THREE.Terrain.Perlin, amplitude: 0.15, frequency: 10    },
    ]);
};

/**
 * Generate random terrain using the Simplex Noise method.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 *
 * See https://github.com/mrdoob/three.js/blob/master/examples/webgl_terrain_dynamic.html
 * for an interesting comparison where the generation happens in GLSL.
 */
THREE.Terrain.Simplex = function(g, options) {
    noise.seed(Math.random());
    var range = (options.maxHeight - options.minHeight) * 0.5,
        divisor = (Math.min(options.xSegments, options.ySegments) + 1) * 2 / options.frequency;
    for (var i = 0, xl = options.xSegments + 1; i < xl; i++) {
        for (var j = 0, yl = options.ySegments + 1; j < yl; j++) {
            g[j * xl + i].z += noise.simplex(i / divisor, j / divisor) * range;
        }
    }
};

/**
 * Generate random terrain using layers of Simplex noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.SimplexLayers = function(g, options) {
    THREE.Terrain.MultiPass(g, options, [
        { method: THREE.Terrain.Simplex,                    frequency:  1.25 },
        { method: THREE.Terrain.Simplex, amplitude: 0.5,    frequency:  2.5  },
        { method: THREE.Terrain.Simplex, amplitude: 0.25,   frequency:  5    },
        { method: THREE.Terrain.Simplex, amplitude: 0.125,  frequency: 10    },
        { method: THREE.Terrain.Simplex, amplitude: 0.0625, frequency: 20    },
    ]);
};

(function() {
    /**
     * Generate a heightmap using white noise.
     *
     * @param {THREE.Vector3[]} g The terrain vertices.
     * @param {Object} options Settings
     * @param {Number} scale The resolution of the resulting heightmap.
     * @param {Number} segments The width of the target heightmap.
     * @param {Number} range The altitude of the noise.
     * @param {Number[]} data The target heightmap.
     */
    function WhiteNoise(g, options, scale, segments, range, data) {
        if (scale > segments) return;
        var i = 0,
            j = 0,
            xl = segments,
            yl = segments,
            inc = Math.floor(segments / scale),
            lastX = -inc,
            lastY = -inc;
        // Walk over the target. For a target of size W and a resolution of N,
        // set every W/N points (in both directions).
        for (i = 0; i <= xl; i += inc) {
            for (j = 0; j <= yl; j += inc) {
                var k = j * xl + i;
                data[k] = Math.random() * range;
                if (lastX < 0 && lastY < 0) continue;
                /* c b *
                 * l t */
                var t = data[k],
                    l = data[ j      * xl + (i-inc)] || t, // left
                    b = data[(j-inc) * xl +  i     ] || t, // bottom
                    c = data[(j-inc) * xl + (i-inc)] || t; // corner
                // Interpolate between adjacent points to set the height of
                // higher-resolution target data.
                for (var x = lastX; x < i; x++) {
                    for (var y = lastY; y < j; y++) {
                        if (x === lastX && y === lastY) continue;
                        var z = y * xl + x;
                        if (z < 0) continue;
                        var px = ((x-lastX) / inc),
                            py = ((y-lastY) / inc),
                            r1 = px * b + (1-px) * c,
                            r2 = px * t + (1-px) * l;
                        data[z] = py * r2 + (1-py) * r1;
                    }
                }
                lastY = j;
            }
            lastX = i;
            lastY = -inc;
        }
        // Assign the temporary data back to the actual terrain heightmap.
        for (i = 0, xl = options.xSegments + 1; i < xl; i++) {
            for (j = 0, yl = options.ySegments + 1; j < yl; j++) {
                // http://stackoverflow.com/q/23708306/843621
                var kg = j * xl + i,
                    kd = j * segments + i;
                g[kg].z += data[kd];
            }
        }
    }

    /**
     * Generate random terrain using value noise.
     *
     * The basic approach of value noise is to generate white noise at a
     * smaller octave than the target and then interpolate to get a higher-
     * resolution result. This is then repeated at different resolutions.
     *
     * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
     */
    THREE.Terrain.Value = function(g, options) {
        // Set the segment length to the smallest power of 2 that is greater
        // than the number of vertices in either dimension of the plane
        var segments = Math.max(options.xSegments, options.ySegments) + 1, n;
        for (n = 1; Math.pow(2, n) < segments; n++) {}
        segments = Math.pow(2, n);

        // Store the array of white noise outside of the WhiteNoise function to
        // avoid allocating a bunch of unnecessary arrays; we can just
        // overwrite old data each time WhiteNoise() is called.
        var data = new Float32Array((segments+1)*(segments+1));

        // Layer white noise at different resolutions.
        var range = options.maxHeight - options.minHeight;
        for (var i = 2; i < 7; i++) {
            WhiteNoise(g, options, Math.pow(2, i), segments, range * Math.pow(2, 2.4-i*1.2), data);
        }

        // White noise creates some weird artifacts; fix them.
        THREE.Terrain.Smooth(g, options);
        THREE.Terrain.Clamp(g, {
            maxHeight: options.maxHeight,
            minHeight: options.minHeight,
            stretch: true,
        });
    };
})();

/**
 * Generate random terrain using Weierstrass functions.
 *
 * Weierstrass functions are known for being continuous but not differentiable
 * anywhere. This produces some nice shapes that look terrain-like, but can
 * look repetitive from above.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.Weierstrass = function(g, options) {
    var range = (options.maxHeight - options.minHeight) * 0.5,
        dir1 = Math.random() < 0.5 ? 1 : -1,
        dir2 = Math.random() < 0.5 ? 1 : -1,
        r11  =  0.5   + Math.random() * 1.0,
        r12  =  0.5   + Math.random() * 1.0,
        r13  =  0.025 + Math.random() * 0.10,
        r14  = -1.0   + Math.random() * 2.0,
        r21  =  0.5   + Math.random() * 1.0,
        r22  =  0.5   + Math.random() * 1.0,
        r23  =  0.025 + Math.random() * 0.10,
        r24  = -1.0   + Math.random() * 2.0;
    for (var i = 0, xl = options.xSegments + 1; i < xl; i++) {
        for (var j = 0, yl = options.ySegments + 1; j < yl; j++) {
            var sum = 0;
            for (var k = 0; k < 20; k++) {
                var x = Math.pow(1+r11, -k) * Math.sin(Math.pow(1+r12, k) * (i + 0.25*Math.cos(j) + r14*j) * r13);
                var y = Math.pow(1+r21, -k) * Math.sin(Math.pow(1+r22, k) * (j + 0.25*Math.cos(i) + r24*i) * r23);
                sum -= Math.exp(dir1*x*x + dir2*y*y);
            }
            g[j * xl + i].z += sum * range;
        }
    }
    THREE.Terrain.Clamp(g, options);
};
