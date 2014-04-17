`THREE.Terrain` is a library that extends the
[Three.js](https://github.com/mrdoob/three.js) web-based 3D graphics framework
to support generating random terrains and rendering terrain from predetermined
heightmaps.

Open `index.html` to try a demo (if you want to load the sample heightmap image
instead of generating random terrains, you will need to run it on a local
server).

## Usage

Include the script on your page (after the `three.js` library):

```html
<script src="THREE.Terrain.js"></script>
```

If you want the Perlin and Simplex noise functions to be available for random
terrain generation, also include `noise.js`:

```html
<script src="noise.js"></script>
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

You can play around with the parameters and see what happens in the demo. They
are all thoroughly documented in the source code. All parameters are optional.
