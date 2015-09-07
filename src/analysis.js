(function() {

/**
 * Analyze a terrain using statistical measures.
 *
 * @param {THREE.Mesh} mesh
 *   The terrain mesh to analyze.
 * @param {Object} options
 *   The map of settings that were passed to `THREE.Terrain()` to construct the
 *   terrain mesh that is being analyzed. Requires at least `maxHeight`,
 *   `minHeight`, `xSegments`, `xSize`, `ySegments`, and `ySize` properties.
 *
 * @return {Object}
 *   An object containing statistical information about the terrain.
 */
THREE.Terrain.Analyze = function(mesh, options) {
    if (mesh.geometry.vertices.length < 3) {
        throw new Error('Not enough vertices to analyze');
    }

    var sortNumeric = function(a, b) { return a - b; },
        elevations = Array.prototype.sort.call(
            THREE.Terrain.toArray1D(mesh.geometry.vertices),
            sortNumeric
        ),
        numVertices = elevations.length,
        maxElevation = percentile(elevations, 1),
        minElevation = percentile(elevations, 0),
        medianElevation = percentile(elevations, 0.5),
        meanElevation = mean(elevations),
        stdevElevation = 0,
        pearsonSkewElevation = 0,
        groeneveldMeedenSkewElevation = 0,
        kurtosisElevation = 0,
        up = mesh.up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5*Math.PI), // correct for mesh rotation
        slopes = mesh.geometry.faces
            .map(function(v) { return v.normal.angleTo(up) * 180 / Math.PI; })
            .sort(sortNumeric),
        numFaces = slopes.length,
        maxSlope = percentile(slopes, 1),
        minSlope = percentile(slopes, 0),
        medianSlope = percentile(slopes, 0.5),
        meanSlope = mean(slopes),
        centroid = mesh.position.clone().setZ(meanElevation),
        fittedPlaneNormal = getFittedPlaneNormal(mesh.geometry.vertices, centroid),
        fittedPlaneSlope = fittedPlaneNormal.angleTo(up) * 180 / Math.PI,
        stdevSlope = 0,
        pearsonSkewSlope = 0,
        groeneveldMeedenSkewSlope = 0,
        kurtosisSlope = 0,
        faceArea2D = (options.xSize / options.xSegments) * (options.ySize / options.ySegments) * 0.5,
        area3D = 0,
        tri = 0,
        jaggedness = 0,
        medianElevationDeviations = new Float32Array(numVertices),
        medianSlopeDeviations = new Float32Array(numFaces),
        deviation,
        i;

    for (i = 0; i < numVertices; i++) {
        deviation = elevations[i] - meanElevation;
        stdevElevation += deviation * deviation;
        pearsonSkewElevation += deviation * deviation * deviation;
        medianElevationDeviations[i] = Math.abs(elevations[i] - medianElevation);
        groeneveldMeedenSkewElevation += medianElevationDeviations[i];
        kurtosisElevation += deviation * deviation * deviation * deviation;
    }
    pearsonSkewElevation = (pearsonSkewElevation / numVertices) / Math.pow(stdevElevation / (numVertices - 1), 1.5);
    groeneveldMeedenSkewElevation = (meanElevation - medianElevation) / (groeneveldMeedenSkewElevation / numVertices);
    kurtosisElevation = (kurtosisElevation * numVertices) / (stdevElevation * stdevElevation) - 3;
    stdevElevation = Math.sqrt(stdevElevation / numVertices);
    Array.prototype.sort.call(medianElevationDeviations, sortNumeric);

    for (i = 0; i < numFaces; i++) {
        deviation = slopes[i] - meanSlope;
        stdevSlope += deviation * deviation;
        pearsonSkewSlope += deviation * deviation * deviation;
        medianSlopeDeviations[i] = Math.abs(slopes[i] - medianSlope);
        groeneveldMeedenSkewSlope += medianSlopeDeviations[i];
        kurtosisSlope += deviation * deviation * deviation * deviation;
        area3D += faceArea2D / Math.cos(slopes[i] * Math.PI / 180);
    }
    pearsonSkewSlope = (pearsonSkewSlope / numFaces) / Math.pow(stdevSlope / (numFaces - 1), 1.5);
    groeneveldMeedenSkewSlope = (meanSlope - medianSlope) / (groeneveldMeedenSkewSlope / numFaces);
    kurtosisSlope = (kurtosisSlope * numFaces) / (stdevSlope * stdevSlope) - 3;
    stdevSlope = Math.sqrt(stdevSlope / numFaces);
    Array.prototype.sort.call(medianSlopeDeviations, sortNumeric);

    for (var ii = 0, xl = options.xSegments + 1, yl = options.ySegments + 1; ii < xl; ii++) {
        for (var j = 0; j < yl; j++) {
            var neighborhoodMax = -Infinity,
                neighborhoodMin = Infinity,
                v = mesh.geometry.vertices[j*xl + ii].z,
                sum = 0,
                c = 0;
            for (var n = -1; n <= 1; n++) {
                for (var m = -1; m <= 1; m++) {
                    if (ii+m >= 0 && j+n >= 0 && ii+m < xl && j+n < yl && !(n === 0 && m === 0)) {
                        var val = mesh.geometry.vertices[(j+n)*xl + ii + m].z;
                        sum += val;
                        c++;
                        if (val > neighborhoodMax) neighborhoodMax = val;
                        if (val < neighborhoodMin) neighborhoodMin = val;
                    }
                }
            }
            if (c) tri += (sum / c - v) * (sum / c - v);
            if (v > neighborhoodMax || v < neighborhoodMin) jaggedness++;
        }
    }
    tri = Math.sqrt(tri / numVertices);
    // ceil(n/2)*ceil(m/2) is the max # of local maxima or minima in an n*m grid
    jaggedness /= Math.ceil((options.xSegments+1) * 0.5) * Math.ceil((options.ySegments+1) * 0.5) * 2;

    return {
        elevation: {
            sampleSize: numVertices,
            max: maxElevation,
            min: minElevation,
            range: maxElevation - minElevation,
            midrange: (maxElevation - minElevation) * 0.5 + minElevation,
            median: medianElevation,
            iqr: percentile(elevations, 0.75) - percentile(elevations, 0.25),
            mean: meanElevation,
            stdev: stdevElevation,
            mad: percentile(medianElevationDeviations, 0.5),
            pearsonSkew: pearsonSkewElevation,
            groeneveldMeedenSkew: groeneveldMeedenSkewElevation,
            kurtosis: kurtosisElevation,
            modes: getModes(
                elevations,
                Math.ceil(options.maxHeight - options.minHeight),
                options.minHeight,
                options.maxHeight
            ),
            percentile: function(p) { return percentile(elevations, p); },
            percentRank: function(v) { return percentRank(elevations, v); },
            drawHistogram: function(canvas, bucketCount) {
                drawHistogram(
                    bucketNumbersLinearly(
                        elevations,
                        bucketCount,
                        options.minHeight,
                        options.maxHeight
                    ),
                    canvas,
                    options.minHeight,
                    options.maxHeight
                );
            },
        },
        slope: {
            sampleSize: numFaces,
            max: maxSlope,
            min: minSlope,
            range: maxSlope - minSlope,
            midrange: (maxSlope - minSlope) * 0.5 + minSlope,
            median: medianSlope,
            iqr: percentile(slopes, 0.75) - percentile(slopes, 0.25),
            mean: meanSlope,
            stdev: stdevSlope,
            mad: percentile(medianSlopeDeviations, 0.5),
            pearsonSkew: pearsonSkewSlope,
            groeneveldMeedenSkew: groeneveldMeedenSkewSlope,
            kurtosis: kurtosisSlope,
            modes: getModes(slopes, 90, 0, 90),
            percentile: function(p) { return percentile(slopes, p); },
            percentRank: function(v) { return percentRank(slopes, v); },
            drawHistogram: function(canvas, bucketCount) {
                drawHistogram(
                    bucketNumbersLinearly(
                        slopes,
                        bucketCount,
                        0,
                        90
                    ),
                    canvas,
                    0,
                    90,
                    String.fromCharCode(176)
                );
            },
        },
        roughness: {
            planimetricAreaRatio: options.xSize * options.ySize / area3D,
            terrainRuggednessIndex: tri,
            jaggedness: jaggedness,
        },
        fittedPlane: {
            centroid: centroid,
            normal: fittedPlaneNormal,
            slope: fittedPlaneSlope,
            pctExplained: percentVariationExplainedByFittedPlane(
                mesh.geometry.vertices,
                centroid,
                fittedPlaneNormal,
                options.maxHeight - options.minHeight
            ),
        },
        // # of different kinds of features http://www.armystudyguide.com/content/army_board_study_guide_topics/land_navigation_map_reading/identify-major-minor-terr.shtml
    };
};

/**
 * Returns the value at a given percentile in a sorted numeric array.
 *
 * Uses the "linear interpolation between closest ranks" method.
 *
 * @param {Number[]} arr
 *   A sorted numeric array to examine.
 * @param {Number} p
 *   The percentile at which to return the value.
 *
 * @return {Number}
 *   The value at the given percentile in the given array.
 */
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    if (typeof p !== 'number') throw new TypeError('p must be a number');
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = arr.length * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
}

