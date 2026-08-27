import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Las pruebas contra una base de datos de verdad.
 *
 * Existen porque los dos fallos más graves que ha tenido esta plataforma —el
 * precio que se quedaba a cero y el aviso de pago que no caducaba nunca— no los
 * habría cazado ninguna prueba de función pura. Los dos estaban en cómo hablan
 * entre sí el código y la base de datos, y eso sólo se ve ejecutándolo contra
 * PostgreSQL.
 *
 * **Nunca contra la base de datos de verdad.** El fichero de arranque lo
 * comprueba antes de dejar correr nada: ahí hay teléfonos de familias con hijos
 * menores, y estas pruebas borran tablas enteras entre caso y caso.
 *
 * Van en serie, no en paralelo. Comparten una única base de datos y se limpian
 * entre ellas; en paralelo se pisarían y fallarían por turnos, que es la peor
 * clase de prueba: la que a veces pasa.
 */
export default defineConfig({
  test: {
    include: ['tests/integracion/**/*.test.ts'],
    setupFiles: ['./tests/integracion/arranque.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
