import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { GUI } from 'dat.gui';
import Terrain, { TerrainNS, createGrass, generateBlendedMaterial, grassMeshWeight, grassClusterWeight, updateGrass, updateGrassLOD } from '../src/index.js';
import { createRandomSeed, createSeededRandom } from '../src/random.js';
import { Tree } from '../vendor/eztree/build/eztree.module.js';

var nativeRandom = Math.random,
    demoURL = new URL(window.location.href),
    demoSeed = parseDemoSeed(demoURL.searchParams.get('seed')),
    demoStatic = demoURL.searchParams.get('static') === '1',
    terrainRandom,
    decorationRandom;
var DEMO_DECORATION_SEED = 0x9e3779b9;

var cameraStarts = {
  'default': {
    main: {
      position: [449, 311, 376],
      rotation: [-52 * Math.PI / 180, 35 * Math.PI / 180, 37 * Math.PI / 180],
    },
    fps: {
      position: [449, 311, 376],
      target: [0, 0, 0],
    },
  },
  'readme-screenshot-options': {
    main: {
      position: [420, 120, 420],
      target: [0, 25, 0],
    },
    fps: {
      position: [420, 120, 420],
      target: [0, 25, 0],
    },
  },
  'readme-screenshot-beach': {
    main: {
      position: [301, -13, -154],
      target: [260, -18, -210],
    },
    fps: {
      position: [301, -13, -154],
      target: [260, -18, -210],
    },
  },
};

var demoStart = normalizeDemoStart(demoURL.searchParams.get('start')),
    demoInfluence = demoURL.searchParams.get('influence') === 'island' ? 'island' : null;

if (demoSeed === null) demoSeed = createRandomSeed(nativeRandom);
resetDemoRandomness('terrain');
window.terrainDemoSeed = demoSeed;
window.terrainDemoStart = demoStart;
window.terrainDemoInfluence = demoInfluence;
window.terrainDemoStatic = demoStatic;

/**
 * Parse an optional unsigned 32-bit seed from the demo URL.
 *
 * @param {string|null} value
 *   URL value supplied by the user.
 * @return {number|null}
 *   The normalized seed, or null when no valid seed was supplied.
 */
function parseDemoSeed(value) {
  if (!value || !/^(?:0x[0-9a-f]+|\d+)$/i.test(value)) return null;
  var seed = Number(value);
  return Number.isSafeInteger(seed) ? seed >>> 0 : null;
}

/**
 * Reset the demo's deterministic random stream for a generation phase.
 *
 * Terrain and decoration use separate streams. This keeps a GUI regeneration
 * from changing the heightmap because a tree or grass instance happened to
 * consume a different number of random values first.
 *
 * @param {string} phase
 *   Either `terrain` or `decoration`.
 */
function resetDemoRandomness(phase) {
  var offset = phase === 'decoration' ? DEMO_DECORATION_SEED : 0;
  var random = createSeededRandom((demoSeed + offset) >>> 0);
  if (phase === 'decoration') decorationRandom = random;
  else terrainRandom = random;
  return random;
}

/**
 * Normalize the optional camera start name from the demo URL.
 *
 * @param {string|null} value
 *   Requested URL start name.
 * @return {string}
 *   One of `default`, `readme-screenshot-options`, or
 *   `readme-screenshot-beach`.
 */
function normalizeDemoStart(value) {
  value = value || 'default';
  return cameraStarts[value] ? value : 'default';
}

/**
 * Parse a boolean dat.GUI value supplied through the URL.
 *
 * `true`/`false` are readable in hand-authored URLs, while `1`/`0` keep the
 * values compact for generated capture URLs. Invalid values return null so a
 * malformed query does not overwrite the GUI default.
 *
 * @param {string} value
 *   URL query value.
 * @return {boolean|null}
 *   Parsed boolean or null when the value is not recognized.
 */
function parseURLBoolean(value) {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return null;
}

/**
 * Apply dat.GUI settings supplied through the URL.
 *
 * URL keys match the enumerable settings properties directly. The optional
 * `influence=island` spelling is retained as a compatibility shorthand, but
 * it now selects the same radial/downward edge controls a user would choose
 * in dat.GUI; it does not install a second hidden heightmap.
 *
 * @param {Object} settings
 *   Settings instance created by the demo's dat.GUI setup.
 */
function applyURLSettings(settings) {
  for (var property in settings) {
    if (!settings.hasOwnProperty(property) || typeof settings[property] === 'function') continue;
    var value = demoURL.searchParams.get(property);
    if (value === null) continue;
    if (typeof settings[property] === 'boolean') {
      var booleanValue = parseURLBoolean(value);
      if (booleanValue !== null) settings[property] = booleanValue;
    }
    else if (typeof settings[property] === 'number') {
      var numberValue = Number(value);
      if (Number.isFinite(numberValue)) settings[property] = numberValue;
    }
    else {
      settings[property] = value;
    }
  }
  if (demoInfluence === 'island') {
    if (!demoURL.searchParams.has('edgeType')) settings.edgeType = 'Radial';
    if (!demoURL.searchParams.has('edgeDirection')) settings.edgeDirection = 'Down';
    if (!demoURL.searchParams.has('edgeCurve')) settings.edgeCurve = 'EaseInOut';
    if (!demoURL.searchParams.has('edgeDistance')) settings.edgeDistance = 320;
  }
}

