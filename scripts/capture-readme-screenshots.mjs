#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const analyticsViewport = {width: 1920, height: 1019};
const materialViewport = {width: 722, height: 542};
// The 1920px capture renders the full WebGL terrain and dense instanced grass;
// sometimes it can take awhile to flush that frame.
const screenshotTimeout = 300_000;

/**
 * Parse the small set of options used by the README screenshot task.
 *
 * A local Vite server is started by default. Pass `--url` when the demo is
 * already being served, for example when checking a deployed GitHub Pages
 * build. The output dimensions match the images linked from the README.
 *
 * @param {string[]} argv
 *   Command-line arguments after the Node executable and script path.
 * @return {Object}
 *   Capture options.
 */
function parseArguments(argv) {
    var options = {
        headed: false,
        layersEdgeDistance: 256,
        layersInfluence: 'island',
        layersOnly: false,
        layersSeed: 987654321,
        layersSeedProvided: false,
        outputDir: resolve(projectRoot, 'demo/img'),
        port: 4173,
        seed: 271828,
        url: null,
    };
    for (var index = 0; index < argv.length; index++) {
        var argument = argv[index],
            next = argv[index + 1];
        if (argument === '--help' || argument === '-h') {
            options.help = true;
        }
        else if (argument === '--headed') {
            options.headed = true;
        }
        else if (argument === '--layers-edge-distance') {
            options.layersEdgeDistance = Number(next);
            index++;
        }
        else if (argument === '--layers-influence') {
            options.layersInfluence = next === 'none' ? null : next;
            index++;
        }
        else if (argument === '--layers-only') {
            options.layersOnly = true;
        }
        else if (argument === '--url') {
            options.url = next;
            index++;
        }
        else if (argument === '--output-dir') {
            options.outputDir = resolve(process.cwd(), next);
            index++;
        }
        else if (argument === '--port') {
            options.port = Number(next);
            index++;
        }
        else if (argument === '--seed') {
            options.seed = Number(next) >>> 0;
            if (!options.layersSeedProvided) {
                options.layersSeed = (options.seed ^ 0x9e3779b9) >>> 0;
            }
            index++;
        }
        else if (argument === '--layers-seed') {
            options.layersSeed = Number(next) >>> 0;
            options.layersSeedProvided = true;
            index++;
        }
        else {
            throw new Error('Unknown argument: ' + argument);
        }
    }
    if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
        throw new Error('--port must be an integer between 1 and 65535.');
    }
    if (!Number.isFinite(options.layersEdgeDistance) || options.layersEdgeDistance < 0 || options.layersEdgeDistance > 512) {
        throw new Error('--layers-edge-distance must be a number between 0 and 512.');
    }
    return options;
}

/**
 * Print the command-line help and exit without starting a browser.
 */
function printHelp() {
    console.log(`Usage: npm run screenshots -- [options]

Capture the two README demo images into demo/img/.

Options:
  --url URL          Use an existing demo server instead of starting Vite.
  --port PORT        Vite port when --url is not supplied (default: 4173).
  --output-dir DIR   Directory for screenshot1.jpg and screenshot2.jpg.
  --seed NUMBER      Seed the analytics beach terrain; defaults to 271828.
  --layers-seed NUM  Seed the HUD-free beach/material terrain; defaults to 987654321.
  --layers-influence VALUE
                     Influence for the HUD-free terrain; use island or none.
  --layers-edge-distance NUM
                     Width of the HUD-free radial beach transition; defaults to 256.
  --layers-only      Capture only screenshot2 while iterating beach compositions.
  --headed           Show the Playwright Chromium window while capturing.
  --help             Show this help.

Examples:
  npm run screenshots
  npm run screenshots -- --headed
  npm run screenshots -- --url https://icecreamyou.github.io/THREE.Terrain/
`);
}

/**
 * Start the Vite demo server without opening a separate system browser.
 *
 * @param {number} port
 *   Local TCP port for the Vite server.
 * @return {Promise<import('vite').ViteDevServer>}
 *   The running Vite server.
 */
async function startDemoServer(port) {
    var server = await createServer({
        root: projectRoot,
        server: {
            host: '127.0.0.1',
            open: false,
            port: port,
            strictPort: true,
        },
    });
    await server.listen();
    return server;
}

