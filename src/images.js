/**
 * Convert an image-based heightmap into vertex-based height data.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 */
THREE.Terrain.fromHeightmap = function(g, options) {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        rows = options.ySegments + 1,
        cols = options.xSegments + 1,
        spread = options.maxHeight - options.minHeight;
    canvas.width = cols;
    canvas.height = rows;
    context.drawImage(options.heightmap, 0, 0, canvas.width, canvas.height);
    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var i = row * cols + col,
                idx = i * 4;
            g[i].z = (data[idx] + data[idx+1] + data[idx+2]) / 765 * spread + options.minHeight;
        }
    }
};

/**
 * Convert a terrain plane into an image-based heightmap.
 *
 * Parameters are the same as for {@link THREE.Terrain.fromHeightmap} except
 * that if `options.heightmap` is a canvas element then the image will be
 * painted onto that canvas; otherwise a new canvas will be created.
 *
 * NOTE: this method performs an operation on an array of vertices, which
 * aren't available when using `BufferGeometry`. So, if you want to use this
 * method, make sure to set the `useBufferGeometry` option to `false` when
 * generating your terrain.
 *
 * @return {HTMLCanvasElement}
 *   A canvas with the relevant heightmap painted on it.
 */
THREE.Terrain.toHeightmap = function(g, options) {
    var hasMax = typeof options.maxHeight === 'undefined',
        hasMin = typeof options.minHeight === 'undefined',
        max = hasMax ? options.maxHeight : -Infinity,
        min = hasMin ? options.minHeight :  Infinity;
    if (!hasMax || !hasMin) {
        var max2 = max,
            min2 = min;
        for (var k = 0, l = g.length; k < l; k++) {
            if (g[k].z > max2) max2 = g[k].z;
            if (g[k].z < min2) min2 = g[k].z;
        }
        if (!hasMax) max = max2;
        if (!hasMin) min = min2;
    }
    var canvas = options.heightmap instanceof HTMLCanvasElement ? options.heightmap : document.createElement('canvas'),
        context = canvas.getContext('2d'),
        rows = options.ySegments + 1,
        cols = options.xSegments + 1,
        spread = options.maxHeight - options.minHeight;
    canvas.width = cols;
    canvas.height = rows;
    var d = context.createImageData(canvas.width, canvas.height),
        data = d.data;
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var i = row * cols + col,
            idx = i * 4;
            data[idx] = data[idx+1] = data[idx+2] = Math.round(((g[i].z - options.minHeight) / spread) * 255);
            data[idx+3] = 255;
        }
    }
    context.putImageData(d, 0, 0);
    return canvas;
};
