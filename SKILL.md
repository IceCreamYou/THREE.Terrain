# THREE.Terrain agent skill

## Purpose

Use this guide when an agent must build, modify, inspect, or document a terrain
scene with THREE.Terrain. The library creates heightmapped Three.js terrain and
provides procedural generators, filters, material blending, decoration tools,
grass, image conversion, analysis, and seeded randomness.

Keep the source code as the final authority. Read [src/index.js](src/index.js)
first to confirm the public package exports. Read the relevant source module
before using an option that is not shown in the README.

## Quick start

Install the package and its peer dependency:

```bash
npm install three.terrain.js three
```

Use the default export for terrain and the namespace for the older API style:

```js
import * as THREE from 'three';
import Terrain, { TerrainNS } from 'three.terrain.js';

const terrainScene = Terrain({
  heightmap: TerrainNS.PerlinDiamond,
  xSegments: 63,
  ySegments: 63,
  xSize: 1024,
  ySize: 1024,
  minHeight: -100,
  maxHeight: 100,
  material: new THREE.MeshLambertMaterial({ color: 0x889966 }),
});
scene.add(terrainScene);
```

`Terrain()` returns a `THREE.Object3D`. The first child is the highest-detail
terrain mesh. Use its geometry for analysis, image conversion, and scattering:

```js
const terrainMesh = terrainScene.children[0];
const terrainGeometry = terrainMesh.geometry;
```

## Package entry points

The ES-module entry exports:

- default `Terrain`;
- `TerrainNS`;
- `generateBlendedMaterial`;
- `createGrassTexture`, `createGrass`, `scatterGrass`, `updateGrass`,
  `updateGrassLOD`;
- `grassPatchNoise`, `grassClusterWeight`, `grassTextureWeight`,
  `grassSlopeWeight`, `grassMaterialWeight`, `grassMeshWeight`;
- `createRandomSeed`, `createSeededRandom`.

Most other public helpers are attached to `TerrainNS`. The random-seed helpers
and `updateGrassLOD` are named exports only. In older browser code, the entry
point also assigns the namespace to `window.THREE.Terrain`.

## Terrain construction

`Terrain(options)` accepts these main options:

| Option | Meaning |
| --- | --- |
| `heightmap` | A generator function, canvas, or image. The default is `DiamondSquare`. |
| `material` | Any Three.js material. The default is a basic orange material. |
| `xSegments`, `ySegments` | Number of terrain segments in each direction. Defaults to 63. |
| `xSize`, `ySize` | Terrain width and length. Defaults to 1024. |
| `minHeight`, `maxHeight` | Output elevation range. Defaults to -100 and 100. |
| `frequency` | Feature frequency for generators that use it. Higher values make smaller features. |
| `easing` | A curve from `[0, 1]` to `[0, 1]` used during normalization. |
| `steps` | Number of flat elevation steps. Values above 1 create terraces. |
| `stretch` | Whether to stretch generated values across the requested height range. |
| `turbulent` | Whether to apply the turbulence transform during normalization. |
| `after` | Callback after normalization. The current implementation passes the mutable Z-value array and the options object. |
| `random` | A function that returns a value in `[0, 1)`. Defaults to `Math.random`. |
| `optimization` | Compatibility constants exist, but terrain LOD optimizations are not implemented. |

The built-in easing functions are `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`,
`InEaseOut`, `EaseInWeak`, and `EaseInStrong`. A custom easing function must
accept and return a number in `[0, 1]`.

### Generator selection

All generator functions receive a height array `g` and an options object. They
write height values in place. Use them as `heightmap` functions or call them in
a custom pipeline.

| Generator | Use it for |
| --- | --- |
| `Cosine` | Large, regular wave forms. |
| `CosineLayers` | Several cosine scales. |
| `DiamondSquare` | Classic fractal terrain with broad irregular features. |
| `Fault` | Repeated fault lines and ridges. |
| `Hill` | Accumulated local hills. Pass a custom feature or point-distribution shape when needed. |
| `HillIsland` | Hill terrain biased toward an island-like central sector. |
| `Particles` | Particle deposition. Low `frequency` can create archipelagos; the default creates a larger island. |
| `Perlin` | Smooth Perlin noise. |
| `PerlinDiamond` | A Perlin pass, Diamond-Square pass, and median smoothing. |
| `PerlinLayers` | Several Perlin frequencies. |
| `Simplex` | Smooth Simplex noise. |
| `SimplexLayers` | Several Simplex frequencies. |
| `Value` | Interpolated white-noise layers. |
| `Weierstrass` | Continuous but non-differentiable forms with rough detail. |
| `Worley` | Cell/Voronoi terrain from distances to scattered points. |
| `Brownian` | A random walk across the heightmap. |
| `Curve` | A custom `curve(x, y)` function. `x` and `y` are phase coordinates. |
| `MultiPass` | Additive composition of generator passes with per-pass amplitude and frequency. |

