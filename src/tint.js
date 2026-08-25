import * as THREE from 'three';

/**
 * Normalize an optional instance-tint range into Three.js colors.
 *
 * @param {Array<THREE.Color|number|string>|Object} tintRange
 *   Either `[min, max]` or an object with `min` and `max` color values.
 * @return {{min: THREE.Color, max: THREE.Color}|null}
 *   Normalized colors, or null when the option is absent or incomplete.
 */
function getTintRange(tintRange) {
    if (!tintRange) return null;
    var min = Array.isArray(tintRange) ? tintRange[0] : tintRange.min,
        max = Array.isArray(tintRange) ? tintRange[1] : tintRange.max;
    if (typeof min === 'undefined' || typeof max === 'undefined') return null;
    return {
        min: new THREE.Color(min),
        max: new THREE.Color(max),
    };
}

/**
 * Preserve custom shader callbacks when cloning a material for instance tinting.
 *
 * Three.js copies the standard material properties and `userData`, but its
 * material `copy` method intentionally does not copy `onBeforeCompile` or
 * `customProgramCacheKey`. Grass uses `onBeforeCompile` for wind displacement
 * and its minimum-light floor, so dropping either callback would silently turn
 * a tinted grass instance back into the unmodified Lambert shader.
 *
 * @param {THREE.Material} source
 *   Material whose custom shader callbacks should be retained.
 * @param {THREE.Material} clone
 *   Material clone receiving the callbacks.
 * @return {THREE.Material}
 *   The callback-preserving clone.
 */
function preserveMaterialShaderHooks(source, clone) {
    if (typeof source.onBeforeCompile === 'function') {
        clone.onBeforeCompile = source.onBeforeCompile;
    }
    if (typeof source.customProgramCacheKey === 'function') {
        clone.customProgramCacheKey = source.customProgramCacheKey;
    }
    return clone;
}

/**
 * Clone a material or material array and enable vertex colors on the clone.
 *
 * Instance tinting multiplies the mesh's vertex colors by
 * `InstancedMesh.instanceColor`; this helper keeps the caller's prototype
 * material unchanged while enabling that multiplication on the instance
 * material.
 *
 * @param {THREE.Material|THREE.Material[]} material
 *   Material or material array to clone.
 * @return {THREE.Material|THREE.Material[]}
 *   A vertex-color-enabled clone.
 */
function cloneMaterialWithVertexColors(material) {
    if (Array.isArray(material)) {
        return material.map(function(item) {
            var clone = preserveMaterialShaderHooks(item, item.clone());
            clone.vertexColors = true;
            clone.needsUpdate = true;
            return clone;
        });
    }
    var clone = preserveMaterialShaderHooks(material, material.clone());
    clone.vertexColors = true;
    clone.needsUpdate = true;
    return clone;
}

/**
 * Clone geometry and provide neutral vertex colors when it has none.
 *
 * White fallback colors preserve the prototype's material color while still
 * allowing an instance color to tint every vertex consistently.
 *
 * @param {THREE.BufferGeometry} geometry
 *   Geometry to clone.
 * @return {THREE.BufferGeometry}
 *   Geometry with a `color` attribute ready for vertex-color shading.
 */
function cloneGeometryWithVertexColors(geometry) {
    var clone = geometry.clone();
    if (!clone.getAttribute('color') && clone.getAttribute('position')) {
        var colors = new Float32Array(clone.getAttribute('position').count * 3);
        colors.fill(1);
        clone.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    return clone;
}

export { getTintRange, cloneMaterialWithVertexColors, cloneGeometryWithVertexColors };