/**
 * Returns the percentile of the given value in a sorted numeric array.
 *
 * @param {Number[]} arr
 *   A sorted numeric array to examine.
 * @param {Number} v
 *   The value at which to return the percentile.
 *
 * @return {Number}
 *   The percentile at the given value in the given array.
 */
function percentRank(arr, v) {
    if (typeof v !== 'number') throw new TypeError('v must be a number');
    for (var i = 0, l = arr.length; i < l; i++) {
        if (v <= arr[i]) {
            while (i < l && v === arr[i]) {
                i++;
            }
            if (i === 0) return 0;
            if (v !== arr[i-1]) {
                i += (v - arr[i-1]) / (arr[i] - arr[i-1]);
            }
            return i / l;
        }
    }
    return 1;
}

/**
 * Gets the normal vector of the fitted plane of a 3D array of points.
 *
 * @param {THREE.Vector3[]} points
 *   A 3D array of vertices to which to fit a plane.
 * @param {THREE.Vector3} centroid
 *   The centroid of the vertex cloud.
 *
 * @return {THREE.Vector3}
 *   The normal vector of the fitted plane.
 */
function getFittedPlaneNormal(points, centroid) {
    var n = points.length,
        xx = 0,
        xy = 0,
        xz = 0,
        yy = 0,
        yz = 0,
        zz = 0;
    if (n < 3) throw new Error('At least three points are required to fit a plane');

    var r = new THREE.Vector3();
    for (var i = 0, l = points.length; i < l; i++) {
        r.copy(points[i]).sub(centroid);
        xx += r.x * r.x;
        xy += r.x * r.y;
        xz += r.x * r.z;
        yy += r.y * r.y;
        yz += r.y * r.z;
        zz += r.z * r.z;
    }

    var xDeterminant = yy*zz - yz*yz,
        yDeterminant = xx*zz - xz*xz,
        zDeterminant = xx*yy - xy*xy,
        maxDeterminant = Math.max(xDeterminant, yDeterminant, zDeterminant);
    if (maxDeterminant <= 0) throw new Error("The points don't span a plane");

    if (maxDeterminant === xDeterminant) {
        r.set(
            1,
            (xz*yz - xy*zz) / xDeterminant,
            (xy*yz - xz*yy) / xDeterminant
        );
    }
    else if (maxDeterminant === yDeterminant) {
        r.set(
            (yz*xz - xy*zz) / yDeterminant,
            1,
            (xy*xz - yz*xx) / yDeterminant
        );
    }
    else if (maxDeterminant === zDeterminant) {
        r.set(
            (yz*xy - xz*yy) / zDeterminant,
            (xz*xy - yz*xx) / zDeterminant,
            1
        );
    }
    return r.normalize();
}