/**
 * Return the selected camera start definition.
 *
 * @return {Object}
 *   Main and first-person camera poses for the current URL start.
 */
function getCameraStart() {
  return cameraStarts[demoStart] || cameraStarts.default;
}

/**
 * Apply a position and either an Euler rotation or a look-at target.
 *
 * @param {THREE.Camera} targetCamera
 *   Camera receiving the pose.
 * @param {Object} pose
 *   Pose with `position` and either `rotation` or `target` arrays.
 */
function applyCameraPose(targetCamera, pose) {
  targetCamera.position.fromArray(pose.position);
  if (pose.rotation) targetCamera.rotation.fromArray(pose.rotation);
  else if (pose.target) targetCamera.lookAt(new THREE.Vector3().fromArray(pose.target));
}

/**
 * Return a deterministic tree seed derived from the demo seed and preset.
 *
 * @param {string} preset
 *   Eztree preset name.
 * @return {number}
 *   Unsigned seed for that preset.
 */
function getTreeSeed(preset) {
  var hash = 2166136261;
  for (var index = 0; index < preset.length; index++) {
    hash ^= preset.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (demoSeed ^ hash) >>> 0;
}

// Global variables (use let)
let camera, scene, renderer, clock, player, terrainScene, decoScene, grassScene, grassMesh, lastOptions, controls = {}, fpsCamera, skyDome, skyLight, sand, water; // jscs:ignore requireLineBreakAfterVariableAssignment
let grassMaxDistance = 1200;
let INV_MAX_FPS = 1 / 100,
    frameDelta = 0,
    paused = true,
    mouseX = 0,
    mouseY = 0,
    useFPS = false;

function animate() {
  draw();

  frameDelta += clock.getDelta();
  while (frameDelta >= INV_MAX_FPS) {
    update(INV_MAX_FPS);
    frameDelta -= INV_MAX_FPS;
  }

  if (!paused) {
    requestAnimationFrame(animate);
  }
}

function startAnimating() {
  if (paused) {
    paused = false;
    controls.enabled = true;
    clock.start();
    requestAnimationFrame(animate);
  }
}

function stopAnimating() {
  paused = true;
  controls.enabled = false;
  clock.stop();
}

function setup() {
  setupThreeJS();
  setupControls();
  setupWorld();
  watchFocus();
  setupDatGui();
  startAnimating();
}

function setupThreeJS() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x868293, 0.0007);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('tabindex', -1);

  camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
  scene.add(camera);
  applyCameraPose(camera, getCameraStart().main);

  clock = new THREE.Clock(false);
}

function setupControls() {
  fpsCamera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
  scene.add(fpsCamera);
  controls = new FirstPersonControls(fpsCamera, renderer.domElement); // Use imported control
  controls.enabled = false;
  controls.movementSpeed = 100;
  controls.lookSpeed = 0.075;
  applyCameraPose(fpsCamera, getCameraStart().fps);
  controls.lookAt(new THREE.Vector3().fromArray(getCameraStart().fps.target));
}

function setupWorld() {
  new THREE.TextureLoader().load('demo/img/sky1.jpg', function(t1) {
    t1.minFilter = THREE.LinearFilter; // Texture is not a power-of-two size; use smoother interpolation.
    skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(8192, 16, 16, 0, Math.PI*2, 0, Math.PI*0.5),
      new THREE.MeshBasicMaterial({map: t1, side: THREE.BackSide, fog: false})
    );
    skyDome.position.y = -99;
    scene.add(skyDome);
  });

  water = new THREE.Mesh(
    new THREE.PlaneGeometry(16384+1024, 16384+1024, 16, 16), // Use PlaneGeometry
    new THREE.MeshLambertMaterial({color: 0x006ba0, transparent: true, opacity: 0.6})
  );
  water.position.y = -99;
  water.rotation.x = -0.5 * Math.PI;
  scene.add(water);

  // Create warmer, more vibrant lighting
  skyLight = new THREE.DirectionalLight(0xffe8d6, 1.75); 
  skyLight.position.set(2950, 2625, -160); // Sun on the sky texture
  scene.add(skyLight);
  // Add slightly cooler fill light to simulate sky light
  var light = new THREE.DirectionalLight(0xadd8e6, 0.85);
  light.position.set(-1, -0.5, -1);
  scene.add(light);
  
  // Add warmer ambient light to enhance greens and prevent dark shadows
  var ambientLight = new THREE.AmbientLight(0xb3a35e, 0.45);
  scene.add(ambientLight);
}

