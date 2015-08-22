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
    // geometry.computeFaceNormals();
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
                // mesh.geometry.computeBoundingBox();
                mesh.position.copy(v[f.a]).add(v[f.b]).add(v[f.c]).divideScalar(3);
                // mesh.translateZ((mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z) * 0.5);
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