/**
 * Put numbers into buckets that have equal-size ranges.
 *
 * @param {Number[]} data
 *   The data to bucket.
 * @param {Number} bucketCount
 *   The number of buckets to use.
 * @param {Number} [min]
 *   The minimum allowed data value. Defaults to the smallest value passed.
 * @param {Number} [max]
 *   The maximum allowed data value. Defaults to the largest value passed.
 *
 * @return {Number[][]} An array of buckets of numbers.
 */
function bucketNumbersLinearly(data, bucketCount, min, max) {
    var i = 0,
        l = data.length;
    // If min and max aren't given, set them to the highest and lowest data values
    if (typeof min === 'undefined') {
        min = Infinity;
        max = -Infinity;
        for (i = 0; i < l; i++) {
            if (data[i] < min) min = data[i];
            if (data[i] > max) max = data[i];
        }
    }
    var inc = (max - min) / bucketCount,
        buckets = new Array(bucketCount);
    // Initialize buckets
    for (i = 0; i < bucketCount; i++) {
        buckets[i] = [];
    }
    // Put the numbers into buckets
    for (i = 0; i < l; i++) {
        // Buckets include the lower bound but not the higher bound, except the top bucket
        try {
            if (data[i] === max) buckets[bucketCount-1].push(data[i]);
            else buckets[((data[i] - min) / inc) | 0].push(data[i]);
        } catch(e) {
            console.warn('Numbers in the data are outside of the min and max values used to bucket the data.');
        }
    }
    return buckets;
}

