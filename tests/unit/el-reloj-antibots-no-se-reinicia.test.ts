import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Un formulario que se vuelve a montar no puede reiniciar el reloj antibots.
 *
 * `CamposTrampa` apunta cuándo se abrió el formulario, y el servidor marca como
 * automático lo que llegue en menos de tres segundos. El instante se fija al
 * montarse el componente, que es lo correcto mientras el componente no se
 * desmonte.
 *
 * Los formularios largos sí se desmontan. Cambian su `key` con cada respuesta
 * del servidor para no perder las casillas marcadas, y eso los reconstruye
 * enteros. Con `CamposTrampa` dentro, el reloj volvía a cero en cada intento:
 * quien enviaba, leía que le faltaba un campo, lo corregía y volvía a enviar en
 * dos segundos, salía marcado como guion automático llevando diez minutos
 * rellenando.
 *
 * Y durante un tiempo esa marca no era una anotación, era la papelera. En los
 * registros del servidor hay once altas de profesores y tres solicitudes de
 * familias descartadas así, todas ellas viendo en pantalla que se habían
 * recibido.
 *
 * La regla, entonces: si un fichero remonta su formulario con una `key`, el
 * instante tiene que venirle de fuera. Se comprueba leyendo el texto, que es
 * tosco pero mira justo el tramo donde estuvo el fallo.
 */

const RAIZ = join(import.meta.dirname, '..', '..');

/** Todos los `.tsx` de la aplicación, sin distinguir carpetas. */
function ficherosTsx(desde: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(desde)) {
    const ruta = join(desde, entrada);

    if (statSync(ruta).isDirectory()) {
      encontrados.push(...ficherosTsx(ruta));
      continue;
    }

    if (entrada.endsWith('.tsx')) encontrados.push(ruta);
  }

  return encontrados;
}

const SOSPECHOSOS = ficherosTsx(join(RAIZ, 'src'))
  .map((ruta) => ({ ruta, texto: readFileSync(ruta, 'utf8') }))
  // Sólo importan los que usan el detector.
  .filter(({ texto }) => texto.includes('<CamposTrampa'))
  // Y de ésos, sólo los que reconstruyen el formulario con una `key`.
  .filter(({ texto }) => /<form[^>]*\n?\s*key=\{/.test(texto));

describe('⭐ el reloj antibots sobrevive al remontaje del formulario', () => {
  it('la prueba encuentra los formularios que se remontan', () => {
    // Si esto falla, o desapareció el patrón o la expresión dejó de
    // reconocerlo, y entonces el resto pasaría en vacío sin mirar nada.
    expect(SOSPECHOSOS.length).toBeGreaterThan(0);
  });

  it.each(SOSPECHOSOS.map((f) => f.ruta))(
    '%s le pasa el instante desde fuera',
    (ruta) => {
      const texto = readFileSync(ruta, 'utf8');

      expect(
        /<CamposTrampa\s+inicio=\{/.test(texto),
        `${ruta} remonta su formulario con una \`key\` y pinta ` +
          `<CamposTrampa /> sin pasarle \`inicio\`. Cada respuesta del ` +
          `servidor le reinicia el reloj antibots, y quien corrija un campo y ` +
          `vuelva a enviar deprisa saldrá marcado como guion automático. El ` +
          `instante tiene que vivir fuera del <form>, donde no se desmonta.`,
      ).toBe(true);
    },
  );
});
