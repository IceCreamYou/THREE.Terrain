`THREE.Terrain` generates terrains either procedurally or from image-based
heightmaps for use with the [Three.js](https://github.com/mrdoob/three.js) 3D
graphics library for the web.

#### [Try the demo](https://icecreamyou.github.io/THREE.Terrain/)!

## Usage

Include the script on your page (after the `three.js` library):

```html
<script src="THREE.Terrain.min.js"></script>
```

Then, in your own script, generate a terrain and add it to your scene:

```javascript
var xS = 63, yS = 63;
terrainScene = THREE.Terrain({
    easing: THREE.Terrain.Linear,
    frequency: 2.5,
    heightmap: THREE.Terrain.DiamondSquare,
    material: new THREE.MeshBasicMaterial({color: 0x5566aa}),
    maxHeight: 100,
    minHeight: -100,
    useBufferGeometry: true,
    xSegments: xS,
    xSize: 1024,
    ySegments: yS,
    ySize: 1024,
});
// Assuming you already have your global scene
scene.add(terrainScene);

// Add randomly distributed foliage
decoScene = THREE.Terrain.ScatterMeshes(geo, {
    mesh: new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6)),
    w: xS,
    h: yS,
    spread: 0.02,
    randomness: Math.random,
});
terrainScene.add(decoScene);
```

All parameters are optional and thoroughly documented in the
[source code](https://github.com/IceCreamYou/THREE.Terrain/blob/gh-pages/build/THREE.Terrain.js).
You can play around with some of the parameters and see what happens in the
[demo](https://icecreamyou.github.io/THREE.Terrain/).

![Screenshot 1](https://raw.githubusercontent.com/IceCreamYou/THREE.Terrain/gh-pages/demo/img/screenshot1.jpg)
![Screenshot 2](https://raw.githubusercontent.com/IceCreamYou/THREE.Terrain/gh-pages/demo/img/screenshot2.png)
