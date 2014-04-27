var webglExists = ( function () { try { var canvas = document.createElement( 'canvas' ); return !!window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )();

// Workaround: in Chrome, if a page is opened with window.open(), window.innerWidth and window.innerHeight will be zero.
if ( window.innerWidth === 0 ) { window.innerWidth = parent.innerWidth; window.innerHeight = parent.innerHeight; }

var camera, scene, renderer, clock, player, terrainScene, controls = {}, fpsCamera, skyDome, skyLight;
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
  THREE.ImageUtils.loadTexture('img/sky1.jpg', undefined, function(t1) {
    skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(4096, 64, 64),
      new THREE.MeshBasicMaterial({map: t1, side: THREE.BackSide, fog: false})
    );
    scene.add(skyDome);
  });

  skyLight = new THREE.DirectionalLight(0xfffbef, 1.85);
  skyLight.position.set(1, 1, 1);
  scene.add(skyLight);
  var light = new THREE.DirectionalLight(0xc3eaff, 1);
  light.position.set(-1, -0.5, -1);
  scene.add(light);
}

function setupDatGui() {
  var heightmapImage = new Image();
  heightmapImage.src = 'img/heightmap.png';
  function Settings() {
    var that = this;
    var mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true});
    var blend, grass;
    THREE.ImageUtils.loadTexture('img/sand1.jpg', undefined, function(t1) {
      THREE.ImageUtils.loadTexture('img/grass1.jpg', undefined, function(t2) {
        THREE.ImageUtils.loadTexture('img/stone1.jpg', undefined, function(t3) {
          THREE.ImageUtils.loadTexture('img/snow1.jpg', undefined, function(t4) {
            blend = THREE.Terrain.generateBlendedMaterial([
              {texture: t1},
              {texture: t2, levels: [-80, -35, 20, 50]},
              {texture: t3, levels: [20, 50, 60, 85]},
              {texture: t4, glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
            ], scene);
            grass = new THREE.MeshLambertMaterial({map: t2});
            that.Regenerate();
          });
        });
      });
    });
    this.easing = 'NoEasing';
    this.heightmap = 'PerlinDiamond';
    this.maxHeight = 200;
    this.segments = webglExists ? 63 : 31;
    this.size = 1024;
    this.sky = true;
    this.texture = webglExists ? 'Blended' : 'Wireframe';
    this['width:length ratio'] = 1;
    this['Flight mode'] = useFPS;
    this['Light color'] = '#fffbef';
    this.Regenerate = function() {
      var s = parseInt(that.segments, 10),
          h = that.heightmap === 'heightmap.png';
      var o = {
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : THREE.Terrain[that.heightmap],
        material: that.texture == 'Wireframe' ? mat : (that.texture == 'Blended' ? blend : grass),
        maxHeight: (that.maxHeight - 100) * (h ? 0.25 : 1),
        minHeight: -100 * (h ? 0.25 : 1),
        useBufferGeometry: s >= 64 && that.texture != 'Wireframe',
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
        if (s < 64 || that.texture == 'Wireframe') {
          he.style.display = 'block';
          o.heightmap = he;
          THREE.Terrain.toHeightmap(terrainScene.children[0].geometry.vertices, o);
        }
        else {
          he.style.display = 'none';
        }
      }
    };
  }
  var gui = new dat.GUI();
  var settings = new Settings();
  //gui.add(settings, 'easing', ['NoEasing', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'heightmap', ['Corner', 'DiamondSquare', 'heightmap.png', 'Perlin', 'Simplex', 'PerlinDiamond', 'SimplexCorner']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'texture', ['Blended', 'Wireframe'/*, 'Grass'*/]).onFinishChange(settings.Regenerate);
  gui.add(settings, 'segments', 7, 127).step(1).onFinishChange(settings.Regenerate);
  gui.addColor(settings, 'Light color').onChange(function(val) {
    skyLight.color.set(val);
  });
  /*
  gui.add(settings, 'sky').onChange(function(val) {
    skyDome.visible = val;
  });
   */
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
  var folder = gui.addFolder('Terrain size');
  folder.add(settings, 'size', 256, 3072).step(256).onFinishChange(settings.Regenerate);
  folder.add(settings, 'maxHeight', 2, 300).step(2).onFinishChange(settings.Regenerate);
  folder.add(settings, 'width:length ratio', 0.2, 2).step(0.05).onFinishChange(settings.Regenerate);
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
    stats = {begin:function(){},end:function(){}};
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
  if (terrainScene) terrainScene.children[0].rotation.z = Date.now() * 0.00001;
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
