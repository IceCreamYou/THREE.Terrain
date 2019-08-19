import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import sourceMaps from 'rollup-plugin-sourcemaps'
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        external: ['three'],
        plugins: [
            typescript(),
            terser()
        ],
        output: [
            {
                name: 'THREE.Terrain',
                file: pkg.browser,
                format: 'umd',
                sourcemap: true,
                globals: {
                    three: 'THREE'
                },
            }
        ]
    },
    {
        input: 'src/main.ts',
        external: ['three'],
        watch: {
            include: 'src/**',
        },
        plugins: [
            typescript(),
            sourceMaps()
        ],
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'es', sourcemap: true }
        ]
    }
];
