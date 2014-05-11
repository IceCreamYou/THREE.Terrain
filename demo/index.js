var webglExists = ( function () { try { var canvas = document.createElement( 'canvas' ); return !!window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )();

if (!webglExists) {
  alert('Your browser does not appear to support WebGL. You can try viewing this page anyway, but it may be slow and some things may not look as intended. Please try viewing on desktop Firefox or Chrome.');
}

if (/&?webgl=0\b/g.test(location.hash)) {
  webglExists = !confirm('Are you sure you want to disable WebGL on this page?');
  if (webglExists) {
    location.hash = '#';
  }
}

// Workaround: in Chrome, if a page is opened with window.open(), window.innerWidth and window.innerHeight will be zero.
if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }

var camera, scene, renderer, clock, player, terrainScene, decoScene, controls = {}, fpsCamera, skyDome, skyLight;
var INV_MAX_FPS = 1 / 100,
    frameDelta = 0,
    paused = true,
    mouseX = 0,
    mouseY = 0,
    useFPS = false;

function animate() {
  stats.begin();
  draw();

  frameDelta += clock.getDelta();
  while (frameDelta >= INV_MAX_FPS) {
    update(INV_MAX_FPS);
    frameDelta -= INV_MAX_FPS;
  }

  stats.end();
  if (!paused) {
    requestAnimationFrame(animate);
  }
}

function startAnimating() {
  if (paused) {
    paused = false;
    controls.freeze = false;
    clock.start();
    requestAnimationFrame(animate);
  }
}

function stopAnimating() {
  paused = true;
  controls.freeze = true;
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
  scene.fog = new THREE.FogExp2(0xe5f9e9, 0.0007);

  renderer = webglExists ? new THREE.WebGLRenderer({ antialias: true }) : new THREE.CanvasRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('tabindex', -1);

  camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
  scene.add(camera);
  camera.position.x = 449;
  camera.position.y = 311;
  camera.position.z = 376;
  camera.rotation.x = -52 * Math.PI / 180;
  camera.rotation.y = 35 * Math.PI / 180;
  camera.rotation.z = 37 * Math.PI / 180;

  clock = new THREE.Clock(false);
}

function setupControls() {
  fpsCamera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
  scene.add(fpsCamera);
  controls = new THREE.FirstPersonControls(fpsCamera, renderer.domElement);
  controls.freeze = true;
  controls.movementSpeed = 100;
  controls.lookSpeed = 0.075;
}

function setupWorld() {
  THREE.ImageUtils.loadTexture('demo/img/sky1.jpg', undefined, function(t1) {
    skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(4096, 64, 64),
      new THREE.MeshBasicMaterial({map: t1, side: THREE.BackSide, fog: false})
    );
    scene.add(skyDome);
  });

  skyLight = new THREE.DirectionalLight(0xead3d3, 1.5);
  skyLight.position.set(1, 1, 1);
  scene.add(skyLight);
  var light = new THREE.DirectionalLight(0xc3eaff, 0.75);
  light.position.set(-1, -0.5, -1);
  scene.add(light);
}

