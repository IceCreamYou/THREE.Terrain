import * as THREE from 'three';
import Terrain, { TerrainNS } from '../../src/index.js';

const heightmaps = [
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
];

const aProps = [
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
];

const mat = new THREE.MeshBasicMaterial({ color: 0x5566aa, wireframe: true });
const heightmapImage = new Image();
const n = 40;
const bucketCount = 10;

heightmapImage.addEventListener('load', setup, false);
heightmapImage.addEventListener('error', function() {
  console.error('Failed to load heightmap image:', heightmapImage.src);
}, false);
heightmapImage.src = '../demo/img/heightmap.png';

function setup() {
  var results = { overall: {}, summary: {} },
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
    canvas,
    i,
    j,
    l;

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
      analytics = TerrainNS.Analyze(Terrain(options).children[0], options);
      for (k = 0, m = aProps.length; k < m; k++) {
        prop = aProps[k].split('.');
        result[aProps[k]].push(analytics[prop[0]][prop[1]]);
        results.overall[aProps[k]].push(analytics[prop[0]][prop[1]]);
      }
    }
  }

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
    TerrainNS.drawHistogram(
      TerrainNS.bucketNumbersLinearly(
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
      TerrainNS.drawHistogram(
        TerrainNS.bucketNumbersLinearly(
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
}

function assembleOptions(heightmap, easing, turbulent) {
  return {
    after: function(vertices, options) {
      applyEdgeFilter(vertices, options);
    },
    easing: TerrainNS[easing || 'Linear'],
    heightmap: heightmap === 'heightmap.png' ? heightmapImage : TerrainNS[heightmap || 'PerlinDiamond'],
    material: mat,
    maxHeight: 100,
    minHeight: -100,
    steps: 1,
    stretch: true,
    turbulent: turbulent || false,
    xSize: 1024,
    ySize: 1024,
    xSegments: 63,
    ySegments: 63,
  };
}

function applyEdgeFilter(vertices, options, edgeType, edgeDirection, edgeCurve) {
  if (!edgeDirection || edgeDirection === 'Normal') return;
  (edgeType === 'Box' ? TerrainNS.Edges : TerrainNS.RadialEdges)(
    vertices,
    options,
    edgeDirection === 'Up',
    256,
    TerrainNS[edgeCurve || 'EaseInOut']
  );
}

Number.prototype.round = function(v, a) {
  if (typeof a === 'undefined') {
    a = v;
    v = this;
  }
  if (!a) a = 0;
  var m = Math.pow(10, a | 0);
  return Math.round(v * m) / m;
};
