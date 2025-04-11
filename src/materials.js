import * as THREE from 'three';
import { TerrainNS } from './core.js';

/**
 * Generate a material that blends together textures based on vertex height.
 *
 * Inspired by http://www.chandlerprall.com/2011/06/blending-webgl-textures/
 *
 * Usage:
 *
 *    // Assuming the textures are already loaded
 *    var material = THREE.Terrain.generateBlendedMaterial([
 *      {texture: THREE.ImageUtils.loadTexture('img1.jpg')},
 *      {texture: THREE.ImageUtils.loadTexture('img2.jpg'), levels: [-80, -35, 20, 50]},
 *      {texture: THREE.ImageUtils.loadTexture('img3.jpg'), levels: [20, 50, 60, 85]},
 *      {texture: THREE.ImageUtils.loadTexture('img4.jpg'), glsl: '1.0 - smoothstep(65.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 80.0, vPosition.z)'},
 *    ]);
 *
 * This material tries to behave exactly like a MeshLambertMaterial other than
 * the fact that it blends multiple texture maps together, although
 * ShaderMaterials are treated slightly differently by Three.js so YMMV. Note
 * that this means the texture will appear black unless there are lights
 * shining on it.
 *
 * @param {Object[]} textures
 *   An array of objects specifying textures to blend together and how to blend
 *   them. Each object should have a `texture` property containing a
 *   `THREE.Texture` instance. There must be at least one texture and the first
 *   texture does not need any other properties because it will serve as the
 *   base, showing up wherever another texture isn't blended in. Other textures
 *   must have either a `levels` property containing an array of four numbers
 *   or a `glsl` property containing a single GLSL expression evaluating to a
 *   float between 0.0 and 1.0. For the `levels` property, the four numbers
 *   are, in order: the height at which the texture will start blending in, the
 *   height at which it will be fully blended in, the height at which it will
 *   start blending out, and the height at which it will be fully blended out.
 *   The `vec3 vPosition` variable is available to `glsl` expressions; it
 *   contains the coordinates in Three-space of the texel currently being
 *   rendered.
 * @param {Three.Material} material
 *   An optional base material. You can use this to pick a different base
 *   material type such as `MeshStandardMaterial` instead of the default
 *   `MeshLambertMaterial`.
 */
function generateBlendedMaterial(textures, material) {
    // Convert numbers to strings of floats so GLSL doesn't barf on "1" instead of "1.0"
    function glslifyNumber(n) {
        return n === (n|0) ? n+'.0' : n+'';
    }

    var declare = '',
        assign = '',
        t0Repeat = textures[0].texture.repeat,
        t0Offset = textures[0].texture.offset;
    for (var i = 0, l = textures.length; i < l; i++) {
        // Update textures
        textures[i].texture.wrapS = textures[i].texture.wrapT = THREE.RepeatWrapping;
        // Set color space and enhance saturation for more vibrant colors
        if (textures[i].texture.source) {
            textures[i].texture.colorSpace = THREE.SRGBColorSpace;
            textures[i].texture.encoding = THREE.sRGBEncoding; // Backward compatibility
        }
        textures[i].texture.needsUpdate = true;

        // Shader fragments
        // Declare each texture, then mix them together.
        declare += 'uniform sampler2D texture_' + i + ';\n';
        if (i !== 0) {
            var v = textures[i].levels, // Vertex heights at which to blend textures in and out
                p = textures[i].glsl, // Or specify a GLSL expression that evaluates to a float between 0.0 and 1.0 indicating how opaque the texture should be at this texel
                useLevels = typeof v !== 'undefined', // Use levels if they exist; otherwise, use the GLSL expression
                tiRepeat = textures[i].texture.repeat,
                tiOffset = textures[i].texture.offset;
            if (useLevels) {
                // Must fade in; can't start and stop at the same point.
                // So, if levels are too close, move one of them slightly.
                if (v[1] - v[0] < 1) v[0] -= 1;
                if (v[3] - v[2] < 1) v[3] += 1;
                for (var j = 0; j < v.length; j++) {
                    v[j] = glslifyNumber(v[j]);
                }
            }
            // The transparency of the new texture when it is layered on top of the existing color at this texel is
            // (how far between the start-blending-in and fully-blended-in levels the current vertex is) +
            // (how far between the start-blending-out and fully-blended-out levels the current vertex is)
            // So the opacity is 1.0 minus that.
            var blendAmount = !useLevels ? p :
                '1.0 - smoothstep(' + v[0] + ', ' + v[1] + ', vPosition.z) + smoothstep(' + v[2] + ', ' + v[3] + ', vPosition.z)';
            assign += '        color = mix( ' +
                'texture2D( texture_' + i + ', MyvUv * vec2( ' + glslifyNumber(tiRepeat.x) + ', ' + glslifyNumber(tiRepeat.y) + ' ) + vec2( ' + glslifyNumber(tiOffset.x) + ', ' + glslifyNumber(tiOffset.y) + ' ) ), ' +
                'color, ' +
                'max(min(' + blendAmount + ', 1.0), 0.0)' +
                ');\n';
        }
    }

    // Enhance color vibrancy in the shader
    var fragBlend = '// Calculate terrain slope for texture blending\n' +
        '    float slope = acos(max(min(dot(normalize(myNormal), vec3(0.0, 0.0, 1.0)), 1.0), -1.0));\n' +
        '    diffuseColor = vec4( diffuse, opacity );\n' +
        '    vec4 color = texture2D( texture_0, MyvUv * vec2( ' + glslifyNumber(t0Repeat.x) + ', ' + glslifyNumber(t0Repeat.y) + ' ) + vec2( ' + glslifyNumber(t0Offset.x) + ', ' + glslifyNumber(t0Offset.y) + ' ) ); // base\n' +
            assign +
        '    // Enhance saturation of the final color\n' +
        '    vec3 grayScale = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));\n' +
        '    color.rgb = mix(grayScale, color.rgb, 1.3);\n' + // Increase saturation 
        '    diffuseColor = color;\n';

    var fragPars = declare + '\n' +
            'varying vec2 MyvUv;\n' +
            'varying vec3 vPosition;\n' +
            'varying vec3 myNormal;\n';

    // Use MeshPhongMaterial for more realistic lighting
    var mat = material || new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        shininess: 5, 
        specular: new THREE.Color(0x111111),
        flatShading: false
    });
    mat.onBeforeCompile = function(shader) {
        // Patch vertexShader to setup MyUv, vPosition, and myNormal
        shader.vertexShader = shader.vertexShader.replace('#include <common>',
            'varying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal;\n#include <common>');
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>',
            'MyvUv = uv;\nvPosition = position;\nmyNormal = normal;\n#include <uv_vertex>');
        shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', 
            '#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nmyNormal = mat3(instanceMatrix) * myNormal;\n#endif');

        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', fragPars + '\n#include <common>');
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', fragBlend);

        // Add our custom texture uniforms
        for (var i = 0, l = textures.length; i < l; i++) {
            shader.uniforms['texture_' + i] = {
                type: 't',
                value: textures[i].texture,
            };
        }
    };

    return mat;
}

export { generateBlendedMaterial };
