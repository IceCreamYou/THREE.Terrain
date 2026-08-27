import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { createServer } from 'vite';

const repositoryRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
let browser;
let server;
let serverUrl;

before(async () => {
    server = await createServer({
        configFile: resolve(repositoryRoot, 'vite.config.js'),
        server: {
            host: '127.0.0.1',
            open: false,
            port: 0,
        },
    });
    await server.listen();
    const address = server.httpServer.address();
    serverUrl = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({headless: true});
});

after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
});

test('browser heightmap import and export preserve a generated terrain surface', async () => {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error));
    const response = await page.goto(`${serverUrl}/test/fixtures/library.html`);

    assert.equal(response.status(), 200);
    const result = await page.evaluate(async () => {
        const {default: Terrain, TerrainNS} = await import('/src/index.js');
        const source = document.createElement('canvas');
        source.width = 3;
        source.height = 3;
        const context = source.getContext('2d');
        const pixelValues = [0, 31, 63, 95, 127, 159, 191, 223, 255];
        const image = context.createImageData(3, 3);
        for (let index = 0; index < pixelValues.length; index++) {
            image.data[index * 4] = pixelValues[index];
            image.data[index * 4 + 1] = pixelValues[index];
            image.data[index * 4 + 2] = pixelValues[index];
            image.data[index * 4 + 3] = 255;
        }
        context.putImageData(image, 0, 0);

        const options = {
            xSegments: 2,
            ySegments: 2,
            xSize: 20,
            ySize: 20,
            minHeight: -20,
            maxHeight: 80,
            stretch: false,
        };
        const sourceTerrain = Terrain({...options, heightmap: source});
        const sourcePositions = sourceTerrain.children[0].geometry.attributes.position.array;
        const originalHeights = Array.from(TerrainNS.toArray1D(sourcePositions));
        const exported = TerrainNS.toHeightmap(sourcePositions, options);
        const importedTerrain = Terrain({...options, heightmap: exported});
        const importedHeights = Array.from(
            TerrainNS.toArray1D(importedTerrain.children[0].geometry.attributes.position.array)
        );

        return {
            aliasWorks: window.THREE && window.THREE.Terrain === Terrain,
            exportedSize: [exported.width, exported.height],
            vertexCount: sourceTerrain.children[0].geometry.attributes.position.count,
            originalHeights,
            importedHeights,
            maxError: Math.max(...originalHeights.map((value, index) => Math.abs(value - importedHeights[index]))),
        };
    });

    await page.close();

    assert.deepEqual(result.exportedSize, [3, 3]);
    assert.equal(result.vertexCount, 9);
    assert.equal(result.aliasWorks, true);
    assert.ok(result.originalHeights[0] < result.originalHeights[result.originalHeights.length - 1]);
    assert.ok(result.maxError < 0.5);
    assert.deepEqual(pageErrors, []);
});

test('demo loads the library and creates its terrain heightmap', async () => {
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestErrors = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
        const failure = request.failure();
        requestErrors.push(`${request.url()}: ${failure ? failure.errorText : 'request failed'}`);
    });

    let response;
    let result;
    try {
        response = await page.goto(`${serverUrl}/?seed=12345&decorationSeed=67890`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        await page.waitForFunction(() =>
            Boolean(
                window.THREE &&
                window.THREE.Terrain &&
                typeof window.terrainDemoSeed === 'number' &&
                document.querySelector('#heightmap') &&
                document.querySelector('#heightmap').width > 0 &&
                document.querySelector('#heightmap').height > 0
            ), null, {timeout: 30000}
        );
        result = await page.evaluate(() => ({
            hasTerrainNamespace: Boolean(window.THREE && window.THREE.Terrain),
            seed: window.terrainDemoSeed,
            heightmapSize: [
                document.querySelector('#heightmap').width,
                document.querySelector('#heightmap').height,
            ],
        }));
    }
    finally {
        await page.close();
    }

    assert.equal(response.status(), 200);
    assert.equal(result.hasTerrainNamespace, true);
    assert.equal(result.seed, 12345);
    assert.ok(result.heightmapSize[0] > 1 && result.heightmapSize[1] > 1);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(requestErrors, []);
});
