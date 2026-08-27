import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as THREE from 'three';

// Terrain() checks these browser constructors when it receives a heightmap.
// The library pipeline tested here uses generator functions, so lightweight
// constructors are enough to exercise the public API in Node.
if (!globalThis.HTMLCanvasElement) globalThis.HTMLCanvasElement = class HTMLCanvasElement {};
if (!globalThis.Image) globalThis.Image = class Image {};

const {
    default: Terrain,
    TerrainNS,
    createSeededRandom,
    createGrass,
    generateBlendedMaterial,
    scatterGrass,
    updateGrass,
    updateGrassLOD,
} = await import('../src/index.js');

function buildTerrain(seed, overrides = {}) {
    const options = {
        heightmap: TerrainNS.PerlinDiamond,
        random: createSeededRandom(seed),
        xSegments: 8,
        ySegments: 6,
        xSize: 160,
        ySize: 120,
        minHeight: -40,
        maxHeight: 60,
        material: new THREE.MeshBasicMaterial({color: 0x778866}),
        ...overrides,
    };
    const scene = Terrain(options);
    const mesh = scene.children[0];
    const heights = Array.from(TerrainNS.toArray1D(mesh.geometry.attributes.position.array));
    return {options, scene, mesh, heights};
}

test('seeded terrain construction is repeatable and stays within its requested range', () => {
    const first = buildTerrain(12345);
    const second = buildTerrain(12345);
    const differentSeed = buildTerrain(12346);

    assert.equal(first.scene.isObject3D, true);
    assert.equal(first.scene.rotation.x, -0.5 * Math.PI);
    assert.equal(first.mesh.isMesh, true);
    assert.equal(
        first.mesh.geometry.attributes.position.count,
        (first.options.xSegments + 1) * (first.options.ySegments + 1)
    );
    assert.deepEqual(first.heights, second.heights);
    assert.notDeepEqual(first.heights, differentSeed.heights);
    assert.ok(first.heights.every((height) => height >= first.options.minHeight && height <= first.options.maxHeight));
    assert.ok(Math.min(...first.heights) < Math.max(...first.heights));
});

test('constructor callbacks can shape generated terrain before geometry updates', () => {
    let callbackValues;
    let callbackOptions;
    const result = buildTerrain(77, {
        xSegments: 10,
        ySegments: 8,
        after(values, options) {
            callbackValues = values;
            callbackOptions = options;
            TerrainNS.Edges(
                values,
                options,
                false,
                24,
                TerrainNS.Linear,
                {top: true, bottom: true, left: false, right: false}
            );
        },
    });

    assert.equal(callbackOptions, result.options);
    assert.equal(callbackValues.length, (result.options.xSegments + 1) * (result.options.ySegments + 1));
    assert.ok(callbackValues instanceof Float32Array);

    const centerIndex = Math.floor(result.options.ySegments / 2) * (result.options.xSegments + 1) +
        Math.floor(result.options.xSegments / 2);
    const edgeValues = [
        ...result.heights.slice(0, result.options.xSegments + 1),
        ...result.heights.slice(-result.options.xSegments - 1),
    ];
    assert.ok(Math.min(...edgeValues) < result.heights[centerIndex]);
    assert.ok(result.heights.every((height) => height >= result.options.minHeight && height <= result.options.maxHeight));
});

test('generated terrain produces complete analysis metrics', () => {
    const result = buildTerrain(9001, {
        heightmap: TerrainNS.HillIsland,
        xSegments: 7,
        ySegments: 7,
    });
    const analysis = TerrainNS.Analyze(result.mesh, result.options);
    const finiteMetrics = [
        analysis.elevation.min,
        analysis.elevation.max,
        analysis.elevation.mean,
        analysis.elevation.stdev,
        analysis.slope.min,
        analysis.slope.max,
        analysis.slope.mean,
        analysis.slope.stdev,
        analysis.roughness.planimetricAreaRatio,
        analysis.roughness.terrainRuggednessIndex,
        analysis.fittedPlane.slope,
        analysis.fittedPlane.pctExplained,
    ];

    assert.equal(analysis.elevation.sampleSize, result.mesh.geometry.index.count);
    assert.equal(analysis.slope.sampleSize, result.mesh.geometry.index.count / 3);
    assert.ok(finiteMetrics.every(Number.isFinite));
    assert.ok(analysis.elevation.range > 0);
    assert.ok(analysis.slope.max >= analysis.slope.min);
    assert.ok(analysis.roughness.planimetricAreaRatio > 0);
    assert.equal(typeof analysis.elevation.percentile(0.5), 'number');
    assert.equal(typeof analysis.slope.percentRank(analysis.slope.median), 'number');
});

test('blended materials expose every texture layer through the compiled shader', () => {
    const textures = [new THREE.Texture(), new THREE.Texture(), new THREE.Texture()];
    textures[1].repeat.set(2, 3);
    textures[1].offset.set(0.1, 0.2);
    const material = generateBlendedMaterial([
        {texture: textures[0]},
        {texture: textures[1], levels: [-40, -10, 20, 50]},
        {texture: textures[2], glsl: 'slope > 0.3 ? 1.0 : 0.0'},
    ]);
    const shader = {
        vertexShader: '#include <common>\n#include <uv_vertex>\n#include <worldpos_vertex>',
        fragmentShader: '#include <common>\n#include <map_fragment>',
        uniforms: {},
    };

    material.onBeforeCompile(shader);

    assert.equal(material.type, 'MeshPhongMaterial');
    assert.equal(textures.every((texture) => texture.wrapS === THREE.RepeatWrapping && texture.wrapT === THREE.RepeatWrapping), true);
    assert.match(shader.vertexShader, /varying vec3 vPosition/);
    assert.match(shader.fragmentShader, /texture_0/);
    assert.match(shader.fragmentShader, /texture_1/);
    assert.match(shader.fragmentShader, /slope > 0\.3/);
    assert.deepEqual(Object.keys(shader.uniforms).sort(), ['texture_0', 'texture_1', 'texture_2']);
});

test('grass scattering creates instanced coverage and responds to wind and camera distance', () => {
    const terrain = buildTerrain(2024, {
        heightmap: TerrainNS.Cosine,
        xSegments: 4,
        ySegments: 4,
        xSize: 80,
        ySize: 80,
    });
    const grass = createGrass({bladeCount: 5, height: 10, width: 5, windSpeed: 2});
    const grassScene = scatterGrass(terrain.mesh.geometry, {
        mesh: grass,
        spread: () => true,
        instanced: true,
        maxSlope: Math.PI,
        maxTilt: 0,
        random: createSeededRandom(2025),
        tintRange: {min: 0x3d6429, max: 0x84a654},
    });
    const instances = grassScene.children[0];
    const expectedCount = terrain.mesh.geometry.index.count / 3;

    assert.equal(grassScene.children.length, 1);
    assert.equal(instances.isInstancedMesh, true);
    assert.equal(instances.count, expectedCount);
    assert.equal(instances.userData.instancedLOD.positions.length, expectedCount * 3);
    assert.equal(instances.instanceColor !== null, true);

    updateGrass(grass, 12.5);
    assert.equal(grass.userData.grassMaterial.userData.grassUniforms.time.value, 12.5);

    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    updateGrassLOD(grassScene, camera, 20);
    assert.ok(instances.count >= 0 && instances.count < expectedCount);

    camera.position.set(1000, 1000, 1000);
    updateGrassLOD(grassScene, camera, 20);
    assert.equal(instances.count, 0);

    updateGrassLOD(grassScene, camera, Infinity);
    assert.equal(instances.count, expectedCount);
});
