import * as THREE from 'three';
import { TerrainNS } from './core.js';

let defaultGrassTexture;

/**
 * Return a deterministic pseudo-random value for procedural grass details.
 *
 * A hash is used instead of a shared random-number stream so that generated
 * patches remain stable when a caller changes the order of its samples.
 *
 * @param {number} seed
 *   Numeric seed for the hash.
 * @return {number}
 *   A value in the half-open range [0, 1).
 */
function randomValue(seed) {
    var value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

/**
 * Draw one tapered blade into a grass texture atlas.
 *
 * @param {CanvasRenderingContext2D} context
 *   Canvas context receiving the blade.
 * @param {number} x
 *   Horizontal base position in canvas pixels.
 * @param {number} baseY
 *   Vertical base position in canvas pixels.
 * @param {number} width
 *   Blade width in canvas pixels.
 * @param {number} height
 *   Blade height in canvas pixels.
 * @param {number} lean
 *   Horizontal displacement of the tip in canvas pixels.
 * @param {string} color
 *   CSS fill color for the blade.
 */
function drawBlade(context, x, baseY, width, height, lean, color) {
    var halfWidth = width * 0.5;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x - halfWidth, baseY);
    context.quadraticCurveTo(x - width * 0.45 - lean, baseY - height * 0.45, x + lean, baseY - height);
    context.quadraticCurveTo(x + width * 0.35 + lean, baseY - height * 0.45, x + halfWidth, baseY);
    context.closePath();
    context.fill();
}

/**
 * Hash integer coordinates for deterministic two-dimensional value noise.
 *
 * @param {number} x
 *   Integer lattice coordinate on the x axis.
 * @param {number} y
 *   Integer lattice coordinate on the y axis.
 * @return {number}
 *   A repeatable value in the half-open range [0, 1).
 */
function grassNoiseHash(x, y) {
    var value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
}

/**
 * Evaluate smooth two-dimensional value noise for grass coverage variation.
 *
 * Four hashed lattice values are interpolated with a cubic smoothstep curve.
 * This creates broad, continuous patches without adding a texture asset or
 * allowing the scatter pattern to follow terrain face boundaries.
 *
 * @param {number} x
 *   Noise-space x coordinate.
 * @param {number} y
 *   Noise-space y coordinate.
 * @return {number}
 *   A smoothly varying value in the range [0, 1].
 */
function grassValueNoise(x, y) {
    var x0 = Math.floor(x),
        y0 = Math.floor(y),
        tx = x - x0,
        ty = y - y0,
        sx = tx * tx * (3 - 2 * tx),
        sy = ty * ty * (3 - 2 * ty),
        n00 = grassNoiseHash(x0, y0),
        n10 = grassNoiseHash(x0 + 1, y0),
        n01 = grassNoiseHash(x0, y0 + 1),
        n11 = grassNoiseHash(x0 + 1, y0 + 1),
        nx0 = n00 + (n10 - n00) * sx,
        nx1 = n01 + (n11 - n01) * sx;
    return nx0 + (nx1 - nx0) * sy;
}

/**
 * Return a deterministic broad-and-detail coverage value for grass patches.
 *
 * The broad scale (0.018) produces features about 56 terrain units across;
 * the detail scale (0.043) adds features about 23 units across. A 72/28
 * weighted mix keeps the distribution irregular while avoiding noisy holes.
 *
 * @param {number} x
 *   Terrain-local x coordinate.
 * @param {number} y
 *   Terrain-local y coordinate.
 * @return {number}
 *   A coverage variation value in the range [0, 1].
 */
function grassPatchNoise(x, y) {
    var broad = grassValueNoise(x * 0.018, y * 0.018),
        detail = grassValueNoise(x * 0.043 + 17.3, y * 0.043 - 9.1);
    return broad * 0.72 + detail * 0.28;
}

