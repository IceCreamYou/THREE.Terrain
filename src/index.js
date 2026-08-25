import * as THREE from 'three';

// First import the core with the TerrainNS namespace
import Terrain, { TerrainNS } from './core.js';

// Then import all the modules that extend TerrainNS
import './filters.js';
import './generators.js';
import './grass.js';
import './images.js';
import './influences.js';
import './materials.js';
import './noise.js';
import './scatter.js';
import './analysis.js';
import './brownian.js';
import './gaussian.js';
import './weightedBoxBlurGaussian.js';
import './worley.js';

export { generateBlendedMaterial } from './materials.js';
export { createGrassTexture, createGrass, grassPatchNoise, grassClusterWeight, grassTextureWeight, grassSlopeWeight, grassMaterialWeight, grassMeshWeight, updateGrass, updateGrassLOD, scatterGrass } from './grass.js';
export { createRandomSeed, createSeededRandom } from './random.js';
export { Terrain as default, TerrainNS };

// For backwards compatibility with the global THREE.Terrain namespace
if (typeof window !== 'undefined') {
  if (!window.THREE) window.THREE = {};
  window.THREE.Terrain = Terrain;
  Object.assign(window.THREE.Terrain, TerrainNS);
}