Generators that use randomness read `options.random`. `Perlin` and `Simplex`
use the internal noise implementation, while `Worley` also accepts:

- `distanceType`: `''` for Euclidean, or `Manhattan`, `Chebyshev`, `Quadratic`,
  or `Squared`;
- `worleyPoints`: number of Voronoi points;
- `worleyDistanceTransformation(distance)`: converts distance to height;
- `worleyDistribution(width, height, count, random)`: returns `Vector2` points.

`TerrainNS.Worley.randomPoints` and `TerrainNS.Worley.PoissonDisks` are useful
distribution functions.

Example with a reproducible generator:

```js
import Terrain, { TerrainNS, createSeededRandom } from 'three.terrain.js';

const terrainScene = Terrain({
  heightmap: TerrainNS.PerlinDiamond,
  random: createSeededRandom(12345),
  minHeight: -100,
  maxHeight: 100,
});
```

## Shape and filter operations

The functions below mutate a height array. They are useful in an `after`
callback, in a custom generator, or between generator passes.

| Function | Signature and purpose |
| --- | --- |
| `Clamp` | `Clamp(g, options)`. Rescales, eases, and clamps values to `minHeight` and `maxHeight`. |
| `Edges` | `Edges(g, options, direction, distance, easing, edges)`. Raises or lowers selected rectangular edges. |
| `RadialEdges` | `RadialEdges(g, options, direction, distance, easing)`. Raises or lowers the outside of a radial boundary. |
| `Smooth` | `Smooth(g, options, weight)`. Replaces values with neighborhood averages; `weight` preserves more of the original value. |
| `SmoothMedian` | `SmoothMedian(g, options)`. Uses the neighborhood median and removes spikes. |
| `SmoothConservative` | `SmoothConservative(g, options, multiplier)`. Clamps outliers to neighbor ranges. |
| `Step` | `Step(g, levels)`. Converts a continuous heightmap into population-balanced terraces. |
| `Turbulence` | `Turbulence(g, options)`. Mirrors values inside the configured height range. |
| `Gaussian` | `Gaussian(g, options, sigma, kernelSize)`. Applies a Gaussian blur. |
| `GaussianBoxBlur` | `GaussianBoxBlur(g, options, sigma, passes)`. Approximates a Gaussian blur with weighted box blurs. |
| `Normalize` | `Normalize(mesh, options)`. Applies turbulence, steps, clamping, the `after` callback, bounds, and normals to a mesh. |

`Edges` uses an edge object such as
`{top: true, bottom: false, left: true, right: false}`. Use `Edges` for walls
or square islands and `RadialEdges` for a round island boundary.

## Local influences

`Influence(g, options, feature, x, y, radius, height, blend, easing)` places a
feature at normalized coordinates `x` and `y`. The feature receives normalized
distance and optional normalized X/Y distances. Built-in shapes are:

```js
TerrainNS.Influences.Mesa;
TerrainNS.Influences.Hole;
TerrainNS.Influences.Hill;
TerrainNS.Influences.Valley;
TerrainNS.Influences.Dome;
TerrainNS.Influences.Flat;
TerrainNS.Influences.Volcano;
```

The blend can be `THREE.AdditiveBlending`, `SubtractiveBlending`,
`MultiplyBlending`, `NoBlending`, `NormalBlending`, or a custom function. A
custom blend receives the current height, displacement, normalized distance,
and optional normalized X/Y distances.

Use `HillIsland` when the broad shape should read as an island. Do not add an
island influence after the texture mask has been designed. Pick the elevation
bands again after shaping the terrain.

## Material blending

`generateBlendedMaterial(textures, baseMaterial)` returns a material that works
like a lit Three.js material while layering texture maps. The first texture is
the base. Each later entry uses either four height levels or a GLSL expression:

```js
const material = generateBlendedMaterial([
  { texture: sandTexture },
  { texture: grassTexture, levels: [-80, -35, 20, 50] },
  { texture: rockTexture, glsl:
    '1.0 - smoothstep(0.4712389, 0.7853982, slope)' },
]);
```

The four values in `levels` are:

1. start blending in;
2. fully blended in;
3. start blending out;
4. fully blended out.

The GLSL expression must return a value from `0.0` to `1.0`. It can read
`vPosition` and `slope`, where `slope` is the angle in radians from the +Z up
vector. Texture blending is applied in array order. The helper sets repeat
wrapping and sRGB color space on source textures.

When a decoration must match a material layer, use the same altitude and slope
boundaries in a CPU predicate. A material mask can be wider than a decoration
mask, but the decoration mask must not be wider than the material mask.

## Scattering meshes