function setupDatGui() {
  var heightmapImage = new Image();
  heightmapImage.src = 'demo/img/heightmap.png';
  // var blend; // Move inside Settings
  function Settings() {
    var that = this;
    var mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true});
    var gray = new THREE.MeshPhongMaterial({ color: 0x88aaaa, specular: 0x444455, shininess: 10 });
    var terrainUp = new THREE.Vector3(0, 0, 1);
    var blend; // Declare blend here
    var elevationGraph = document.getElementById('elevation-graph'),
        slopeGraph = document.getElementById('slope-graph'),
        analyticsValues = document.getElementsByClassName('value');
    var loader = new THREE.TextureLoader();
    loader.load('demo/img/sand1.jpg', function(t1) {
      t1.wrapS = t1.wrapT = THREE.RepeatWrapping;
      t1.repeat.set(4, 4); // Repeat the texture more for better detail
      t1.colorSpace = THREE.SRGBColorSpace;
      t1.encoding = THREE.sRGBEncoding;
      t1.anisotropy = renderer.capabilities.getMaxAnisotropy();
      sand = new THREE.Mesh(
        new THREE.PlaneGeometry(16384+1024, 16384+1024, 64, 64), // Use PlaneGeometry
        new THREE.MeshLambertMaterial({map: t1})
      );
      sand.position.y = -101;
      sand.rotation.x = -0.5 * Math.PI;
      scene.add(sand);
      loader.load('demo/img/grass1.jpg', function(t2) {
        loader.load('demo/img/stone1.jpg', function(t3) {
          loader.load('demo/img/snow1.jpg', function(t4) {
            // Set texture repeats for more detail
            t2.repeat.set(8, 8); 
            t3.repeat.set(6, 6);
            t4.repeat.set(6, 6);
            
            // Make sure textures use proper filtering
            [t1, t2, t3, t4].forEach(tex => {
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.encoding = THREE.sRGBEncoding;
              tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
              tex.needsUpdate = true;
            });
           
            // Enhanced terrain material settings
            blend = generateBlendedMaterial([ // Use imported function
              {texture: t1},
              {texture: t2, levels: [-80, -35, 20, 50]}, // Grass texture
              {texture: t3, levels: [20, 50, 60, 85]},   // Stone texture
              {texture: t4, glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
              {texture: t3, glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'}, // between 27 and 45 degrees
            ]);
            that.Regenerate();
          });
        });
      });
    });
    this.easing = 'Linear';
    this.heightmap = 'PerlinDiamond';
    this.smoothing = 'None';
    this.maxHeight = 200;
    this.segments = 63;
    this.steps = 1;
    this.turbulent = false;
    this.size = 1024;
    this.sky = true;
    this.texture = 'Blended';
    this.edgeDirection = 'Normal';
    this.edgeType = 'Box';
    this.edgeDistance = 480;
    this.edgeCurve = 'EaseInOut';
    this.widthLengthRatio = 1.0;
    this['Flight mode'] = useFPS;
    this['Light color'] = '#' + skyLight.color.getHexString();
    this.grassEnabled = true;
    this.grassDensity = 0.75;
    this.grassHeight = 7;
    this.grassWidth = 5;
    this.grassAlphaTest = 0.65;
    this.grassMinimumLight = 0.58;
    this.grassLodDistance = 1200;
    // The final stone slope layer fully masks the grass by 45 degrees.
    this.grassMaxSlope = 0.7853981633974483;
    this.grassPositionJitter = 2.8;
    this.grassWindSpeed = 1.15;
    this.grassWindStrength = 3.5;
    this.grassTintLow = '#496b34';
    this.grassTintHigh = '#78934a';
    grassMaxDistance = this.grassLodDistance;
    this.spread = 32;
    this.scattering = 'PerlinAltitude';
    this.bushPreset = 'Bush 1';
    this.after = function(vertices, options) {
      if (that.edgeDirection !== 'Normal') {
        (that.edgeType === 'Box' ? TerrainNS.Edges : TerrainNS.RadialEdges)( // Use TerrainNS
          vertices,
          options,
          that.edgeDirection === 'Up' ? true : false,
          that.edgeType === 'Box' ? that.edgeDistance : Math.min(options.xSize, options.ySize) * 0.5 - that.edgeDistance,
          TerrainNS[that.edgeCurve] // Use TerrainNS
        );
      }
    };
    function altitudeProbability(z) { // Keep this helper local to Settings
        if (z > -80 && z < -50) return TerrainNS.EaseInOut((z + 80) / (-50 + 80)) * that.spread * 0.002;
        else if (z > -50 && z < 20) return that.spread * 0.002;
        else if (z > 20 && z < 50) return TerrainNS.EaseInOut((z - 20) / (50 - 20)) * that.spread * 0.002;
        return 0;
    }
    this.altitudeSpread = function(v, k) {
      return k % 4 === 0 && decorationRandom() < altitudeProbability(v.z);
    };
    window.rebuild = this.Regenerate = function() {
      var random = resetDemoRandomness('terrain'),
          s = parseInt(that.segments, 10),
          h = that.heightmap === 'heightmap.png',
          heightmap = h ? heightmapImage : (that.heightmap === 'influences' ? customInfluences : TerrainNS[that.heightmap]);
      var o = {
        after: that.after,
        easing: TerrainNS[that.easing], // Use TerrainNS
        heightmap: heightmap, // Use TerrainNS
        material: that.texture == 'Wireframe' ? mat : (that.texture == 'Blended' && blend ? blend : gray), // check blend
        maxHeight: that.maxHeight - 100,
        minHeight: -100,
        steps: that.steps,
        stretch: true,
        turbulent: that.turbulent,
        xSize: that.size,
        ySize: Math.round(that.size * that.widthLengthRatio),
        xSegments: s,
        ySegments: Math.round(s * that.widthLengthRatio),
        random: random,
      };
      scene.remove(terrainScene);
      terrainScene = Terrain(o); // Use imported Terrain
      applySmoothing(that.smoothing, o);
      scene.add(terrainScene);
      // The GUI is initialized before the asynchronous sky and material
      // textures finish loading. Regeneration must still be safe during that
      // short window; the later texture callback regenerates again with the
      // blended material once all assets are available.
      if (skyDome) skyDome.visible = that.texture != 'Wireframe';
      if (sand) sand.visible = that.texture != 'Wireframe';
      if (water) water.visible = that.texture != 'Wireframe';
      var he = document.getElementById('heightmap');
      if (he) {
        o.heightmap = he;
        TerrainNS.toHeightmap(terrainScene.children[0].geometry.attributes.position.array, o); // Use TerrainNS
      }
      that['Scatter meshes']();
      lastOptions = o;

      // Run analytics
      var analysis = TerrainNS.Analyze(terrainScene.children[0], o), // Use TerrainNS
          deviations = getSummary(analysis),
          prop;
      analysis.elevation.drawHistogram(elevationGraph, 10);
      analysis.slope.drawHistogram(slopeGraph, 10);
      for (var i = 0, l = analyticsValues.length; i < l; i++) {
        prop = analyticsValues[i].getAttribute('data-property').split('.');
        var analytic = analysis[prop[0]][prop[1]];
        if (analyticsValues[i].getAttribute('class').split(/\s+/).indexOf('percent') !== -1) {
          analytic *= 100;
        }
        analyticsValues[i].textContent = cleanAnalytic(analytic);
      }
      for (prop in deviations) {
        if (deviations.hasOwnProperty(prop)) {
          document.querySelector('.summary-value[data-property="' + prop + '"]').textContent = deviations[prop];
        }
      }
    };
    var treeMeshCache = {};
    function getTreeMesh(preset) {
      if (!treeMeshCache[preset]) treeMeshCache[preset] = buildTree(getTreeSeed(preset), preset);
      return treeMeshCache[preset];
    }
    function rebuildGrassMesh() {
      grassMesh = createGrass({
        alphaTest: that.grassAlphaTest,
        bladeCount: 24,
        color: 0xffffff,
        emissive: 0x1f3215,
        emissiveIntensity: 0.08,
        height: that.grassHeight,
        minimumLight: that.grassMinimumLight,
        name: 'Dense Grass Patch',
        width: that.grassWidth,
        windSpeed: that.grassWindSpeed,
        windStrength: that.grassWindStrength,
      });
    }
    rebuildGrassMesh();
    this['Scatter meshes'] = function() {
      var random = resetDemoRandomness('decoration'),
          s = parseInt(that.segments, 10),
          spread,
          randomness;
      var o = {
        xSegments: s,
        ySegments: Math.round(s * that.widthLengthRatio),
        random: random,
      };
      if (that.scattering === 'Linear') {
        spread = that.spread * 0.0005;
        randomness = random;
      }
      else if (that.scattering === 'Altitude') {
        spread = that.altitudeSpread;
      }
      else if (that.scattering === 'PerlinAltitude') {
        spread = (function() {
          var h = TerrainNS.ScatterHelper(TerrainNS.Perlin, o, 2, 0.125)(), // Use TerrainNS
              hs = TerrainNS.InEaseOut(that.spread * 0.01); // Use TerrainNS
          return function(v, k) {
            var rv = h[k],
                place = false;
            if (rv < hs) {
              place = true;
            }
            else if (rv < hs + 0.2) {
              place = TerrainNS.EaseInOut((rv - hs) * 5) * hs < random(); // Use TerrainNS
            }
            return random() < altitudeProbability(v.z) * 5 && place;
          };
        })();
      }
      else {
        spread = TerrainNS.InEaseOut(that.spread*0.01) * (that.scattering === 'Worley' ? 1 : 0.5); // Use TerrainNS
        randomness = TerrainNS.ScatterHelper(TerrainNS[that.scattering], o, 2, 0.125); // Use TerrainNS
      }
      var geo = terrainScene.children[0].geometry;
      terrainScene.remove(decoScene);
      var useWoodlandDistribution = that.scattering === 'PerlinAltitude';
      var treePresets = ['Oak Medium', 'Ash Medium', 'Aspen Medium'];
      if (that.bushPreset !== 'None') treePresets.push(that.bushPreset);
      decoScene = new THREE.Object3D();
      for (var treeMeshIndex = 0; treeMeshIndex < treePresets.length; treeMeshIndex++) {
        TerrainNS.ScatterMeshes(geo, { // Use vendored Eztree prototypes
          scene: decoScene,
          mesh: getTreeMesh(treePresets[treeMeshIndex]),
          w: s,
          h: Math.round(s * that.widthLengthRatio),
          randomDistribution: useWoodlandDistribution,
          randomDistributionMinDistance: 60,
          sampleCount: Math.round(s * s * 0.03),
          // Keep trees inside the strict fully-grass mask. The filter is
          // separate from `spread` so each scattering mode keeps its density
          // and noise pattern while transition bands remain barren.
          filter: function(v, faceNormal) {
            var slope = faceNormal ? faceNormal.angleTo(terrainUp) : Math.PI;
            return grassMeshWeight(v.z, slope) > 0;
          },
          spread: useWoodlandDistribution ? function(v) {
            return v.z > -100 && v.z < 100 && random() < Math.min(1, that.spread / 60);
          } : spread,
          random: random,
          smoothSpread: that.scattering === 'Linear' ? 0 : 0.2,
          randomness: randomness,
          maxSlope: 0.6283185307179586, // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
          maxTilt: 0.15707963267948966, //  9deg or  9 / 180 * Math.PI. Trees grow up regardless of slope but we can allow a small variation
          sizeVariance: 0.22,
        });
      }
      if (decoScene) {
        terrainScene.add(decoScene);
      }
      terrainScene.remove(grassScene);
      grassScene = null;
      grassMaxDistance = that.grassLodDistance;
      if (that.grassEnabled && that.texture === 'Blended' && blend) {
        grassScene = TerrainNS.ScatterGrass(geo, {
          h: Math.round(s * that.widthLengthRatio),
          instanced: true,
          maxSlope: that.grassMaxSlope,
          maxTilt: 0,
          mesh: grassMesh,
          nonUniformSizeVariance: true,
          randomDistribution: true,
          randomDistributionMinDistance: Math.max(0.55, 2.8 - that.grassPositionJitter * 0.7),
          // Grass is authored Y-up. ScatterMeshes aligns that axis with the
          // terrain's Z-up axis, so local-Y rotation varies heading without
          // tilting the tuft onto a horizontal axis.
          randomRotationAxis: 'y',
          sampleCount: Math.round(s * s * 26 * that.grassDensity),
          // Random distribution already samples inside each face; expose
          // grassPositionJitter as the minimum-spacing control above.
          positionJitter: 0,
          sizeVariance: 0.14,
          tintRange: {
            min: that.grassTintLow,
            max: that.grassTintHigh,
          },
          spread: function(v, k, faceNormal) {
            // Stay inside the fully grass-covered interval. This deliberately
            // rejects both altitude transition bands and the stone slope blend.
            var slope = faceNormal ? faceNormal.angleTo(terrainUp) : Math.PI,
                coverage = grassMeshWeight(v.z, slope);
            if (coverage <= 0) return false;
            // Broad value-noise clusters make grass gather into natural
            // stands. The small residual probability keeps their boundaries
            // soft instead of producing obvious stamped circles.
            coverage *= grassClusterWeight(v.x, v.y);
            return random() < Math.max(0, Math.min(1, coverage));
          },
          random: random,
          w: s,
        });
        terrainScene.add(grassScene);
      }
    };
    this['Rebuild grass'] = function() {
      rebuildGrassMesh();
      that['Scatter meshes']();
    };
  }
  var gui = new GUI(); // Use imported GUI
  var settings = new Settings();
  applyURLSettings(settings);
  var heightmapFolder = gui.addFolder('Heightmap');
  heightmapFolder.add(settings, 'heightmap', ['Brownian', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Fault', 'heightmap.png', 'Hill', 'HillIsland', 'influences', 'Particles', 'Perlin', 'PerlinDiamond', 'PerlinLayers', 'Simplex', 'SimplexLayers', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'easing', ['Linear', 'EaseIn', 'EaseInWeak', 'EaseOut', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'smoothing', ['Conservative (0.5)', 'Conservative (1)', 'Conservative (10)', 'Gaussian (0.5, 7)', 'Gaussian (1.0, 7)', 'Gaussian (1.5, 7)', 'Gaussian (1.0, 5)', 'Gaussian (1.0, 11)', 'GaussianBox', 'Mean (0)', 'Mean (1)', 'Mean (8)', 'Median', 'None']).onChange(function (val) {
    applySmoothing(val, lastOptions);
    settings['Scatter meshes']();
    if (lastOptions.heightmap) {
      TerrainNS.toHeightmap(terrainScene.children[0].geometry.attributes.position.array, lastOptions); // Use TerrainNS
    }
  });
  heightmapFolder.add(settings, 'segments', 7, 127).step(1).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'steps', 1, 8).step(1).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'turbulent').onFinishChange(settings.Regenerate);
  heightmapFolder.open();
  var decoFolder = gui.addFolder('Decoration');
  decoFolder.add(settings, 'texture', ['Blended', 'Grayscale', 'Wireframe']).onFinishChange(settings.Regenerate);
  decoFolder.add(settings, 'scattering', ['Altitude', 'Linear', 'Cosine', 'CosineLayers', 'DiamondSquare', 'Particles', 'Perlin', 'PerlinAltitude', 'Simplex', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings['Scatter meshes']);
  decoFolder.add(settings, 'spread', 0, 100).step(1).onFinishChange(settings['Scatter meshes']);
  decoFolder.add(settings, 'bushPreset', ['None', 'Bush 1', 'Bush 2', 'Bush 3']).name('Bush preset').onFinishChange(settings['Scatter meshes']);
  decoFolder.addColor(settings, 'Light color').onChange(function(val) {
    skyLight.color.set(val);
  });
  var grassFolder = decoFolder.addFolder('Grass');
  grassFolder.add(settings, 'grassEnabled').name('Enabled').onChange(settings['Scatter meshes']);
  grassFolder.add(settings, 'grassDensity', 0, 2).step(0.01).name('Density').onFinishChange(settings['Scatter meshes']);
  grassFolder.add(settings, 'grassHeight', 4, 24).step(1).name('Height').onFinishChange(settings['Rebuild grass']);
  grassFolder.add(settings, 'grassWidth', 4, 32).step(1).name('Width').onFinishChange(settings['Rebuild grass']);
  grassFolder.add(settings, 'grassAlphaTest', 0.1, 0.95).step(0.01).name('Alpha test').onFinishChange(settings['Rebuild grass']);
  grassFolder.add(settings, 'grassMinimumLight', 0, 2).step(0.01).name('Min light').onFinishChange(settings['Rebuild grass']);
  grassFolder.add(settings, 'grassLodDistance', 0, 2000).step(50).name('LOD distance').onChange(function(val) {
    grassMaxDistance = val;
  });
  grassFolder.add(settings, 'grassMaxSlope', 0.1, 1.57).step(0.01).name('Max slope').onFinishChange(settings['Scatter meshes']);
  grassFolder.add(settings, 'grassPositionJitter', 0, 3).step(0.05).name('Jitter / spacing').onFinishChange(settings['Scatter meshes']);
  grassFolder.add(settings, 'grassWindSpeed', 0, 3).step(0.05).name('Wind speed').onFinishChange(settings['Rebuild grass']);
  grassFolder.add(settings, 'grassWindStrength', 0, 12).step(0.1).name('Wind strength').onFinishChange(settings['Rebuild grass']);
  grassFolder.addColor(settings, 'grassTintLow').name('Tint low').onFinishChange(settings['Scatter meshes']);
  grassFolder.addColor(settings, 'grassTintHigh').name('Tint high').onFinishChange(settings['Scatter meshes']);
  grassFolder.open();
  var sizeFolder = gui.addFolder('Size');
  sizeFolder.add(settings, 'size', 1024, 3072).step(256).onFinishChange(settings.Regenerate);
  sizeFolder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(settings.Regenerate);
  sizeFolder.add(settings, 'widthLengthRatio', 0.2, 2).step(0.05).name('width:length ratio').onFinishChange(settings.Regenerate);
  var edgesFolder = gui.addFolder('Edges');
  edgesFolder.add(settings, 'edgeType', ['Box', 'Radial']).onFinishChange(settings.Regenerate);
  edgesFolder.add(settings, 'edgeDirection', ['Normal', 'Up', 'Down']).onFinishChange(settings.Regenerate);
  edgesFolder.add(settings, 'edgeCurve', ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut']).onFinishChange(settings.Regenerate);
  edgesFolder.add(settings, 'edgeDistance', 0, 512).step(32).onFinishChange(settings.Regenerate);
  gui.add(settings, 'Flight mode').onChange(function(val) {
    useFPS = val;
    applyCameraPose(fpsCamera, getCameraStart().fps);
    controls.lookAt(new THREE.Vector3().fromArray(getCameraStart().fps.target));
    controls.update(0);
    controls.enabled = false;
    if (useFPS) {
      document.getElementById('fpscontrols').className = 'visible';
      setTimeout(function() {
        controls.enabled = true;
      }, 1000);
    }
    else {
      document.getElementById('fpscontrols').className = '';
    }
  });
  gui.add(settings, 'Scatter meshes');
  gui.add(settings, 'Regenerate');

}

window.addEventListener('resize', function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = renderer.domElement.width / renderer.domElement.height;
  camera.updateProjectionMatrix();
  fpsCamera.aspect = renderer.domElement.width / renderer.domElement.height;
  fpsCamera.updateProjectionMatrix();
  draw();
}, { passive: true });