function setupDatGui() {
  var heightmapImage = new Image();
  heightmapImage.src = 'demo/img/heightmap.png';
  function Settings() {
    var that = this;
    var mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true});
    var blend;
    THREE.ImageUtils.loadTexture('demo/img/sand1.jpg', undefined, function(t1) {
      THREE.ImageUtils.loadTexture('demo/img/grass1.jpg', undefined, function(t2) {
        THREE.ImageUtils.loadTexture('demo/img/stone1.jpg', undefined, function(t3) {
          THREE.ImageUtils.loadTexture('demo/img/snow1.jpg', undefined, function(t4) {
            blend = THREE.Terrain.generateBlendedMaterial([
              {texture: t1},
              {texture: t2, levels: [-80, -35, 20, 50]},
              {texture: t3, levels: [20, 50, 60, 85]},
              {texture: t4, glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
              {texture: t3, glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'}, // between 27 and 45 degrees
            ], scene);
            that.Regenerate();
          });
        });
      });
    });
    this.easing = 'Linear';
    this.heightmap = 'PerlinDiamond';
    this.maxHeight = 200;
    this.segments = webglExists ? 63 : 31;
    this.steps = 1;
    this.turbulent = false;
    this.size = 1024;
    this.sky = true;
    this.texture = webglExists ? 'Blended' : 'Wireframe';
    this.edgeDirection = 'Normal';
    this.edgeDistance = 128;
    this.edgeCurve = 'EaseInOut';
    this['width:length ratio'] = 1;
    this['Flight mode'] = useFPS;
    this['Light color'] = '#fffbef';
    this.spread = 40;
    this.scattering = 'Altitude';
    this.after = function(vertices, options) {
      if (that.edgeDirection === 'Normal') return;
      THREE.Terrain.Edges(
        vertices,
        options,
        that.edgeDirection === 'Up' ? true : false,
        that.edgeDistance,
        THREE.Terrain[that.edgeCurve]
      );
    };
    window.rebuild = this.Regenerate = function() {
      var s = parseInt(that.segments, 10),
          h = that.heightmap === 'heightmap.png';
      var o = {
        after: that.after,
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : THREE.Terrain[that.heightmap],
        material: that.texture == 'Wireframe' ? mat : blend,
        maxHeight: that.maxHeight - 100,
        minHeight: -100,
        steps: that.steps,
        stretch: true,
        turbulent: that.turbulent,
        useBufferGeometry: false,
        xSize: that.size,
        ySize: Math.round(that.size * that['width:length ratio']),
        xSegments: s,
        ySegments: Math.round(s * that['width:length ratio']),
      };
      scene.remove(terrainScene);
      terrainScene = THREE.Terrain(o);
      scene.add(terrainScene);
      skyDome.visible = that.texture != 'Wireframe';
      var he = document.getElementById('heightmap');
      if (he) {
        o.heightmap = he;
        THREE.Terrain.toHeightmap(terrainScene.children[0].geometry.vertices, o);
      }
      that['Scatter meshes']();
    };
    this.altitudeSpread = function(v, k) {
      if (v.z > -80 && v.z < -50) return !(k % 4) && Math.random() < THREE.Terrain.EaseInOut((v.z - -80) / (-50 - -80)) * that.spread * 0.002; // jshint ignore:line
      else if (v.z > -50 && v.z < 20) return !(k % 4) && Math.random() < that.spread * 0.002; // jshint ignore:line
      else if (v.z > 20 && v.z < 50) return !(k % 4) && Math.random() < THREE.Terrain.EaseInOut((v.z - 20) / (50 - 20)) * that.spread * 0.002; // jshint ignore:line
      return false;
    };
    var mesh = buildTree();
    var decoMat = mesh.material.clone(); // new THREE.MeshBasicMaterial({color: 0x229966, wireframe: true});
    decoMat.materials[0].wireframe = true;
    decoMat.materials[1].wireframe = true;
    this['Scatter meshes'] = function() {
      var s = parseInt(that.segments, 10);
      var geo = terrainScene.children[0].geometry;
      terrainScene.remove(decoScene);
      var o = {
        xSegments: s,
        ySegments: Math.round(s * that['width:length ratio']),
      };
      decoScene = THREE.Terrain.ScatterMeshes(geo, {
        mesh: mesh,
        w: s,
        h: Math.round(s * that['width:length ratio']),
        spread: that.scattering === 'Altitude' ? that.altitudeSpread : (that.scattering === 'Linear' ? that.spread*0.0005 : THREE.Terrain.InEaseOut(that.spread*0.01)* (that.scattering === 'Worley' ? 1 : 0.5)),
        randomness: that.scattering === 'Linear' ? Math.random : (that.scattering === 'Altitude' ? null : THREE.Terrain.ScatterHelper(THREE.Terrain[that.scattering], o, 2, 0.125)),
      });
      if (decoScene) {
        if (that.texture == 'Wireframe') {
          decoScene.children[0].material = decoMat;
        }
        terrainScene.add(decoScene);
      }
    };
  }
  var gui = new dat.GUI();
  var settings = new Settings();
  var heightmapFolder = gui.addFolder('Heightmap');
  heightmapFolder.add(settings, 'heightmap', ['DiamondSquare', 'heightmap.png', 'Perlin', 'PerlinDiamond', 'PerlinLayers', 'Simplex', 'SimplexLayers', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'easing', ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'segments', 7, 127).step(1).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'steps', 1, 8).step(1).onFinishChange(settings.Regenerate);
  heightmapFolder.add(settings, 'turbulent').onFinishChange(settings.Regenerate);
  heightmapFolder.open();
  var decoFolder = gui.addFolder('Decoration');
  decoFolder.add(settings, 'texture', ['Blended', 'Wireframe']).onFinishChange(settings.Regenerate);
  decoFolder.add(settings, 'scattering', ['Altitude', 'Linear', 'DiamondSquare', 'Perlin', 'Simplex', 'Value', 'Weierstrass', 'Worley']).onFinishChange(settings['Scatter meshes']);
  decoFolder.add(settings, 'spread', 0, 100).step(1).onFinishChange(settings['Scatter meshes']);
  decoFolder.addColor(settings, 'Light color').onChange(function(val) {
    skyLight.color.set(val);
  });
  var sizeFolder = gui.addFolder('Size');
  sizeFolder.add(settings, 'size', 256, 3072).step(256).onFinishChange(settings.Regenerate);
  sizeFolder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(settings.Regenerate);
  sizeFolder.add(settings, 'width:length ratio', 0.2, 2).step(0.05).onFinishChange(settings.Regenerate);
  var edgesFolder = gui.addFolder('Edges');
  edgesFolder.add(settings, 'edgeDirection', ['Normal', 'Up', 'Down']).onFinishChange(settings.Regenerate);
  edgesFolder.add(settings, 'edgeCurve', ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut']).onFinishChange(settings.Regenerate);
  edgesFolder.add(settings, 'edgeDistance', 0, 256).step(16).onFinishChange(settings.Regenerate);
  gui.add(settings, 'Flight mode').onChange(function(val) {
    useFPS = val;
    fpsCamera.position.x = 449;
    fpsCamera.position.y = 311;
    fpsCamera.position.z = 376;
    controls.lat = -41;
    controls.lon = -139;
    controls.update(0);
    controls.freeze = true;
    if (useFPS) {
      document.getElementById('fpscontrols').className = 'visible';
      setTimeout(function() {
        controls.freeze = false;
      }, 1000);
    }
    else {
      document.getElementById('fpscontrols').className = '';
    }
  });
  gui.add(settings, 'Scatter meshes');
  gui.add(settings, 'Regenerate');

  if (typeof window.Stats !== 'undefined' && /[?&]stats=1\b/g.test(location.search)) {
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '20px';
    stats.domElement.style.bottom = '0px';
    document.body.appendChild(stats.domElement);
    document.getElementById('code').style.left = '120px';
  }
  else {
    stats = {begin: function() {}, end: function() {}};
  }
}

window.addEventListener('resize', function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = renderer.domElement.width / renderer.domElement.height;
  camera.updateProjectionMatrix();
  fpsCamera.aspect = renderer.domElement.width / renderer.domElement.height;
  fpsCamera.updateProjectionMatrix();
  draw();
}, false);

