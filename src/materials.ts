import { ShaderLib, UniformsUtils, Texture, RepeatWrapping, ShaderChunk, ShaderMaterial } from 'three';

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
 */
interface TextureBasics {
    texture: Texture;
}

interface TextureWithLevels extends TextureBasics {
    levels: [number, number, number, number];
}

interface TextureWithGLSL extends TextureBasics {
    glsl: string;
}

type TextureParam = TextureWithLevels | TextureWithGLSL;

export function generateBlendedMaterial(textures: TextureParam[]) {
    // Convert numbers to strings of floats so GLSL doesn't barf on "1" instead of "1.0"
    function glslifyNumber(n: number): string {
        return n === (n | 0) ? n + '.0' : n + '';
    }

    var uniforms = UniformsUtils.merge([ShaderLib.lambert.uniforms]),
        declare = '',
        assign = '',
        t0Repeat = textures[0].texture.repeat,
        t0Offset = textures[0].texture.offset;
    for (var i = 0, l = textures.length; i < l; i++) {
        // Uniforms
        textures[i].texture.wrapS = textures[i].texture.wrapT = RepeatWrapping;
        textures[i].texture.needsUpdate = true;
        uniforms['texture_' + i] = {
            type: 't',
            value: textures[i].texture,
        };

        // Shader fragments
        // Declare each texture, then mix them together.
        declare += 'uniform sampler2D texture_' + i + ';\n';
        if (i !== 0) {
            const tiRepeat = textures[i].texture.repeat;
            const tiOffset = textures[i].texture.offset;

            let blendAmount = '';

            // Use levels if they exist; otherwise, use the GLSL expression
            if (typeof (textures[i] as TextureWithLevels).levels !== 'undefined') {
                const v = (textures[i] as TextureWithLevels).levels;
                // Vertex heights at which to blend textures in and out
                // Must fade in; can't start and stop at the same point.
                // So, if levels are too close, move one of them slightly.
                if (v[1] - v[0] < 1) v[0] -= 1;
                if (v[3] - v[2] < 1) v[3] += 1;
                blendAmount = '1.0 - smoothstep(' + glslifyNumber(v[0]) + ', ' + glslifyNumber(v[1]) + ', vPosition.z) + smoothstep(' + glslifyNumber(v[2]) + ', ' + glslifyNumber(v[3]) + ', vPosition.z)';
            }
            else {
                // GLSL expression that evaluates to a float between 0.0 and 1.0 indicating how opaque the texture should be at this texel
                blendAmount = (textures[i] as TextureWithGLSL).glsl;
            }

            // The transparency of the new texture when it is layered on top of the existing color at this texel is
            // (how far between the start-blending-in and fully-blended-in levels the current vertex is) +
            // (how far between the start-blending-out and fully-blended-out levels the current vertex is)
            // So the opacity is 1.0 minus that.

            assign += '        color = mix( ' +
                'texture2D( texture_' + i + ', MyvUv * vec2( ' + glslifyNumber(tiRepeat.x) + ', ' + glslifyNumber(tiRepeat.y) + ' ) + vec2( ' + glslifyNumber(tiOffset.x) + ', ' + glslifyNumber(tiOffset.y) + ' ) ), ' +
                'color, ' +
                'max(min(' + blendAmount + ', 1.0), 0.0)' +
                ');\n';
        }
    }

    var params = {
        // I don't know which of these properties have any effect
        fog: true,
        lights: true,
        // shading: THREE.SmoothShading,
        // blending: THREE.NormalBlending,
        // depthTest: <bool>,
        // depthWrite: <bool>,
        // wireframe: false,
        // wireframeLinewidth: 1,
        // vertexColors: THREE.NoColors,
        // skinning: <bool>,
        // morphTargets: <bool>,
        // morphNormals: <bool>,
        // opacity: 1.0,
        // transparent: <bool>,
        // side: THREE.FrontSide,

        uniforms: uniforms,
        vertexShader: ShaderLib.lambert.vertexShader.replace(
            'void main() {',
            'varying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal; void main() {\nMyvUv = uv;\nvPosition = position;\nmyNormal = normal;'
        ),
        // This is mostly copied from THREE.ShaderLib.lambert.fragmentShader
        fragmentShader: [
            'uniform vec3 diffuse;',
            'uniform vec3 emissive;',
            'uniform float opacity;',
            'varying vec3 vLightFront;',
            '#ifdef DOUBLE_SIDED',
            '    varying vec3 vLightBack;',
            '#endif',

            ShaderChunk.common,
            ShaderChunk.packing,
            ShaderChunk.dithering_pars_fragment,
            ShaderChunk.color_pars_fragment,
            ShaderChunk.uv_pars_fragment,
            ShaderChunk.uv2_pars_fragment,
            ShaderChunk.map_pars_fragment,
            ShaderChunk.alphamap_pars_fragment,
            ShaderChunk.aomap_pars_fragment,
            ShaderChunk.lightmap_pars_fragment,
            ShaderChunk.emissivemap_pars_fragment,
            ShaderChunk.envmap_pars_fragment,
            ShaderChunk.bsdfs,
            ShaderChunk.lights_pars_begin,
            ShaderChunk.lights_pars_maps,
            ShaderChunk.fog_pars_fragment,
            ShaderChunk.shadowmap_pars_fragment,
            ShaderChunk.shadowmask_pars_fragment,
            ShaderChunk.specularmap_pars_fragment,
            ShaderChunk.logdepthbuf_pars_fragment,
            ShaderChunk.clipping_planes_pars_fragment,

            declare,
            'varying vec2 MyvUv;',
            'varying vec3 vPosition;',
            'varying vec3 myNormal;',

            'void main() {',

            ShaderChunk.clipping_planes_fragment,

            'ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );',
            'vec3 totalEmissiveRadiance = emissive;',

            // TODO: The second vector here is the object's "up" vector. Ideally we'd just pass it in directly.
            'float slope = acos(max(min(dot(myNormal, vec3(0.0, 0.0, 1.0)), 1.0), -1.0));',

            '    vec4 diffuseColor = vec4( diffuse, opacity );',
            '    vec4 color = texture2D( texture_0, MyvUv * vec2( ' + glslifyNumber(t0Repeat.x) + ', ' + glslifyNumber(t0Repeat.y) + ' ) + vec2( ' + glslifyNumber(t0Offset.x) + ', ' + glslifyNumber(t0Offset.y) + ' ) ); // base',
            assign,
            '    diffuseColor = color;',
            // '    gl_FragColor = color;',

            ShaderChunk.logdepthbuf_fragment,
            ShaderChunk.map_fragment,
            ShaderChunk.color_fragment,
            ShaderChunk.alphamap_fragment,
            ShaderChunk.alphatest_fragment,
            ShaderChunk.specularmap_fragment,
            ShaderChunk.emissivemap_fragment,

            // accumulation
            '   reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );',

            ShaderChunk.lightmap_fragment,

            '    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );',
            '    #ifdef DOUBLE_SIDED',
            '            reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;',
            '    #else',
            '            reflectedLight.directDiffuse = vLightFront;',
            '    #endif',
            '    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();',

            // modulation
            ShaderChunk.aomap_fragment,
            '   vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
            ShaderChunk.normal_flip,
            ShaderChunk.envmap_fragment,
            '   gl_FragColor = vec4( outgoingLight, diffuseColor.a );', // This will probably change in future three.js releases
            ShaderChunk.tonemapping_fragment,
            ShaderChunk.encodings_fragment,
            ShaderChunk.fog_fragment,
            ShaderChunk.premultiplied_alpha_fragment,
            ShaderChunk.dithering_fragment,
            '}'
        ].join('\n'),
    };
    return new ShaderMaterial(params);
};