/**
 * Calculate the visible weight of a height-blended grass texture.
 *
 * The default levels match the demo's grass layer: grass fades in from -80
 * to -35, remains fully visible through 20, and fades out by 50. The return
 * value is texture coverage, not the inverse factor used by the material's
 * `mix(texture, previousColor, inverseWeight)` expression.
 *
 * @param {number} height
 *   Terrain-local height.
 * @param {number[]} [levels]
 *   Four levels in the order start-in, full-in, start-out, full-out.
 * @return {number}
 *   Grass texture coverage in the range [0, 1].
 */
function grassTextureWeight(height, levels) {
    levels = levels || [-80, -35, 20, 50];
    var fadeInRange = Math.max(0.0001, levels[1] - levels[0]),
        fadeOutRange = Math.max(0.0001, levels[3] - levels[2]),
        fadeInT = Math.max(0, Math.min(1, (height - levels[0]) / fadeInRange)),
        fadeOutT = Math.max(0, Math.min(1, (height - levels[2]) / fadeOutRange)),
        fadeIn = fadeInT * fadeInT * (3 - 2 * fadeInT),
        fadeOut = fadeOutT * fadeOutT * (3 - 2 * fadeOutT);
    return Math.max(0, Math.min(1, fadeIn - fadeOut));
}

/**
 * Create a transparent atlas containing small clusters of grass blades.
 *
 * The atlas is intentionally generated at runtime so applications can use
 * the helper without shipping a particular art asset. Pass `texture` to
 * `createGrass` when a custom alpha-cutout atlas is preferred.
 *
 * @param {Object} [options]
 *   Optional texture settings. `size` controls the square canvas size;
 *   `clusterCount`, `minBlades`, and `bladeRange` tune the atlas density.
 * @return {THREE.CanvasTexture}
 */
function createGrassTexture(options) {
    options = options || {};
    if (defaultGrassTexture && !options.newTexture) {
        return defaultGrassTexture;
    }

    var size = options.size || 256,
        canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);

    // Keep each cluster open enough to read as separate blades, while using
    // enough clusters to keep the terrain from looking dotted at a distance.
    var clusterCount = typeof options.clusterCount === 'number' ? options.clusterCount : 5,
        minBlades = typeof options.minBlades === 'number' ? options.minBlades : 3,
        bladeRange = typeof options.bladeRange === 'number' ? options.bladeRange : 3,
        clusterSpread = typeof options.clusterSpread === 'number' ? options.clusterSpread : 0.18,
        bladeWidthMin = typeof options.bladeWidthMin === 'number' ? options.bladeWidthMin : 0.022,
        bladeWidthRange = typeof options.bladeWidthRange === 'number' ? options.bladeWidthRange : 0.028;
    for (var cluster = 0; cluster < clusterCount; cluster++) {
        var clusterX = clusterCount === 1 ? size * 0.5 : (0.05 + randomValue(cluster * 3 + 1) * 0.9) * size,
            clusterBase = size * (0.78 + randomValue(cluster * 3 + 2) * 0.18),
            bladeCount = minBlades + Math.floor(randomValue(cluster * 3 + 3) * (bladeRange + 1));
        for (var blade = 0; blade < bladeCount; blade++) {
            var seed = cluster * 32 + blade,
                x = clusterX + (randomValue(seed + 1) - 0.5) * size * clusterSpread,
                height = size * (0.28 + randomValue(seed + 2) * 0.62),
                width = size * (bladeWidthMin + randomValue(seed + 3) * bladeWidthRange),
                lean = (randomValue(seed + 4) - 0.5) * size * 0.06,
                green = 150 + Math.floor(randomValue(seed + 5) * 75),
                red = 35 + Math.floor(randomValue(seed + 6) * 45),
                blue = 34 + Math.floor(randomValue(seed + 7) * 40);
            drawBlade(
                context,
                x,
                clusterBase,
                width,
                height,
                lean,
                'rgb(' + red + ', ' + green + ', ' + blue + ')'
            );
            if (blade % 3 === 0) {
                drawBlade(context, x + width * 0.18, clusterBase, width * 0.35, height * 0.92, lean * 0.7, 'rgb(224, 240, 118)');
            }
        }
    }

    var texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    if (!options.newTexture) {
        defaultGrassTexture = texture;
    }
    return texture;
}

