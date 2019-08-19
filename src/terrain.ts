import { BufferGeometry, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';

import { Optimization, TerrainOptions } from './basicTypes';
import { Linear } from './core';
import { Clamp, Smooth, Step, Turbulence } from './filters';
import { DiamondSquare } from './generators';
import { fromHeightmap } from './images';

/**
 * A terrain object for use with the Three.js library.
 *
 * Usage: `var terrainScene = THREE.Terrain();`
 *
 * @param {Object} [options]
 *   An optional map of settings that control how the terrain is constructed
 *   and displayed. Options include:
 *
 *   - `after`: A function to run after other transformations on the terrain
 *     produce the highest-detail heightmap, but before optimizations and
 *     visual properties are applied. Takes two parameters, which are the same
 *     as those for {@link THREE.Terrain.DiamondSquare}: an array of
 *     `THREE.Vector3` objects representing the vertices of the terrain, and a
 *     map of options with the same available properties as the `options`
 *     parameter for the `THREE.Terrain` function.
 *   - `easing`: A function that affects the distribution of slopes by
 *     interpolating the height of each vertex along a curve. Valid values
 *     include `THREE.Terrain.Linear` (the default), `THREE.Terrain.EaseIn`,
 *     `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *     `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *     between 0 and 1 and returns a float between 0 and 1.
 *   - `frequency`: For terrain generation methods that support it (Perlin,
 *     Simplex, and Worley) the octave of randomness. This basically controls
 *     how big features of the terrain will be (higher frequencies result in
 *     smaller features). Often running multiple generation functions with
 *     different frequencies and heights results in nice detail, as
 *     the PerlinLayers and SimplexLayers methods demonstrate. (The counterpart
 *     to frequency, amplitude, is represented by the difference between the
 *     `maxHeight` and `minHeight` parameters.) Defaults to 2.5.
 *   - `heightmap`: Either a canvas or pre-loaded image (from the same domain
 *     as the webpage or served with a CORS-friendly header) representing
 *     terrain height data (lighter pixels are higher); or a function used to
 *     generate random height data for the terrain. Valid random functions are
 *     specified in `generators.js` (or custom functions with the same
 *     signature). Ideally heightmap images have the same number of pixels as
 *     the terrain has vertices, as determined by the `xSegments` and
 *     `ySegments` options, but this is not required. If the heightmap is a
 *     different size, vertex height values will be interpolated.) Defaults to
 *     `THREE.Terrain.DiamondSquare`.
 *   - `material`: a THREE.Material instance used to display the terrain.
 *     Defaults to `new THREE.MeshBasicMaterial({color: 0xee6633})`.
 *   - `maxHeight`: the highest point, in Three.js units, that a peak should
 *     reach. Defaults to 100. Setting to `undefined`, `null`, or `Infinity`
 *     removes the cap, but this is generally not recommended because many
 *     generators and filters require a vertical range. Instead, consider
 *     setting the `stretch` option to `false`.
 *   - `minHeight`: the lowest point, in Three.js units, that a valley should
 *     reach. Defaults to -100. Setting to `undefined`, `null`, or `-Infinity`
 *     removes the cap, but this is generally not recommended because many
 *     generators and filters require a vertical range. Instead, consider
 *     setting the `stretch` option to `false`.
 *   - `steps`: If this is a number above 1, the terrain will be paritioned
 *     into that many flat "steps," resulting in a blocky appearance. Defaults
 *     to 1.
 *   - `stretch`: Determines whether to stretch the heightmap across the
 *     maximum and minimum height range if the height range produced by the
 *     `heightmap` property is smaller. Defaults to true.
 *   - `turbulent`: Whether to perform a turbulence transformation. Defaults to
 *     false.
 *   - `useBufferGeometry`: a Boolean indicating whether to use
 *     THREE.BufferGeometry instead of THREE.Geometry for the Terrain plane.
 *     Defaults to `false`.
 *   - `xSegments`: The number of segments (rows) to divide the terrain plane
 *     into. (This basically determines how detailed the terrain is.) Defaults
 *     to 63.
 *   - `xSize`: The width of the terrain in Three.js units. Defaults to 1024.
 *     Rendering might be slightly faster if this is a multiple of
 *     `options.xSegments + 1`.
 *   - `ySegments`: The number of segments (columns) to divide the terrain
 *     plane into. (This basically determines how detailed the terrain is.)
 *     Defaults to 63.
 *   - `ySize`: The length of the terrain in Three.js units. Defaults to 1024.
 *     Rendering might be slightly faster if this is a multiple of
 *     `options.ySegments + 1`.
 */

export function Terrain(givenOptions: Partial<TerrainOptions>) {
    var defaultOptions: TerrainOptions = {
        after: null,
        easing: Linear,
        heightmap: DiamondSquare,
        material: null,
        maxHeight: 100,
        minHeight: -100,
        optimization: Optimization.NONE,
        frequency: 2.5,
        steps: 1,
        stretch: true,
        turbulent: false,
        useBufferGeometry: false,
        xSegments: 63,
        xSize: 1024,
        ySegments: 63,
        ySize: 1024,
    };

    let options: TerrainOptions & { _mesh: Mesh | null }
        = { ...defaultOptions, ...(givenOptions || {}), _mesh: null /* internal, only */ };

    options.material = options.material || new MeshBasicMaterial({ color: 0xee6633 });

    // Encapsulating the terrain in a parent object allows us the flexibility
    // to more easily have multiple meshes for optimization purposes.
    var scene = new Object3D();
    // Planes are initialized on the XY plane, so rotate the plane to make it lie flat.
    scene.rotation.x = -0.5 * Math.PI;

    // Create the terrain mesh.
    // To save memory, it is possible to re-use a pre-existing mesh.
    const { _mesh } = options;
    let mesh: Mesh;
    let geometry: PlaneGeometry;
    if (_mesh && _mesh.geometry.type === 'PlaneGeometry') {
        mesh = _mesh;
        geometry = _mesh.geometry as PlaneGeometry;
        const { parameters, vertices } = geometry;
        if (parameters.widthSegments === options.xSegments &&
            (mesh.geometry as any).parameters.heightSegments === options.ySegments) {
            mesh.material = options.material;
            mesh.scale.x = options.xSize / parameters.width;
            mesh.scale.y = options.ySize / parameters.height;
            for (var i = 0, l = vertices.length; i < l; i++) {
                vertices[i].z = 0;
            }
        }
    }
    else {
        geometry = new PlaneGeometry(options.xSize, options.ySize, options.xSegments, options.ySegments);
        mesh = new Mesh(geometry, options.material);
    }
    delete options._mesh; // Remove the reference for GC

    // Assign elevation data to the terrain plane from a heightmap or function.
    if (options.heightmap instanceof HTMLCanvasElement || options.heightmap instanceof Image) {
        fromHeightmap(geometry.vertices, options);
    }
    else if (typeof options.heightmap === 'function') {
        options.heightmap(geometry.vertices, options);
    }
    else {
        console.warn('An invalid value was passed for `options.heightmap`: ' + options.heightmap);
    }
    Normalize(mesh, options);

    if (options.useBufferGeometry) {
        mesh.geometry = (new BufferGeometry()).fromGeometry(geometry);
    }

    // lod.addLevel(mesh, options.unit * 10 * Math.pow(2, lodLevel));

    scene.add(mesh);
    return scene;
};

/**
 * Normalize the terrain after applying a heightmap or filter.
 *
 * This applies turbulence, steps, and height clamping; calls the `after`
 * callback; updates normals and the bounding sphere; and marks vertices as
 * dirty.
 *
 * @param {THREE.Mesh} mesh
 *   The terrain mesh.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid options are the same as for {@link THREE.Terrain}().
 */
export function Normalize(mesh: Mesh, options: TerrainOptions) {
    const geometry = mesh.geometry as PlaneGeometry;
    var v = geometry.vertices;
    if (options.turbulent) {
        Turbulence(v, options);
    }
    if (options.steps && options.steps > 1) {
        Step(v, options.steps);
        Smooth(v, options);
    }
    // Keep the terrain within the allotted height range if necessary, and do easing.
    Clamp(v, options);
    // Call the "after" callback
    if (typeof options.after === 'function') {
        options.after(v, options);
    }
    // Mark the geometry as having changed and needing updates.
    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
};