/**
 * Add a seed and camera start to a demo URL.
 *
 * Keeping these values in the URL exercises the same public controls that a
 * user can use to reproduce a view, including on a deployed GitHub Pages
 * copy of the demo.
 *
 * @param {string} baseURL
 *   Demo URL to extend.
 * @param {number} seed
 *   Unsigned 32-bit random seed.
 * @param {string} start
 *   Demo camera start name.
 * @param {string|null} influence
 *   Optional terrain influence mode, such as `island`.
 * @return {string}
 *   URL containing the requested parameters.
 */
function createCaptureURL(baseURL, seed, start, influence) {
    var url = new URL(baseURL);
    url.searchParams.set('seed', String(seed >>> 0));
    url.searchParams.set('start', start);
    // Freeze the demo's optional terrain rotation so repeated captures with
    // the same seed and camera remain pixel-stable while ordinary visits keep
    // their normal animated presentation.
    url.searchParams.set('static', '1');
    if (influence) url.searchParams.set('influence', influence);
    else url.searchParams.delete('influence');
    return url.toString();
}

/**
 * Wait until the demo has generated its terrain and initialized its controls.
 *
 * Four canvases are expected: the heightmap, two analytics graphs, and the
 * WebGL renderer. Waiting for the GUI as well avoids capturing the brief
 * loading state before the decoration controls have been created.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 */
async function waitForDemo(page) {
    await page.waitForFunction(() => {
        var folderTitles = Array.from(document.querySelectorAll('.dg .folder .title'));
        return document.querySelectorAll('canvas').length >= 4 &&
            document.querySelector('#show-analytics') &&
            folderTitles.some((title) => title.textContent.trim() === 'Edges');
    }, undefined, {timeout: 60000});
    // Texture loading and the first scatter pass can finish after the GUI is
    // present. Wait through that first asynchronous regeneration before
    // changing controls; otherwise dat.GUI can briefly detach nested folders.
    await page.waitForTimeout(10000);
}

/**
 * Select a value in a dat.GUI controller and allow its regeneration callback
 * to finish before the next control is changed.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {string} property
 *   dat.GUI property name, such as `edgeType`.
 * @param {string} value
 *   Visible option label to select.
 */
async function selectGuiValue(page, property, value) {
    var row = page.locator('.dg .cr').filter({hasText: property}).first();
    await row.waitFor({state: 'attached'});
    var select = row.locator('select'),
        current = await select.inputValue();
    if (current !== value) {
        await select.selectOption({force: true, label: value});
    }
    // Regeneration is synchronous for the small demo mesh, but textures and
    // instanced decoration still need a few frames before the shot is stable.
    await page.waitForTimeout(3500);
}

/**
 * Set a dat.GUI numeric controller by its property name.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {string} property
 *   dat.GUI property name.
 * @param {number} value
 *   Numeric value to enter.
 */
async function setGuiNumber(page, property, value) {
    // Match the controller's property-name span exactly. Using a text filter
    // can select a hidden ancestor or a similarly named controller such as
    // `Height` versus `maxHeight` while dat.GUI is rebuilding a folder.
    await page.waitForFunction((property) => Array.from(document.querySelectorAll('.dg .cr')).some((row) => {
        var name = row.querySelector('.property-name');
        return name && name.textContent.trim() === property && row.querySelector('input');
    }), property, {timeout: 30000});
    await page.evaluate(({property, value}) => {
        var row = Array.from(document.querySelectorAll('.dg .cr')).find((candidate) => {
                var name = candidate.querySelector('.property-name');
                return name && name.textContent.trim() === property;
            }),
            input = row && row.querySelector('input'),
            setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, String(value));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        input.dispatchEvent(new Event('blur'));
    }, {property, value});
    await page.waitForTimeout(3500);
}

/**
 * Open or close a dat.GUI folder by checking one of its child controllers.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {string} folderName
 *   Visible folder title.
 * @param {string} childLabel
 *   Label of a controller inside the folder.
 * @param {boolean} open
 *   Desired folder state.
 */