`TerrainNS.ScatterMeshes(geometry, options)` returns or fills an `Object3D` with
decorations. `terrainScene` is a valid `scene` option and is also the expected
parent when the terrain's rotation must be inherited.

Important options:

| Option | Behavior |
| --- | --- |
| `mesh` | Required prototype mesh. A group is allowed for clone-based scattering. |
| `spread` | Number probability, or a predicate `(vertex, faceIndex, faceNormal, offset) => boolean`. |
| `filter` | Predicate after `spread`, useful for a sampled position and normal. |
| `randomness` | Random source for numeric `spread`; `ScatterHelper` can create a clumpy array. |
| `random` | Random source for placement, heading, size, and tint. Defaults to `Math.random`. |
| `randomDistribution` | Sample random points across faces instead of using each face in sequence. |
| `sampleCount` | Number of random-distribution candidates. |
| `randomDistributionMinDistance` | Candidate spacing for random distribution. |
| `minimumDistance` | Minimum horizontal separation between accepted placements. |
| `minimumDistanceGroup` | Reuse one object across scatter calls to keep different mesh types apart. |
| `instancesPerFace` | Number of placements per accepted face. |
| `positionJitter` | Moves a placement from the face centroid toward a random point in the face. |
| `sizeVariance` | Uniform or non-uniform random scale variation. |
| `sizeRange` | Per-axis scale ranges, such as `{x: [0.8, 1.2], y: [0.9, 1.5], z: [0.8, 1.2], easing}`. |
| `randomRotationAxis` | Usually `'y'` for a Y-up prototype. `'z'` is for a deliberately different orientation. |
| `maxSlope` | Rejects faces steeper than this angle in radians. Default is about 36 degrees. |
| `maxTilt` | Limits how far the prototype tilts toward the face normal. `Infinity` follows the face. |
| `instanced` | Uses one `THREE.InstancedMesh` for a single mesh with no children. Groups use clones. |
| `tintRange` | `[min, max]` or `{min, max}` color range for per-instance colors. |
| `w`, `h` | Terrain segment counts used by some scatter helpers. |

Use `randomDistribution` for a natural point field. Use `minimumDistanceGroup`
when trees and bushes must not occupy the same space. Do not set an arbitrary
small minimum distance that removes valid placements; start with the visual
diameter of the prototype and tune from there.

Example:

```js
const treeRandom = createSeededRandom(7001);
const occupied = { minimumDistance: 24 };
const trees = TerrainNS.ScatterMeshes(terrainGeometry, {
  mesh: treePrototype,
  random: treeRandom,
  randomDistribution: true,
  sampleCount: 1400,
  minimumDistanceGroup: occupied,
  spread: 0.75,
  maxSlope: Math.PI / 4,
  instanced: true,
});
terrainScene.add(trees);
```

`ScatterHelper(method, options, skip, threshold)` creates an array-valued
randomness function. It generates a heightmap and uses it as a placement
probability. Use it for repeatable clumps with a numeric `spread`.

If you change the position of a geometry that is part of the terrain scene,
update its bounding sphere and normals.

## Dense grass

### Create, scatter, and animate

`createGrass(options)` returns a single grass tuft. Without a texture it creates
tapered blade ribbons with per-vertex color variation. With `texture` or
`textureOptions` it creates crossed alpha-cutout billboards. The material is
Lambert-lit and adds a minimum-light floor plus vertex wind animation.

Useful `createGrass` options include `width`, `height`, `bladeCount`, `texture`,
`textureOptions`, `material`, `alphaTest`, `color`, `emissive`,
`emissiveIntensity`, `minimumLight`, `windSpeed`, `windStrength`, and `name`.

`createGrassTexture(options)` creates a transparent runtime atlas. It requires a
browser canvas. Its density controls include `size`, `clusterCount`,
`minBlades`, `bladeRange`, `clusterSpread`, `bladeWidthMin`, and
`bladeWidthRange`.

Use `scatterGrass` or `TerrainNS.ScatterGrass` with the terrain geometry:

```js
import {
  createGrass,
  createSeededRandom,
  grassMeshWeight,
  scatterGrass,
  updateGrass,
  updateGrassLOD,
} from 'three.terrain.js';

const grass = createGrass({
  bladeCount: 20,
  height: 9,
  width: 7,
  minimumLight: 0.58,
  windSpeed: 1.8,
  windStrength: 5,
});
const grassScene = scatterGrass(terrainGeometry, {
  mesh: grass,
  instanced: true,
  random: createSeededRandom(8001),
  randomDistribution: true,
  sampleCount: 6000,
  spread: (vertex, faceIndex, faceNormal) =>
    grassMeshWeight(vertex.z, faceNormal.angleTo(new THREE.Vector3(0, 0, 1))) > 0,
  maxTilt: 0,
  randomRotationAxis: 'y',
  positionJitter: 2.5,
  tintRange: { min: 0x496b34, max: 0x78934a },
});
terrainScene.add(grassScene);

function animate(time) {
  updateGrass(grass, time * 0.001);
  updateGrassLOD(grassScene, camera, 1200);
  renderer.render(scene, camera);
}
```