function draw() {
  updateGrass(grassMesh, clock.elapsedTime);
  var activeCamera = useFPS ? fpsCamera : camera;
  updateGrassLOD(grassScene, activeCamera, grassMaxDistance);
  renderer.render(scene, activeCamera);
}

function update(delta) {
  if (terrainScene && !demoStatic) terrainScene.rotation.z = Date.now() * 0.00001;
  if (controls.update) controls.update(delta);
}

document.addEventListener('keyup', function(event) {
  if (event.key === 'q' && useFPS) {
    controls.enabled = !controls.enabled;
  }
}, { passive: true }); // Added passive listener

document.addEventListener('mousemove', function(event) {
  if (!paused) {
    mouseX = event.pageX;
    mouseY = event.pageY;
  }
}, { passive: true }); // Added passive listener

// Stop animating if the window is out of focus
function watchFocus() {
  var _blurred = false;
  window.addEventListener('focus', function() {
    if (_blurred) {
      _blurred = false;
      startAnimating();
      controls.enabled = true;
    }
  }, { passive: true });
  window.addEventListener('blur', function() {
    stopAnimating();
    _blurred = true;
    controls.enabled = false;
  }, { passive: true });
}

document.querySelector('#analytics .close').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('analytics').classList.remove('visible');
  document.getElementById('show-analytics').classList.add('visible');
}, { passive: false });