async function setGuiFolder(page, folderName, childLabel, open) {
    var title = page.locator('.dg .folder .title').filter({hasText: folderName}).first(),
        child = page.locator('.dg .cr').filter({hasText: childLabel}).first();
    await title.waitFor({state: 'attached'});
    var childVisible = await child.isVisible().catch(() => false);
    if (childVisible !== open) {
        // dat.GUI puts folders in its own scroll container. A title can be
        // CSS-visible while outside that container's viewport, so a normal
        // Playwright click may wait forever trying to scroll the panel. The
        // title is a local, non-destructive control; dispatch it directly.
        await title.evaluate((element) => element.click());
        await page.waitForTimeout(250);
    }
}

/**
 * Set the radial, downward edge treatment used by both README compositions.
 * This leaves the terrain interior visible and keeps the generated boundary
 * out of the camera crops.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {boolean} beach
 *   Whether to retain a radial shoreline for the beach composition.
 * @param {number} [edgeDistance]
 *   Distance from the terrain edge at which the radial transition begins.
 * @return {Promise<void>}
 *   Resolves after the demo has regenerated the terrain.
 */
async function configureInteriorTerrain(page, beach, edgeDistance) {
    // Configure the terrain before the final capture-only grass assertion.
    // The demo starts with grass enabled, so no nested-folder toggle is needed
    // during the asynchronous heightmap/edge setup.
    await setGuiFolder(page, 'Heightmap', 'heightmap', true);
    await selectGuiValue(page, 'heightmap', 'PerlinDiamond');
    await setGuiFolder(page, 'Decoration', 'scattering', true);
    if (beach) {
        await setGuiFolder(page, 'Edges', 'edgeType', true);
        // Set the numeric radius while the Edges folder is stable. Changing
        // the select controllers regenerates the terrain and dat.GUI may
        // briefly detach its collapsed child rows.
        await setGuiNumber(page, 'edgeDistance', typeof edgeDistance === 'number' ? edgeDistance : 64);
        await selectGuiValue(page, 'edgeType', 'Radial');
        await setGuiFolder(page, 'Edges', 'edgeDirection', true);
        await selectGuiValue(page, 'edgeDirection', 'Down');
    }
    else {
        // Keep the full PerlinDiamond terrain for the material-layer shot;
        // radial edge falloff is only needed for the beach composition.
        await setGuiFolder(page, 'Edges', 'edgeType', true);
        await selectGuiValue(page, 'edgeDirection', 'Normal');
    }
}

/**
 * Open the analytics drawer and verify its visible-state class.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 */
async function openAnalytics(page) {
    await page.locator('#show-analytics').evaluate((element) => element.click());
    await page.waitForFunction(() => {
        var analytics = document.getElementById('analytics');
        return analytics?.classList.contains('visible');
    }, undefined, {timeout: 5000});
}

/**
 * Reassert the analytics drawer's visible styles immediately before a
 * screenshot.
 *
 * Applying inline capture styles avoids a race between dat.GUI focus changes
 * and the drawer's opacity transition. This changes only the capture page;
 * the normal demo source and UI remain unchanged.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 */
async function forceAnalyticsVisible(page) {
    await page.evaluate(() => {
        var trigger = document.getElementById('show-analytics'),
            panel = document.getElementById('analytics');
        trigger.style.display = 'none';
        panel.style.setProperty('opacity', '1', 'important');
        panel.style.pointerEvents = 'auto';
        panel.style.visibility = 'visible';
        panel.style.setProperty('transition', 'none', 'important');
    });
}

/**
 * Allow the requested frame and UI transitions to settle before capture.
 *
 * The demo's focus handlers intentionally stop its animation loop when the
 * window loses focus. Sending the event after the UI has been forced visible
 * leaves a stable WebGL frame for the high-resolution encoder.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 */
async function pauseDemoForCapture(page) {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(200);
}

/**
 * Hide the demo controls for the HUD-free material composition.
 *
 * This is capture-only styling. The public demo keeps its heightmap,
 * analytics link, dat.GUI controls, and footer visible for normal visitors.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 */
async function hideDemoHudForCapture(page) {
    await page.evaluate(() => {
        document.querySelectorAll('#heightmap, #show-analytics, #analytics, #code, #fpscontrols, .dg')
            .forEach((element) => { element.style.display = 'none'; });
    });
}

/**
 * Toggle the top-level Flight mode controller.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {boolean} enabled
 *   Desired Flight mode state.
 */
async function setFlightMode(page, enabled) {
    var checkbox = page.locator('.dg .cr')
        .filter({hasText: 'Flight mode'})
        .locator('input[type="checkbox"]')
        .first();
    await checkbox.waitFor({state: 'attached'});
    await checkbox.setChecked(enabled, {force: true});
    await page.waitForTimeout(1300);
}