`updateGrass` changes the shared wind time uniform. Call it once per frame for
the prototype material. `updateGrassLOD` works on instanced grass and changes
the active `InstancedMesh.count`. The CPU still checks source positions when the
camera moves, the distance changes, or its refresh interval elapses, but the
GPU does not process culled instances. Pass `0` or `Infinity` to disable the
distance limit.

### Grass coverage helpers

Use these deterministic helpers to keep CPU scatter masks aligned with a
blended material:

- `grassPatchNoise(x, y)`: broad and detail value noise for continuous patches.
- `grassClusterWeight(x, y)`: soft cluster density from the patch noise.
- `grassTextureWeight(height, levels)`: altitude coverage from four levels.
- `grassSlopeWeight(slope, levels)`: remaining coverage after a slope layer.
- `grassMaterialWeight(height, slope, altitudeLevels, slopeLevels)`: product of
  altitude and slope coverage.
- `grassMeshWeight(height, slope, altitudeLevels, slopeLevels, edgeInset)`:
  strict placement coverage inside the fully grass-covered band.

The default grass altitude levels are `[-80, -35, 20, 50]`. The default slope
transition is about 27 to 45 degrees. Pass custom levels when the material uses
different values. Use `grassMeshWeight` rather than only checking height when a
later material layer replaces grass on steep terrain.

## Seeded randomness

`createRandomSeed(fallbackRandom)` returns an unsigned 32-bit seed. It uses
`crypto.getRandomValues` when available and the supplied fallback otherwise.
`createSeededRandom(seed)` returns a deterministic xorshift32 function.

```js
const seed = createRandomSeed();
const terrainRandom = createSeededRandom(seed);
const treeRandom = createSeededRandom(seed + 1);

const terrainScene = Terrain({
  heightmap: TerrainNS.PerlinDiamond,
  random: terrainRandom,
});
```

Use a numeric URL seed or application setting to recreate a scene. Keep the
random stream local to the operation. Do not assign to `Math.random`.

## Heightmap images and arrays

`fromHeightmap(g, options, image)` reads a canvas or image and maps average RGB
brightness into the configured height range. Same-origin or CORS-safe images
are required.

`toHeightmap(g, options)` returns a canvas with one pixel per terrain vertex.
`heightmapArray(method, options)` returns generated height data without making a
Three.js mesh.

Use these conversion helpers when a custom algorithm needs a different array
shape:

- `toArray1D(vertices)` extracts Z values from a position array.
- `fromArray1D(vertices, source)` writes Z values into a position array.
- `toArray2D(vertices, options)` creates a two-dimensional height array.
- `fromArray2D(vertices, source)` writes a two-dimensional height array.

## Terrain analysis

`TerrainNS.Analyze(mesh, options)` returns elevation, slope, roughness, and
fitted-plane results. Supply `maxHeight`, `minHeight`, `xSegments`, `xSize`,
`ySegments`, and `ySize` from the terrain options.

The result includes:

- elevation sample size, range, median, IQR, mean, standard deviation, MAD,
  skew, kurtosis, modes, percentile, percent rank, and histogram drawing;
- slope statistics in degrees with the same distribution helpers;
- roughness values `planimetricAreaRatio`, `terrainRuggednessIndex`, and
  `jaggedness`;
- fitted-plane `centroid`, `normal`, `slope`, and `pctExplained`.

Standalone analysis helpers are:
`percentile`, `percentRank`, `faceNormals`, `getFittedPlaneNormal`,
`percentVariationExplainedByFittedPlane`, `bucketNumbersLinearly`, `getModes`,
`drawHistogram`, and `mean`.

## Compatibility constants

`NONE`, `GEOMIPMAP`, `GEOCLIPMAP`, and `POLYGONREDUCTION` describe optimization
names kept by the API. The current terrain constructor does not implement those
terrain LOD modes. Grass LOD is a separate, implemented feature for instanced
grass.

## Verification workflow

If you are editing/contributing to the THREE.Terrain library, use this order:

1. Run `npm test` or a focused Node import check when the change is library
   code.
2. Run `npm run build` to verify the ES module and UMD/CommonJS bundles.
3. Run `npm start` and inspect the demo for visual or browser-only changes.
4. Check that the console has no import, shader, texture, or CORS errors.
5. Compare a seeded scene before and after if the change affects generation or
   placement.

For a static GitHub Pages checkout, run `npm run vendor` when dependency files
must be copied into `vendor/`. Generated bundles and vendor files are build
outputs; update them only when the task requires a distributable or static demo.
