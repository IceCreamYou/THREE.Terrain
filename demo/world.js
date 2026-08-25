import * as THREE from 'three';

/**
 * Create the scene surfaces and lights that frame the terrain demonstration.
 *
 * Terrain generation stays in `landscape.js`. This module owns the sky, water,
 * sand plane, fog, and lights that make the generated landscape readable.
 *
 * @param {Object} options
 *   Scene and renderer used by the demo.
 * @return {Object}
 *   World objects and visibility/texture operations.
 */
export function createWorld(options) {
    var scene = options.scene,
        renderer = options.renderer,
        landscapeVisible = true,
        skyDome = null,
        sand = null,
        water = new THREE.Mesh(
            new THREE.PlaneGeometry(16384 + 1024, 16384 + 1024, 16, 16),
            new THREE.MeshLambertMaterial({color: 0x006ba0, transparent: true, opacity: 0.6})
        ),
        skyLight = new THREE.DirectionalLight(0xffe8d6, 1.75),
        fillLight = new THREE.DirectionalLight(0xadd8e6, 0.85),
        ambientLight = new THREE.AmbientLight(0xb3a35e, 0.45);

    scene.fog = new THREE.FogExp2(0x868293, 0.0007);

    water.position.y = -99;
    water.rotation.x = -0.5 * Math.PI;
    scene.add(water);

    skyLight.position.set(2950, 2625, -160);
    scene.add(skyLight);
    fillLight.position.set(-1, -0.5, -1);
    scene.add(fillLight);
    scene.add(ambientLight);

    new THREE.TextureLoader().load('demo/img/sky1.jpg', function(texture) {
        texture.minFilter = THREE.LinearFilter;
        skyDome = new THREE.Mesh(
            new THREE.SphereGeometry(8192, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide, fog: false})
        );
        skyDome.position.y = -99;
        skyDome.visible = landscapeVisible;
        scene.add(skyDome);
    });

    /**
     * Add or update the sand surface below the generated terrain.
     *
     * @param {THREE.Texture} texture
     *   Sand texture used by the material demonstration.
     */
    function setSandTexture(texture) {
        if (!sand) {
            sand = new THREE.Mesh(
                new THREE.PlaneGeometry(16384 + 1024, 16384 + 1024, 64, 64),
                new THREE.MeshLambertMaterial({map: texture})
            );
            sand.position.y = -101;
            sand.rotation.x = -0.5 * Math.PI;
            scene.add(sand);
        }
        else {
            sand.material.map = texture;
            sand.material.needsUpdate = true;
        }
        sand.visible = landscapeVisible;
    }

    /**
     * Show or hide the world surfaces that accompany the terrain material.
     *
     * @param {boolean} visible
     *   Desired visibility state.
     */
    function setLandscapeVisible(visible) {
        landscapeVisible = visible;
        if (skyDome) skyDome.visible = visible;
        if (sand) sand.visible = visible;
        water.visible = visible;
    }

    return {
        skyLight: skyLight,
        water: water,
        setLandscapeVisible: setLandscapeVisible,
        setSandTexture: setSandTexture,
    };
}
