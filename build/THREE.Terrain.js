/**
 * THREE.Terrain.js 1.2.0-20150217
 *
 * @author Isaac Sukin (http://www.isaacsukin.com/)
 * @license MIT
 */

/**
* Simplex and Perlin noise.
*
* Copied with small edits from https://github.com/josephg/noisejs which is
* public domain, originally by Stefan Gustavson (stegu@itn.liu.se) with
* optimizations by Peter Eastman (peastman@drizzle.stanford.edu) and converted
* to JavaScript by Joseph Gentle.
*/

(function(global) {
  var module = global.noise = {};

  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  module.seed = function(seed) {
    if (seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      }
      else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  module.seed(Math.random());

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  var F3 = 1/3;
  var G3 = 1/6;

  // 2D simplex noise
  module.simplex = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 1; j1 = 0;
    }
    else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1 = 0; j1 = 1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if (t0 < 0) {
      n0 = 0;
    }
    else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if (t1 < 0) {
      n1 = 0;
    }
    else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if (t2 < 0) {
      n2 = 0;
    }
    else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  function lerp(a, b, t) {
    return (1-t)*a + t*b;
  }

  // 2D Perlin Noise
  module.perlin = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = gradP[X+perm[Y]].dot2(x, y);
    var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
    var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
    var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
       fade(y));
  };
})(this);

/**
 * A terrain object for use with the Three.js library.
 *
 * Usage: `var terrainScene = THREE.Terrain();`
 *
 * @param {Object} [options]
 *   An optional map of settings that control how the terrain is constructed
 *   and displayed. Options include:
 *
 *   - `after`: A function to run after other transformations on the terrain
 *     produce the highest-detail heightmap, but before optimizations and
 *     visual properties are applied. Takes two parameters, which are the same
 *     as those for {@link THREE.Terrain.DiamondSquare}: an array of
 *     `THREE.Vector3` objects representing the vertices of the terrain, and a
 *     map of options with the same available properties as the `options`
 *     parameter for the `THREE.Terrain` function.
 *   - `easing`: A function that affects the distribution of slopes by
 *     interpolating the height of each vertex along a curve. Valid values
 *     include `THREE.Terrain.Linear` (the default), `THREE.Terrain.EaseIn`,
 *     `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *     `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *     between 0 and 1 and returns a float between 0 and 1.
 *   - `frequency`: For terrain generation methods that support it (Perlin,
 *     Simplex, and Worley) the octave of randomness. This basically controls
 *     how big features of the terrain will be (higher frequencies result in
 *     smaller features). Often running multiple generation functions with
 *     different frequencies and heights results in nice detail, as
 *     the PerlinLayers and SimplexLayers methods demonstrate. (The counterpart
 *     to frequency, amplitude, is represented by the difference between the
 *     `maxHeight` and `minHeight` parameters.) Defaults to 2.5.
 *   - `heightmap`: Either a pre-loaded image (from the same domain as the
 *     webpage or served with a CORS-friendly header) representing terrain
 *     height data (lighter pixels are higher); or a function used to generate
 *     random height data for the terrain. Valid random functions are specified
 *     in `generators.js` (or custom functions with the same signature).
 *     (Ideally heightmap images have the same number of pixels as the terrain
 *     has vertices, as determined by the `xSegments` and `ySegments` options,
 *     but this is not required: if the heightmap is a different size, vertex
 *     height values will be interpolated.) Defaults to
 *     `THREE.Terrain.DiamondSquare`.
 *   - `material`: a THREE.Material instance used to display the terrain.
 *     Defaults to `new THREE.MeshBasicMaterial({color: 0xee6633})`.
 *   - `maxHeight`: the highest point, in Three.js units, that a peak should
 *     reach. Defaults to 100. Setting to `undefined`, `null`, or `Infinity`
 *     removes the cap, but this is generally not recommended because many
 *     generators and filters require a vertical range. Instead, consider
 *     setting the `stretch` option to `false`.
 *   - `minHeight`: the lowest point, in Three.js units, that a valley should
 *     reach. Defaults to -100. Setting to `undefined`, `null`, or `-Infinity`
 *     removes the cap, but this is generally not recommended because many
 *     generators and filters require a vertical range. Instead, consider
 *     setting the `stretch` option to `false`.
 *   - `steps`: If this is a number above 1, the terrain will be paritioned
 *     into that many flat "steps," resulting in a blocky appearance. Defaults
 *     to 1.
 *   - `stretch`: Determines whether to stretch the heightmap across the
 *     maximum and minimum height range if the height range produced by the
 *     `heightmap` property is smaller. Defaults to true.
 *   - `turbulent`: Whether to perform a turbulence transformation. Defaults to
 *     false.
 *   - `useBufferGeometry`: a Boolean indicating whether to use
 *     THREE.BufferGeometry instead of THREE.Geometry for the Terrain plane.
 *     Defaults to `false`.
 *   - `xSegments`: The number of segments (rows) to divide the terrain plane
 *     into. (This basically determines how detailed the terrain is.) Defaults
 *     to 63.
 *   - `xSize`: The width of the terrain in Three.js units. Defaults to 1024.
 *     Rendering might be slightly faster if this is a multiple of
 *     `options.xSegments + 1`.
 *   - `ySegments`: The number of segments (columns) to divide the terrain
 *     plane into. (This basically determines how detailed the terrain is.)
 *     Defaults to 63.
 *   - `ySize`: The length of the terrain in Three.js units. Defaults to 1024.
 *     Rendering might be slightly faster if this is a multiple of
 *     `options.ySegments + 1`.
 */
THREE.Terrain = function(options) {
    var defaultOptions = {
        after: null,
        easing: THREE.Terrain.Linear,
        heightmap: THREE.Terrain.DiamondSquare,
        material: null,
        maxHeight: 100,
        minHeight: -100,
        optimization: THREE.Terrain.NONE,
        frequency: 2.5,
        steps: 1,
        stretch: true,
        turbulent: false,
        useBufferGeometry: false,
        xSegments: 63,
        xSize: 1024,
        ySegments: 63,
        ySize: 1024,
    };
    options = options || {};
    for (var opt in defaultOptions) {
        if (defaultOptions.hasOwnProperty(opt)) {
            options[opt] = typeof options[opt] === 'undefined' ? defaultOptions[opt] : options[opt];
        }
    }
    //options.unit = (options.xSize / (options.xSegments+1) + options.ySize / (options.ySegments+1)) * 0.5;
    options.material = options.material || new THREE.MeshBasicMaterial({ color: 0xee6633 });

    // Encapsulating the terrain in a parent object allows us the flexibility
    // to more easily have multiple meshes for optimization purposes.
    var scene = new THREE.Object3D();
    // Planes are initialized on the XY plane, so rotate the plane to make it lie flat.
    scene.rotation.x = -0.5 * Math.PI;

    var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(options.xSize, options.ySize, options.xSegments, options.ySegments),
        options.material
    );

    // It's actually possible to pass a canvas with heightmap data instead of an image.
    if (options.heightmap instanceof HTMLCanvasElement || options.heightmap instanceof Image) {
        THREE.Terrain.fromHeightmap(mesh.geometry.vertices, options);
    }
    else if (typeof options.heightmap === 'function') {
        options.heightmap(mesh.geometry.vertices, options);
    }
    else {
        console.warn('An invalid value was passed for `options.heightmap`: ' + options.heightmap);
    }
    THREE.Terrain.Normalize(mesh, options);

    if (options.useBufferGeometry) {
        mesh.geometry = THREE.BufferGeometryUtils.fromGeometry(mesh.geometry);
    }

    // lod.addLevel(mesh, options.unit * 10 * Math.pow(2, lodLevel));

    scene.add(mesh);
    return scene;
};