/**
 * Get the bucketed mode(s) in a data set.
 *
 * @param {Number[]} data
 *   The data set from which the modes should be retrieved.
 * @param {Number} bucketCount
 *   The number of buckets to use.
 * @param {Number} min
 *   The minimum allowed data value.
 * @param {Number} max
 *   The maximum allowed data value.
 *
 * @return {Number[]}
 *   An array containing the bucketed mode(s).
 */
function getModes(data, bucketCount, min, max) {
    var buckets = bucketNumbersLinearly(data, bucketCount, min, max),
        maxLen = 0,
        modes = [];
    for (var i = 0, l = buckets.length; i < l; i++) {
        if (buckets[i].length > maxLen) {
            maxLen = buckets[i].length;
            modes = [Math.floor(((i + 0.5) / l) * (max - min) + min)];
        }
        else if (buckets[i].length === maxLen) {
            modes.push(Math.floor(((i + 0.5) / l) * (max - min) + min));
        }
    }
    return modes;
}

/**
 * Draw a histogram.
 *
 * @param {Number[][]} buckets
 *   An array of data to draw, typically from `bucketNumbersLinearly()`.
 * @param {HTMLCanvasElement} canvas
 *   The canvas on which to draw the histogram.
 * @param {Number} [minV]
 *   The lowest x-value to plot. Defaults to the lowest value in the data.
 * @param {Number} [maxV]
 *   The highest x-value to plot. Defaults to the highest value in the data.
 * @param {String} [append='']
 *   A string to append to the bar labels. Defaults to the empty string.
 */
