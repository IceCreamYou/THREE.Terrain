import * as THREE from 'three';
import { TerrainNS } from './core.js';
import { getRandom } from './random.js';

/**
 * A terrain generation method using Brownian motion.
 *
 * Parameters are the same as those for {@link TerrainNS.Terrain}().
 */
TerrainNS.Brownian = function(g, options) {
    var random = getRandom(options),
        untouched = [],
        touched = [],
        smallerSideSize = Math.min(options.xSize, options.ySize),
        changeDirectionProbability = Math.sqrt(smallerSideSize) / smallerSideSize,
        maxHeightAdjust = Math.sqrt(options.maxHeight - options.minHeight),
        xl = options.xSegments + 1,
        yl = options.ySegments + 1,
        i = Math.floor(random() * options.xSegments),
        j = Math.floor(random() * options.ySegments),
        x = i,
        y = j,
        numVertices = g.length,
        vertices = Array.from(g).map(function(z) {
            return { z: z };
        }),
        current = vertices[j * xl + i],
        randomDirection = random() * Math.PI * 2,
        addX = Math.cos(randomDirection),
        addY = Math.sin(randomDirection),
        n,
        m,
        key,
        sum,
        c,
        lastAdjust,
        index;

    // Initialize the first vertex.
    current.z = random() * (options.maxHeight - options.minHeight) + options.minHeight;
    touched.push(current);

    // Walk through all vertices until they've all been adjusted.
    while (touched.length !== numVertices) {
        // Mark the untouched neighboring vertices to revisit later.
        for (n = -1; n <= 1; n++) {
            for (m = -1; m <= 1; m++) {
                key = (j+n)*xl + i + m;
                if (typeof vertices[key] !== 'undefined' && touched.indexOf(vertices[key]) === -1 && i+m >= 0 && j+n >= 0 && i+m < xl && j+n < yl && n && m) {
                    untouched.push(vertices[key]);
                }
            }
        }

        // Occasionally, pick a random untouched point instead of continuing.
        if (random() < changeDirectionProbability) {
            current = untouched.splice(Math.floor(random() * untouched.length), 1)[0];
            randomDirection = random() * Math.PI * 2;
            addX = Math.cos(randomDirection);
            addY = Math.sin(randomDirection);
            index = vertices.indexOf(current);
            i = index % xl;
            j = Math.floor(index / xl);
            x = i;
            y = j;
        }
        else {
            // Keep walking in the current direction.
            var u = x,
                v = y;
            while (Math.round(u) === i && Math.round(v) === j) {
                u += addX;
                v += addY;
            }
            i = Math.round(u);
            j = Math.round(u);

            // If we hit a touched vertex, look in different directions to try to find an untouched one.
            for (var k = 0; i >= 0 && j >= 0 && i < xl && j < yl && touched.indexOf(vertices[j * xl + i]) !== -1 && k < 9; k++) {
                randomDirection = random() * Math.PI * 2;
                addX = Math.cos(randomDirection);
                addY = Math.sin(randomDirection);
                while (Math.round(u) === i && Math.round(v) === j) {
                    u += addX;
                    v += addY;
                }
                i = Math.round(u);
                j = Math.round(v);
            }

            // If we found an untouched vertex, make it the current one.
            if (i >= 0 && j >= 0 && i < xl && j < yl && touched.indexOf(vertices[j * xl + i]) === -1) {
                x = u;
                y = v;
                current = vertices[j * xl + i];
                var io = untouched.indexOf(current);
                if (io !== -1) {
                    untouched.splice(io, 1);
                }
            }

            // If we couldn't find an untouched vertex near the current point,
            // pick a random untouched vertex instead.
            else {
                current = untouched.splice(Math.floor(random() * untouched.length), 1)[0];
                randomDirection = random() * Math.PI * 2;
                addX = Math.cos(randomDirection);
                addY = Math.sin(randomDirection);
                index = vertices.indexOf(current);
                i = index % xl;
                j = Math.floor(index / xl);
                x = i;
                y = j;
            }
        }

        // Set the current vertex to the average elevation of its touched neighbors plus a random amount
        sum = 0;
        c = 0;
        for (n = -1; n <= 1; n++) {
            for (m = -1; m <= 1; m++) {
                key = (j+n)*xl + i + m;
                if (typeof vertices[key] !== 'undefined' && touched.indexOf(vertices[key]) !== -1 && i+m >= 0 && j+n >= 0 && i+m < xl && j+n < yl && n && m) {
                    sum += vertices[key].z;
                    c++;
                }
            }
        }
        if (c) {
            if (!lastAdjust || random() < changeDirectionProbability) {
                lastAdjust = random();
            }
            current.z = sum / c + TerrainNS.EaseInWeak(lastAdjust) * maxHeightAdjust * 2 - maxHeightAdjust;
        }
        touched.push(current);
    }

    for (i = vertices.length - 1; i >= 0; i--) {
        g[i] = vertices[i].z;
    }

    // Erase artifacts.
    TerrainNS.Smooth(g, options);
    TerrainNS.Smooth(g, options);
};