document.querySelector('#show-analytics').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('show-analytics').classList.remove('visible');
  var analytics = document.getElementById('analytics');
  analytics.scrollTop = 0;
  analytics.classList.add('visible');
}, { passive: false });

function applySmoothing(smoothing, o) {
  var m = terrainScene.children[0];
  var g = TerrainNS.toArray1D(m.geometry.attributes.position.array); // Use TerrainNS
  if (smoothing === 'Conservative (0.5)') TerrainNS.SmoothConservative(g, o, 0.5); // Use TerrainNS
  if (smoothing === 'Conservative (1)') TerrainNS.SmoothConservative(g, o, 1); // Use TerrainNS
  if (smoothing === 'Conservative (10)') TerrainNS.SmoothConservative(g, o, 10); // Use TerrainNS
  else if (smoothing === 'Gaussian (0.5, 7)') TerrainNS.Gaussian(g, o, 0.5, 7); // Use TerrainNS
  else if (smoothing === 'Gaussian (1.0, 7)') TerrainNS.Gaussian(g, o, 1, 7); // Use TerrainNS
  else if (smoothing === 'Gaussian (1.5, 7)') TerrainNS.Gaussian(g, o, 1.5, 7); // Use TerrainNS
  else if (smoothing === 'Gaussian (1.0, 5)') TerrainNS.Gaussian(g, o, 1, 5); // Use TerrainNS
  else if (smoothing === 'Gaussian (1.0, 11)') TerrainNS.Gaussian(g, o, 1, 11); // Use TerrainNS
  else if (smoothing === 'GaussianBox') TerrainNS.GaussianBoxBlur(g, o, 1, 3); // Use TerrainNS
  else if (smoothing === 'Mean (0)') TerrainNS.Smooth(g, o, 0); // Use TerrainNS
  else if (smoothing === 'Mean (1)') TerrainNS.Smooth(g, o, 1); // Use TerrainNS
  else if (smoothing === 'Mean (8)') TerrainNS.Smooth(g, o, 8); // Use TerrainNS
  else if (smoothing === 'Median') TerrainNS.SmoothMedian(g, o); // Use TerrainNS
  TerrainNS.fromArray1D(m.geometry.attributes.position.array, g); // Use TerrainNS
  TerrainNS.Normalize(m, o); // Use TerrainNS
}

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