/**
 * Normalize the terrain after applying a heightmap or filter.
 *
 * This applies turbulence, steps, and height clamping; calls the `after`
 * callback; updates normals and the bounding sphere; and marks vertices as
 * dirty.
 *
 * @param {THREE.Mesh} mesh
 *   The terrain mesh.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid options are the same as for {@link THREE.Terrain}().
 */
THREE.Terrain.Normalize = function(mesh, options) {
    var v = mesh.geometry.vertices;
    if (options.turbulent) {
        THREE.Terrain.Turbulence(v, options);
    }
    if (options.steps > 1) {
        THREE.Terrain.Step(v, options.steps);
        THREE.Terrain.Smooth(v, options);
    }
    // Keep the terrain within the allotted height range if necessary, and do easing.
    THREE.Terrain.Clamp(v, options);
    // Call the "after" callback
    if (typeof options.after === 'function') {
        options.after(v, options);
    }
    // Mark the geometry as having changed and needing updates.
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeBoundingSphere();
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
};

/**
 * Optimization types.
 *
 * Note that none of these are implemented right now. They should be done as
 * shaders so that they execute on the GPU, and the resulting scene would need
 * to be updated every frame to adjust to the camera's position.
 *
 * Further reading:
 * - http://vterrain.org/LOD/Papers/
 * - http://vterrain.org/LOD/Implementations/
 *
 * GEOMIPMAP: The terrain plane should be split into sections, each with their
 * own LODs, for screen-space occlusion and detail reduction. Intermediate
 * vertices on higher-detail neighboring sections should be interpolated
 * between neighbor edge vertices in order to match with the edge of the
 * lower-detail section. The number of sections should be around sqrt(segments)
 * along each axis. It's unclear how to make materials stretch across segments.
 * Possible example (I haven't looked too much into it) at
 * https://github.com/felixpalmer/lod-terrain/tree/master/js/shaders
 *
 * GEOCLIPMAP: The terrain should be composed of multiple donut-shaped sections
 * at decreasing resolution as the radius gets bigger. When the player moves,
 * the sections should morph so that the detail "follows" the player around.
 * There is an implementation of geoclipmapping at
 * https://github.com/CodeArtemis/TriggerRally/blob/unified/server/public/scripts/client/terrain.coffee
 * and a tutorial on morph targets at
 * http://nikdudnik.com/making-3d-gfx-for-the-cinema-on-low-budget-and-three-js/
 *
 * POLYGONREDUCTION: Combine areas that are relatively coplanar into larger
 * polygons as described at http://www.shamusyoung.com/twentysidedtale/?p=142.
 * This method can be combined with the others if done very carefully, or it
 * can be adjusted to be more aggressive at greater distance from the camera
 * (similar to combining with geomipmapping).
 *
 * If these do get implemented, here is the option description to add to the
 * `THREE.Terrain` docblock:
 *
 *    - `optimization`: the type of optimization to apply to the terrain. If
 *      an optimization is applied, the number of segments along each axis that
 *      the terrain should be divided into at the most detailed level should
 *      equal (n * 2^(LODs-1))^2 - 1, for arbitrary n, where LODs is the number
 *      of levels of detail desired. Valid values include:
 *
 *          - `THREE.Terrain.NONE`: Don't apply any optimizations. This is the
 *            default.
 *          - `THREE.Terrain.GEOMIPMAP`: Divide the terrain into evenly-sized
 *            sections with multiple levels of detail. For each section,
 *            display a level of detail dependent on how close the camera is.
 *          - `THREE.Terrain.GEOCLIPMAP`: Divide the terrain into donut-shaped
 *            sections, where detail decreases as the radius increases. The
 *            rings then morph to "follow" the camera around so that the camera
 *            is always at the center, surrounded by the most detail.
 */
THREE.Terrain.NONE = 0;
THREE.Terrain.GEOMIPMAP = 1;
THREE.Terrain.GEOCLIPMAP = 2;
THREE.Terrain.POLYGONREDUCTION = 3;

/**
 * Get a 2D array of heightmap values from a 1D array of plane vertices.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param {Object} options
 *   A map of settings defining properties of the terrain. The only properties
 *   that matter here are `xSegments` and `ySegments`, which represent how many
 *   vertices wide and deep the terrain plane is, respectively (and therefore
 *   also the dimensions of the returned array).
 *
 * @return {Number[][]}
 *   A 2D array representing the terrain's heightmap.
 */
THREE.Terrain.toArray2D = function(vertices, options) {
    var tgt = new Array(options.xSegments),
        xl = options.xSegments + 1,
        yl = options.ySegments + 1,
        i, j;
    for (i = 0; i < xl; i++) {
        tgt[i] = new Float64Array(options.ySegments);
        for (j = 0; j < yl; j++) {
            tgt[i][j] = vertices[j * xl + i].z;
        }
    }
    return tgt;
};

/**
 * Set the height of plane vertices from a 2D array of heightmap values.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param {Number[][]} src
 *   A 2D array representing a heightmap to apply to the terrain.
 */
THREE.Terrain.fromArray2D = function(vertices, src) {
    for (var i = 0, xl = src.length; i < xl; i++) {
        for (var j = 0, yl = src[i].length; j < yl; j++) {
            vertices[j * xl + i].z = src[i][j];
        }
    }
};

/**
 * Get a 1D array of heightmap values from a 1D array of plane vertices.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param {Object} options
 *   A map of settings defining properties of the terrain. The only properties
 *   that matter here are `xSegments` and `ySegments`, which represent how many
 *   vertices wide and deep the terrain plane is, respectively (and therefore
 *   also the dimensions of the returned array).
 *
 * @return {Number[]}
 *   A 1D array representing the terrain's heightmap.
 */
THREE.Terrain.toArray1D = function(vertices) {
    var tgt = new Float64Array(vertices.length);
    for (var i = 0, l = tgt.length; i < l; i++) {
        tgt[i] = vertices[i].z;
    }
    return tgt;
};

/**
 * Set the height of plane vertices from a 1D array of heightmap values.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param {Number[]} src
 *   A 1D array representing a heightmap to apply to the terrain.
 */
THREE.Terrain.fromArray1D = function(vertices, src) {
    for (var i = 0, l = Math.min(vertices.length, src.length); i < l; i++) {
        vertices[i].z = src[i];
    }
};

/**
 * Generate a 1D array containing random heightmap data.
 *
 * This is like {@link THREE.Terrain.toHeightmap} except that instead of
 * generating the Three.js mesh and material information you can just get the
 * height data.
 *
 * @param {Function} method
 *   The method to use to generate the heightmap data. Works with function that
 *   would be an acceptable value for the `heightmap` option for the
 *   {@link THREE.Terrain} function.
 * @param {Number} options
 *   The same as the options parameter for the {@link THREE.Terrain} function.
 */
