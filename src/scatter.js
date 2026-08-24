import * as THREE from 'three';
import { TerrainNS } from './core.js';
import { cloneGeometryWithVertexColors, cloneMaterialWithVertexColors, getTintRange } from './tint.js';

function setScatterTransform(mesh, vertex1, vertex2, vertex3, faceNormal, up, options) {
    mesh.position.addVectors(vertex1, vertex2).add(vertex3).divideScalar(3);
    if (options.positionJitter > 0) {
        var u = Math.random(),
            v = Math.random();
        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }
        var weight1 = 1 - u - v,
            jitter = Math.max(0, options.positionJitter),
            randomX = vertex1.x * weight1 + vertex2.x * u + vertex3.x * v,
            randomY = vertex1.y * weight1 + vertex2.y * u + vertex3.y * v,
            randomZ = vertex1.z * weight1 + vertex2.z * u + vertex3.z * v;
        mesh.position.x += (randomX - mesh.position.x) * jitter;
        mesh.position.y += (randomY - mesh.position.y) * jitter;
        mesh.position.z += (randomZ - mesh.position.z) * jitter;
    }
    if (options.maxTilt > 0) {
        var normal = mesh.position.clone().add(faceNormal);
        mesh.lookAt(normal);
        var tiltAngle = faceNormal.angleTo(up);
        if (tiltAngle > options.maxTilt) {
            var ratio = options.maxTilt / tiltAngle;
            mesh.rotation.x *= ratio;
            mesh.rotation.y *= ratio;
            mesh.rotation.z *= ratio;
        }
    }
    mesh.rotation.x += 90 / 180 * Math.PI;
    if (options.randomRotationAxis === 'z') {
        mesh.rotateZ(Math.random() * 2 * Math.PI);
    }
    else {
        mesh.rotateY(Math.random() * 2 * Math.PI);
    }
    if (options.sizeVariance) {
        var variance = Math.random() * options.sizeVariance * 2 - options.sizeVariance;
        if (options.nonUniformSizeVariance) {
            mesh.scale.x *= 1 + variance;
            mesh.scale.y *= 1 + variance * (0.75 + Math.random() * 0.5);
            mesh.scale.z *= 1 + (Math.random() * options.sizeVariance * 2 - options.sizeVariance);
        }
        else {
            mesh.scale.x = mesh.scale.z = 1 + variance;
            mesh.scale.y += variance;
        }
    }
    mesh.updateMatrix();
}

function createRandomScatterGeometry(geometry, options) {
    geometry.computeBoundingBox();
    var source = geometry.index ? geometry.toNonIndexed() : geometry,
        sourceArray = source.attributes.position.array,
        faceCount = sourceArray.length / 9,
        sampleCount = Math.max(1, Math.floor(options.sampleCount || faceCount)),
        bounds = geometry.boundingBox,
        horizontalArea = bounds ? Math.max(1, (bounds.max.x - bounds.min.x) * (bounds.max.y - bounds.min.y)) : 1,
        minimumDistance = typeof options.randomDistributionMinDistance === 'number' ?
            Math.max(0, options.randomDistributionMinDistance) :
            Math.sqrt(horizontalArea / sampleCount) * 0.34,
        minimumDistanceSquared = minimumDistance * minimumDistance,
        cellSize = Math.max(1, minimumDistance),
        occupied = {},
        sampledPositions = [],
        vertex1 = new THREE.Vector3(),
        vertex2 = new THREE.Vector3(),
        vertex3 = new THREE.Vector3(),
        faceNormal = new THREE.Vector3(),
        sample = new THREE.Vector3();
    for (var sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
        var faceIndex = Math.floor(Math.random() * faceCount),
            offset = faceIndex * 9;
        vertex1.fromArray(sourceArray, offset);
        vertex2.fromArray(sourceArray, offset + 3);
        vertex3.fromArray(sourceArray, offset + 6);
        THREE.Triangle.getNormal(vertex1, vertex2, vertex3, faceNormal);

        var u = Math.random(),
            v = Math.random();
        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }
        var weight1 = 1 - u - v;
        sample.set(
            vertex1.x * weight1 + vertex2.x * u + vertex3.x * v,
            vertex1.y * weight1 + vertex2.y * u + vertex3.y * v,
            vertex1.z * weight1 + vertex2.z * u + vertex3.z * v
        );
        if (typeof options.spread === 'function') {
            if (!options.spread(sample, faceIndex, faceNormal, offset)) continue;
        }
        else if (typeof options.spread === 'number' && Math.random() >= options.spread) {
            continue;
        }

        if (minimumDistance > 0) {
            var cellX = Math.floor(sample.x / cellSize),
                cellY = Math.floor(sample.y / cellSize),
                tooClose = false;
            for (var neighborX = cellX - 2; neighborX <= cellX + 2 && !tooClose; neighborX++) {
                for (var neighborY = cellY - 2; neighborY <= cellY + 2; neighborY++) {
                    var nearby = occupied[neighborX + ':' + neighborY];
                    if (nearby) {
                        for (var nearbyIndex = 0; nearbyIndex < nearby.length; nearbyIndex++) {
                            var dx = nearby[nearbyIndex].x - sample.x,
                                dy = nearby[nearbyIndex].y - sample.y;
                            if (dx * dx + dy * dy < minimumDistanceSquared) {
                                tooClose = true;
                                break;
                            }
                        }
                    }
                    if (tooClose) break;
                }
            }
            if (tooClose) continue;
            var cellKey = cellX + ':' + cellY;
            if (!occupied[cellKey]) occupied[cellKey] = [];
            occupied[cellKey].push({x: sample.x, y: sample.y});
        }

        // Preserve the source face normal while making a tiny triangle whose
        // centroid is exactly the sampled point. ScatterMeshes then applies
        // its normal/slope and instancing logic without reintroducing a grid.
        var epsilon = 0.01,
            centroid = vertex1.clone().add(vertex2).add(vertex3).divideScalar(3);
        vertex1.sub(centroid).multiplyScalar(epsilon).add(sample);
        vertex2.sub(centroid).multiplyScalar(epsilon).add(sample);
        vertex3.sub(centroid).multiplyScalar(epsilon).add(sample);
        sampledPositions.push(
            vertex1.x, vertex1.y, vertex1.z,
            vertex2.x, vertex2.y, vertex2.z,
            vertex3.x, vertex3.y, vertex3.z
        );
    }
    var sampledGeometry = new THREE.BufferGeometry();
    sampledGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sampledPositions, 3));
    return sampledGeometry;
}