function customInfluences(g, options) {
  var clonedOptions = {};
  for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
          clonedOptions[opt] = options[opt];
      }
  }
  clonedOptions.maxHeight = options.maxHeight * 0.67;
  clonedOptions.minHeight = options.minHeight * 0.67;
  TerrainNS.DiamondSquare(g, clonedOptions); // Use TerrainNS

  var radius = Math.min(options.xSize, options.ySize) * 0.21,
      height = options.maxHeight * 0.8;
  TerrainNS.Influence( // Use TerrainNS
    g, options,
    TerrainNS.Influences.Hill, // Use TerrainNS
    0.25, 0.25,
    radius, height,
    THREE.AdditiveBlending,
    TerrainNS.Linear // Use TerrainNS
  );
  TerrainNS.Influence( // Use TerrainNS
    g, options,
    TerrainNS.Influences.Mesa, // Use TerrainNS
    0.75, 0.75,
    radius, height,
    THREE.SubtractiveBlending,
    TerrainNS.EaseInStrong // Use TerrainNS
  );
  TerrainNS.Influence( // Use TerrainNS
    g, options,
    TerrainNS.Influences.Flat, // Use TerrainNS
    0.75, 0.25,
    radius, options.maxHeight,
    THREE.NormalBlending,
    TerrainNS.EaseIn // Use TerrainNS
  );
  TerrainNS.Influence( // Use TerrainNS
    g, options,
    TerrainNS.Influences.Volcano, // Use TerrainNS
    0.25, 0.75,
    radius, options.maxHeight,
    THREE.NormalBlending,
    TerrainNS.EaseInStrong // Use TerrainNS
  );
}

