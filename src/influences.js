/**
 *
 Support an "influence" function which takes a location, radius, and a function that takes coordinates [0, 1]
 and returns a scaled height; and apply that feature to the terrain at the specified location,
 with intensity increasing as the radius decreases (similar to the edge filter).
 Support add, subtract, replace; falloff
 */

THREE.Terrain.Influences = {
    // http://www.wolframalpha.com/input/?i=1.25*min%280.8%2C+2e^-%28x^2%2By^2%29%29
    // Inverse: hole
    Mesa: function(x, y) {
        return 1.25 * Math.min(0.8, 2 * Math.exp(-(x*x + y*y)));
    },
    // http://www.wolframalpha.com/input/?i=e^%28-%28%281x%29^2+%2B+%281y%29^2%29%29
    // Inverse: valley/basin
    Hill: function(x, y) {
        return Math.exp(-(x*x + y*y));
    },
    Flat: function(x, y) {
        return 0;
    },
    // river/canyon, volcano, peak
};

/**
 * Place a geographic feature on the terrain.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Function} f
 *   A function describing the feature. The function should accept two
 *   parameters, `x` and `y`, representing coordinates on those axes. The
 *   coordinates are expressed as numbers between -1 and 1 inclusive, where
 *   (0, 0) is the origin location of the feature to be placed. The function
 *   should return a number between -1 and 1 representing the height of the
 *   feature at the given coordinate. `THREE.Terrain.Influences` contains some
 *   useful functions for this purpose.
 * @param {Number} [x=0.5]
 *   How far across the terrain the feature should be placed on the X-axis, in
 *   percent (as a decimal) of the size of the terrain on that axis.
 * @param {Number} [y=0.5]
 *   How far across the terrain the feature should be placed on the Y-axis, in
 *   percent (as a decimal) of the size of the terrain on that axis.
 * @param {Number} [r=64]
 *   The radius of the feature.
 * @param {Number} [h=64]
 *   The height of the feature.
 * @param {String} [t]
 *   Determines how to layer the feature on top of the existing terrain. Valid
 *   values include `THREE.AdditiveBlending`, `THREE.SubtractiveBlending`,
 *   `THREE.MultiplyBlending`, `THREE.NoBlending`, and any function that takes
 *   the terrain's current height and the feature's displacement at a vertex
 *   and returns the new height for that vertex.
 * @param {Number/Function} [e=THREE.Terrain.Linear]
 *   A function that determines the "falloff" of the feature, i.e. how quickly
 *   the terrain will get close to its height before the feature was applied as
 *   the distance increases from the feature's location. It does this by
 *   interpolating the height of each vertex along a curve. Valid values
 *   include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 and returns a float between 0 and 1.
 */
THREE.Terrain.Influence = function(g, options, f, x, y, r, h, t, e) {
    f = f || THREE.Terrain.Influences.Hill;
    x = typeof x === 'undefined' ? 0.5 : x;
    y = typeof y === 'undefined' ? 0.5 : y;
    r = typeof r === 'undefined' ? 64  : r;
    h = typeof h === 'undefined' ? 64  : h;
    t = typeof t === 'undefined' ? THREE.AdditiveBlending : t;
    e = e || THREE.Terrain.Linear;
    // Find the vertex location of the feature origin
    var xl = options.xSegments + 1,
        yl = options.ySegments + 1,
        vx = xl * x,
        vy = yl * y,
        rx = r / (options.xSize / options.xSegments),
        ry = r / (options.ySize / options.ySegments),
        xs = Math.ceil(vx - rx),
        xe = Math.floor(vx + rx),
        yx = Math.ceil(vy - ry),
        ye = Math.floor(vy + ry),
        r1 = 1 / r;
    // Walk over the vertices within radius of origin
    for (var i = xs; i < xe; i++) {
        for (var j = ys; j < ye; j++) {
            var k = j * xl + i,
                // The feature coordinates [-1, 1]
                xf = (i - vx) * r1,
                yf = (j - vy) * r1,
                // Get the displacement according to f, interpolate using e,
                // multiply it by h, then blend according to t.
                d = e(f(xf, yf)) * h;
            if      (t === THREE.AdditiveBlending)    g[k] += d;
            else if (t === THREE.SubtractiveBlending) g[k] -= d;
            else if (t === THREE.MultiplyBlending)    g[k] *= d;
            else if (t === THREE.NoBlending)          g[k]  = d;
            else if (typeof t === 'function')         g[k]  = t(g[k], d);
        }
    }
};
