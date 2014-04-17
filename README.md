`THREE.Terrain` generates terrains either randomly or from image-based
heightmaps for use with the [Three.js](https://github.com/mrdoob/three.js) 3D
graphics library for the web.

[Try the demo](https://icecreamyou.github.io/THREE.Terrain/)!

![Screenshot](https://raw.githubusercontent.com/IceCreamYou/THREE.Terrain/gh-pages/img/screenshot.jpg)

## Usage

Include the script on your page (after the `three.js` library):

```html
<script src="THREE.Terrain.noise.min.js"></script>
```

Then, in your own script, generate a terrain and add it to your scene:

```javascript
terrainScene = THREE.Terrain({
    easing: THREE.Terrain.NoEasing,
    heightmap: THREE.Terrain.DiamondSquare,
    material: new THREE.MeshBasicMaterial({color: 0x5566aa}),
    maxHeight: 100,
    minHeight: -100,
    useBufferGeometry: true,
    xSegments: 63,
    xSize: 1024,
    ySegments: 63,
    ySize: 1024,
});
// Assuming you already have your global scene
scene.add(terrainScene);
```

All parameters are optional and thoroughly documented in the
[source code](https://github.com/IceCreamYou/THREE.Terrain/blob/gh-pages/THREE.Terrain.js).
You can play around with some of the parameters and see what happens in the
[demo](https://icecreamyou.github.io/THREE.Terrain/).