function cleanAnalytic(val) {
  if (Array.isArray(val)) {
    if (val.length === 1) {
      val = val[0];
    }
    else {
      var str = val.map(function(v) { return Math.round(v); }).join(', ');
      if (str.length > 9) str = val.join(',');
      if (str.length > 9) str = str.substring(0, str.lastIndexOf(',', 7)) + ',…';
      return str;
    }
  }
  var valIntStr = (val | 0) + '',
      c = '';
  if ((val | 0) === 0 && val < 0) {
    valIntStr = '-' + valIntStr;
  }
  while (valIntStr.length + c.length < 5) {
    c += ' ';
  }
  return c + (typeof val === 'undefined' || val === null ? NaN : val).round(3);
}

var moments = {
    'elevation.stdev': {
        mean: 42.063,
        stdev: 6.353,
    },
    'elevation.pearsonSkew': {
        levels: {
            '+high': -1.032,
            '+medium': -0.277,
            'low': 0.666,
            '-medium': 1.232,
            '-high': Infinity,
        },
    },
    'slope.stdev': {
        mean: 10.154,
        stdev: 3.586,
    },
    'slope.groeneveldMeedenSkew': {
        levels: {
            '+high': -0.347,
            '+medium': -0.130,
            'low': 0.088,
            '-medium': 0.305,
            '-high': Infinity,
        },
    },
    'roughness.jaggedness': {
        levels: [0.006, 0.02, 0.044, 0.10],
    },
    'roughness.terrainRuggednessIndex': {
        levels: [1, 2.2, 3.5, 4.8],
    },
};