/**
 * Scatter a mesh across the terrain.
 *
 * @param {THREE.BufferGeometry} geometry
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
 *   - `randomRotationAxis`: Selects the local axis used for the random heading
 *     applied after the scatterer's legacy +90deg X correction. Most meshes
 *     use local Y as their up axis. Use `'z'` when the prototype's up axis is
 *     local Z after that correction, as with a vertical blade mesh.
 *   - `positionJitter`: The amount to move each placement from the face
 *     centroid to a random point inside that face. Defaults to 0.
 *   - `instancesPerFace`: The number of copies to place on each accepted
 *     face. Defaults to 1.
 *   - `randomDistribution`: Sample random points across the source faces
 *     instead of placing on each face in sequence. Defaults to false.
 *   - `sampleCount`: Number of random distribution candidates to try.
 *   - `randomDistributionMinDistance`: Minimum horizontal separation between
 *     random distribution points. Defaults to a density-based spacing.
 *   - `instanced`: If true and `mesh` is a single `THREE.Mesh`, place all
 *     instances in one `THREE.InstancedMesh`. Object3D groups fall back to
 *     individual clones.
 *   - `tintRange`: Optional `[minColor, maxColor]` or `{min, max}` color range.
 *     When instancing, each instance receives a random tint between the two
 *     colors through `InstancedMesh.instanceColor`.
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
TerrainNS.ScatterMeshes = function(geometry, options) {
    if (!options.mesh) {
        console.error('options.mesh is required for THREE.Terrain.ScatterMeshes but was not passed');
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
        randomRotationAxis: 'y',
        positionJitter: 0,
        instancesPerFace: 1,
        w: 0,
        h: 0,
        instanced: false,
        tintRange: null,
    };
    for (var opt in defaultOptions) {
        if (defaultOptions.hasOwnProperty(opt)) {
            options[opt] = typeof options[opt] === 'undefined' ? defaultOptions[opt] : options[opt];
        }
    }

    if (options.randomDistribution) {
        geometry = createRandomScatterGeometry(geometry, options);
        options.spread = function() { return true; };
        options.positionJitter = 0;
    }

    var useInstancing = !!options.instanced && options.mesh.isMesh && !options.mesh.children.length,
        tintRange = getTintRange(options.tintRange),
        instanceData = useInstancing ? [] : null,
        instanceTransform = useInstancing ? new THREE.Object3D() : null,
        spreadIsNumber = typeof options.spread === 'number',
        randomHeightmap,
        randomness,
        spreadRange = 1 / options.smoothSpread,
        vertex1 = new THREE.Vector3(),
        vertex2 = new THREE.Vector3(),
        vertex3 = new THREE.Vector3(),
        faceNormal = new THREE.Vector3(),
        instancesPerFace = Math.max(1, Math.floor(options.instancesPerFace)),
        up = options.mesh.up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5*Math.PI);
    if (options.instanced && !useInstancing) {
        console.warn('THREE.Terrain.ScatterMeshes can only instance a single THREE.Mesh; falling back to clones');
    }
    if (tintRange && !useInstancing) {
        console.warn('THREE.Terrain.ScatterMeshes applies tintRange only when instanced is true');
    }
    if (spreadIsNumber) {
        randomHeightmap = options.randomness();
        randomness = typeof randomHeightmap === 'number' ? Math.random : function(k) { return randomHeightmap[k]; };
    }

    if (geometry.index) geometry = geometry.toNonIndexed();
    var gArray = geometry.attributes.position.array;
    for (var i = 0; i < geometry.attributes.position.array.length; i += 9) {
        vertex1.set(gArray[i + 0], gArray[i + 1], gArray[i + 2]);
        vertex2.set(gArray[i + 3], gArray[i + 4], gArray[i + 5]);
        vertex3.set(gArray[i + 6], gArray[i + 7], gArray[i + 8]);
        THREE.Triangle.getNormal(vertex1, vertex2, vertex3, faceNormal);

        var place = false;
        if (spreadIsNumber) {
            var rv = randomness(i/9);
            if (rv < options.spread) {
                place = true;
            }
            else if (rv < options.spread + options.smoothSpread) {
                // Interpolate rv between spread and spread + smoothSpread,
                // then multiply that "easing" value by the probability
                // that a mesh would get placed on a given face.
                place = TerrainNS.EaseInOut((rv - options.spread) * spreadRange) * options.spread > Math.random();
            }
        }
        else {
            place = options.spread(vertex1, i / 9, faceNormal, i);
        }
        if (place) {
            // Don't place a mesh if the angle is too steep.
            if (faceNormal.angleTo(up) > options.maxSlope) {
                continue;
            }
            for (var placement = 0; placement < instancesPerFace; placement++) {
                if (useInstancing) {
                    instanceTransform.position.copy(options.mesh.position);
                    instanceTransform.quaternion.copy(options.mesh.quaternion);
                    instanceTransform.scale.copy(options.mesh.scale);
                    setScatterTransform(instanceTransform, vertex1, vertex2, vertex3, faceNormal, up, options);
                    var instance = {
                        matrix: instanceTransform.matrix.clone(),
                        position: instanceTransform.position.clone(),
                    };
                    if (tintRange) {
                        instance.tint = new THREE.Color().lerpColors(tintRange.min, tintRange.max, Math.random());
                    }
                    instanceData.push(instance);
                }
                else {
                    var mesh = options.mesh.clone();
                    setScatterTransform(mesh, vertex1, vertex2, vertex3, faceNormal, up, options);
                    options.scene.add(mesh);
                }
            }
        }
    }

    if (useInstancing && instanceData.length) {
        var instanceGeometry = tintRange ? cloneGeometryWithVertexColors(options.mesh.geometry) : options.mesh.geometry,
            instanceMaterial = tintRange ? cloneMaterialWithVertexColors(options.mesh.material) : options.mesh.material,
            instances = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, instanceData.length),
            lodMatrices = new Float32Array(instanceData.length * 16),
            lodPositions = new Float32Array(instanceData.length * 3),
            lodColors = tintRange ? new Float32Array(instanceData.length * 3) : null;
        instances.name = (options.mesh.name || 'ScatteredMesh') + ' Instances';
        instances.castShadow = options.mesh.castShadow;
        instances.receiveShadow = options.mesh.receiveShadow;
        instances.frustumCulled = options.mesh.frustumCulled;
        instances.renderOrder = options.mesh.renderOrder;
        for (var instanceIndex = 0; instanceIndex < instanceData.length; instanceIndex++) {
            instances.setMatrixAt(instanceIndex, instanceData[instanceIndex].matrix);
            lodMatrices.set(instanceData[instanceIndex].matrix.elements, instanceIndex * 16);
            lodPositions.set(instanceData[instanceIndex].position.toArray(), instanceIndex * 3);
            if (tintRange) {
                instances.setColorAt(instanceIndex, instanceData[instanceIndex].tint);
                lodColors.set([
                    instanceData[instanceIndex].tint.r,
                    instanceData[instanceIndex].tint.g,
                    instanceData[instanceIndex].tint.b,
                ], instanceIndex * 3);
            }
        }
        instances.userData.instancedLOD = {
            colors: lodColors,
            matrices: lodMatrices,
            positions: lodPositions,
            initialized: false,
            lastDistance: -1,
            lastUpdate: 0,
        };
        instances.instanceMatrix.needsUpdate = true;
        if (instances.instanceColor) {
            instances.instanceColor.needsUpdate = true;
        }
        instances.computeBoundingSphere();
        options.scene.add(instances);
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
TerrainNS.ScatterHelper = function(method, options, skip, threshold) {
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
    var heightmap = TerrainNS.heightmapArray(method, clonedOptions);

    for (var i = 0, l = heightmap.length; i < l; i++) {
        if (i % skip || Math.random() > threshold) {
            heightmap[i] = 1; // 0 = place, 1 = don't place
        }
    }
    return function() {
        return heightmap;
    };
};
