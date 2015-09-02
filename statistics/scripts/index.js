var heightmaps = [
      'Cosine',
      'CosineLayers',
      'DiamondSquare',
      'Fault',
      'heightmap.png',
      'Hill',
      'HillIsland',
      'Particles',
      'Perlin',
      'PerlinDiamond',
      'PerlinLayers',
      'Simplex',
      'SimplexLayers',
      'Value',
      'Weierstrass',
      'Worley',
    ],
    easing = [
      'Linear',
      'EaseIn',
      'EaseOut',
      'EaseInOut',
      'InEaseOut',
    ],
    aProps = [
      'elevation.median',
      'elevation.mean',
      'elevation.iqr',
      'elevation.stdev',
      'elevation.pearsonSkew',
      'elevation.groeneveldMeedenSkew',
      'elevation.kurtosis',
      'slope.median',
      'slope.mean',
      'slope.iqr',
      'slope.stdev',
      'slope.pearsonSkew',
      'slope.groeneveldMeedenSkew',
      'slope.kurtosis',
      'roughness.planimetricAreaRatio',
      'roughness.terrainRuggednessIndex',
      'roughness.jaggedness',
      'fittedPlane.slope',
    ],
    mat = new THREE.MeshBasicMaterial({color: 0x5566aa, wireframe: true}),
    heightmapImage = new Image(),
    n = 40,
    bucketCount = 10,
    i,
    j,
    l;
heightmapImage.addEventListener('load', setup, false);

function setup() {
  var results = {overall: {}, summary: {}},
      result,
      analytics,
      options,
      heightmap,
      m,
      k,
      prop,
      needsDegreeSymbol,
      output = document.getElementById('analytics'),
      accumulator = function(sum, value) { return sum + value; },
      sum,
      deviation,
      statgroup,
      divMean,
      divStdev,
      histogramContainer,
      histogramLabel,
      canvas;

  // Gather data
  for (i = 0, l = aProps.length; i < l; i++) {
    results.overall[aProps[i]] = [];
  }
  for (i = 0, l = heightmaps.length; i < l; i++) {
    heightmap = heightmaps[i];
    results[heightmap] = {};
    result = results[heightmap];
    for (j = 0, m = aProps.length; j < m; j++) {
      result[aProps[j]] = [];
    }
    options = assembleOptions(heightmap);
    for (j = 0; j < n; j++) {
      analytics = THREE.Terrain.Analyze(THREE.Terrain(options).children[0], options);
      for (k = 0, m = aProps.length; k < m; k++) {
        prop = aProps[k].split('.');
        result[aProps[k]].push(analytics[prop[0]][prop[1]]);
        results.overall[aProps[k]].push(analytics[prop[0]][prop[1]]);
      }
    }
  }

  // Summarize
  var outline = document.createElement('ul');
  outline.id = 'outline';
  outline.innerHTML += '<li><a href="#overall">Overall</a></li>';
  for (i = 0, l = heightmaps.length; i < l; i++) {
    outline.innerHTML += '<li><a href="#' + heightmaps[i] + '">' + heightmaps[i] + '</a></li>';
  }
  output.appendChild(outline);
  var header = document.createElement('h2'),
      section = document.createElement('div');
  header.textContent = 'Overall';
  section.classList.add('section');
  section.id = 'overall';
  section.appendChild(header);
  for (i = 0, l = aProps.length; i < l; i++) {
    prop = aProps[i];
    needsDegreeSymbol = prop.indexOf('slope') !== -1 && prop.indexOf('kurtosis') === -1 && prop.indexOf('Skew') === -1;
    results.summary[prop] = {
      mean: results.overall[prop].reduce(accumulator) / results.overall[prop].length,
    };
    for (j = 0, m = results.overall[prop].length, sum = 0; j < m; j++) {
      deviation = results.overall[prop][j] - results.summary[prop].mean;
      sum += deviation * deviation;
    }
    results.summary[prop].stdev = Math.sqrt(sum / results.overall[prop].length);
    statgroup = document.createElement('div');
    statgroup.classList.add('statgroup');
    divMean = document.createElement('div');
    divMean.classList.add('stat');
    divMean.innerHTML = '<span class="label">Mean of all ' + prop +
      '</span><span class="value">' + results.summary[prop].mean.round(3) +
      (needsDegreeSymbol ? '&deg;' : '') + '</span>';
    statgroup.appendChild(divMean);
    divStdev = document.createElement('div');
    divStdev.classList.add('stat');
    divStdev.innerHTML = '<span class="label">Stdev of all ' + prop +
      '</span><span class="value">' + results.summary[prop].stdev.round(3) +
      (needsDegreeSymbol ? '&deg;' : '') + '</span>';
    statgroup.appendChild(divStdev);
    histogramContainer = document.createElement('div');
    histogramLabel = document.createElement('div');
    canvas = document.createElement('canvas');
    drawHistogram(
      bucketNumbersLinearly(
        results.overall[prop],
        bucketCount
      ),
      canvas,
      undefined,
      undefined,
      needsDegreeSymbol ? String.fromCharCode(176) : undefined
    );
    histogramContainer.classList.add('histogram-container');
    histogramLabel.classList.add('graph-label');
    histogramLabel.textContent = prop + ' histogram';
    histogramContainer.appendChild(canvas);
    histogramContainer.appendChild(histogramLabel);
    statgroup.appendChild(histogramContainer);
    section.appendChild(statgroup);
  }
  output.appendChild(section);
  for (i = 0, l = heightmaps.length; i < l; i++) {
    heightmap = heightmaps[i];
    result = results[heightmap];
    result.summary = {};
    section = document.createElement('div');
    section.classList.add('section');
    section.id = heightmap;
    header = document.createElement('h2');
    header.textContent = heightmap;
    section.appendChild(header);
    for (j = 0, m = aProps.length; j < m; j++) {
      prop = aProps[j];
      needsDegreeSymbol = prop.indexOf('slope') !== -1 && prop.indexOf('kurtosis') === -1 && prop.indexOf('Skew') === -1;
      result.summary[prop] = {
        mean: result[prop].reduce(accumulator) / result[prop].length,
      };
      for (k = 0, sum = 0; k < n; k++) {
        deviation = result[prop][k] - result.summary[prop].mean;
        sum += deviation * deviation;
      }
      result.summary[prop].stdev = Math.sqrt(sum / result[prop].length);
      statgroup = document.createElement('div');
      statgroup.classList.add('statgroup');
      divMean = document.createElement('div');
      divMean.classList.add('stat');
      divMean.innerHTML = '<span class="label">Mean of ' + prop +
        '</span><span class="value">' + result.summary[prop].mean.round(3) +
        (needsDegreeSymbol ? '&deg;' : '') + '</span>';
      statgroup.appendChild(divMean);
      divStdev = document.createElement('div');
      divStdev.classList.add('stat');
      divStdev.innerHTML = '<span class="label">Stdev of ' + prop +
        '</span><span class="value">' + result.summary[prop].stdev.round(3) +
        (needsDegreeSymbol ? '&deg;' : '') + '</span>';
      statgroup.appendChild(divStdev);
      histogramContainer = document.createElement('div');
      histogramLabel = document.createElement('div');
      canvas = document.createElement('canvas');
      drawHistogram(
        bucketNumbersLinearly(
          result[prop],
          bucketCount
        ),
        canvas,
        undefined,
        undefined,
        needsDegreeSymbol ? String.fromCharCode(176) : undefined
      );
      histogramContainer.classList.add('histogram-container');
      histogramLabel.classList.add('graph-label');
      histogramLabel.textContent = prop + ' histogram';
      histogramContainer.appendChild(canvas);
      histogramContainer.appendChild(histogramLabel);
      statgroup.appendChild(histogramContainer);
      section.appendChild(statgroup);
    }
    output.appendChild(section);
  }

  // Report
  //console.log(results);
}