/**
 * Capture the analytics/configuration view for README screenshot 1.
 *
 * The analytics drawer and decoration controls remain visible. The URL's
 * `analytics` start places the camera close to the ground and aims it at the
 * interior shoreline without exposing the generated terrain edge.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {string} path
 *   Output JPEG path.
 */
async function captureAnalyticsShot(page, path) {
    await configureInteriorTerrain(page, true);
    await setGuiFolder(page, 'Decoration', 'scattering', true);
    await setGuiFolder(page, 'Edges', 'edgeType', false);
    await setFlightMode(page, true);

    // Open this last: camera/control interactions can change focus while the
    // terrain is settling, so the published frame must verify the final state.
    await openAnalytics(page);
    await forceAnalyticsVisible(page);
    await pauseDemoForCapture(page);
    await page.waitForFunction(() => {
        var panel = document.getElementById('analytics');
        return panel &&
            Number.parseFloat(getComputedStyle(panel).opacity) > 0.9 &&
            panel.getBoundingClientRect().width > 0;
    }, undefined, {timeout: 5000});
    await page.screenshot({path, type: 'jpeg', quality: 90, timeout: screenshotTimeout});
}

/**
 * Capture the HUD-free beach and material-layer view for README screenshot 2.
 *
 * The capture uses the historical 722x542 README dimensions. Capture-only
 * styling removes the heightmap, analytics link, dat.GUI, and bottom code
 * controls while retaining all four blended material bands and the grass
 * meshes. The URL's `layers` start keeps the camera close to the ground and
 * aims at the island shoreline without showing the generated terrain edge.
 *
 * @param {import('playwright').Page} page
 *   Page containing the terrain demo.
 * @param {string} url
 *   URL containing the seed and `layers` camera start.
 * @param {string} path
 *   Output JPEG path.
 * @param {number} [edgeDistance]
 *   Distance from the terrain edge at which the radial transition begins.
 */
async function captureMaterialShot(page, url, path, edgeDistance) {
    await page.goto(url, {waitUntil: 'commit', timeout: 120000});
    await waitForDemo(page);
    await configureInteriorTerrain(page, true, edgeDistance);
    await hideDemoHudForCapture(page);
    await page.waitForTimeout(500);
    await pauseDemoForCapture(page);
    await page.screenshot({
        path,
        type: 'jpeg',
        quality: 90,
        timeout: screenshotTimeout,
    });
}

/**
 * Run both README screenshot captures and clean up the browser/server.
 */
async function main() {
    var options = parseArguments(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }
    await mkdir(options.outputDir, {recursive: true});

    var demoServer,
        browser,
        screenshot1 = resolve(options.outputDir, 'screenshot1.jpg'),
        screenshot2 = resolve(options.outputDir, 'screenshot2.jpg'),
        demoURL = options.url || 'http://127.0.0.1:' + options.port + '/';
    try {
        if (!options.url) {
            demoServer = await startDemoServer(options.port);
        }
        browser = await chromium.launch({
            args: ['--use-angle=swiftshader'],
            headless: !options.headed,
        });
        var context = await browser.newContext({viewport: options.layersOnly ? materialViewport : analyticsViewport});
        var page = await context.newPage();
        if (!options.layersOnly) {
            await page.goto(createCaptureURL(demoURL, options.seed, 'analytics', 'island'), {waitUntil: 'domcontentloaded', timeout: 60000});
            await waitForDemo(page);
            await captureAnalyticsShot(page, screenshot1);
            await page.setViewportSize(materialViewport);
        }
        await captureMaterialShot(
            page,
            createCaptureURL(demoURL, options.layersSeed, 'layers', options.layersInfluence),
            screenshot2,
            options.layersEdgeDistance
        );
        if (!options.layersOnly) console.log('Wrote ' + screenshot1);
        console.log('Wrote ' + screenshot2);
    }
    catch (error) {
        if (error?.message && error.message.includes('Executable doesn')) {
            throw new Error(error.message + '\nRun `npx playwright install chromium` once, then retry.');
        }
        throw error;
    }
    finally {
        if (browser) await browser.close();
        if (demoServer) await demoServer.close();
    }
}

main().catch(function(error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
