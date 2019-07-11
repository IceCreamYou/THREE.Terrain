import {
    AdditiveBlending,
    Blending,
    MultiplyBlending,
    NoBlending,
    NormalBlending,
    SubtractiveBlending,
    Vector3,
} from 'three';

import { TerrainOptions, FeatureFunction, BlendingFunction, FalloffFunction } from './basicTypes';
import { EaseIn } from './core';

// Allows placing geometrically-described features on a terrain.
// If you want these features to look a little less regular,
// just apply them before a procedural pass.
// If you want more complex influence, you can just composite heightmaps.

/**
 * Equations describing geographic features.
 */
export const Influences = {
    Mesa: function (x: number) {
        return 1.25 * Math.min(0.8, Math.exp(-(x * x)));
    },
    Hole: function (x: number) {
        return -Influences.Mesa(x);
    },
    Hill: function (x: number) {
        // Same curve as EaseInOut, but mirrored and translated.
        return x < 0 ? (x + 1) * (x + 1) * (3 - 2 * (x + 1)) : 1 - x * x * (3 - 2 * x);
    },
    Valley: function (x: number) {
        return -Influences.Hill(x);
    },
    Dome: function (x: number) {
        // Parabola
        return -(x + 1) * (x - 1);
    },
    // Not meaningful in Additive or Subtractive mode
    Flat: function (x: number) {
        return 0;
    },
    Volcano: function (x: number) {
        return 0.94 - 0.32 * (Math.abs(2 * x) + Math.cos(2 * Math.PI * Math.abs(x) + 0.4));
    },
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
 *   A function describing the feature. The function should accept one
 *   parameter representing the distance from the feature's origin expressed as
 *   a number between -1 and 1 inclusive. Optionally it can accept a second and
 *   third parameter, which are the x- and y- distances from the feature's
 *   origin, respectively. It should return a number between -1 and 1
 *   representing the height of the feature at the given coordinate.
 *   `THREE.Terrain.Influences` contains some useful functions for this
 *   purpose.
 * @param {Number} [x=0.5]
 *   How far across the terrain the feature should be placed on the X-axis, in
 *   PERCENT (as a decimal) of the size of the terrain on that axis.
 * @param {Number} [y=0.5]
 *   How far across the terrain the feature should be placed on the Y-axis, in
 *   PERCENT (as a decimal) of the size of the terrain on that axis.
 * @param {Number} [r=64]
 *   The radius of the feature.
 * @param {Number} [h=64]
 *   The height of the feature.
 * @param {String} [t=THREE.NormalBlending]
 *   Determines how to layer the feature on top of the existing terrain. Valid
 *   values include `THREE.AdditiveBlending`, `THREE.SubtractiveBlending`,
 *   `THREE.MultiplyBlending`, `THREE.NoBlending`, `THREE.NormalBlending`, and
 *   any function that takes the terrain's current height, the feature's
 *   displacement at a vertex, and the vertex's distance from the feature
 *   origin, and returns the new height for that vertex. (If a custom function
 *   is passed, it can take optional fourth and fifth parameters, which are the
 *   x- and y-distances from the feature's origin, respectively.)
 * @param {Number | Function} [e=THREE.Terrain.EaseIn]
 *   A function that determines the "falloff" of the feature, i.e. how quickly
 *   the terrain will get close to its height before the feature was applied as
 *   the distance increases from the feature's location. It does this by
 *   interpolating the height of each vertex along a curve. Valid values
 *   include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 representing the distance to the feature origin and
 *   returns a float between 0 and 1 with the adjusted distance. (Custom
 *   functions can also accept optional second and third parameters, which are
 *   the x- and y-distances to the feature origin, respectively.)
 */

export function Influence(g: Vector3[], options: TerrainOptions,
    f: FeatureFunction = Influences.Hill, // feature shape
    x: number = 0.5, // x-location %
    y: number = 0.5, // y-location %
    r: number = 64, // radius
    h: number = 64, // height
    t: Blending | BlendingFunction = NormalBlending,
    e: FalloffFunction = EaseIn) {
    // Find the vertex location of the feature origin
    var xl = options.xSegments + 1, // # x-vertices
        yl = options.ySegments + 1, // # y-vertices
        vx = xl * x, // vertex x-location
        vy = yl * y, // vertex y-location
        xw = options.xSize / options.xSegments, // width of x-segments
        yw = options.ySize / options.ySegments, // width of y-segments
        rx = r / xw, // radius of the feature in vertices on the x-axis
        ry = r / yw, // radius of the feature in vertices on the y-axis
        r1 = 1 / r, // for speed
        xs = Math.ceil(vx - rx),  // starting x-vertex index
        xe = Math.floor(vx + rx), // ending x-vertex index
        ys = Math.ceil(vy - ry),  // starting y-vertex index
        ye = Math.floor(vy + ry); // ending y-vertex index
    // Walk over the vertices within radius of origin
    for (var i = xs; i < xe; i++) {
        for (var j = ys; j < ye; j++) {
            var k = j * xl + i,
                // distance to the feature origin
                fdx = (i - vx) * xw,
                fdy = (j - vy) * yw,
                fd = Math.sqrt(fdx * fdx + fdy * fdy),
                fdr = fd * r1,
                fdxr = fdx * r1,
                fdyr = fdy * r1,
                // Get the displacement according to f, multiply it by h,
                // interpolate using e, then blend according to t.
                d = f(fdr, fdxr, fdyr) * h * (1 - e(fdr, fdxr, fdyr));
            if (fd > r || typeof g[k] == 'undefined') continue;
            if (t === AdditiveBlending) g[k].z += d; // jscs:ignore requireSpaceAfterKeywords
            else if (t === SubtractiveBlending) g[k].z -= d;
            else if (t === MultiplyBlending) g[k].z *= d;
            else if (t === NoBlending) g[k].z = d;
            else if (t === NormalBlending) g[k].z = e(fdr, fdxr, fdyr) * g[k].z + d;
            else if (typeof t === 'function') g[k].z = t(g[k].z, d, fdr, fdxr, fdyr);
        }
    }
};