function assembleOptions(heightmap, easing, smoothing, turbulent) {
  return {
    after: function(vertices, options) {
      applyEdgeFilter(vertices, options);
    },
    easing: THREE.Terrain[easing || 'Linear'],
    heightmap: heightmap === 'heightmap.png' ? heightmapImage : THREE.Terrain[heightmap || 'PerlinDiamond'],
    material: mat,
    maxHeight: 100,
    minHeight: -100,
    steps: 1,
    stretch: true,
    turbulent: turbulent || false,
    useBufferGeometry: false,
    xSize: 1024,
    ySize: 1024,
    xSegments: 63,
    ySegments: 63,
  };
}

function applyEdgeFilter(vertices, options, edgeType, edgeDirection, edgeCurve) {
  if (!edgeDirection || edgeDirection === 'Normal') return;
  (!edgeType || edgeType === 'Box' ? THREE.Terrain.Edges : THREE.Terrain.RadialEdges)(
    vertices,
    options,
    edgeDirection === 'Up' ? true : false,
    edgeDistance || 256,
    THREE.Terrain[edgeCurve || 'EaseInOut']
  );
}

/**
 * Utility method to round numbers to a given number of decimal places.
 *
 * Usage:
 *   3.5.round(0) // 4
 *   Math.random().round(4) // 0.8179
 *   var a = 5532; a.round(-2) // 5500
 *   Number.prototype.round(12345.6, -1) // 12350
 *   32..round(-1) // 30 (two dots required since the first one is a decimal)
 */
Number.prototype.round = function(v, a) {
  if (typeof a === 'undefined') {
    a = v;
    v = this;
  }
  if (!a) a = 0;
  var m = Math.pow(10, a|0);
  return Math.round(v*m)/m;
};

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
        i,
        l;
    canvas.width = width + border*2;
    canvas.height = height + border*2;
    if (typeof append === 'undefined') append = '';

    // If max or min is not set, set them to the highest/lowest value.
    if (max === -Infinity || min === Infinity) {
        for (i = 0, l = buckets.length; i < l; i++) {
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
    var maxBucketSize = 0;
    for (i = 0, l = buckets.length; i < l; i++) {
        if (buckets[i].length > maxBucketSize) {
            maxBucketSize = buckets[i].length;
        }
    }

    // Draw a bar.
    var unitSizeY = (height - separator) / maxBucketSize,
        unitSizeX = (width - (buckets.length + 1) * separator) / buckets.length;
    if (unitSizeX >= 1) unitSizeX = Math.floor(unitSizeX);
    if (unitSizeY >= 1) unitSizeY = Math.floor(unitSizeY);
    context.fillStyle = 'rgba(13, 42, 64, 1)';
    for (i = 0, l = buckets.length; i < l; i++) {
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
    for (i = 0, l = buckets.length; i < l; i++) {
        var text = Math.floor(((i + 0.5) / buckets.length) * (max - min) + min) + '' + append;
        context.fillText(
            text,
            border + separator + i * (unitSizeX + separator) + Math.floor((unitSizeX - context.measureText(text).width) * 0.5),
            border + height - 8,
            unitSizeX
        );
    }

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

heightmapImage.src = 'images/heightmap.png';
