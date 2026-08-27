import * as THREE from 'three';
import Terrain, {
    TerrainNS,
    createGrass,
    generateBlendedMaterial,
    grassClusterWeight,
    grassMeshWeight,
    updateGrass,
    updateGrassLOD,
} from '../src/index.js';
import { getTerrainHeight as sampleTerrainHeight } from '../src/core.js';
import { isNearScatterGroup } from '../src/scatter.js';
import { createRandomSeed, createSeededRandom } from '../src/random.js';
import { createFlowerMesh } from './flowers.js';
import { Tree } from '../vendor/eztree/build/eztree.module.js';

var DEMO_DECORATION_SEED = 0x9e3779b9,
    TREE_MINIMUM_DISTANCE = 36,
    FLOWER_TREE_MINIMUM_DISTANCE = 24,
    FLOWER_MINIMUM_DISTANCE = 8,
    FLOWER_SAMPLE_MULTIPLIER = 1.2,
    FLOWER_COVERAGE = 0.22,
    FLOWER_HEIGHT_FRACTION = 0.72,
    TERRAIN_UP = new THREE.Vector3(0, 0, 1);

/**
 * Create the part of the demo that exercises the terrain library.
 *
 * This module owns terrain generation, material blending, smoothing, terrain
 * influences, tree and flower scattering, grass scattering, wind, and grass
 * LOD. Browser controls and presentation code pass their state through
 * `options`.
 *
 * @param {Object} options
 *   Scene, renderer, settings, terrain seed, optional decoration seed, world,
 *   analytics, and heightmap canvas.
 * @return {Object}
 *   Landscape operations and accessors used by the browser entry point.
 */
