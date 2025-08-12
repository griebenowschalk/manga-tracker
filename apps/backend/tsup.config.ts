import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  sourcemap: true,
  clean: true,
  target: 'node20',
  format: ['esm'],
  minify: false,
  dts: true,
  external: [
    'express',
    'cors',
    'helmet',
    'cookie-parser',
    'morgan',
    'express-rate-limit',
    'hpp',
    'express-xss-sanitizer',
    'dotenv',
    'jsonwebtoken',
    'buffer',
    'crypto',
    'util',
    'fs',
    'path',
  ],
  noExternal: ['@manga/shared'],
});