THREE.Terrain.heightmapArray = function(method, options) {
    var arr = new Array((options.xSegments+1) * (options.ySegments+1)),
        l = arr.length,
        i;
    // The heightmap functions provided by this script operate on THREE.Vector3
    // objects by changing the z field, so we need to make that available.
    // Unfortunately that means creating a bunch of objects we're just going to
    // throw away, but a conscious decision was made here to optimize for the
    // vector case.
    for (i = 0; i < l; i++) {
        arr[i] = {z: 0};
    }
    options.minHeight = options.minHeight || 0;
    options.maxHeight = typeof options.maxHeight === 'undefined' ? 1 : options.maxHeight;
    options.stretch = options.stretch || false;
    method(arr, options);
    THREE.Terrain.Clamp(arr, options);
    for (i = 0; i < l; i++) {
        arr[i] = arr[i].z;
    }
    return arr;
};

/**
 * Randomness interpolation functions.
 */
THREE.Terrain.Linear = function(x) {
    return x;
};

// x = [0, 1], x^2
THREE.Terrain.EaseIn = function(x) {
    return x*x;
};

// x = [0, 1], -x(x-2)
THREE.Terrain.EaseOut = function(x) {
    return -x * (x - 2);
};

// x = [0, 1], x^2(3-2x)
// Nearly identical alternatives: 0.5+0.5*cos(x*pi-pi), x^a/(x^a+(1-x)^a) (where a=1.6 seems nice)
// For comparison: http://www.wolframalpha.com/input/?i=x^1.6%2F%28x^1.6%2B%281-x%29^1.6%29%2C+x^2%283-2x%29%2C+0.5%2B0.5*cos%28x*pi-pi%29+from+0+to+1
THREE.Terrain.EaseInOut = function(x) {
    return x*x*(3-2*x);
};

// x = [0, 1], 0.5*(2x-1)^3+0.5
THREE.Terrain.InEaseOut = function(x) {
    var y = 2*x-1;
    return 0.5 * y*y*y + 0.5;
};

// x = [0, 1], x^7
THREE.Terrain.EaseInStrong = function(x) {
    return x*x*x*x*x*x*x;
};

/**
 * Convert an image-based heightmap into vertex-based height data.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 */
THREE.Terrain.fromHeightmap = function(g, options) {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        rows = options.ySegments + 1,
        cols = options.xSegments + 1,
        spread = options.maxHeight - options.minHeight;
    canvas.width = cols;
    canvas.height = rows;
    context.drawImage(options.heightmap, 0, 0, canvas.width, canvas.height);
    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var i = row * cols + col,
                idx = i * 4;
            g[i].z = (data[idx] + data[idx+1] + data[idx+2]) / 765 * spread + options.minHeight;
        }
    }
};

/**
 * Convert a terrain plane into an image-based heightmap.
 *
 * Parameters are the same as for {@link THREE.Terrain.fromHeightmap} except
 * that if `options.heightmap` is a canvas element then the image will be
 * painted onto that canvas; otherwise a new canvas will be created.
 *
 * NOTE: this method performs an operation on an array of vertices, which
 * aren't available when using `BufferGeometry`. So, if you want to use this
 * method, make sure to set the `useBufferGeometry` option to `false` when
 * generating your terrain.
 *
 * @return {HTMLCanvasElement}
 *   A canvas with the relevant heightmap painted on it.
 */
THREE.Terrain.toHeightmap = function(g, options) {
    var hasMax = typeof options.maxHeight === 'undefined',
        hasMin = typeof options.minHeight === 'undefined',
        max = hasMax ? options.maxHeight : -Infinity,
        min = hasMin ? options.minHeight :  Infinity;
    if (!hasMax || !hasMin) {
        var max2 = max,
            min2 = min;
        for (var k = 0, l = g.length; k < l; k++) {
            if (g[k].z > max2) max2 = g[k].z;
            if (g[k].z < min2) min2 = g[k].z;
        }
        if (!hasMax) max = max2;
        if (!hasMin) min = min2;
    }
    var canvas = options.heightmap instanceof HTMLCanvasElement ? options.heightmap : document.createElement('canvas'),
        context = canvas.getContext('2d'),
        rows = options.ySegments + 1,
        cols = options.xSegments + 1,
        spread = options.maxHeight - options.minHeight;
    canvas.width = cols;
    canvas.height = rows;
    var d = context.createImageData(canvas.width, canvas.height),
        data = d.data;
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var i = row * cols + col,
            idx = i * 4;
            data[idx] = data[idx+1] = data[idx+2] = Math.round(((g[i].z - options.minHeight) / spread) * 255);
            data[idx+3] = 255;
        }
    }
    context.putImageData(d, 0, 0);
    return canvas;
};

/**
 * Rescale the heightmap of a terrain to keep it within the maximum range.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}() but only `maxHeight`, `minHeight`, and `easing`
 *   are used.
 */
THREE.Terrain.Clamp = function(g, options) {
    var min = Infinity,
        max = -Infinity,
        l = g.length,
        i;
    options.easing = options.easing || THREE.Terrain.Linear;
    for (i = 0; i < l; i++) {
        if (g[i].z < min) min = g[i].z;
        if (g[i].z > max) max = g[i].z;
    }
    var actualRange = max - min,
        optMax = typeof options.maxHeight !== 'number' ? max : options.maxHeight,
        optMin = typeof options.minHeight !== 'number' ? min : options.minHeight,
        targetMax = options.stretch ? optMax : (max < optMax ? max : optMax),
        targetMin = options.stretch ? optMin : (min > optMin ? min : optMin),
        range = targetMax - targetMin;
    if (targetMax < targetMin) {
        targetMax = optMax;
        range = targetMax - targetMin;
    }
    for (i = 0; i < l; i++) {
        g[i].z = options.easing((g[i].z - min) / actualRange) * range + optMin;
    }
};

/**
 * Move the edges of the terrain up or down based on distance from the edge.
 *
 * Useful to make islands or enclosing walls/cliffs.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Boolean} direction
 *   `true` if the edges should be turned up; `false` if they should be turned
 *   down.
 * @param {Number} distance
 *   The distance from the edge at which the edges should begin to be affected
 *   by this operation.
 * @param {Number/Function} [e=THREE.Terrain.EaseInOut]
 *   A function that determines how quickly the terrain will transition between
 *   its current height and the edge shape as distance to the edge decreases.
 *   It does this by interpolating the height of each vertex along a curve.
 *   Valid values include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 and returns a float between 0 and 1.
 * @param {Object} [edges={top: true, bottom: true, left: true, right: true}]
 *   Determines which edges should be affected by this function. Defaults to
 *   all edges. If passed, should be an object with `top`, `bottom`, `left`,
 *   and `right` Boolean properties specifying which edges to affect.
 */
THREE.Terrain.Edges = function(g, options, direction, distance, easing, edges) {
    var numXSegments = Math.floor(distance / (options.xSize / options.xSegments)) || 1,
        numYSegments = Math.floor(distance / (options.ySize / options.ySegments)) || 1,
        peak = direction ? options.maxHeight : options.minHeight,
        max = direction ? Math.max : Math.min,
        xl = options.xSegments + 1,
        yl = options.ySegments + 1,
        i, j, multiplier, k1, k2;
    easing = easing || THREE.Terrain.EaseInOut;
    if (typeof edges !== 'object') {
        edges = {top: true, bottom: true, left: true, right: true};
    }
    for (i = 0; i < xl; i++) {
        for (j = 0; j < numYSegments; j++) {
            multiplier = easing(1 - j / numYSegments);
            k1 = j*xl + i;
            k2 = (options.ySegments-j)*xl + i;
            if (edges.top) {
                g[k1].z = max(g[k1].z, (peak - g[k1].z) * multiplier + g[k1].z);
            }
            if (edges.bottom) {
                g[k2].z = max(g[k2].z, (peak - g[k2].z) * multiplier + g[k2].z);
            }
        }
    }
    for (i = 0; i < yl; i++) {
        for (j = 0; j < numXSegments; j++) {
            multiplier = easing(1 - j / numXSegments);
            k1 = i*xl+j;
            k2 = (options.ySegments-i)*xl + (options.xSegments-j);
            if (edges.left) {
                g[k1].z = max(g[k1].z, (peak - g[k1].z) * multiplier + g[k1].z);
            }
            if (edges.right) {
                g[k2].z = max(g[k2].z, (peak - g[k2].z) * multiplier + g[k2].z);
            }
        }
    }
    THREE.Terrain.Clamp(g, {
        maxHeight: options.maxHeight,
        minHeight: options.minHeight,
        stretch: true,
    });
};

