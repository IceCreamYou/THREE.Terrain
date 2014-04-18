var webglExists = ( function () { try { var canvas = document.createElement( 'canvas' ); return !!window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )();

// Workaround: in Chrome, if a page is opened with window.open(), window.innerWidth and window.innerHeight will be zero.
if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }

var camera, scene, renderer, clock, player, terrainScene, controls = {}, fpsCamera;
var INV_MAX_FPS = 1 / 100,
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
  scene.fog = new THREE.FogExp2(0xcc6655, 0.0025);

  renderer = webglExists ? new THREE.WebGLRenderer({ antialias: true }) : new THREE.CanvasRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('tabindex', -1);

  camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
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
  scene.add(camera);
  camera.position.x = 155;
  camera.position.y = 190;
  camera.position.z = 265;
  camera.rotation.x = -44.5 * Math.PI / 180;
  camera.rotation.y = 24 * Math.PI / 180;
  camera.rotation.z = 22 * Math.PI / 180;

  terrainScene = THREE.Terrain({
    material: new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true}),
    useBufferGeometry: false,
    xSize: 512, ySize: 512, xSegments: 31, ySegments: 31,
  });
  scene.add(terrainScene);
}

function setupDatGui() {
  var heightmapImage = new Image();
  heightmapImage.src = 'img/heightmap.png';
  function Settings() {
    var mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true});
    var that = this;
    this.easing = 'NoEasing';
    this.heightmap = 'DiamondSquare';
    this.maxHeight = 200;
    this.segments = 31;
    this['width:length ratio'] = 1;
    this['First person view'] = useFPS;
    this.Regenerate = function() {
      var s = parseInt(that.segments, 10),
          h = that.heightmap === 'heightmap.png';
      var o = {
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : THREE.Terrain[that.heightmap],
        material: mat,
        maxHeight: (that.maxHeight - 100) * (h ? 0.25 : 1),
        maxVariation: 12,
        minHeight: -100 * (h ? 0.25 : 1),
        useBufferGeometry: false,
        xSize: 512,
        ySize: Math.round(512 * that['width:length ratio']),
        xSegments: s,
        ySegments: Math.round(s * that['width:length ratio']),
      };
      scene.remove(terrainScene);
      terrainScene = THREE.Terrain(o);
      scene.add(terrainScene);
      var he = document.getElementById('heightmap');
      if (he) {
        o.heightmap = he;
        THREE.Terrain.toHeightmap(terrainScene.children[0].geometry.vertices, o);
      }
    };
    this.Regenerate();
  }
  var gui = new dat.GUI();
  var settings = new Settings();
  gui.add(settings, 'easing', ['NoEasing', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'heightmap', ['Corner', 'DiamondSquare', 'heightmap.png', 'Perlin', 'Simplex', 'PerlinDiamond', 'SimplexCorner']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'segments', 7, 95).step(1).onFinishChange(settings.Regenerate);
  gui.add(settings, 'First person view').onChange(function(val) {
    useFPS = val;
    fpsCamera.position.x = 155;
    fpsCamera.position.z = 265;
    fpsCamera.position.y = 190;
    controls.lon = -122;
    controls.lat = -40;
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
  var folder = gui.addFolder('Terrain size');
  folder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(settings.Regenerate);
  folder.add(settings, 'width:length ratio', 0.2, 2).step(0.05).onFinishChange(settings.Regenerate);
  gui.add(settings, 'Regenerate');
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
  terrainScene.children[0].rotation.z = Date.now() * 0.00001;
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
