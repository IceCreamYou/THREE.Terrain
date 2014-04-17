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
  //scene.fog = new THREE.Fog(0xcc6655, 1, 600);

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
  //player = new Player();
  //player.add(camera);
  //scene.add(player);
  scene.add(camera);
  camera.position.x = 155;
  camera.position.z = 265;
  camera.position.y = 190;
  camera.rotation.x = -50 * Math.PI / 180;
  camera.rotation.y = 30 * Math.PI / 180;
  camera.rotation.z = 30 * Math.PI / 180;

/*
  var light = new THREE.DirectionalLight(0xffeac3, 1.5);
  light.position.set(1, 1, 1);
  scene.add(light);
  light = new THREE.DirectionalLight(0xc3eaff, 0.75);
  light.position.set(-1, -0.5, -1);
  scene.add(light);

  terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xee6633, wireframe: true })
  );
  terrain.rotation.x = -0.5 * Math.PI;

  // Generate random terrain
  var g = terrain.geometry.vertices,
      l = Math.round(Math.sqrt(g.length)),
      max = 300,
      min = -50,
      peakiness = 1.1,
      maxVar = 40,
      maxVarHalf = maxVar * 0.5;
  for (var i = 0; i < l; i++) {
    for (var j = 0; j < l; j++) {
      var k = i*l + j,
          s = (i-1)*l + j,
          t = i*l + j-1,
          v = ((s < 0 ? g[k].z : g[s].z) + (t < 0 ? g[k].z : g[t].z)) * 0.5;
      g[k].z = THREE.Math.clamp(v + Math.pow(Math.random(), peakiness) * maxVar - maxVarHalf, min, max);
    }
  }
  terrain.geometry.verticesNeedUpdate = true;
  terrain.geometry.normalsNeedUpdate = true;
  terrain.geometry.computeBoundingSphere();
*/

  terrainScene = THREE.Terrain({
    heightmap: THREE.Terrain.DiamondSquare,
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
    this.maxHeight = 100;
    this.segments = 31;
    this.firstPerson = useFPS;
    this.Regenerate = function() {
      var s = parseInt(that.segments, 10),
          h = that.heightmap === 'heightmap.png';
      var t = THREE.Terrain({
        easing: THREE.Terrain[that.easing],
        heightmap: h ? heightmapImage : THREE.Terrain[that.heightmap],
        material: mat,
        maxHeight: that.maxHeight * (h ? 0.25 : 1),
        maxVariation: 12,
        minHeight: -200 * (h ? 0.25 : 1),
        useBufferGeometry: false,
        xSize: 512,
        ySize: 512,
        xSegments: s,
        ySegments: s,
      });
      scene.remove(terrainScene);
      terrainScene = t;
      scene.add(terrainScene);
    };
  }
  var gui = new dat.GUI();
  var settings = new Settings();
  gui.add(settings, 'easing', ['NoEasing', 'EaseInOut', 'InEaseOut']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'heightmap', ['Corner', 'DiamondSquare', 'heightmap.png', 'Perlin', 'Simplex']).onFinishChange(settings.Regenerate);
  gui.add(settings, 'maxHeight', 1, 200).step(1).onFinishChange(settings.Regenerate);
  gui.add(settings, 'segments', [7, 15, 31, 63]).onFinishChange(settings.Regenerate);
  gui.add(settings, 'firstPerson').onChange(function(val) {
    useFPS = val;
    fpsCamera.position.x = 155;
    fpsCamera.position.z = 265;
    fpsCamera.position.y = 190;
    controls.lon = -130;
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
  /*
  if (!PL.isEnabled()) {
    player.rotateTowards(mouseX / window.innerWidth, mouseY / window.innerHeight);
  }
  player.update(delta);

  // Collision
  if (player.collideFloor(-100)) {
    player.canJump = true;
  }
  if (player.position.x < -280) {
    player.position.x = -280;
  }
  else if (player.position.x > 280) {
    player.position.x = 280;
  }
  if (player.position.z < -280) {
    player.position.z = -280;
  }
  else if (player.position.z > 280) {
    player.position.z = 280;
  }
  */
}

document.addEventListener('mousemove', function(event) {
  if (!paused) {
    mouseX = event.pageX;
    mouseY = event.pageY;
    /*
    if (PL.isEnabled()) {
      player.rotate(event.movementY, event.movementX, 0);
    }
    */
  }
}, false);

document.addEventListener('keydown', function(event) {
  // Don't move while paused.
  if (paused) return;
  // Allow CTRL+L, CTRL+T, CTRL+W, and F5 for sanity
  if (!event.ctrlKey || !(event.keyCode == 76 || event.keyCode == 84 || event.keyCode == 87)) {
    if (event.keyCode != 116) {
      event.preventDefault();
    }
  }
  /*
  switch (event.keyCode) {
    case 38: // up
    case 87: // w
      player.moveDirection.FORWARD = true;
      break;
    case 37: // left
    case 65: // a
      player.moveDirection.LEFT = true;
      break;
    case 40: // down
    case 83: // s
      player.moveDirection.BACKWARD = true;
      break;
    case 39: // right
    case 68: // d
      player.moveDirection.RIGHT = true;
      break;
    case 32: // space
      player.jump();
      break;
  }
  */
}, false);

document.addEventListener('keyup', function(event) {
  // Don't move while paused.
  if (paused) return;

  /*
  switch (event.keyCode) {
    case 38: // up
    case 87: // w
      player.moveDirection.FORWARD = false;
      break;
    case 37: // left
    case 65: // a
      player.moveDirection.LEFT = false;
      break;
    case 40: // down
    case 83: // s
      player.moveDirection.BACKWARD = false;
      break;
    case 39: // right
    case 68: // d
      player.moveDirection.RIGHT = false;
      break;
    case 81: // q
      player.freeze = !player.freeze;
      break;
    case 32: // space
      break;
    case 13: // enter
      goFullScreen();
      break;
  }
  */
}, false);

function goFullScreen() {
  if (PL.isEnabled()) return;
  if (BigScreen.enabled) {
    BigScreen.request(document.body, function() {
      document.body.className += ' fullscreen';
      PL.requestPointerLock(document.body, function() {
        startAnimating();
        document.body.className += ' pointerlock';
      }, function() {
        // We can lose pointer lock but keep full screen when alt-tabbing away
        document.body.className = document.body.className.replace(/\bpointerlock\b/g, '');
      }, function() {
        alert('Error: entering pointer lock failed');
      });
    }, function() {
      document.body.className = document.body.className.replace(/\bfullscreen\b/g, '');
    }, function() {
      alert('Error: entering full screen failed');
    });
  }
  else {
    alert('Error: full screen not supported');
  }
}

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