/**
 * Move the edges of the terrain up or down based on distance from the center.
 *
 * Useful to make islands or enclosing walls/cliffs.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Boolean} direction
 *   `true` if the edges should be turned up; `false` if they should be turned
 *   down.
 * @param {Number} distance
 *   The distance from the center at which the edges should begin to be
 *   affected by this operation.
 * @param {Number/Function} [e=THREE.Terrain.EaseInOut]
 *   A function that determines how quickly the terrain will transition between
 *   its current height and the edge shape as distance to the edge decreases.
 *   It does this by interpolating the height of each vertex along a curve.
 *   Valid values include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 and returns a float between 0 and 1.
 */
THREE.Terrain.RadialEdges = function(g, options, direction, distance, easing) {
    var peak = direction ? options.maxHeight : options.minHeight,
        max = direction ? Math.max : Math.min,
        xl = (options.xSegments + 1),
        yl = (options.ySegments + 1),
        xl2 = xl * 0.5,
        yl2 = yl * 0.5,
        xSegmentSize = options.xSize / options.xSegments,
        ySegmentSize = options.ySize / options.ySegments,
        edgeRadius = Math.min(options.xSize, options.ySize) * 0.5 - distance,//Math.sqrt(options.xSize * options.xSize + options.ySize * options.ySize) - distance,
        i, j, multiplier, k, vertexDistance;
    for (i = 0; i < xl; i++) {
        for (j = 0; j < yl2; j++) {
            k = j*xl + i;
            vertexDistance = Math.min(edgeRadius, Math.sqrt((xl2-i)*xSegmentSize*(xl2-i)*xSegmentSize + (yl2-j)*ySegmentSize*(yl2-j)*ySegmentSize) - distance);
            if (vertexDistance < 0) continue;
            multiplier = easing(vertexDistance / edgeRadius);
            g[k].z = max(g[k].z, (peak - g[k].z) * multiplier + g[k].z);
            // Use symmetry to reduce the number of iterations.
            k = (options.ySegments-j)*xl + i;
            g[k].z = max(g[k].z, (peak - g[k].z) * multiplier + g[k].z);
        }
    }
};

/**
 * Smooth the terrain by setting each point to the mean of its neighborhood.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Number} [weight=0]
 *   How much to weight the original vertex height against the average of its
 *   neighbors.
 */
THREE.Terrain.Smooth = function(g, options, weight) {
    var heightmap = new Float64Array(g.length);
    for (var i = 0, xl = options.xSegments + 1, yl = options.ySegments + 1; i < xl; i++) {
        for (var j = 0; j < yl; j++) {
            var sum = 0, c = 0;
            for (var n = -1; n <= 1; n++) {
                for (var m = -1; m <= 1; m++) {
                    var key = (j+n)*xl + i + m;
                    if (typeof g[key] !== 'undefined') {
                        sum += g[key].z;
                        c++;
                    }
                }
            }
            heightmap[j*xl + i] = sum / c;
        }
    }
    weight = weight || 0;
    var w = 1 / (1 + weight);
    for (var k = 0, l = g.length; k < l; k++) {
        g[k].z = (heightmap[k] + g[k].z * weight) * w;
    }
};

/**
 * Smooth the terrain by setting each point to the median of its neighborhood.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.SmoothMedian = function(g, options) {
    var heightmap = new Float64Array(g.length),
        neighborValues = [],
        neighborKeys = [],
        sortByValue = function(a, b) {
            return neighborValues[a] - neighborValues[b];
        };
    for (var i = 0, xl = options.xSegments + 1, yl = options.ySegments + 1; i < xl; i++) {
        for (var j = 0; j < yl; j++) {
            neighborValues.length = 0;
            neighborKeys.length = 0;
            for (var n = -1; n <= 1; n++) {
                for (var m = -1; m <= 1; m++) {
                    var key = (j+n)*xl + i + m;
                    if (typeof g[key] !== 'undefined') {
                        neighborValues.push(g[key].z);
                        neighborKeys.push(key);
                    }
                }
            }
            neighborKeys.sort(sortByValue);
            var halfKey = Math.floor(neighborKeys.length*0.5),
                median;
            if (neighborKeys.length % 2 === 1) {
                median = g[neighborKeys[halfKey]].z;
            }
            else {
                median = (g[neighborKeys[halfKey-1]].z + g[neighborKeys[halfKey]].z) * 0.5;
            }
            heightmap[j*xl + i] = median;
        }
    }
    for (var k = 0, l = g.length; k < l; k++) {
        g[k].z = heightmap[k];
    }
};

/**
 * Smooth the terrain by clamping each point within its neighbors' extremes.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Number} [multiplier=1]
 *   By default, this filter clamps each point within the highest and lowest
 *   value of its neighbors. This parameter is a multiplier for the range
 *   outside of which the point will be clamped. Higher values mean that the
 *   point can be farther outside the range of its neighbors.
 */
THREE.Terrain.SmoothConservative = function(g, options, multiplier) {
    var heightmap = new Float64Array(g.length);
    for (var i = 0, xl = options.xSegments + 1, yl = options.ySegments + 1; i < xl; i++) {
        for (var j = 0; j < yl; j++) {
            var max = -Infinity,
                min = Infinity;
            for (var n = -1; n <= 1; n++) {
                for (var m = -1; m <= 1; m++) {
                    var key = (j+n)*xl + i + m;
                    if (typeof g[key] !== 'undefined' && n && m) {
                        if (g[key].z < min) min = g[key].z;
                        if (g[key].z > max) max = g[key].z;
                    }
                }
            }
            var kk = j*xl + i;
            if (typeof multiplier === 'number') {
                var halfdiff = (max - min) * 0.5,
                    middle = min + halfdiff;
                max = middle + halfdiff * multiplier;
                min = middle - halfdiff * multiplier;
            }
            heightmap[kk] = g[kk].z > max ? max : (g[kk].z < min ? min : g[kk].z);
        }
    }
    for (var k = 0, l = g.length; k < l; k++) {
        g[k].z = heightmap[k];
    }
};

/**
 * Partition a terrain into flat steps.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Number} [levels]
 *   The number of steps to divide the terrain into. Defaults to
 *   (g.length/2)^(1/4).
 */