/**
 * Create three crossed billboard planes for an alpha-cutout grass tuft.
 *
 * @param {number} width
 *   Width of the tuft in terrain-local units.
 * @param {number} height
 *   Height of the tuft in terrain-local units.
 * @return {THREE.BufferGeometry}
 *   Crossed, UV-mapped billboard geometry.
 */
function createGrassBillboardGeometry(width, height) {
    var halfWidth = width * 0.5,
        positions = [],
        normals = [],
        uvs = [],
        tangents = [],
        indices = [],
        angles = [0, Math.PI / 3, 2 * Math.PI / 3],
        corners = [
            [-halfWidth, 0, 0, 0],
            [halfWidth, 0, 1, 0],
            [halfWidth, height, 1, 1],
            [-halfWidth, height, 0, 1],
        ];

    for (var plane = 0; plane < angles.length; plane++) {
        var angle = angles[plane],
            cosine = Math.cos(angle),
            sine = Math.sin(angle),
            normalX = sine,
            normalZ = cosine,
            tangentX = cosine,
            tangentZ = -sine,
            vertexOffset = positions.length / 3;
        for (var corner = 0; corner < corners.length; corner++) {
            var point = corners[corner],
                x = point[0];
            positions.push(x * cosine, point[1], -x * sine);
            normals.push(normalX, 0, normalZ);
            uvs.push(point[2], point[3]);
            tangents.push(tangentX, 0, tangentZ);
        }
        indices.push(
            vertexOffset, vertexOffset + 1, vertexOffset + 2,
            vertexOffset, vertexOffset + 2, vertexOffset + 3
        );
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('grassTangent', new THREE.Float32BufferAttribute(tangents, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
}

/**
 * Create tapered ribbon geometry with per-vertex color variation.
 *
 * Each blade uses two narrow crossing ribbons and five height levels. The
 * narrow ribbons keep close views strand-like while the crossed planes keep
 * the tuft readable from changing camera directions.
 *
 * @param {number} width
 *   Width of the tuft in terrain-local units.
 * @param {number} height
 *   Maximum blade height in terrain-local units.
 * @param {number} bladeCount
 *   Number of procedural blades in the tuft.
 * @return {THREE.BufferGeometry}
 *   Tapered, wind-ready blade geometry.
 */
function createGrassGeometry(width, height, bladeCount) {
    bladeCount = bladeCount || 4;
    var positions = [],
        uvs = [],
        tangents = [],
        colors = [],
        indices = [],
        levelT = [0, 0.2, 0.45, 0.72, 1],
        levelWidth = [0.75, 0.9, 0.55, 0.28, 0.02],
        levelLean = [0, 0.08, 0.3, 0.65, 1];
    for (var blade = 0; blade < bladeCount; blade++) {
        var seed = blade * 23 + 7,
            baseAngle = randomValue(seed + 1) * Math.PI * 2,
            baseRadius = Math.sqrt(randomValue(seed + 2)) * width * 0.28,
            baseX = Math.cos(baseAngle) * baseRadius,
            baseZ = Math.sin(baseAngle) * baseRadius,
            bladeAngle = randomValue(seed + 3) * Math.PI * 2,
            heightScale = 0.55 + randomValue(seed + 4) * 0.45,
            bladeHeight = height * heightScale,
            // Keep each blade narrow enough to read as a strand instead of a
            // triangular leaf when the camera is down in the grass.
            bladeWidth = width * (0.005 + randomValue(seed + 5) * 0.009),
            lean = bladeHeight * (0.06 + randomValue(seed + 6) * 0.22),
            shade = 0.88 + randomValue(seed + 7) * 0.24,
                red = (0.28 + randomValue(seed + 8) * 0.18) * shade,
                green = (0.52 + randomValue(seed + 9) * 0.24) * shade,
                blue = (0.1 + randomValue(seed + 10) * 0.08) * shade;
        // Cross two narrow ribbons per blade. This keeps the grass readable
        // from a low camera without turning the strand into a broad card.
        for (var plane = 0; plane < 2; plane++) {
            var planeAngle = bladeAngle + plane * Math.PI * 0.5,
                leanX = Math.cos(planeAngle) * lean,
                leanZ = Math.sin(planeAngle) * lean,
                curveX = Math.cos(planeAngle) * bladeWidth * 0.12,
                curveZ = Math.sin(planeAngle) * bladeWidth * 0.12,
                planeVertexOffset = positions.length / 3;
            for (var level = 0; level < levelT.length; level++) {
                var t = levelT[level],
                    centerX = baseX + leanX * levelLean[level] + curveX * Math.sin(t * Math.PI),
                    centerZ = baseZ + leanZ * levelLean[level] + curveZ * Math.sin(t * Math.PI),
                    halfWidth = bladeWidth * 0.5 * levelWidth[level],
                    leftX = centerX - Math.sin(planeAngle) * halfWidth,
                    leftZ = centerZ + Math.cos(planeAngle) * halfWidth,
                    rightX = centerX + Math.sin(planeAngle) * halfWidth,
                    rightZ = centerZ - Math.cos(planeAngle) * halfWidth,
                    colorShade = shade * (0.88 + t * 0.24),
                    leftVertex = [leftX, bladeHeight * t, leftZ],
                    rightVertex = [rightX, bladeHeight * t, rightZ];
                positions.push(leftVertex[0], leftVertex[1], leftVertex[2], rightVertex[0], rightVertex[1], rightVertex[2]);
                uvs.push(0, t, 1, t);
                tangents.push(Math.cos(planeAngle), 0, Math.sin(planeAngle), Math.cos(planeAngle), 0, Math.sin(planeAngle));
                colors.push(red * colorShade, green * colorShade, blue * colorShade, red * colorShade, green * colorShade, blue * colorShade);
            }
            for (var segment = 0; segment < levelT.length - 1; segment++) {
                var current = planeVertexOffset + segment * 2,
                    next = current + 2;
                indices.push(current, current + 1, next + 1, current, next + 1, next);
            }
        }
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('grassTangent', new THREE.Float32BufferAttribute(tangents, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
}

/**
 * Create the lit grass material and install its wind/minimum-light shader.
 *
 * @param {Object} options
 *   Grass material and wind settings.
 * @param {THREE.Texture|null} texture
 *   Optional alpha-cutout atlas. A null texture selects vertex colors.
 * @return {THREE.MeshLambertMaterial}
 *   Material with grass-specific shader uniforms in `userData`.
 */
function createGrassMaterial(options, texture) {
    var hasTexture = !!texture,
        materialOptions = {
        alphaTest: hasTexture && typeof options.alphaTest === 'number' ? options.alphaTest : 0,
        color: options.color || 0xffffff,
        depthWrite: true,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: typeof options.emissiveIntensity === 'number' ? options.emissiveIntensity : 1,
        fog: true,
            side: THREE.DoubleSide,
            vertexColors: !hasTexture,
            // Textured grass uses an opaque alpha cutout, never translucency.
            transparent: false,
        };
    if (texture) materialOptions.map = texture;
    var material = new THREE.MeshLambertMaterial(materialOptions),
        uniforms = {
            time: {value: 0},
            windDirection: {value: new THREE.Vector2(0.8, 0.35)},
            windSpeed: {value: typeof options.windSpeed === 'number' ? options.windSpeed : 1.2},
            windStrength: {value: typeof options.windStrength === 'number' ? options.windStrength : 7},
            minimumLight: {value: typeof options.minimumLight === 'number' ? options.minimumLight : 1},
        };

    material.userData.grassUniforms = uniforms;
    material.onBeforeCompile = function(shader) {
        shader.uniforms.grassTime = uniforms.time;
        shader.uniforms.grassWindDirection = uniforms.windDirection;
        shader.uniforms.grassWindSpeed = uniforms.windSpeed;
        shader.uniforms.grassWindStrength = uniforms.windStrength;
        shader.uniforms.grassMinimumLight = uniforms.minimumLight;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            '#include <common>\nattribute vec3 grassTangent;\nuniform float grassTime;\nuniform vec2 grassWindDirection;\nuniform float grassWindSpeed;\nuniform float grassWindStrength;'
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n' +
            'float grassHeight = smoothstep(0.0, 1.0, uv.y);\n' +
            'float grassPatchX = modelMatrix[3].x;\n' +
            'float grassPatchZ = modelMatrix[3].z;\n' +
            '#ifdef USE_INSTANCING\n' +
            'grassPatchX += instanceMatrix[3].x;\n' +
            // Terrain geometry is authored on XY before its parent rotates
            // it into world space; instance y is the second ground-plane
            // coordinate, while instance z is elevation.
            'grassPatchZ += instanceMatrix[3].y;\n' +
            '#endif\n' +
            'float grassPhase = dot(vec2(grassPatchX, grassPatchZ), grassWindDirection) * 0.012 + grassTime * grassWindSpeed;\n' +
            'float grassGust = sin(grassPhase) * 0.7 + sin(grassPhase * 0.43 + 1.7) * 0.3;\n' +
            'float grassBend = grassGust * grassWindStrength * grassHeight * grassHeight;\n' +
            'transformed += grassTangent * grassBend;'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            'uniform float opacity;',
            'uniform float opacity;\nuniform float grassMinimumLight;'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
            'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n' +
            'outgoingLight = max(outgoingLight, diffuseColor.rgb * grassMinimumLight);'
        );
    };
    return material;
}

/**
 * Create one procedural grass tuft suitable for `ScatterMeshes`.
 *
 * By default the object contains individual tapered blade quads with per-blade
 * color variation. Passing `texture` or `textureOptions` retains the crossed
 * alpha-cutout path for applications that provide a texture atlas. Both paths
 * bend their upper vertices in the vertex shader.
 *
 * @param {Object} [options]
 *   `width`, `height`, `bladeCount`, `texture`, `textureOptions`, `material`,
 *   `alphaTest`, `color`, `minimumLight`, `windSpeed`, and `windStrength`
 *   control the generated grass object.
 * @return {THREE.Mesh}
 */
function createGrass(options) {
    options = options || {};
    var texture = options.texture ||
        (options.textureOptions ? createGrassTexture(options.textureOptions) : null) ||
        (options.material && options.material.map),
        material = options.material || createGrassMaterial(options, texture),
        geometry = texture ?
            createGrassBillboardGeometry(options.width || 12, options.height || 18) :
            createGrassGeometry(options.width || 12, options.height || 18, options.bladeCount || 3),
        mesh = new THREE.Mesh(
            geometry,
            material
        );
    mesh.name = options.name || 'DenseGrass';
    mesh.userData.grassMaterial = material;
    return mesh;
}

/**
 * Update the shared wind uniforms on a grass object or its material.
 *
 * @param {THREE.Mesh} grass
 *   A mesh returned by `createGrass`.
 * @param {number} time
 *   Elapsed time in seconds.
 * @return {THREE.Mesh}
 */
function updateGrass(grass, time) {
    if (!grass) return grass;
    var material = grass.userData && grass.userData.grassMaterial || grass.material,
        uniforms = material && material.userData && material.userData.grassUniforms;
    if (uniforms) {
        uniforms.time.value = time;
    }
    return grass;
}

/**
 * Hide instanced grass patches beyond a camera-relative distance.
 *
 * The source transforms remain in `userData`, while visible transforms are
 * compacted into the active prefix of the `InstancedMesh`. Setting `count`
 * means the GPU does not process the culled instances; the CPU still checks
 * all source positions when the camera moves or the refresh interval elapses.
 *
 * @param {THREE.Object3D} grassScene
 *   The object returned by `scatterGrass`.
 * @param {THREE.Camera} camera
 *   Camera used to measure distance in world space.
 * @param {number} maxDistance
 *   Maximum visible distance. Use `0` or `Infinity` to disable culling.
 * @return {THREE.Object3D}
 */
function updateGrassLOD(grassScene, camera, maxDistance) {
    if (!grassScene || !camera) return grassScene;
    var distance = typeof maxDistance === 'number' ? maxDistance : 0,
        distanceSquared = distance > 0 && distance !== Infinity ? distance * distance : Infinity,
        cameraPosition = camera.getWorldPosition(new THREE.Vector3()),
        worldPosition = new THREE.Vector3(),
        sourceMatrix = new THREE.Matrix4(),
        now = Date.now();

    grassScene.traverse(function(object) {
        if (!object.isInstancedMesh || !object.userData.instancedLOD) return;
        var lod = object.userData.instancedLOD,
            cameraMoved = !lod.cameraPosition || lod.cameraPosition.distanceToSquared(cameraPosition) > 4,
            distanceChanged = lod.lastDistance !== distance;
        if (!lod.initialized || cameraMoved || distanceChanged || now - lod.lastUpdate > 250) {
            object.updateMatrixWorld(true);
            var visibleCount = 0;
            for (var index = 0; index < lod.positions.length / 3; index++) {
                worldPosition.fromArray(lod.positions, index * 3).applyMatrix4(object.matrixWorld);
                var visible = worldPosition.distanceToSquared(cameraPosition) <= distanceSquared;
                if (visible) {
                    sourceMatrix.fromArray(lod.matrices, index * 16);
                    object.setMatrixAt(visibleCount, sourceMatrix);
                    if (lod.colors && object.instanceColor) {
                        object.instanceColor.setXYZ(
                            visibleCount,
                            lod.colors[index * 3],
                            lod.colors[index * 3 + 1],
                            lod.colors[index * 3 + 2]
                        );
                    }
                    visibleCount++;
                }
            }
            object.count = visibleCount;
            object.instanceMatrix.needsUpdate = true;
            if (object.instanceColor) object.instanceColor.needsUpdate = true;
            lod.initialized = true;
            lod.visibleCount = visibleCount;
            lod.lastDistance = distance;
            lod.lastUpdate = now;
            lod.cameraPosition = cameraPosition.clone();
        }
    });
    return grassScene;
}

/**
 * Scatter a grass object using the terrain scatter implementation.
 *
 * @param {THREE.BufferGeometry} geometry
 *   The terrain geometry to cover.
 * @param {Object} [options]
 *   All regular `ScatterMeshes` options are supported. If `mesh` is omitted,
 *   the remaining grass options are passed to `createGrass`.
 * @return {THREE.Object3D}
 */
function scatterGrass(geometry, options) {
    options = options || {};
    var scatterOptions = {};
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            scatterOptions[option] = options[option];
        }
    }
    scatterOptions.mesh = options.mesh || createGrass(options);
    return TerrainNS.ScatterMeshes(geometry, scatterOptions);
}

TerrainNS.createGrassTexture = createGrassTexture;
TerrainNS.createGrass = createGrass;
TerrainNS.grassPatchNoise = grassPatchNoise;
TerrainNS.grassTextureWeight = grassTextureWeight;
TerrainNS.updateGrass = updateGrass;
TerrainNS.ScatterGrass = scatterGrass;

export { createGrassTexture, createGrass, grassPatchNoise, grassTextureWeight, updateGrass, updateGrassLOD, scatterGrass };
