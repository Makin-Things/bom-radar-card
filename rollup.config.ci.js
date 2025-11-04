import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/bom-radar-card.ts',
  output: {
    file: 'dist/bom-radar-card.js',
    format: 'es',
  },
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
      // FormatJS helpers emit UMD-style helpers that safely fall back when `this` is undefined.
      return;
    }

    warn(warning);
  },
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    json(),
    typescript(),
    copy({
      targets: [
        // Copy all assets to dist/assets/
        { src: 'src/assets/*', dest: 'dist/assets' },
      ],
      hook: 'writeBundle',
    }),
  ]
};
