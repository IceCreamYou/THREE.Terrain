import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
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
                globals: {
                    three: 'THREE'
                },
            }
        ]
    },
    {
        input: 'src/main.ts',
        external: ['three'],
        plugins: [
            typescript(),
        ],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ]
    }
];
