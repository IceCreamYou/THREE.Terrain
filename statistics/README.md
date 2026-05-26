This package provides statistics about each major procedural terrain generation
method included in the `THREE.Terrain` library.

By default, for each procedural terrain generation method, it generates 40
terrains. It then provides interesting summary statistics overall and for each
method.

**Warning:** The calculations can take awhile to run (typically under 30
seconds) and will lock up your browser while running.

## Run locally (v3)

From the repository root:

```bash
npm install
npm start
```

Then open [http://localhost:5173/statistics/](http://localhost:5173/statistics/) (port may differ if 5173 is in use).

You can also use any static file server rooted at the repository, for example:

```bash
npx serve .
# open http://localhost:3000/statistics/
```

The page loads `three` and the library from `src/` as ES modules. An import map
in `statistics/index.html` points `three` at unpkg for static hosting without
Vite; when using `npm start`, Vite resolves `three` from `node_modules`.

## Live demo

[Run the analysis](https://icecreamyou.github.io/THREE.Terrain/statistics/) (GitHub Pages, after deploy).

Note that the graphs show data in the generated range, not in the maximum
possible range. This makes it easier to see the shape of the histograms, even
though it makes visually comparing their locations more difficult.