THREE.Terrain.Step = function(g, levels) {
    // Calculate the max, min, and avg values for each bucket
    var i = 0,
        j = 0,
        l = g.length,
        inc = Math.floor(l / levels),
        heights = new Array(l),
        buckets = new Array(levels);
    if (typeof levels === 'undefined') {
        levels = Math.floor(Math.pow(l*0.5, 0.25));
    }
    for (i = 0; i < l; i++) {
        heights[i] = g[i].z;
    }
    heights.sort(function(a, b) { return a - b; });
    for (i = 0; i < levels; i++) {
        // Bucket by population (bucket size) not range size
        var subset = heights.slice(i*inc, (i+1)*inc),
            sum = 0,
            bl = subset.length;
        for (j = 0; j < bl; j++) {
            sum += subset[j];
        }
        buckets[i] = {
            min: subset[0],
            max: subset[subset.length-1],
            avg: sum / bl,
        };
    }

    // Set the height of each vertex to the average height of its bucket
    for (i = 0; i < l; i++) {
        var startHeight = g[i].z;
        for (j = 0; j < levels; j++) {
            if (startHeight >= buckets[j].min && startHeight <= buckets[j].max) {
                g[i].z = buckets[j].avg;
                break;
            }
        }
    }
};

/**
 * Transform to turbulent noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.Turbulence = function(g, options) {
    var range = options.maxHeight - options.minHeight;
    for (var i = 0, l = g.length; i < l; i++) {
        g[i].z = options.minHeight + Math.abs((g[i].z - options.minHeight) * 2 - range);
    }
};

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
 * Generate random terrain using the Cosine waves.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.Cosine = function(g, options) {
    var amplitude = (options.maxHeight - options.minHeight) * 0.5,
        frequencyScalar = options.frequency * Math.PI / (Math.min(options.xSegments, options.ySegments) + 1),
        phase = Math.random() * Math.PI * 2;
    for (var i = 0, xl = options.xSegments + 1; i < xl; i++) {
        for (var j = 0, yl = options.ySegments + 1; j < yl; j++) {
            g[j * xl + i].z += amplitude * (Math.cos(i * frequencyScalar + phase) + Math.cos(j * frequencyScalar + phase));
        }
    }
};

/**
 * Generate random terrain using layers of Cosine waves.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.CosineLayers = function(g, options) {
    THREE.Terrain.MultiPass(g, options, [
        { method: THREE.Terrain.Cosine,                   frequency:  2.5 },
        { method: THREE.Terrain.Cosine, amplitude: 0.1,   frequency:  12  },
        { method: THREE.Terrain.Cosine, amplitude: 0.05,  frequency:  15  },
        { method: THREE.Terrain.Cosine, amplitude: 0.025, frequency:  20  },
    ]);
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
        heightmap[i] = new Float64Array(segments+1);
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

    //THREE.Terrain.SmoothConservative(g, options);
};

/**
 * Generate random terrain using the Fault method.
 *
 * Based on http://www.lighthouse3d.com/opengl/terrain/index.php3?fault
 * Repeatedly draw random lines that cross the terrain. Raise the terrain on
 * one side of the line and lower it on the other.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
THREE.Terrain.Fault = function(g, options) {
    var d = Math.sqrt(options.xSegments*options.xSegments + options.ySegments*options.ySegments),
        iterations = d * options.frequency,
        range = (options.maxHeight - options.minHeight) * 0.5,
        displacement = range / iterations,
        smoothDistance = Math.min(options.xSize / options.xSegments, options.ySize / options.ySegments) * options.frequency;
    for (var k = 0; k < iterations; k++) {
        var v = Math.random(),
            a = Math.sin(v * Math.PI * 2),
            b = Math.cos(v * Math.PI * 2),
            c = Math.random() * d - d*0.5;
        for (var i = 0, xl = options.xSegments + 1; i < xl; i++) {
            for (var j = 0, yl = options.ySegments + 1; j < yl; j++) {
                var distance = a*i + b*j - c;
                if (distance > smoothDistance) {
                    g[j * xl + i].z += displacement;
                }
                else if (distance < -smoothDistance) {
                    g[j * xl + i].z -= displacement;
                }
                else {
                    g[j * xl + i].z += Math.cos(distance / smoothDistance * Math.PI * 2) * displacement;
                }
            }
        }
    }
    //THREE.Terrain.Smooth(g, options);
};

/**
 * Generate random terrain using the Hill method.
 *
 * The basic approach is to repeatedly pick random points on or near the
 * terrain and raise a small hill around those points. Those small hills
 * eventually accumulate into large hills with distinct features.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Function} [feature=THREE.Terrain.Influences.Hill]
 *   A function describing the feature to raise at the randomly chosen points.
 *   Typically this is a hill shape so that the accumulated features result in
 *   something resembling mountains, but it could be any function that accepts
 *   one parameter representing the distance from the feature's origin
 *   expressed as a number between -1 and 1 inclusive. Optionally it can accept
 *   a second and third parameter, which are the x- and y- distances from the
 *   feature's origin, respectively. It should return a number between -1 and 1
 *   representing the height of the feature at the given coordinate.
 *   `THREE.Terrain.Influences` contains some useful functions for this
 *   purpose.
 * @param {Function} [shape]
 *   A function that takes an object with `x` and `y` properties consisting of
 *   uniform random variables from 0 to 1, and returns a number from 0 to 1,
 *   typically by transforming it over a distribution. The result affects where
 *   small hills are raised thereby affecting the overall shape of the terrain.
 */
THREE.Terrain.Hill = function(g, options, feature, shape) {
    var frequency = options.frequency * 2,
        numFeatures = frequency * frequency * 10,
        heightRange = options.maxHeight - options.minHeight,
        minHeight = heightRange / (frequency * frequency),
        maxHeight = heightRange / frequency,
        smallerSideLength = Math.min(options.xSize, options.ySize),
        minRadius = smallerSideLength / (frequency * frequency),
        maxRadius = smallerSideLength / frequency;
    feature = feature || THREE.Terrain.Influences.Hill;

    var coords = { x: 0, y: 0 };
    for (var i = 0; i < numFeatures; i++) {
        var radius = Math.random() * (maxRadius - minRadius) + minRadius,
            height = Math.random() * (maxHeight - minHeight) + minHeight;
        var min = 0 - radius,
            maxX = options.xSize + radius,
            maxY = options.ySize + radius;
        coords.x = Math.random();
        coords.y = Math.random();
        if (typeof shape === 'function') shape(coords);
        THREE.Terrain.Influence(
            g, options,
            feature,
            coords.x, coords.y,
            radius, height,
            THREE.AdditiveBlending,
            THREE.Terrain.EaseInStrong
        );
    }
};

/**
 * Generate random terrain using the Hill method, centered on the terrain.
 *
 * The only difference between this and the Hill method is that the locations
 * of the points to place small hills are not uniformly randomly distributed
 * but instead are more likely to occur close to the center of the terrain.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Function} [feature=THREE.Terrain.Influences.Hill]
 *   A function describing the feature. The function should accept one
 *   parameter representing the distance from the feature's origin expressed as
 *   a number between -1 and 1 inclusive. Optionally it can accept a second and
 *   third parameter, which are the x- and y- distances from the feature's
 *   origin, respectively. It should return a number between -1 and 1
 *   representing the height of the feature at the given coordinate.
 *   `THREE.Terrain.Influences` contains some useful functions for this
 *   purpose.
 */
THREE.Terrain.HillIsland = (function() {
    var island = function(coords) {
        var theta = Math.random() * Math.PI * 2;
        coords.x = 0.5 + Math.cos(theta) * coords.x * 0.4;
        coords.y = 0.5 + Math.sin(theta) * coords.y * 0.4;
    };
    return function(g, options, feature) {
        THREE.Terrain.Hill(g, options, feature, island);
    };
})();

