import * as THREE from 'three';

/**
 * Append a transformed low-poly part to a flower geometry.
 *
 * Each part keeps its indexed vertices while receiving its own vertex color,
 * so both flower types remain inexpensive when rendered as instanced meshes.
 *
 * @param {Object} target
 *   Accumulated position, normal, color, and index arrays.
 * @param {THREE.BufferGeometry} source
 *   Part geometry to append.
 * @param {THREE.Matrix4} transform
 *   Local transform for the part.
 * @param {THREE.Color} color
 *   Vertex color for the part.
 */
function appendFlowerPart(target, source, transform, color) {
    var sourcePositions = source.attributes.position,
        sourceNormals = source.attributes.normal,
        sourceIndex = source.index,
        normalMatrix = new THREE.Matrix3().getNormalMatrix(transform),
        position = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        vertexCount = sourcePositions.count,
        vertexOffset = target.positions.length / 3;
    for (var vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
        position.fromBufferAttribute(sourcePositions, vertexIndex).applyMatrix4(transform);
        normal.fromBufferAttribute(sourceNormals, vertexIndex).applyMatrix3(normalMatrix).normalize();
        target.positions.push(position.x, position.y, position.z);
        target.normals.push(normal.x, normal.y, normal.z);
        target.colors.push(color.r, color.g, color.b);
    }
    if (sourceIndex) {
        for (var index = 0; index < sourceIndex.count; index++) {
            target.indices.push(vertexOffset + sourceIndex.getX(index));
        }
    }
    else {
        for (var triangleIndex = 0; triangleIndex < vertexCount; triangleIndex++) {
            target.indices.push(vertexOffset + triangleIndex);
        }
    }
}

/**
 * Create one low-profile alpine flower as a single colored mesh.
 *
 * Buttercups use five broad golden petals. Asters use eight narrower blue
 * petals around a warm center. Both forms are deliberately shorter than the
 * demo's average grass tuft so they read as field accents instead of shrubs.
 *
 * @param {string} type
 *   Either `buttercup` or `aster`.
 * @return {THREE.BufferGeometry}
 *   Procedural flower geometry in a Y-up local coordinate system.
 */
function createFlowerGeometry(type) {
    var isButtercup = type === 'buttercup',
        stemHeight = isButtercup ? 4.6 : 4.8,
        petalCount = isButtercup ? 5 : 8,
        petalLength = isButtercup ? 0.9 : 1.02,
        petalWidth = isButtercup ? 0.52 : 0.3,
        petalThickness = isButtercup ? 0.12 : 0.1,
        petalOffset = isButtercup ? 0.63 : 0.72,
        flowerY = stemHeight + 0.18,
        parts = {
            positions: [],
            normals: [],
            colors: [],
            indices: [],
        },
        stemGeometry = new THREE.CylinderGeometry(0.07, 0.11, stemHeight, 5),
        leafGeometry = new THREE.SphereGeometry(1, 6, 3),
        petalGeometry = new THREE.SphereGeometry(1, 8, 3),
        centerGeometry = new THREE.SphereGeometry(isButtercup ? 0.23 : 0.21, 8, 4),
        stemColor = new THREE.Color(0x4c7934),
        petalColor = new THREE.Color(isButtercup ? 0xf4c542 : 0x809ddf),
        centerColor = new THREE.Color(isButtercup ? 0xa76527 : 0xf2c94c),
        position = new THREE.Vector3(),
        scale = new THREE.Vector3(),
        quaternion = new THREE.Quaternion(),
        transform = new THREE.Matrix4();

    position.set(0, stemHeight * 0.5, 0);
    transform.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
    appendFlowerPart(parts, stemGeometry, transform, stemColor);

    for (var leafIndex = 0; leafIndex < 2; leafIndex++) {
        var leafAngle = (leafIndex ? 1 : -1) * (0.9 + leafIndex * 0.3),
            leafY = stemHeight * (0.32 + leafIndex * 0.2);
        position.set(Math.cos(leafAngle) * 0.22, leafY, Math.sin(leafAngle) * 0.22);
        scale.set(0.78, 0.07, 0.2);
        quaternion.setFromEuler(new THREE.Euler(0, leafAngle, leafIndex ? 0.22 : -0.22));
        transform.compose(position, quaternion, scale);
        appendFlowerPart(parts, leafGeometry, transform, stemColor);
    }

    for (var petalIndex = 0; petalIndex < petalCount; petalIndex++) {
        var petalAngle = petalIndex / petalCount * Math.PI * 2,
            petalShade = petalColor.clone();
        petalShade.offsetHSL(0, 0, petalIndex % 2 ? 0.035 : -0.015);
        position.set(
            Math.cos(petalAngle) * petalOffset,
            flowerY,
            Math.sin(petalAngle) * petalOffset
        );
        scale.set(petalLength, petalThickness, petalWidth);
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), petalAngle);
        transform.compose(position, quaternion, scale);
        appendFlowerPart(parts, petalGeometry, transform, petalShade);
    }

    position.set(0, flowerY + 0.03, 0);
    transform.compose(position, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    appendFlowerPart(parts, centerGeometry, transform, centerColor);

    stemGeometry.dispose();
    leafGeometry.dispose();
    petalGeometry.dispose();
    centerGeometry.dispose();

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(parts.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(parts.normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(parts.colors, 3));
    geometry.setIndex(parts.indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}

/**
 * Create an instancing-ready flower mesh.
 *
 * @param {string} type
 *   Either `buttercup` or `aster`.
 * @return {THREE.Mesh}
 *   Flower prototype mesh.
 */
function createFlowerMesh(type) {
    var isButtercup = type === 'buttercup',
        geometry = createFlowerGeometry(type),
        mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshLambertMaterial({
                color: 0xffffff,
                emissive: isButtercup ? 0x3d2604 : 0x17204c,
                emissiveIntensity: 0.16,
                flatShading: true,
                side: THREE.DoubleSide,
                vertexColors: true,
            })
        );
    mesh.userData.flowerHeight = geometry.boundingBox.max.y;
    mesh.name = isButtercup ? 'Alpine Buttercup' : 'Mountain Aster';
    return mesh;
}

export { createFlowerMesh };
