import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  sourcemap: true,
  clean: true,
  target: 'node20',
  format: ['esm'],
  minify: false,
  dts: true,
});