(function() {
    /**
     * Deposit a particle at a vertex.
     */
    function deposit(g, i, j, xl, displacement) {
        var currentKey = j * xl + i;
        // Pick a random neighbor.
        for (var k = 0; k < 3; k++) {
            var r = Math.floor(Math.random() * 8);
            switch (r) {
                case 0: i++; break;
                case 1: i--; break;
                case 2: j++; break;
                case 3: j--; break;
                case 4: i++; j++; break;
                case 5: i++; j--; break;
                case 6: i--; j++; break;
                case 7: i--; j--; break;
            }
            var neighborKey = j * xl + i;
            // If the neighbor is lower, move the particle to that neighbor and re-evaluate.
            if (typeof g[neighborKey] !== 'undefined') {
                if (g[neighborKey].z < g[currentKey].z) {
                    deposit(g, i, j, xl, displacement);
                    return;
                }
            }
            // Deposit some particles on the edge.
            else if (Math.random() < 0.2) {
                g[currentKey].z += displacement;
                return;
            }
        }
        g[currentKey].z += displacement;
    }

    /**
     * Generate random terrain using the Particle Deposition method.
     *
     * Based on http://www.lighthouse3d.com/opengl/terrain/index.php?particle
     * Repeatedly deposit particles on terrain vertices. Pick a random neighbor
     * of that vertex. If the neighbor is lower, roll the particle to the
     * neighbor. When the particle stops, displace the vertex upwards.
     *
     * The shape of the outcome is highly dependent on options.frequency
     * because that affects how many particles will be dropped. Values around
     * 0.25 generally result in archipelagos whereas the default of 2.5
     * generally results in one large mountainous island.
     *
     * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
     */
    THREE.Terrain.Particles = function(g, options) {
        var iterations = Math.sqrt(options.xSegments*options.xSegments + options.ySegments*options.ySegments) * options.frequency * 300,
            xl = options.xSegments + 1,
            displacement = (options.maxHeight - options.minHeight) / iterations * 1000,
            i = Math.floor(Math.random() * options.xSegments),
            j = Math.floor(Math.random() * options.ySegments),
            xDeviation = Math.random() * 0.2 - 0.1,
            yDeviation = Math.random() * 0.2 - 0.1;
        for (var k = 0; k < iterations; k++) {
            deposit(g, i, j, xl, displacement);
            var d = Math.random() * Math.PI * 2;
            if (k % 1000 === 0) {
                xDeviation = Math.random() * 0.2 - 0.1;
                yDeviation = Math.random() * 0.2 - 0.1;
            }
            if (k % 100 === 0) {
                i = Math.floor(options.xSegments*(0.5+xDeviation) + Math.cos(d) * Math.random() * options.xSegments*(0.5-Math.abs(xDeviation)));
                j = Math.floor(options.ySegments*(0.5+yDeviation) + Math.sin(d) * Math.random() * options.ySegments*(0.5-Math.abs(yDeviation)));
            }
        }
        //THREE.Terrain.Smooth(g, options, 3);
    };
})();

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
        { method: function(g, o) { return THREE.Terrain.SmoothMedian(g, o); } },
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
        var data = new Float64Array((segments+1)*(segments+1));

        // Layer white noise at different resolutions.
        var range = options.maxHeight - options.minHeight;
        for (var i = 2; i < 7; i++) {
            WhiteNoise(g, options, Math.pow(2, i), segments, range * Math.pow(2, 2.4-i*1.2), data);
        }

        // White noise creates some weird artifacts; fix them.
        //THREE.Terrain.Smooth(g, options, 1);
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

/**
 * Generate a material that blends together textures based on vertex height.
 *
 * Inspired by http://www.chandlerprall.com/2011/06/blending-webgl-textures/
 *
 * Usage:
 *
 *    // Assuming the textures are already loaded
 *    var material = THREE.Terrain.generateBlendedMaterial([
 *      {texture: THREE.ImageUtils.loadTexture('img1.jpg')},
 *      {texture: THREE.ImageUtils.loadTexture('img2.jpg'), levels: [-80, -35, 20, 50]},
 *      {texture: THREE.ImageUtils.loadTexture('img3.jpg'), levels: [20, 50, 60, 85]},
 *      {texture: THREE.ImageUtils.loadTexture('img4.jpg'), glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
 *    ]);
 *
 * This material tries to behave exactly like a MeshLambertMaterial other than
 * the fact that it blends multiple texture maps together, although
 * ShaderMaterials are treated slightly differently by Three.js so YMMV. Note
 * that this means the texture will appear black unless there are lights
 * shining on it.
 *
 * @param {Object[]} textures
 *   An array of objects specifying textures to blend together and how to blend
 *   them. Each object should have a `texture` property containing a
 *   `THREE.Texture` instance. There must be at least one texture and the first
 *   texture does not need any other properties because it will serve as the
 *   base, showing up wherever another texture isn't blended in. Other textures
 *   must have either a `levels` property containing an array of four numbers
 *   or a `glsl` property containing a single GLSL expression evaluating to a
 *   float between 0.0 and 1.0. For the `levels` property, the four numbers
 *   are, in order: the height at which the texture will start blending in, the
 *   height at which it will be fully blended in, the height at which it will
 *   start blending out, and the height at which it will be fully blended out.
 *   The `vec3 vPosition` variable is available to `glsl` expressions; it
 *   contains the coordinates in Three-space of the texel currently being
 *   rendered.
 */
