import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Genera tanto CommonJS (.js) como ES Modules (.mjs)
  dts: true, // Genera los archivos de declaración de tipos (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true, // Limpia la carpeta /dist antes de cada compilación
  minify: true,
});