function drawHistogram(buckets, canvas, minV, maxV, append) {
    var context = canvas.getContext('2d'),
        width = 280,
        height = 180,
        border = 10,
        separator = 4,
        max = typeof maxV === 'undefined' ? -Infinity : maxV,
        min = typeof minV === 'undefined' ? Infinity : minV,
        l = buckets.length,
        i;
    canvas.width = width + border*2;
    canvas.height = height + border*2;
    if (typeof append === 'undefined') append = '';

    // If max or min is not set, set them to the highest/lowest value.
    if (max === -Infinity || min === Infinity) {
        for (i = 0; i < l; i++) {
            for (var j = 0, m = buckets[i].length; j < m; j++) {
                if (buckets[i][j] > max) {
                    max = buckets[i][j];
                }
                if (buckets[i][j] < min) {
                    min = buckets[i][j];
                }
            }
        }
    }

    // Find the size of the largest bucket.
    var maxBucketSize = 0,
        n = 0;
    for (i = 0; i < l; i++) {
        if (buckets[i].length > maxBucketSize) {
            maxBucketSize = buckets[i].length;
        }
        n += buckets[i].length;
    }

    // Draw a bar.
    var unitSizeY = (height - separator) / maxBucketSize,
        unitSizeX = (width - (buckets.length + 1) * separator) / buckets.length;
    if (unitSizeX >= 1) unitSizeX = Math.floor(unitSizeX);
    if (unitSizeY >= 1) unitSizeY = Math.floor(unitSizeY);
    context.fillStyle = 'rgba(13, 42, 64, 1)';
    for (i = 0; i < l; i++) {
        context.fillRect(
            border + separator + i * (unitSizeX + separator),
            border + height - (separator + buckets[i].length * unitSizeY),
            unitSizeX,
            unitSizeY * buckets[i].length
        );
    }

    // Draw the label text on the bar.
    context.fillStyle = 'rgba(144, 176, 192, 1)';
    context.font = '12px Arial';
    for (i = 0; i < l; i++) {
        var text = Math.floor(((i + 0.5) / buckets.length) * (max - min) + min) + '' + append;
        context.fillText(
            text,
            border + separator + i * (unitSizeX + separator) + Math.floor((unitSizeX - context.measureText(text).width) * 0.5),
            border + height - 8,
            unitSizeX
        );
    }

    context.fillText(
        Math.round(100 * maxBucketSize / n) + '%',
        border + separator,
        border + separator + 6
    );

    // Draw axes.
    context.strokeStyle = 'rgba(13, 42, 64, 1)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(border, border);
    context.lineTo(border, height + border);
    context.moveTo(border, height + border);
    context.lineTo(width + border, height + border);
    context.stroke();
}

/**
 * A measure of correlation between a terrain and its fitted plane.
 *
 * This uses a different approach than the common one (R^2, aka Pearson's
 * correlation coefficient) because the range is constricted and the data is
 * often non-normal. The approach taken here compares the differences between
 * the terrain elevations and the fitted plane at each vertex, and divides by
 * half the range to arrive at a dimensionless value.
 *
 * @param {THREE.Vector3[]} vertices
 *   The terrain vertices.
 * @param {THREE.Vector3} centroid
 *   The fitted plane centroid.
 * @param {THREE.Vector3} normal
 *   The fitted plane normal.
 * @param {Number} range
 *   The allowed range in elevations.
 *
 * @return {Number}
 *   Returns a number between 0 and 1 indicating how well the fitted plane
 *   explains the variation in terrain elevation. 1 means entirely explained; 0
 *   means not explained at all.
 */
function percentVariationExplainedByFittedPlane(vertices, centroid, normal, range) {
    var numVertices = vertices.length,
        diff = 0;
    for (var i = 0; i < numVertices; i++) {
        var fittedZ = Math.sqrt(
                (vertices[i].x - centroid.x) * (vertices[i].x - centroid.x) +
                (vertices[i].y - centroid.y) * (vertices[i].y - centroid.y)
            ) * Math.tan(normal.z * Math.PI) + centroid.z;
        diff += (vertices[i].z - fittedZ) * (vertices[i].z - fittedZ);
    }
    return 1 - Math.sqrt(diff / numVertices) * 2 / range;
}

function mean(data) {
    var sum = 0,
        l = data.length;
    for (var i = 0; i < l; i++) {
        sum += data[i];
    }
    return sum / l;
}

})();