THREE.Terrain.generateBlendedMaterial = function(textures) {
    var uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.lambert.uniforms]),
        declare = '',
        assign = '';
    for (var i = 0, l = textures.length; i < l; i++) {
        // Uniforms
        textures[i].wrapS = textures[i].wrapT = THREE.RepeatWrapping;
        textures[i].needsUpdate = true;
        uniforms['texture_' + i] = {
            type: 't',
            value: textures[i].texture,
        };

        // Shader fragments
        // Declare each texture, then mix them together.
        declare += 'uniform sampler2D texture_' + i + ';\n';
        if (i !== 0) {
            var v = textures[i].levels, // Vertex heights at which to blend textures in and out
                p = textures[i].glsl, // Or specify a GLSL expression that evaluates to a float between 0.0 and 1.0 indicating how opaque the texture should be at this texel
                useLevels = typeof v !== 'undefined'; // Use levels if they exist; otherwise, use the GLSL expression
            if (useLevels) {
                // Must fade in; can't start and stop at the same point.
                // So, if levels are too close, move one of them slightly.
                if (v[1] - v[0] < 1) v[0] -= 1;
                if (v[3] - v[2] < 1) v[3] += 1;
                // Convert levels to floating-point numbers as strings so GLSL doesn't barf on "1" instead of "1.0"
                for (var j = 0; j < v.length; j++) {
                    var n = v[j];
                    v[j] = n|0 === n ? n+'.0' : n+'';
                }
            }
            // The transparency of the new texture when it is layered on top of the existing color at this texel is
            // (how far between the start-blending-in and fully-blended-in levels the current vertex is) +
            // (how far between the start-blending-out and fully-blended-out levels the current vertex is)
            // So the opacity is 1.0 minus that.
            var blendAmount = !useLevels ? p :
                '1.0 - smoothstep(' + v[0] + ', ' + v[1] + ', vPosition.z) + smoothstep(' + v[2] + ', ' + v[3] + ', vPosition.z)';
            assign += '        color = mix( ' +
                'texture2D( texture_' + i + ', MyvUv ), ' +
                'color, ' +
                'max(min(' + blendAmount + ', 1.0), 0.0)' +
                ');\n';
        }
    }
    var params = {
        // I don't know which of these properties have any effect
        fog: true,
        lights: true,
        // shading: THREE.SmoothShading,
        // blending: THREE.NormalBlending,
        // depthTest: <bool>,
        // depthWrite: <bool>,
        // wireframe: false,
        // wireframeLinewidth: 1,
        // vertexColors: THREE.NoColors,
        // skinning: <bool>,
        // morphTargets: <bool>,
        // morphNormals: <bool>,
        // opacity: 1.0,
        // transparent: <bool>,
        // side: THREE.FrontSide,

        uniforms: uniforms,
        vertexShader: THREE.ShaderLib.lambert.vertexShader.replace(
            'void main() {',
            'varying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal; void main() {\nMyvUv = uv;\nvPosition = position;\nmyNormal = normal;'
        ),
        fragmentShader: [
            'uniform float opacity;',
            'varying vec3 vLightFront;',
            '#ifdef DOUBLE_SIDED',
            '    varying vec3 vLightBack;',
            '#endif',

            THREE.ShaderChunk.color_pars_fragment,
            THREE.ShaderChunk.map_pars_fragment,
            THREE.ShaderChunk.lightmap_pars_fragment,
            THREE.ShaderChunk.envmap_pars_fragment,
            THREE.ShaderChunk.fog_pars_fragment,
            THREE.ShaderChunk.shadowmap_pars_fragment,
            THREE.ShaderChunk.specularmap_pars_fragment,
            THREE.ShaderChunk.logdepthbuf_pars_fragment,

            declare,
            'varying vec2 MyvUv;',
            'varying vec3 vPosition;',
            'varying vec3 myNormal;',

            'void main() {',

            // TODO: The second vector here is the object's "up" vector. Ideally we'd just pass it in directly.
            'float slope = acos(max(min(dot(myNormal, vec3(0.0, 0.0, 1.0)), 1.0), -1.0));',

            //'    gl_FragColor = vec4( vec3( 1.0 ), opacity );',
            '    vec4 color = texture2D( texture_0, MyvUv ); // base',
                assign,
            '    gl_FragColor = color;',
            //'    gl_FragColor.a = opacity;',

                THREE.ShaderChunk.logdepthbuf_fragment,
                THREE.ShaderChunk.map_fragment,
                THREE.ShaderChunk.alphatest_fragment,
                THREE.ShaderChunk.specularmap_fragment,

            '    #ifdef DOUBLE_SIDED',
            '        if ( gl_FrontFacing )',
            '            gl_FragColor.xyz *= vLightFront;',
            '        else',
            '            gl_FragColor.xyz *= vLightBack;',
            '    #else',
            '        gl_FragColor.xyz *= vLightFront;',
            '    #endif',

                THREE.ShaderChunk.lightmap_fragment,
                THREE.ShaderChunk.color_fragment,
                THREE.ShaderChunk.envmap_fragment,
                THREE.ShaderChunk.shadowmap_fragment,
                THREE.ShaderChunk.linear_to_gamma_fragment,
                THREE.ShaderChunk.fog_fragment,

            '}'
        ].join('\n'),
    };
    return new THREE.ShaderMaterial(params);
};

/**
 * Scatter a mesh across the terrain.
 *
 * @param {THREE.Geometry} geometry
 *   The terrain's geometry (or the highest-resolution version of it).
 * @param {Object} options
 *   A map of settings that controls how the meshes are scattered, with the
 *   following properties:
 *   - `mesh`: A `THREE.Mesh` instance to scatter across the terrain.
 *   - `spread`: A number or a function that affects where meshes are placed.
 *     If it is a number, it represents the percent of faces of the terrain
 *     onto which a mesh should be placed. If it is a function, it takes a
 *     vertex from the terrain and the key of a related face and returns a
 *     boolean indicating whether to place a mesh on that face or not. An
 *     example could be `function(v, k) { return v.z > 0 && !(k % 4); }`.
 *     Defaults to 0.025.
 *   - `smoothSpread`: If the `spread` option is a number, this affects how
 *     much placement is "eased in." Specifically, if the `randomness` function
 *     returns a value for a face that is within `smoothSpread` percentiles
 *     above `spread`, then the probability that a mesh is placed there is
 *     interpolated between zero and `spread`. This creates a "thinning" effect
 *     near the edges of clumps, if the randomness function creates clumps.
 *   - `scene`: A `THREE.Object3D` instance to which the scattered meshes will
 *     be added. This is expected to be either a return value of a call to
 *     `THREE.Terrain()` or added to that return value; otherwise the position
 *     and rotation of the meshes will be wrong.
 *   - `sizeVariance`: The percent by which instances of the mesh can be scaled
 *     up or down when placed on the terrain.
 *   - `randomness`: If `options.spread` is a number, then this property is a
 *     function that determines where meshes are placed. Specifically, it
 *     returns an array of numbers, where each number is the probability that
 *     a mesh is NOT placed on the corresponding face. Valid values include
 *     `Math.random` and the return value of a call to
 *     `THREE.Terrain.ScatterHelper`.
 *   - `maxSlope`: The angle in radians between the normal of a face of the
 *     terrain and the "up" vector above which no mesh will be placed on the
 *     related face. Defaults to ~0.63, which is 36 degrees.
 *   - `maxTilt`: The maximum angle in radians a mesh can be tilted away from
 *     the "up" vector (towards the normal vector of the face of the terrain).
 *     Defaults to Infinity (meshes will point towards the normal).
 *   - `w`: The number of horizontal segments of the terrain.
 *   - `h`: The number of vertical segments of the terrain.
 *
 * @return {THREE.Object3D}
 *   An Object3D containing the scattered meshes. This is the value of the
 *   `options.scene` parameter if passed. This is expected to be either a
 *   return value of a call to `THREE.Terrain()` or added to that return value;
 *   otherwise the position and rotation of the meshes will be wrong.
 */