function getSummary(analytics) {
    var results = {},
        deviationBuckets = [-2, -2/3, 2/3, 2];
    for (var prop in moments) {
        if (moments.hasOwnProperty(prop)) {
            var averageProp = moments[prop],
                split = prop.split('.'),
                sampleProp = analytics[split[0]][split[1]];
            if (typeof averageProp.mean === 'number') {
                results[prop] = (sampleProp - averageProp.mean) / averageProp.stdev;
                results[prop] = numberToCategory(results[prop], deviationBuckets);
            }
            else {
                results[prop] = numberToCategory(sampleProp, averageProp.levels);
            }
        }
    }
    return results;
}

/**
 * Classify a numeric input.
 *
 * @param {Number} value
 *   The number to classify.
 * @param {Object/Number[]} [buckets=[-2, -2/3, 2/3, 2]]
 *   An object or numeric array used to classify `value`. If `buckets` is an
 *   array, the returned category will be the first of "very low," "low,"
 *   "medium," and "high," in that order, where the correspondingly ordered
 *   bucket value is higher than the `value` being classified, or "very high"
 *   if all bucket values are smaller than the `value` being classified. If
 *   `buckets` is an object, its values will be sorted, and the returned
 *   category will be the key of the first bucket value that is higher than the
 *   `value` being classified, or the key of the highest bucket value if the
 *   `value` being classified is higher than all the values in `buckets`.
 *
 * @return {String}
 *   The category into which the numeric input was classified.
 */
function numberToCategory(value, buckets) {
    if (!buckets) {
        buckets = [-2, -2/3, 2/3, 2];
    }
    if (typeof buckets.length === 'number' && buckets.length > 3) {
        if (value <  buckets[0]) return 'very low';
        if (value <  buckets[1]) return 'low';
        if (value <  buckets[2]) return 'medium';
        if (value <  buckets[3]) return 'high';
        if (value >= buckets[3]) return 'very high';
    }
    var keys = Object.keys(buckets).sort(function(a, b) {
            return buckets[a] - buckets[b];
        }),
        l = keys.length;
    for (var i = 0; i < l; i++) {
        if (value < buckets[keys[i]]) {
            return keys[i];
        }
    }
    return keys[l-1];
}

/**
 * Utility method to round numbers to a given number of decimal places.
 *
 * Usage:
 *   3.5.round(0) // 4
 *   Math.random().round(4) // 0.8179
 *   var a = 5532; a.round(-2) // 5500
 *   Number.prototype.round(12345.6, -1) // 12350
 *   32..round(-1) // 30 (two dots required since the first one is a decimal)
 */
Number.prototype.round = function(v, a) {
  if (typeof a === 'undefined') {
    a = v;
    v = this;
  }
  if (!a) a = 0;
  var m = Math.pow(10, a|0);
  return Math.round(v*m)/m;
};

// Run setup
setup();
