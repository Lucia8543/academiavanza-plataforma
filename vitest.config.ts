import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Las pruebas rápidas.
 *
 * Sólo `tests/unit/`: funciones puras, sin base de datos y sin red. Tardan un
 * segundo y se pueden ejecutar cada vez que se guarda un fichero.
 *
 * Las de integración van aparte, en `vitest.integracion.config.ts`, porque
 * necesitan un PostgreSQL levantado. Separarlas no es manía de orden: si
 * `pnpm test` exigiera base de datos, se dejaría de ejecutar.
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