THREE.Terrain.ScatterMeshes = function(geometry, options) {
    if (!options.mesh) {
        console.error('options.mesh is required for THREE.Terrain.ScatterMeshes but was not passed');
        return;
    }
    if (geometry instanceof THREE.BufferGeometry) {
        console.warn('The terrain mesh is using BufferGeometry but THREE.Terrain.ScatterMeshes can only work with Geometry.');
        return;
    }
    if (!options.scene) {
        options.scene = new THREE.Object3D();
    }
    var defaultOptions = {
        spread: 0.025,
        smoothSpread: 0,
        sizeVariance: 0.1,
        randomness: Math.random,
        maxSlope: 0.6283185307179586, // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
        maxTilt: Infinity,
        w: 0,
        h: 0,
    };
    for (var opt in defaultOptions) {
        if (defaultOptions.hasOwnProperty(opt)) {
            options[opt] = typeof options[opt] === 'undefined' ? defaultOptions[opt] : options[opt];
        }
    }

    var spreadIsNumber = typeof options.spread === 'number',
        randomHeightmap,
        randomness,
        spreadRange = 1 / options.smoothSpread,
        doubleSizeVariance = options.sizeVariance * 2,
        v = geometry.vertices,
        meshes = [],
        up = options.mesh.up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5*Math.PI);
    if (spreadIsNumber) {
        randomHeightmap = options.randomness();
        randomness = typeof randomHeightmap === 'number' ? Math.random : function(k) { return randomHeightmap[k]; };
    }
    //geometry.computeFaceNormals();
    for (var i = 0, w = options.w*2; i < w; i++) {
        for (var j = 0, h = options.h; j < h; j++) {
            var key = j*w + i,
                f = geometry.faces[key],
                place = false;
            if (spreadIsNumber) {
                var rv = randomness(key);
                if (rv < options.spread) {
                    place = true;
                }
                else if (rv < options.spread + options.smoothSpread) {
                    // Interpolate rv between spread and spread + smoothSpread,
                    // then multiply that "easing" value by the probability
                    // that a mesh would get placed on a given face.
                    place = THREE.Terrain.EaseInOut((rv - options.spread) * spreadRange) * options.spread > Math.random();
                }
            }
            else {
                place = options.spread(v[f.a], key, f, i, j);
            }
            if (place) {
                // Don't place a mesh if the angle is too steep.
                if (f.normal.angleTo(up) > options.maxSlope) {
                    continue;
                }
                var mesh = options.mesh.clone();
                //mesh.geometry.computeBoundingBox();
                mesh.position.copy(v[f.a]).add(v[f.b]).add(v[f.c]).divideScalar(3);
                //mesh.translateZ((mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z) * 0.5);
                if (options.maxTilt > 0) {
                    var normal = mesh.position.clone().add(f.normal);
                    mesh.lookAt(normal);
                    var tiltAngle = f.normal.angleTo(up);
                    if (tiltAngle > options.maxTilt) {
                        var ratio = options.maxTilt / tiltAngle;
                        mesh.rotation.x *= ratio;
                        mesh.rotation.y *= ratio;
                        mesh.rotation.z *= ratio;
                    }
                }
                mesh.rotation.x += 90 / 180 * Math.PI;
                mesh.rotateY(Math.random() * 2 * Math.PI);
                if (options.sizeVariance) {
                    var variance = Math.random() * doubleSizeVariance - options.sizeVariance;
                    mesh.scale.x = mesh.scale.z = 1 + variance;
                    mesh.scale.y += variance;
                }
                meshes.push(mesh);
            }
        }
    }

    // Merge geometries.
    var k, l;
    if (options.mesh.geometry instanceof THREE.Geometry) {
        var g = new THREE.Geometry();
        for (k = 0, l = meshes.length; k < l; k++) {
            var m = meshes[k];
            m.updateMatrix();
            g.merge(m.geometry, m.matrix);
        }
        /*
        if (!(options.mesh.material instanceof THREE.MeshFaceMaterial)) {
            g = THREE.BufferGeometryUtils.fromGeometry(g);
        }
        */
        options.scene.add(new THREE.Mesh(g, options.mesh.material));
    }
    // There's no BufferGeometry merge method implemented yet.
    else {
        for (k = 0, l = meshes.length; k < l; k++) {
            options.scene.add(meshes[k]);
        }
    }

    return options.scene;
};

/**
 * Generate a function that returns a heightmap to pass to ScatterMeshes.
 *
 * Specifically, this function generates a heightmap and then uses that
 * heightmap as a map of probabilities of where meshes will be placed.
 *
 * @param {Function} method
 *   A random terrain generation function (i.e. a valid value for the
 *   `options.heightmap` parameter of the `THREE.Terrain` function).
 * @param {Object} options
 *   A map of settings that control how the resulting noise should be generated
 *   (with the same parameters as the `options` parameter to the
 *   `THREE.Terrain` function). `options.minHeight` must equal `0` and
 *   `options.maxHeight` must equal `1` if they are specified.
 * @param {Number} skip
 *   The number of sequential faces to skip between faces that are candidates
 *   for placing a mesh. This avoid clumping meshes too closely together.
 *   Defaults to 1.
 * @param {Number} threshold
 *   The probability that, if a mesh can be placed on a non-skipped face due to
 *   the shape of the heightmap, a mesh actually will be placed there. Helps
 *   thin out placement and make it less regular. Defaults to 0.25.
 *
 * @return {Function}
 *   Returns a function that can be passed as the value of the
 *   `options.randomness` parameter to the {@link THREE.Terrain.ScatterMeshes}
 *   function.
 */
THREE.Terrain.ScatterHelper = function(method, options, skip, threshold) {
    skip = skip || 1;
    threshold = threshold || 0.25;
    options.frequency = options.frequency || 2.5;

    var clonedOptions = {};
    for (var opt in options) {
        if (options.hasOwnProperty(opt)) {
            clonedOptions[opt] = options[opt];
        }
    }

    clonedOptions.xSegments *= 2;
    clonedOptions.stretch = true;
    clonedOptions.maxHeight = 1;
    clonedOptions.minHeight = 0;
    var heightmap = THREE.Terrain.heightmapArray(method, clonedOptions);

    for (var i = 0, l = heightmap.length; i < l; i++) {
        if (i % skip || Math.random() > threshold) {
            heightmap[i] = 1; // 0 = place, 1 = don't place
        }
    }
    return function() {
        return heightmap;
    };
};

// Allows placing geometrically-described features on a terrain.
// If you want these features to look a little less regular,
// just apply them before a procedural pass.
// If you want more complex influence, you can just composite heightmaps.

/**
 * Equations describing geographic features.
 */
THREE.Terrain.Influences = {
    Mesa: function(x) {
        return 1.25 * Math.min(0.8, Math.exp(-(x*x)));
    },
    Hole: function(x) {
        return -THREE.Terrain.Influences.Mesa(x);
    },
    Hill: function(x) {
        // Same curve as EaseInOut, but mirrored and translated.
        return x < 0 ? (x+1)*(x+1)*(3-2*(x+1)) : 1-x*x*(3-2*x);
    },
    Valley: function(x) {
        return -THREE.Terrain.Influences.Hill(x);
    },
    Dome: function(x) {
        // Parabola
        return -(x+1)*(x-1);
    },
    // Not meaningful in Additive or Subtractive mode
    Flat: function(x) {
        return 0;
    },
    Volcano: function(x) {
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
 * @param {Number/Function} [e=THREE.Terrain.EaseIn]
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
THREE.Terrain.Influence = function(g, options, f, x, y, r, h, t, e) {
    f = f || THREE.Terrain.Influences.Hill; // feature shape
    x = typeof x === 'undefined' ? 0.5 : x; // x-location %
    y = typeof y === 'undefined' ? 0.5 : y; // y-location %
    r = typeof r === 'undefined' ? 64  : r; // radius
    h = typeof h === 'undefined' ? 64  : h; // height
    t = typeof t === 'undefined' ? THREE.NormalBlending : t; // blending
    e = e || THREE.Terrain.EaseIn; // falloff
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
                fd = Math.sqrt(fdx*fdx + fdy*fdy),
                fdr = fd * r1,
                fdxr = fdx * r1,
                fdyr = fdy * r1,
                // Get the displacement according to f, multiply it by h,
                // interpolate using e, then blend according to t.
                d = f(fdr, fdxr, fdyr) * h * (1 - e(fdr, fdxr, fdyr));
            if (fd > r || typeof g[k] == 'undefined') continue;
            if      (t === THREE.AdditiveBlending)    g[k].z += d;
            else if (t === THREE.SubtractiveBlending) g[k].z -= d;
            else if (t === THREE.MultiplyBlending)    g[k].z *= d;
            else if (t === THREE.NoBlending)          g[k].z  = d;
            else if (t === THREE.NormalBlending)      g[k].z  = e(fdr, fdxr, fdyr) * g[k].z + d;
            else if (typeof t === 'function')         g[k].z  = t(g[k].z, d, fdr, fdxr, fdyr);
        }
    }
};
