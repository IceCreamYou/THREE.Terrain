import { TerrainNS } from '../src/index.js';

var moments = {
    'elevation.stdev': {
        mean: 42.063,
        stdev: 6.353,
    },
    'elevation.pearsonSkew': {
        levels: {
            '+high': -1.032,
            '+medium': -0.277,
            'low': 0.666,
            '-medium': 1.232,
            '-high': Infinity,
        },
    },
    'slope.stdev': {
        mean: 10.154,
        stdev: 3.586,
    },
    'slope.groeneveldMeedenSkew': {
        levels: {
            '+high': -0.347,
            '+medium': -0.130,
            'low': 0.088,
            '-medium': 0.305,
            '-high': Infinity,
        },
    },
    'roughness.jaggedness': {
        levels: [0.006, 0.02, 0.044, 0.10],
    },
    'roughness.terrainRuggednessIndex': {
        levels: [1, 2.2, 3.5, 4.8],
    },
};

/**
 * Round a number without changing the global Number prototype.
 *
 * @param {number} value
 *   Number to round.
 * @param {number} places
 *   Decimal places.
 * @return {number}
 *   Rounded number.
 */
function roundNumber(value, places) {
    places = places || 0;
    var multiplier = Math.pow(10, places | 0);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Format one analytics value for the fixed-width demo table.
 *
 * @param {number|number[]} value
 *   Analytics value.
 * @return {string}
 *   Formatted value.
 */
function cleanAnalytic(value) {
    if (Array.isArray(value)) {
        if (value.length === 1) value = value[0];
        else {
            var text = value.map(function(item) { return Math.round(item); }).join(', ');
            if (text.length > 9) text = value.join(',');
            if (text.length > 9) text = text.substring(0, text.lastIndexOf(',', 7)) + ',…';
            return text;
        }
    }
    var integerText = (value | 0) + '',
        padding = '';
    if ((value | 0) === 0 && value < 0) integerText = '-' + integerText;
    while (integerText.length + padding.length < 5) padding += ' ';
    return padding + roundNumber(typeof value === 'undefined' || value === null ? NaN : value, 3);
}

/**
 * Classify a number against ordered category boundaries.
 *
 * @param {number} value
 *   Number to classify.
 * @param {Object|number[]} buckets
 *   Array boundaries or named boundaries.
 * @return {string}
 *   Category name.
 */
function numberToCategory(value, buckets) {
    buckets = buckets || [-2, -2 / 3, 2 / 3, 2];
    if (typeof buckets.length === 'number' && buckets.length > 3) {
        if (value < buckets[0]) return 'very low';
        if (value < buckets[1]) return 'low';
        if (value < buckets[2]) return 'medium';
        if (value < buckets[3]) return 'high';
        return 'very high';
    }
    var keys = Object.keys(buckets).sort(function(first, second) {
        return buckets[first] - buckets[second];
    });
    for (var index = 0; index < keys.length; index++) {
        if (value < buckets[keys[index]]) return keys[index];
    }
    return keys[keys.length - 1];
}

/**
 * Return the summary categories shown by the analytics panel.
 *
 * @param {Object} analytics
 *   Result from `TerrainNS.Analyze`.
 * @return {Object}
 *   Summary category values.
 */
function getSummary(analytics) {
    var results = {},
        deviationBuckets = [-2, -2 / 3, 2 / 3, 2];
    for (var property in moments) {
        if (!moments.hasOwnProperty(property)) continue;
        var average = moments[property],
            split = property.split('.'),
            sample = analytics[split[0]][split[1]];
        if (typeof average.mean === 'number') {
            results[property] = numberToCategory((sample - average.mean) / average.stdev, deviationBuckets);
        }
        else {
            results[property] = numberToCategory(sample, average.levels);
        }
    }
    return results;
}

/**
 * Create the analytics panel controller.
 *
 * @return {Object}
 *   Panel update and event-binding operations.
 */
export function createAnalyticsController() {
    var elevationGraph = document.getElementById('elevation-graph'),
        slopeGraph = document.getElementById('slope-graph'),
        analyticsValues = document.getElementsByClassName('value'),
        close = document.querySelector('#analytics .close'),
        show = document.querySelector('#show-analytics');

    if (close) {
        close.addEventListener('click', function(event) {
            event.preventDefault();
            document.getElementById('analytics').classList.remove('visible');
            show.classList.add('visible');
        }, {passive: false});
    }
    if (show) {
        show.addEventListener('click', function(event) {
            event.preventDefault();
            show.classList.remove('visible');
            var panel = document.getElementById('analytics');
            panel.scrollTop = 0;
            panel.classList.add('visible');
        }, {passive: false});
    }

    /**
     * Analyze a terrain mesh and update all analytics elements.
     *
     * @param {THREE.Mesh} terrainMesh
     *   Current terrain mesh.
     * @param {Object} options
     *   Terrain options passed to the analysis helpers.
     */
    function update(terrainMesh, options) {
        if (!terrainMesh) return;
        var analysis = TerrainNS.Analyze(terrainMesh, options),
            summary = getSummary(analysis),
            property;
        analysis.elevation.drawHistogram(elevationGraph, 10);
        analysis.slope.drawHistogram(slopeGraph, 10);
        for (var index = 0; index < analyticsValues.length; index++) {
            property = analyticsValues[index].getAttribute('data-property').split('.');
            var analytic = analysis[property[0]][property[1]];
            if (analyticsValues[index].getAttribute('class').split(/\s+/).indexOf('percent') !== -1) {
                analytic *= 100;
            }
            analyticsValues[index].textContent = cleanAnalytic(analytic);
        }
        for (property in summary) {
            if (summary.hasOwnProperty(property)) {
                var summaryCell = document.querySelector('.summary-value[data-property="' + property + '"]');
                if (summaryCell) summaryCell.textContent = summary[property];
            }
        }
    }

    return {update: update};
}
