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
 *   - `scene`: A `THREE.Object3D` instance to which the scattered meshes will
 *     be added. This is expected to be either a return value of a call to
 *     `THREE.Terrain()` or added to that return value; otherwise the position
 *     and rotation of the meshes will be wrong.
 *   - `sizeVariance`: The percent by which instances of the mesh can be scaled
 *     up or down when placed on the terrain.
 *   - `randomness`: If `options.spread` is a number, then this property is a
 *     function that determines where meshes are placed. Valid values include
 *     `Math.random` and the return value of a call to
 *     `THREE.Terrain.ScatterHelper`.
 *   - `maxSlope`: The angle in radians between the normal of a face of the
 *     terrain and the "up" vector above which no mesh will be placed on the
 *     related face. Defaults to ~0.63, which is 36 degrees.
 *   - `x`, `y`, `w`, `h`: Together, these properties outline a rectangular
 *     region on the terrain inside which meshes should be scattered. The `x`
 *     and `y` properties indicate the upper-left corner of the box and the `w`
 *     and `h` properties indicate its width and height, respectively, in units
 *     of terrain segments (like those specified in the `options` parameter for
 *     the `THREE.Terrain` function). `x` and `y` default to zero, but `w` and
 *     `h` are required.
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
        sizeVariance: 0.1,
        randomness: Math.random,
        maxSlope: 0.6283185307179586, // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
        x: 0,
        y: 0,
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
        doubleSizeVariance = options.sizeVariance * 2,
        v = geometry.vertices,
        meshes = [],
        up = options.mesh.up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5*Math.PI);
    if (spreadIsNumber) {
        randomHeightmap = options.randomness();
        randomness = typeof randomHeightmap === 'number' ? Math.random : function(k) { return randomHeightmap[k]; };
    }
    geometry.computeFaceNormals();
    for (var i = options.y, w = options.w*2; i < w; i++) {
        for (var j = options.x, h = options.h; j < h; j++) {
            var key = j*w + i,
                f = geometry.faces[key];
            if (spreadIsNumber ? randomness(key) < options.spread : options.spread(v[f.a], key)) {
                // Don't place a mesh if the angle is too steep.
                if (f.normal.angleTo(up) > options.maxSlope) {
                    continue;
                }
                var mesh = options.mesh.clone();
                //mesh.geometry.computeBoundingBox();
                mesh.position.copy(v[f.a]).add(v[f.b]).add(v[f.c]).divideScalar(3);
                //mesh.translateZ((mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z) * 0.5);
                var normal = mesh.position.clone().add(f.normal);
                mesh.lookAt(normal);
                mesh.rotation.x += 90 / 180 * Math.PI;
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
    var heightmap = THREE.Terrain.heightmapArray(method, clonedOptions);

    for (var i = 0, l = heightmap.length; i < l; i++) {
        if (i % skip || Math.random() > threshold) {
            heightmap[i] = 1;
        }
    }
    return function() {
        return heightmap;
    };
};

/**
 * Generate a set of points using Poisson disk sampling.
 *
 * Useful for clustering scattered meshes and Voronoi cells for Worley noise.
 *
 * Ported from pseudocode at http://devmag.org.za/2009/05/03/poisson-disk-sampling/
 *
 * @param {Object} options
 *   A map of settings that control how the resulting noise should be generated
 *   (with the same parameters as the `options` parameter to the
 *   `THREE.Terrain` function).
 *
 * @return {THREE.Vector2[]}
 *   An array of points.
 */
THREE.Terrain.PoissonDisks = function(options) {
    function removeAndReturnRandomElement(arr) {
        return arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
    }

    function putInGrid(grid, point, cellSize) {
        var gx = Math.floor(point.x / cellSize), gy = Math.floor(point.y / cellSize);
        if (!grid[gx]) grid[gx] = [];
        grid[gx][gy] = point;
    }

    function inRectangle(point) {
        return  point.x >= 0 &&
                point.y >= 0 &&
                point.x <= options.xSegments+1 &&
                point.y <= options.ySegments+1;
    }

    function inNeighborhood(grid, point, minDist, cellSize) {
        var gx = Math.floor(point.x / cellSize),
            gy = Math.floor(point.y / cellSize);
        for (var x = gx - 1; x <= gx + 1; x++) {
            for (var y = gy - 1; y <= gy + 1; y++) {
                if (x !== gx && y !== gy &&
                    typeof grid[x] !== 'undefined' && typeof grid[x][y] !== 'undefined') {
                    var cx = x * cellSize, cy = y * cellSize;
                    if (Math.sqrt((point.x - cx) * (point.x - cx) + (point.y - cy) * (point.y - cy)) < minDist) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function generateRandomPointAround(point, minDist) {
        var radius = minDist * (Math.random() + 1),
            angle = 2 * Math.PI * Math.random();
        return new THREE.Vector2(
            point.x + radius * Math.cos(angle),
            point.y + radius * Math.sin(angle)
        );
    }

    var numPoints = Math.floor(Math.sqrt(options.xSegments * options.ySegments * 0.5 / options.frequency)) || 1,
        minDist = Math.sqrt((options.xSegments + options.ySegments) * options.frequency),
        cellSize = minDist / Math.sqrt(2);
    if (cellSize < 2) cellSize = 2;

    var grid = [];

    var processList = [],
        samplePoints = [];

    var firstPoint = new THREE.Vector2(
        Math.random() * options.xSegments,
        Math.random() * options.ySegments
    );
    processList.push(firstPoint);
    samplePoints.push(firstPoint);
    putInGrid(grid, firstPoint, cellSize);

    var count = 0;
    while (processList.length) {
        var point = removeAndReturnRandomElement(processList);
        for (var i = 0; i < numPoints; i++) {
            // optionally, minDist = perlin(point.x / options.xSegments, point.y / options.ySegments)
            var newPoint = generateRandomPointAround(point, minDist);
            if (inRectangle(newPoint) && !inNeighborhood(grid, newPoint, minDist, cellSize)) {
                processList.push(newPoint);
                samplePoints.push(newPoint);
                putInGrid(grid, newPoint, cellSize);
                if (samplePoints.length >= numPoints) break;
            }
        }
        if (samplePoints.length >= numPoints) break;
        // Sanity check
        if (++count > numPoints*numPoints) {
            break;
        }
    }
    return samplePoints;
};