function draw() {
  renderer.render(scene, useFPS ? fpsCamera : camera);
}

function update(delta) {
  if (terrainScene) terrainScene.rotation.z = Date.now() * 0.00001;
  if (controls.update) controls.update(delta);
}

document.addEventListener('mousemove', function(event) {
  if (!paused) {
    mouseX = event.pageX;
    mouseY = event.pageY;
  }
}, false);

// Stop animating if the window is out of focus
function watchFocus() {
  var _blurred = false;
  window.addEventListener('focus', function() {
    if (_blurred) {
      _blurred = false;
      //startAnimating();
      controls.freeze = false;
    }
  });
  window.addEventListener('blur', function() {
    //stopAnimating();
    _blurred = true;
    controls.freeze = true;
  });
}

function __printCameraData() {
  var s = '';
  s += 'camera.position.x = ' + Math.round(fpsCamera.position.x) + ';\n';
  s += 'camera.position.y = ' + Math.round(fpsCamera.position.y) + ';\n';
  s += 'camera.position.z = ' + Math.round(fpsCamera.position.z) + ';\n';
  s += 'camera.rotation.x = ' + Math.round(fpsCamera.rotation.x * 180 / Math.PI) + ' * Math.PI / 180;\n';
  s += 'camera.rotation.y = ' + Math.round(fpsCamera.rotation.y * 180 / Math.PI) + ' * Math.PI / 180;\n';
  s += 'camera.rotation.z = ' + Math.round(fpsCamera.rotation.z * 180 / Math.PI) + ' * Math.PI / 180;\n';
  s += 'controls.lat = ' + Math.round(controls.lat) + ';\n';
  s += 'controls.lon = ' + Math.round(controls.lon) + ';\n';
  console.log(s);
}

function buildTree() {
  var material = new THREE.MeshFaceMaterial([
    new THREE.MeshLambertMaterial({ color: 0x3d2817 }), // brown
    new THREE.MeshLambertMaterial({ color: 0x2d4c1e }), // green
  ]);

  var c0 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6, 1, true));
  c0.position.y = 6;
  var c1 = new THREE.Mesh(new THREE.CylinderGeometry(0, 10, 14, 8));
  c1.position.y = 18;
  var c2 = new THREE.Mesh(new THREE.CylinderGeometry(0, 9, 13, 8));
  c2.position.y = 25;
  var c3 = new THREE.Mesh(new THREE.CylinderGeometry(0, 8, 12, 8));
  c3.position.y = 32;

  var g = new THREE.Geometry();
  c0.updateMatrix();
  c1.updateMatrix();
  c2.updateMatrix();
  c3.updateMatrix();
  g.merge(c0.geometry, c0.matrix);
  g.merge(c1.geometry, c1.matrix);
  g.merge(c2.geometry, c2.matrix);
  g.merge(c3.geometry, c3.matrix);

  var b = c0.geometry.faces.length;
  for (var i = 0, l = g.faces.length; i < l; i++) {
    g.faces[i].materialIndex = i < b ? 0 : 1;
  }

  var m = new THREE.Mesh(g, material);

  m.scale.x = m.scale.z = 5;
  m.scale.y = 1.25;
  return m;
}