export function createLandscape(options) {
    var scene = options.scene,
        renderer = options.renderer,
        settings = options.settings,
        world = options.world,
        analytics = options.analytics,
        heightmapImage = options.heightmapImage,
        heightmapCanvas = options.heightmapCanvas,
        demoSeed = options.seed >>> 0,
        decorationSeed = typeof options.decorationSeed === 'number' ? options.decorationSeed >>> 0 :
            (demoSeed + DEMO_DECORATION_SEED) >>> 0,
        demoStatic = !!options.demoStatic,
        terrainScene = null,
        decoScene = null,
        grassScene = null,
        grassMesh = null,
        flowerMeshes = null,
        lastOptions = null,
        terrainRandom,
        decorationRandom,
        blend = null,
        treeMeshCache = {},
        mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true}),
        gray = new THREE.MeshPhongMaterial({color: 0x88aaaa, specular: 0x444455, shininess: 10});

    /**
     * Reset the deterministic random stream for one generation phase.
     *
     * Terrain and decoration use separate streams. A change in decoration
     * density therefore does not change the generated heightmap.
     *
     * @param {string} phase
     *   Either `terrain` or `decoration`.
     * @return {Function}
     *   The phase-specific random source.
     */
    function resetRandomness(phase) {
        var seed = phase === 'decoration' ? decorationSeed : demoSeed,
            random = createSeededRandom(seed);
        if (phase === 'decoration') decorationRandom = random;
        else terrainRandom = random;
        return random;
    }

    /**
     * Set the seed used by terrain generation.
     *
     * @param {number} seed
     *   Unsigned terrain seed.
     */
    function setTerrainSeed(seed) {
        demoSeed = seed >>> 0;
    }

    /**
     * Set the seed used by tree, bush, flower, and grass scattering.
     *
     * Clearing the tree cache is important because eztree uses its seed when
     * generating branch and leaf geometry, not only when choosing placement
     * positions. Grass and flowers use the same stream for placement and
     * per-instance variation choices.
     *
     * @param {number} seed
     *   Unsigned decoration seed.
     */
    function setDecorationSeed(seed) {
        decorationSeed = seed >>> 0;
        treeMeshCache = {};
    }

    /**
     * Return a deterministic tree seed for a preset name.
     *
     * @param {string} preset
     *   Eztree preset name.
     * @return {number}
     *   Unsigned tree seed.
     */
    function getTreeSeed(preset) {
        var hash = 2166136261;
        for (var index = 0; index < preset.length; index++) {
            hash ^= preset.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (decorationSeed ^ hash) >>> 0;
    }

    /**
     * Apply the selected edge filter to generated terrain vertices.
     *
     * @param {Float32Array} vertices
     *   Generated terrain vertex coordinates.
     * @param {Object} terrainOptions
     *   Terrain options used by the edge filter.
     */
    function applyEdges(vertices, terrainOptions) {
        if (settings.edgeDirection === 'Normal') return;
        var edgeFilter = settings.edgeType === 'Box' ? TerrainNS.Edges : TerrainNS.RadialEdges,
            distance = settings.edgeType === 'Box' ?
                settings.edgeDistance :
                Math.min(terrainOptions.xSize, terrainOptions.ySize) * 0.5 - settings.edgeDistance;
        edgeFilter(
            vertices,
            terrainOptions,
            settings.edgeDirection === 'Up',
            distance,
            TerrainNS[settings.edgeCurve]
        );
    }

    /**
     * Return the probability used by the altitude-based tree distribution.
     *
     * @param {number} height
     *   Terrain-local height.
     * @return {number}
     *   Placement probability.
     */
    function altitudeProbability(height) {
        if (height > -80 && height < -50) {
            return TerrainNS.EaseInOut((height + 80) / 30) * settings.spread * 0.002;
        }
        if (height > -50 && height < 20) return settings.spread * 0.002;
        if (height > 20 && height < 50) {
            return TerrainNS.EaseInOut((height - 20) / 30) * settings.spread * 0.002;
        }
        return 0;
    }

    /**
     * Return a spread callback for the altitude scattering mode.
     *
     * @param {Vector3} vertex
     *   Face vertex being tested.
     * @param {number} faceIndex
     *   Face index.
     * @return {boolean}
     *   Whether the face can receive a tree.
     */
    function altitudeSpread(vertex, faceIndex) {
        return faceIndex % 4 === 0 && decorationRandom() < altitudeProbability(vertex.z);
    }

    /**
     * Generate the custom influence stack used by the demo.
     *
     * @param {Float32Array} geometry
     *   Heightmap vertex array.
     * @param {Object} terrainOptions
     *   Terrain generation options.
     */
    function customInfluences(geometry, terrainOptions) {
        var clonedOptions = {},
            option;
        for (option in terrainOptions) {
            if (terrainOptions.hasOwnProperty(option)) clonedOptions[option] = terrainOptions[option];
        }
        clonedOptions.maxHeight = terrainOptions.maxHeight * 0.67;
        clonedOptions.minHeight = terrainOptions.minHeight * 0.67;
        TerrainNS.DiamondSquare(geometry, clonedOptions);

        var radius = Math.min(terrainOptions.xSize, terrainOptions.ySize) * 0.21,
            height = terrainOptions.maxHeight * 0.8;
        TerrainNS.Influence(
            geometry,
            terrainOptions,
            TerrainNS.Influences.Hill,
            0.25,
            0.25,
            radius,
            height,
            THREE.AdditiveBlending,
            TerrainNS.Linear
        );
        TerrainNS.Influence(
            geometry,
            terrainOptions,
            TerrainNS.Influences.Mesa,
            0.75,
            0.75,
            radius,
            height,
            THREE.SubtractiveBlending,
            TerrainNS.EaseInStrong
        );
        TerrainNS.Influence(
            geometry,
            terrainOptions,
            TerrainNS.Influences.Flat,
            0.75,
            0.25,
            radius,
            terrainOptions.maxHeight,
            THREE.NormalBlending,
            TerrainNS.EaseIn
        );
        TerrainNS.Influence(
            geometry,
            terrainOptions,
            TerrainNS.Influences.Volcano,
            0.25,
            0.75,
            radius,
            terrainOptions.maxHeight,
            THREE.NormalBlending,
            TerrainNS.EaseInStrong
        );
    }

    /**
     * Apply the selected smoothing operation to the current terrain mesh.
     *
     * @param {string} smoothing
     *   Name of the smoothing operation.
     * @param {Object} terrainOptions
     *   Options used to normalize the changed geometry.
     */
    function applySmoothing(smoothing, terrainOptions) {
        if (!terrainScene || !terrainScene.children[0]) return;
        var mesh = terrainScene.children[0],
            values = TerrainNS.toArray1D(mesh.geometry.attributes.position.array);
        if (smoothing === 'Conservative (0.5)') TerrainNS.SmoothConservative(values, terrainOptions, 0.5);
        if (smoothing === 'Conservative (1)') TerrainNS.SmoothConservative(values, terrainOptions, 1);
        if (smoothing === 'Conservative (10)') TerrainNS.SmoothConservative(values, terrainOptions, 10);
        else if (smoothing === 'Gaussian (0.5, 7)') TerrainNS.Gaussian(values, terrainOptions, 0.5, 7);
        else if (smoothing === 'Gaussian (1.0, 7)') TerrainNS.Gaussian(values, terrainOptions, 1, 7);
        else if (smoothing === 'Gaussian (1.5, 7)') TerrainNS.Gaussian(values, terrainOptions, 1.5, 7);
        else if (smoothing === 'Gaussian (1.0, 5)') TerrainNS.Gaussian(values, terrainOptions, 1, 5);
        else if (smoothing === 'Gaussian (1.0, 11)') TerrainNS.Gaussian(values, terrainOptions, 1, 11);
        else if (smoothing === 'GaussianBox') TerrainNS.GaussianBoxBlur(values, terrainOptions, 1, 3);
        else if (smoothing === 'Mean (0)') TerrainNS.Smooth(values, terrainOptions, 0);
        else if (smoothing === 'Mean (1)') TerrainNS.Smooth(values, terrainOptions, 1);
        else if (smoothing === 'Mean (8)') TerrainNS.Smooth(values, terrainOptions, 8);
        else if (smoothing === 'Median') TerrainNS.SmoothMedian(values, terrainOptions);
        TerrainNS.fromArray1D(mesh.geometry.attributes.position.array, values);
        TerrainNS.Normalize(mesh, terrainOptions);
    }

    /**
     * Build one tree prototype from a vendored eztree preset.
     *
     * @param {number} seed
     *   Tree seed.
     * @param {string} preset
     *   Eztree preset name.
     * @return {THREE.Object3D}
     *   Generated tree prototype.
     */
    function buildTree(seed, preset) {
        var tree = new Tree();
        tree.loadPreset(preset || 'Oak Medium');
        tree.options.seed = typeof seed === 'number' ? seed : tree.options.seed;
        var isBush = /^Bush /.test(preset || '');
        if (!isBush) {
            tree.options.leaves.count = 48;
            tree.options.leaves.size = 2.8;
            tree.options.leaves.sizeVariance = 0.8;
            tree.options.leaves.tint = 0xabc06b;
        }
        tree.options.bark.textureScale.y = 8;
        tree.scale.set(0.82, 0.82, 0.82);
        tree.generate();
        tree.leavesMesh.material.emissive.set(0x2d471a);
        tree.leavesMesh.material.emissiveIntensity = 0.28;
        tree.name = 'Eztree ' + (preset || 'Oak Medium');
        return tree;
    }

    /**
     * Return a cached tree prototype for a preset.
     *
     * @param {string} preset
     *   Eztree preset name.
     * @return {THREE.Object3D}
     *   Cached generated prototype.
     */
    function getTreeMesh(preset) {
        var cacheKey = decorationSeed + ':' + preset;
        if (!treeMeshCache[cacheKey]) treeMeshCache[cacheKey] = buildTree(getTreeSeed(preset), preset);
        return treeMeshCache[cacheKey];
    }

    /**
     * Rebuild the procedural grass prototype from the current settings.
     */
    function rebuildGrassMesh() {
        var grassHeight = Math.max(settings.grassHeightMin, settings.grassHeightMax),
            grassWidth = Math.max(settings.grassWidthMin, settings.grassWidthMax);
        grassMesh = createGrass({
            alphaTest: settings.grassAlphaTest,
            bladeCount: 24,
            color: 0xffffff,
            emissive: 0x1f3215,
            emissiveIntensity: 0.08,
            height: grassHeight,
            minimumLight: settings.grassMinimumLight,
            name: 'Dense Grass Patch',
            width: grassWidth,
            windSpeed: settings.grassWindSpeed,
            windStrength: settings.grassWindStrength,
        });
    }

    /**
     * Scatter trees, flowers, and grass across the current terrain mesh.
     */
    function scatterMeshes() {
        if (!terrainScene || !terrainScene.children[0]) return;
        var random = resetRandomness('decoration'),
            segments = parseInt(settings.segments, 10),
            spread,
            randomness,
            scatterOptions = {
                xSegments: segments,
                ySegments: Math.round(segments * settings.widthLengthRatio),
                random: random,
            };
        if (settings.scattering === 'Linear') {
            spread = settings.spread * 0.0005;
            randomness = random;
        }
        else if (settings.scattering === 'Altitude') {
            spread = altitudeSpread;
        }
        else if (settings.scattering === 'PerlinAltitude') {
            spread = (function() {
                var heightmap = TerrainNS.ScatterHelper(TerrainNS.Perlin, scatterOptions, 2, 0.125)(),
                    threshold = TerrainNS.InEaseOut(settings.spread * 0.01);
                return function(vertex, faceIndex) {
                    var value = heightmap[faceIndex],
                        place = value < threshold;
                    if (!place && value < threshold + 0.2) {
                        place = TerrainNS.EaseInOut((value - threshold) * 5) * threshold < random();
                    }
                    return random() < altitudeProbability(vertex.z) * 5 && place;
                };
            })();
        }
        else {
            spread = TerrainNS.InEaseOut(settings.spread * 0.01) *
                (settings.scattering === 'Worley' ? 1 : 0.5);
            randomness = TerrainNS.ScatterHelper(TerrainNS[settings.scattering], scatterOptions, 2, 0.125);
        }

        var geometry = terrainScene.children[0].geometry;
        if (decoScene) terrainScene.remove(decoScene);
        var useWoodlandDistribution = settings.scattering === 'PerlinAltitude',
            treePresets = ['Oak Medium', 'Ash Medium', 'Aspen Medium', 'Bush 1', 'Bush 2', 'Bush 3'],
            treeSampleMultiplier = Math.max(1, settings.spread / 60),
            treeSampleCount = Math.max(1, Math.round(segments * segments * 0.03 * treeSampleMultiplier)),
            // Keep trunks and central crowns from sharing a patch of ground,
            // while allowing neighboring trees to form a woodland instead of
            // spacing the whole grove at the width of the largest canopy.
            treePlacementGroup = {minimumDistance: TREE_MINIMUM_DISTANCE};
        decoScene = new THREE.Object3D();
        for (var treeMeshIndex = 0; treeMeshIndex < treePresets.length; treeMeshIndex++) {
            TerrainNS.ScatterMeshes(geometry, {
                scene: decoScene,
                mesh: getTreeMesh(treePresets[treeMeshIndex]),
                w: segments,
                h: Math.round(segments * settings.widthLengthRatio),
                randomDistribution: useWoodlandDistribution,
                randomDistributionMinDistance: TREE_MINIMUM_DISTANCE,
                minimumDistance: TREE_MINIMUM_DISTANCE,
                minimumDistanceGroup: treePlacementGroup,
                sampleCount: treeSampleCount,
                filter: function(vertex, faceNormal) {
                    var slope = faceNormal ? faceNormal.angleTo(TERRAIN_UP) : Math.PI;
                    return grassMeshWeight(vertex.z, slope) > 0;
                },
                spread: useWoodlandDistribution ? function(vertex) {
                    return vertex.z > -100 && vertex.z < 100 &&
                        random() < Math.min(1, settings.spread / 60);
                } : spread,
                random: random,
                smoothSpread: settings.scattering === 'Linear' ? 0 : 0.2,
                randomness: randomness,
                maxSlope: 0.6283185307179586,
                maxTilt: 0.15707963267948966,
                sizeVariance: 0.22,
            });
        }

        // Flowers use a denser, independent spacing grid so the two types can
        // be more common than trees. The filter still reads the accepted tree
        // positions above and rejects any candidate inside the tree clearance.
        if (settings.grassEnabled && settings.grassDensity > 0 && settings.texture === 'Blended' && blend) {
            var flowerPlacementGroup = {minimumDistance: FLOWER_MINIMUM_DISTANCE},
                flowerSampleCount = Math.max(1, Math.round(
                    segments * segments * FLOWER_SAMPLE_MULTIPLIER
                )),
                averageGrassHeight = Math.max(0.5, (
                    Number(settings.grassHeightMin) + Number(settings.grassHeightMax)
                ) * 0.5),
                flowerFilter = function(vertex, faceNormal) {
                    var slope = faceNormal ? faceNormal.angleTo(TERRAIN_UP) : Math.PI;
                    return grassMeshWeight(vertex.z, slope) > 0 &&
                        !isNearScatterGroup(vertex, treePlacementGroup, FLOWER_TREE_MINIMUM_DISTANCE);
                },
                flowerSpread = function(vertex, faceIndex, faceNormal) {
                    var slope = faceNormal ? faceNormal.angleTo(TERRAIN_UP) : Math.PI,
                        coverage = grassMeshWeight(vertex.z, slope);
                    if (coverage <= 0) return false;
                    coverage *= grassClusterWeight(vertex.x, vertex.y);
                    return random() < coverage * FLOWER_COVERAGE;
                },
                flowerTypes = [flowerMeshes.buttercup, flowerMeshes.aster];
            for (var flowerIndex = 0; flowerIndex < flowerTypes.length; flowerIndex++) {
                var flowerMesh = flowerTypes[flowerIndex],
                    flowerScale = averageGrassHeight * FLOWER_HEIGHT_FRACTION /
                        Math.max(0.001, flowerMesh.userData.flowerHeight);
                flowerMesh.scale.setScalar(flowerScale);
                TerrainNS.ScatterMeshes(geometry, {
                    scene: decoScene,
                    mesh: flowerMesh,
                    w: segments,
                    h: Math.round(segments * settings.widthLengthRatio),
                    filter: flowerFilter,
                    instanced: true,
                    maxSlope: settings.grassMaxSlope,
                    maxTilt: 0,
                    minimumDistance: FLOWER_MINIMUM_DISTANCE,
                    minimumDistanceGroup: flowerPlacementGroup,
                    random: random,
                    randomDistribution: true,
                    randomDistributionMinDistance: FLOWER_MINIMUM_DISTANCE,
                    randomRotationAxis: 'y',
                    sampleCount: flowerSampleCount,
                    nonUniformSizeVariance: true,
                    sizeVariance: 0.12,
                    spread: flowerSpread,
                });
            }
        }
        terrainScene.add(decoScene);

        if (grassScene) terrainScene.remove(grassScene);
        grassScene = null;
        if (settings.grassEnabled && settings.grassDensity > 0 && settings.texture === 'Blended' && blend) {
            var grassHeightMin = Math.min(settings.grassHeightMin, settings.grassHeightMax),
                grassHeightMax = Math.max(settings.grassHeightMin, settings.grassHeightMax),
                grassWidthMin = Math.min(settings.grassWidthMin, settings.grassWidthMax),
                grassWidthMax = Math.max(settings.grassWidthMin, settings.grassWidthMax),
                widthMinimumScale = grassWidthMin / Math.max(0.001, grassWidthMax),
                heightMinimumScale = grassHeightMin / Math.max(0.001, grassHeightMax);
            grassScene = TerrainNS.ScatterGrass(geometry, {
                h: Math.round(segments * settings.widthLengthRatio),
                instanced: true,
                maxSlope: settings.grassMaxSlope,
                maxTilt: 0,
                mesh: grassMesh,
                nonUniformSizeVariance: true,
                randomDistribution: true,
                randomDistributionMinDistance: Math.max(0.55, 2.8 - settings.grassPositionJitter * 0.7),
                randomRotationAxis: 'y',
                sampleCount: Math.round(segments * segments * 26 * settings.grassDensity),
                positionJitter: 0,
                sizeRange: {
                    easing: TerrainNS[settings.grassSizeEasing] || TerrainNS.Linear,
                    x: [widthMinimumScale, 1],
                    y: [heightMinimumScale, 1],
                    z: [widthMinimumScale, 1],
                },
                sizeVariance: 0,
                tintRange: {
                    min: settings.grassTintLow,
                    max: settings.grassTintHigh,
                },
                spread: function(vertex, faceIndex, faceNormal) {
                    var slope = faceNormal ? faceNormal.angleTo(TERRAIN_UP) : Math.PI,
                        coverage = grassMeshWeight(vertex.z, slope);
                    if (coverage <= 0) return false;
                    coverage *= grassClusterWeight(vertex.x, vertex.y);
                    return random() < Math.max(0, Math.min(1, coverage));
                },
                random: random,
                w: segments,
            });
            terrainScene.add(grassScene);
        }
    }

    /**
     * Generate or regenerate the terrain and all library decorations.
     *
     * @return {THREE.Object3D|null}
     *   Current terrain scene.
     */
    function regenerate() {
        var random = resetRandomness('terrain'),
            segments = parseInt(settings.segments, 10),
            heightmap = settings.heightmap === 'heightmap.png' ? heightmapImage :
                settings.heightmap === 'influences' ? customInfluences : TerrainNS[settings.heightmap],
            terrainOptions = {
                after: applyEdges,
                easing: TerrainNS[settings.easing],
                heightmap: heightmap,
                material: settings.texture === 'Wireframe' ? mat :
                    settings.texture === 'Blended' && blend ? blend : gray,
                maxHeight: settings.maxHeight - 100,
                minHeight: -100,
                steps: settings.steps,
                stretch: true,
                turbulent: settings.turbulent,
                xSize: settings.size,
                ySize: Math.round(settings.size * settings.widthLengthRatio),
                xSegments: segments,
                ySegments: Math.round(segments * settings.widthLengthRatio),
                random: random,
            };
        if (terrainScene) scene.remove(terrainScene);
        terrainScene = Terrain(terrainOptions);
        applySmoothing(settings.smoothing, terrainOptions);
        scene.add(terrainScene);
        world.setLandscapeVisible(settings.texture !== 'Wireframe');
        lastOptions = terrainOptions;
        updateHeightmap();
        scatterMeshes();
        if (analytics) analytics.update(terrainScene.children[0], terrainOptions);
        return terrainScene;
    }

    /**
     * Generate the terrain with a newly chosen terrain seed.
     *
     * The decoration seed remains unchanged, so this action changes the
     * landscape shape without also consuming a new tree/grass/bush stream.
     *
     * @return {THREE.Object3D|null}
     *   Current terrain scene.
     */
    function regenerateNewSeed() {
        setTerrainSeed(createRandomSeed());
        return regenerate();
    }

    /**
     * Scatter all decorations with a newly chosen decoration seed.
     *
     * The terrain seed remains unchanged, so this action changes the
     * tree/grass/bush arrangement without changing the generated terrain.
     *
     * @return {THREE.Object3D|null}
     *   Current terrain scene.
     */
    function scatterMeshesNewSeed() {
        setDecorationSeed(createRandomSeed());
        return scatterMeshes();
    }

    /**
     * Update the demo heightmap canvas from the current terrain geometry.
     */
    function updateHeightmap() {
        if (!heightmapCanvas || !terrainScene || !terrainScene.children[0]) return;
        var terrainOptions = lastOptions || {};
        terrainOptions.heightmap = heightmapCanvas;
        TerrainNS.toHeightmap(terrainScene.children[0].geometry.attributes.position.array, terrainOptions);
    }

    /**
     * Return an interpolated terrain elevation in local XY coordinates.
     *
     * @param {number} x
     *   Local terrain X coordinate.
     * @param {number} y
     *   Local terrain Y coordinate.
     * @return {number}
     *   Interpolated local terrain elevation.
     */
    function getTerrainHeight(x, y) {
        if (!terrainScene || !terrainScene.children[0] || !lastOptions) return 0;
        return sampleTerrainHeight(
            terrainScene.children[0].geometry,
            lastOptions,
            x,
            y
        );
    }

    /**
     * Perturb terrain vertices under a sculpt brush.
     *
     * @param {THREE.Vector3} center
     *   Brush center in terrain-local coordinates.
     * @param {number} brushRadius
     *   Brush radius in terrain units.
     * @param {number} hardnessRadius
     *   Inner radius receiving full strength.
     * @param {Function|string} feathering
     *   Easing function or TerrainNS easing name for the outer falloff.
     * @param {number} amount
     *   Signed height change at full hardness for this frame.
     * @return {boolean}
     *   True when at least one vertex changed.
     */
    function sculpt(center, brushRadius, hardnessRadius, feathering, amount) {
        if (!terrainScene || !terrainScene.children[0] || !lastOptions || !amount) return false;
        var options = lastOptions,
            mesh = terrainScene.children[0],
            geometry = mesh.geometry,
            positionAttribute = geometry.attributes.position,
            positions = positionAttribute.array,
            xSegments = options.xSegments,
            ySegments = options.ySegments,
            columns = xSegments + 1,
            radius = Math.max(0, Number(brushRadius) || 0),
            hardness = Math.max(0, Math.min(radius, Number(hardnessRadius) || 0)),
            radiusSquared = radius * radius,
            xStep = options.xSize / xSegments,
            yStep = options.ySize / ySegments,
            halfX = options.xSize * 0.5,
            halfY = options.ySize * 0.5,
            centerX = Math.max(-halfX, Math.min(halfX, center.x)),
            centerY = Math.max(-halfY, Math.min(halfY, center.y)),
            minX = Math.max(0, Math.floor((centerX - radius + halfX) / xStep)),
            maxX = Math.min(xSegments, Math.ceil((centerX + radius + halfX) / xStep)),
            minY = Math.max(0, Math.floor((halfY - centerY - radius) / yStep)),
            maxY = Math.min(ySegments, Math.ceil((halfY - centerY + radius) / yStep)),
            easing = typeof feathering === 'function' ? feathering : TerrainNS[feathering] || TerrainNS.Linear,
            changed = false;
        if (!radius) return false;

        for (var xIndex = minX; xIndex <= maxX; xIndex++) {
            var x = -halfX + xIndex * xStep,
                xDistance = x - centerX;
            for (var yIndex = minY; yIndex <= maxY; yIndex++) {
                var y = halfY - yIndex * yStep,
                    distanceSquared = xDistance * xDistance + (y - centerY) * (y - centerY);
                if (distanceSquared > radiusSquared) continue;
                var distance = Math.sqrt(distanceSquared),
                    falloff = 1;
                if (distance > hardness) {
                    falloff = easing((radius - distance) / Math.max(0.0001, radius - hardness));
                    falloff = Math.max(0, Math.min(1, falloff));
                }
                var offset = (yIndex * columns + xIndex) * 3 + 2,
                    current = positions[offset],
                    next = Math.max(options.minHeight, Math.min(options.maxHeight, current + amount * falloff));
                if (next === current) continue;
                positions[offset] = next;
                changed = true;
            }
        }
        if (!changed) return false;
        positionAttribute.needsUpdate = true;
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
        updateHeightmap();
        return true;
    }

    /**
     * Refresh the analytics panel from the current terrain geometry.
     */
    function updateAnalytics() {
        if (analytics && terrainScene && terrainScene.children[0] && lastOptions) {
            analytics.update(terrainScene.children[0], lastOptions);
        }
    }

    /**
     * Update library-owned animated decoration for one rendered frame.
     *
     * @param {number} elapsedTime
     *   Elapsed time in seconds.
     * @param {THREE.Camera} activeCamera
     *   Camera used for the current frame.
     * @param {boolean} rotateTerrain
     *   Whether the presentation rotation should continue while updating.
     */
    function update(elapsedTime, activeCamera, rotateTerrain) {
        updateGrass(grassMesh, elapsedTime);
        updateGrassLOD(grassScene, activeCamera, settings.grassLodDistance);
        if (terrainScene && !demoStatic && rotateTerrain !== false) {
            // Terrain() converts its local XY/Z-up plane to the demo's
            // world XZ/Y-up coordinates with a -90deg X rotation. Leave the
            // current orientation untouched in Flight mode; resetting the
            // orbit angle there would move the landscape under a camera whose
            // world-space pose has not changed.
            terrainScene.rotation.z = Date.now() * 0.00001;
        }
    }

    /**
     * Load the material textures used by the demonstration.
     *
     * The first terrain appears with a basic material. The blended material
     * replaces it after all four demonstration textures finish loading.
     */
    function loadMaterials() {
        var loader = new THREE.TextureLoader();
        loader.load('demo/img/sand1.jpg', function(sandTexture) {
            sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
            sandTexture.repeat.set(4, 4);
            configureTexture(sandTexture);
            world.setSandTexture(sandTexture);
            loader.load('demo/img/grass1.jpg', function(grassTexture) {
                loader.load('demo/img/stone1.jpg', function(stoneTexture) {
                    loader.load('demo/img/snow1.jpg', function(snowTexture) {
                        grassTexture.repeat.set(8, 8);
                        stoneTexture.repeat.set(6, 6);
                        snowTexture.repeat.set(6, 6);
                        [sandTexture, grassTexture, stoneTexture, snowTexture].forEach(configureTexture);
                        blend = generateBlendedMaterial([
                            {texture: sandTexture},
                            {texture: grassTexture, levels: [-80, -35, 20, 50]},
                            {texture: stoneTexture, levels: [20, 50, 60, 85]},
                            {texture: snowTexture, glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
                            {texture: stoneTexture, glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'},
                        ]);
                        regenerate();
                    });
                });
            });
        });
    }

    /**
     * Configure one terrain texture for repeated color-correct rendering.
     *
     * @param {THREE.Texture} texture
     *   Texture to configure.
     */
    function configureTexture(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
    }

    rebuildGrassMesh();
    flowerMeshes = {
        buttercup: createFlowerMesh('buttercup'),
        aster: createFlowerMesh('aster'),
    };
    loadMaterials();

    return {
        applySmoothing: applySmoothing,
        rebuildGrass: function() {
            rebuildGrassMesh();
            scatterMeshes();
        },
        regenerate: regenerate,
        regenerateNewSeed: regenerateNewSeed,
        scatterMeshes: scatterMeshes,
        scatterMeshesNewSeed: scatterMeshesNewSeed,
        updateHeightmap: updateHeightmap,
        updateAnalytics: updateAnalytics,
        update: update,
        getLastOptions: function() { return lastOptions; },
        getTerrainHeight: getTerrainHeight,
        getTerrainScene: function() { return terrainScene; },
        getTerrainMesh: function() { return terrainScene && terrainScene.children[0]; },
        sculpt: sculpt,
        getSeeds: function() {
            return {terrain: demoSeed, decoration: decorationSeed};
        },
    };
}
