import * as THREE from 'three';
import Terrain, { TerrainNS } from './core.js';

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
TerrainNS.Analyze = function(mesh, options) {
    // Basic validation
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || 
        !mesh.geometry.attributes.position || 
        mesh.geometry.attributes.position.count < 3) {
        console.warn('Not enough vertices to analyze or invalid mesh');
        return createEmptyAnalysisResult(options);
    }

    try {
        // Work with a cloned non-indexed geometry to ensure consistency
        var geometry = mesh.geometry.clone();
        if (geometry.index) {
            geometry = geometry.toNonIndexed();
        }

        // Extract elevations and prepare for analysis
        var elevations = TerrainNS.toArray1D(geometry.attributes.position.array);
        if (!elevations || elevations.length === 0) {
            console.warn('Could not extract elevations from geometry');
            return createEmptyAnalysisResult(options);
        }

        // Sort elevations for percentile calculations
        var sortedElevations = Array.from(elevations).sort(function(a, b) { return a - b; });
        var numVertices = elevations.length;
        
        // Basic elevation statistics
        var maxElevation = percentile(sortedElevations, 1);
        var minElevation = percentile(sortedElevations, 0);
        var medianElevation = percentile(sortedElevations, 0.5);
        var meanElevation = mean(sortedElevations);
        
        // Default values for statistics
        var stdevElevation = 0;
        var pearsonSkewElevation = 0;
        var groeneveldMeedenSkewElevation = 0;
        var kurtosisElevation = 0;
        var up = mesh.up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5*Math.PI);
        
        // Calculate face normals
        var slopes = [];
        try {
            slopes = faceNormals(geometry, options)
                .map(function(normal) { return normal.angleTo(up) * 180 / Math.PI; })
                .sort(function(a, b) { return a - b; });
        } catch (e) {
            console.warn('Error calculating slopes:', e);
            slopes = [0]; // Default to flat terrain
        }
        
        var numFaces = slopes.length;
        var maxSlope = percentile(slopes, 1);
        var minSlope = percentile(slopes, 0);
        var medianSlope = percentile(slopes, 0.5);
        var meanSlope = mean(slopes);
        
        var centroid = mesh.position.clone().setZ(meanElevation);
        var fittedPlaneNormal, fittedPlaneSlope;
        
        try {
            fittedPlaneNormal = getFittedPlaneNormal(geometry.attributes.position.array, centroid);
            fittedPlaneSlope = fittedPlaneNormal.angleTo(up) * 180 / Math.PI;
        } catch (e) {
            console.warn('Error calculating plane normal:', e);
            fittedPlaneNormal = new THREE.Vector3(0, 0, 1);
            fittedPlaneSlope = 0;
        }
        
        var stdevSlope = 0;
        var pearsonSkewSlope = 0;
        var groeneveldMeedenSkewSlope = 0;
        var kurtosisSlope = 0;
        
        var faceArea2D = (options.xSize / options.xSegments) * (options.ySize / options.ySegments) * 0.5;
        var area3D = 0;
        var tri = 0;
        var jaggedness = 0;
        
        // Create arrays for deviations
        var medianElevationDeviations = new Float32Array(numVertices);
        var medianSlopeDeviations = new Float32Array(numFaces);
        
        // Calculate elevation statistics
        for (var i = 0, deviation; i < numVertices; i++) {
            deviation = sortedElevations[i] - meanElevation;
            stdevElevation += deviation * deviation;
            pearsonSkewElevation += deviation * deviation * deviation;
            medianElevationDeviations[i] = Math.abs(sortedElevations[i] - medianElevation);
            groeneveldMeedenSkewElevation += medianElevationDeviations[i];
            kurtosisElevation += deviation * deviation * deviation * deviation;
        }
        
        // Finalize elevation statistics
        if (numVertices > 1) {
            pearsonSkewElevation = (pearsonSkewElevation / numVertices) / Math.pow(stdevElevation / (numVertices - 1), 1.5);
            groeneveldMeedenSkewElevation = (meanElevation - medianElevation) / (groeneveldMeedenSkewElevation / numVertices || 1);
            kurtosisElevation = (kurtosisElevation * numVertices) / (stdevElevation * stdevElevation || 1) - 3;
            stdevElevation = Math.sqrt(stdevElevation / numVertices);
        }
        
        Array.prototype.sort.call(medianElevationDeviations, function(a, b) { return a - b; });

        // Calculate slope statistics
        for (i = 0; i < numFaces; i++) {
            deviation = slopes[i] - meanSlope;
            stdevSlope += deviation * deviation;
            pearsonSkewSlope += deviation * deviation * deviation;
            medianSlopeDeviations[i] = Math.abs(slopes[i] - medianSlope);
            groeneveldMeedenSkewSlope += medianSlopeDeviations[i];
            kurtosisSlope += deviation * deviation * deviation * deviation;
            area3D += faceArea2D / Math.cos((slopes[i] * Math.PI / 180) || 0.001); // Avoid division by zero
        }
        
        // Finalize slope statistics
        if (numFaces > 1) {
            pearsonSkewSlope = (pearsonSkewSlope / numFaces) / Math.pow(stdevSlope / (numFaces - 1), 1.5);
            groeneveldMeedenSkewSlope = (meanSlope - medianSlope) / (groeneveldMeedenSkewSlope / numFaces || 1);
            kurtosisSlope = (kurtosisSlope * numFaces) / (stdevSlope * stdevSlope || 1) - 3;
            stdevSlope = Math.sqrt(stdevSlope / numFaces);
        }
        
        Array.prototype.sort.call(medianSlopeDeviations, function(a, b) { return a - b; });

        // Calculate roughness statistics
        try {
            var xl = options.xSegments + 1;
            var yl = options.ySegments + 1;
            
            for (var ii = 0; ii < xl; ii++) {
                for (var j = 0; j < yl; j++) {
                    var neighborhoodMax = -Infinity;
                    var neighborhoodMin = Infinity;
                    var vertexZ = geometry.attributes.position.array[(j*xl + ii) * 3 + 2];
                    var sum = 0;
                    var c = 0;
                    
                    for (var n = -1; n <= 1; n++) {
                        for (var m = -1; m <= 1; m++) {
                            if (ii+m >= 0 && j+n >= 0 && ii+m < xl && j+n < yl && !(n === 0 && m === 0)) {
                                var neighborZ = geometry.attributes.position.array[((j+n)*xl + ii + m) * 3 + 2];
                                sum += neighborZ;
                                c++;
                                if (neighborZ > neighborhoodMax) neighborhoodMax = neighborZ;
                                if (neighborZ < neighborhoodMin) neighborhoodMin = neighborZ;
                            }
                        }
                    }
                    
                    if (c) tri += (sum / c - vertexZ) * (sum / c - vertexZ);
                    if (vertexZ > neighborhoodMax || vertexZ < neighborhoodMin) jaggedness++;
                }
            }
            
            tri = Math.sqrt(tri / numVertices);
            var maxPeaks = Math.ceil(xl * 0.5) * Math.ceil(yl * 0.5) * 2;
            jaggedness /= maxPeaks > 0 ? maxPeaks : 1;
        } catch (e) {
            console.warn('Error calculating roughness:', e);
            tri = 0;
            jaggedness = 0;
        }

        // Build the result object
        return {
            elevation: {
                sampleSize: numVertices,
                max: maxElevation,
                min: minElevation,
                range: maxElevation - minElevation,
                midrange: (maxElevation - minElevation) * 0.5 + minElevation,
                median: medianElevation,
                iqr: percentile(sortedElevations, 0.75) - percentile(sortedElevations, 0.25),
                mean: meanElevation,
                stdev: stdevElevation,
                mad: percentile(medianElevationDeviations, 0.5),
                pearsonSkew: pearsonSkewElevation,
                groeneveldMeedenSkew: groeneveldMeedenSkewElevation,
                kurtosis: kurtosisElevation,
                modes: getModes(
                    sortedElevations,
                    Math.ceil(options.maxHeight - options.minHeight),
                    options.minHeight,
                    options.maxHeight
                ),
                percentile: function(p) { return percentile(sortedElevations, p); },
                percentRank: function(v) { return percentRank(sortedElevations, v); },
                drawHistogram: function(canvas, bucketCount) {
                    drawHistogram(
                        bucketNumbersLinearly(
                            sortedElevations,
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
                planimetricAreaRatio: options.xSize * options.ySize / (area3D || options.xSize * options.ySize),
                terrainRuggednessIndex: tri,
                jaggedness: jaggedness,
            },
            fittedPlane: {
                centroid: centroid,
                normal: fittedPlaneNormal,
                slope: fittedPlaneSlope,
                pctExplained: percentVariationExplainedByFittedPlane(
                    geometry.attributes.position.array,
                    centroid,
                    fittedPlaneNormal,
                    options.maxHeight - options.minHeight
                ),
            },
        };
    } catch (e) {
        console.error('Error during terrain analysis:', e);
        return createEmptyAnalysisResult(options);
    }
};

/**
 * Creates an empty analysis result when actual analysis fails
 */
function createEmptyAnalysisResult(options) {
    var emptyHistogram = function(canvas) {
        if (canvas && canvas.getContext) {
            var ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(144, 176, 192, 1)';
            ctx.font = '12px Arial';
            ctx.fillText('No data available for analysis', 10, 100);
        }
    };
    
    return {
        elevation: {
            sampleSize: 0,
            max: 0,
            min: 0,
            range: 0,
            midrange: 0,
            median: 0,
            iqr: 0,
            mean: 0,
            stdev: 0,
            mad: 0,
            pearsonSkew: 0,
            groeneveldMeedenSkew: 0,
            kurtosis: 0,
            modes: [],
            percentile: function() { return 0; },
            percentRank: function() { return 0; },
            drawHistogram: emptyHistogram
        },
        slope: {
            sampleSize: 0,
            max: 0,
            min: 0,
            range: 0,
            midrange: 0,
            median: 0,
            iqr: 0,
            mean: 0,
            stdev: 0,
            mad: 0,
            pearsonSkew: 0,
            groeneveldMeedenSkew: 0,
            kurtosis: 0,
            modes: [],
            percentile: function() { return 0; },
            percentRank: function() { return 0; },
            drawHistogram: emptyHistogram
        },
        roughness: {
            planimetricAreaRatio: 1,
            terrainRuggednessIndex: 0,
            jaggedness: 0,
        },
        fittedPlane: {
            centroid: new THREE.Vector3(),
            normal: new THREE.Vector3(0, 0, 1),
            slope: 0,
            pctExplained: 0,
        }
    };
}

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
TerrainNS.percentile = percentile;
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
TerrainNS.percentRank = percentRank;
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
 * Returns the face normals for the specified geometry.
 *
 * @param {THREE.BufferGeometry} geometry
 *   The indexed geometry to analyze.
 * @param {Object} options
 *   Includes the `xSegments` and `ySegments` - the number of row and column
 *   segments of the plane geometry.
 */
TerrainNS.faceNormals = faceNormals;
function faceNormals(geometry, options) {
    // Clone the geometry to avoid modifying the original
    var geom = geometry.clone();
    
    // Make sure we're working with non-indexed geometry
    if (geom.index) {
        geom = geom.toNonIndexed();
    }
    
    var positions = geom.attributes.position.array;
    var numFaces = positions.length / 9; // 3 vertices per face, 3 components per vertex
    var normals = new Array(numFaces);
    
    // Create temporary vectors for calculations
    var v1 = new THREE.Vector3();
    var v2 = new THREE.Vector3();
    var v3 = new THREE.Vector3();
    
    // For each face, calculate its normal
    for (var i = 0; i < numFaces; i++) {
        var baseIndex = i * 9;
        
        // Get the three vertices of the face
        v1.set(
            positions[baseIndex],
            positions[baseIndex + 1],
            positions[baseIndex + 2]
        );
        
        v2.set(
            positions[baseIndex + 3],
            positions[baseIndex + 4],
            positions[baseIndex + 5]
        );
        
        v3.set(
            positions[baseIndex + 6],
            positions[baseIndex + 7],
            positions[baseIndex + 8]
        );
        
        // Calculate normal
        var normal = new THREE.Vector3()
            .crossVectors(
                new THREE.Vector3().subVectors(v2, v1),
                new THREE.Vector3().subVectors(v3, v1)
            )
            .normalize();
        
        normals[i] = normal;
    }
    
    return normals;
}

/**
 * Gets the normal vector of the fitted plane of a 3D array of points.
 *
 * @param {Float32Array} points
 *   The vertex positions of the geometry to analyze.
 * @param {THREE.Vector3} centroid
 *   The centroid of the vertex cloud.
 *
 * @return {THREE.Vector3}
 *   The normal vector of the fitted plane.
 */
TerrainNS.getFittedPlaneNormal = getFittedPlaneNormal;
function getFittedPlaneNormal(points, centroid) {
    var n = points.length / 3, // Divide by 3 to get actual point count
        xx = 0,
        xy = 0,
        xz = 0,
        yy = 0,
        yz = 0,
        zz = 0;
    if (n < 3) throw new Error('At least three points are required to fit a plane');

    var r = new THREE.Vector3();
    for (var i = 0, l = points.length; i < l; i += 3) {
        // Get position relative to centroid
        var x = points[i] - centroid.x;
        var y = points[i+1] - centroid.y;
        var z = points[i+2] - centroid.z;
        
        // Calculate covariance matrix
        xx += x * x;
        xy += x * y;
        xz += x * z;
        yy += y * y;
        yz += y * z;
        zz += z * z;
    }

    var det_x = yy*zz - yz*yz;
    var det_y = xx*zz - xz*xz;
    var det_z = xx*yy - xy*xy;
    
    // Find the direction with the maximum determinant
    if (det_x >= det_y && det_x >= det_z) {
        // x has max determinant
        r.set(det_x, xy*zz - xz*yz, xz*yy - xy*yz);
    } 
    else if (det_y >= det_x && det_y >= det_z) {
        // y has max determinant
        r.set(xy*zz - xz*yz, det_y, xy*xz - yz*xx);
    }
    else {
        // z has max determinant
        r.set(xz*yy - xy*yz, xy*xz - yz*xx, det_z);
    }
    
    // Ensure normal points upward
    if (r.z < 0) r.negate();
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
TerrainNS.bucketNumbersLinearly = bucketNumbersLinearly;
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
    
    // Ensure min and max are different
    if (min === max) {
        max = min + 1;  // Prevent division by zero
    }
    
    var inc = (max - min) / bucketCount,
        buckets = new Array(bucketCount);
    // Initialize buckets
    for (i = 0; i < bucketCount; i++) {
        buckets[i] = [];
    }
    // Put the numbers into buckets
    for (i = 0; i < l; i++) {
        // Clamp data to min/max range
        var value = Math.max(min, Math.min(max, data[i]));
        
        // Buckets include the lower bound but not the higher bound, except the top bucket
        if (value === max) {
            buckets[bucketCount-1].push(value);
        } else {
            var bucketIndex = Math.floor((value - min) / inc);
            // Safety check for index
            bucketIndex = Math.max(0, Math.min(bucketCount - 1, bucketIndex));
            buckets[bucketIndex].push(value);
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
TerrainNS.getModes = getModes;
function getModes(data, bucketCount, min, max) {
    // Handle empty data
    if (!data || data.length === 0) {
        return [];
    }
    
    // Ensure min and max are different
    if (min === max) {
        max = min + 1;
    }
    
    var buckets = bucketNumbersLinearly(data, bucketCount, min, max),
        maxLen = 0,
        modes = [];
    
    // Find the buckets with the most values
    for (var i = 0, l = buckets.length; i < l; i++) {
        if (buckets[i].length > maxLen) {
            maxLen = buckets[i].length;
            modes = [min + ((i + 0.5) / bucketCount) * (max - min)];
        }
        else if (buckets[i].length === maxLen && maxLen > 0) {
            modes.push(min + ((i + 0.5) / bucketCount) * (max - min));
        }
    }
    
    // If no modes were found (all buckets empty), return empty array
    if (modes.length === 0) {
        return [];
    }
    
    // Round modes to integers if they're close enough to integers
    for (var j = 0; j < modes.length; j++) {
        if (Math.abs(modes[j] - Math.round(modes[j])) < 0.001) {
            modes[j] = Math.round(modes[j]);
        } else {
            modes[j] = parseFloat(modes[j].toFixed(3));
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
TerrainNS.drawHistogram = drawHistogram;
function drawHistogram(buckets, canvas, minV, maxV, append) {
    // Check if canvas is valid
    if (!canvas || !canvas.getContext) {
        console.warn('Invalid canvas for histogram drawing');
        return;
    }
    
    var context = canvas.getContext('2d'),
        width = 280,
        height = 180,
        border = 10,
        separator = 4,
        max = typeof maxV === 'undefined' ? -Infinity : maxV,
        min = typeof minV === 'undefined' ? Infinity : minV,
        l = buckets.length,
        i;
    
    // Clear canvas
    canvas.width = width + border*2;
    canvas.height = height + border*2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Ensure min and max are different
    if (min === max) {
        max = min + 1;
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
    
    // If there's no data, draw an empty histogram
    if (n === 0 || maxBucketSize === 0) {
        context.fillStyle = 'rgba(144, 176, 192, 1)';
        context.font = '12px Arial';
        context.fillText('No data available', border + 10, border + height/2);
        
        // Draw axes
        context.strokeStyle = 'rgba(13, 42, 64, 1)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(border, border);
        context.lineTo(border, height + border);
        context.moveTo(border, height + border);
        context.lineTo(width + border, height + border);
        context.stroke();
        return;
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

    // Calculate percentage for maxBucketSize if n is not zero
    var percentage = n > 0 ? Math.round(100 * maxBucketSize / n) + '%' : '0%';
    context.fillText(
        percentage,
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
 * @param {Float32Array} vertices
 *   The terrain vertex positions.
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
TerrainNS.percentVariationExplainedByFittedPlane = percentVariationExplainedByFittedPlane;
function percentVariationExplainedByFittedPlane(vertices, centroid, normal, range) {
    if (!vertices || vertices.length < 3 || !centroid || !normal || !normal.isVector3) {
        return 0; // Return 0 if we have invalid inputs
    }
    
    // Ensure range is valid
    range = Math.abs(range) || 1; // Use 1 as default if range is 0 or undefined
    
    var numVertices = vertices.length;
    var totalDiff = 0;
    var dotProduct, vertexPlaneDistance;
    
    try {
        for (var i = 0; i < numVertices; i += 3) {
            // Get the vertex position relative to centroid
            var dx = vertices[i + 0] - centroid.x;
            var dy = vertices[i + 1] - centroid.y;
            var dz = vertices[i + 2] - centroid.z;
            
            // Calculate the distance from the vertex to the plane
            // The plane equation is: ax + by + cz + d = 0 where (a,b,c) is the normal
            // For a point (x,y,z) on the plane: a(x-x0) + b(y-y0) + c(z-z0) = 0
            // where (x0,y0,z0) is a point on the plane (our centroid)
            dotProduct = normal.x * dx + normal.y * dy + normal.z * dz;
            
            // The distance from the point to the plane
            vertexPlaneDistance = Math.abs(dotProduct) / Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
            
            // Add to total squared difference
            totalDiff += vertexPlaneDistance * vertexPlaneDistance;
        }
        
        // Calculate and return the explained variation
        // 1 - normalized average distance (bounded between 0 and 1)
        return Math.max(0, Math.min(1, 1 - Math.sqrt(totalDiff / numVertices) * 2 / range));
    } catch (e) {
        console.warn('Error calculating plane variation:', e);
        return 0;
    }
}

TerrainNS.mean = mean;
function mean(data) {
    var sum = 0,
        l = data.length;
    for (var i = 0; i < l; i++) {
        sum += data[i];
    }
    return sum / l;
}
