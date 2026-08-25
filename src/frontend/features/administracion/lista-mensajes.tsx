import type { Contacto } from '@/backend/repositories/profesores';

/**
 * Los mensajes de familias, en el panel.
 *
 * Cada tarjeta lleva el teléfono como enlace `tel:`, para poder llamar desde el
 * móvil sin copiar nada, y el correo del profesor como enlace `mailto:` con el
 * aviso ya escrito. Mientras el envío automático no funcione, esto es lo que
 * convierte «hay un mensaje guardado» en «el profesor lo sabe».
 */

function cuerpoDelAviso(c: Contacto): string {
  const lineas = [
    `Hola ${c.profesores.nombre}:`,
    '',
    'Una familia ha visto tu ficha en AcademiAvanza y quiere hablar contigo.',
    '',
    `Nombre:   ${c.nombre_familia}`,
    `Teléfono: ${c.telefono_familia ?? '—'}`,
  ];

  if (c.niveles?.nombre) lineas.push(`Curso:    ${c.niveles.nombre}`);
  if (c.mensaje) lineas.push('', 'Lo que te cuenta:', c.mensaje);

  lineas.push(
    '',
    'Llámala tú: ella no tiene tu teléfono ni tu correo.',
    '',
    'AcademiAvanza',
  );

  return lineas.join('\n');
}

export function ListaMensajes({ mensajes }: { mensajes: Contacto[] }) {
  if (mensajes.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-gris-borde p-6 text-center text-gris-medio">
        Ninguna familia ha escrito todavía.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {mensajes.map((c) => {
        const asunto = `Una familia quiere clases contigo — ${c.nombre_familia}`;
        const enlaceCorreo = `mailto:${c.profesores.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoDelAviso(c))}`;

        return (
          <article
            key={c.id}
            className="rounded-xl border border-gris-borde bg-white p-5"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-bold text-azul-confianza">
                {c.nombre_familia}
              </h3>
              <span className="text-sm text-gris-medio">
                {new Date(c.enviado_en).toLocaleDateString('es-ES')}
              </span>
            </header>

            <p className="mt-1 text-sm text-carbon">
              Para {c.profesores.nombre} {c.profesores.apellidos}
              {c.niveles?.nombre ? ` · ${c.niveles.nombre}` : ''}
            </p>

            {c.telefono_familia && (
              <p className="mt-3">
                <a
                  href={`tel:${c.telefono_familia}`}
                  className="text-lg font-semibold text-verde-avanza-oscuro underline underline-offset-4"
                >
                  {c.telefono_familia}
                </a>
              </p>
            )}

            {c.mensaje && (
              <blockquote className="mt-3 border-l-2 border-gris-borde pl-3 text-sm italic text-carbon">
                «{c.mensaje}»
              </blockquote>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gris-borde pt-4">
              {c.correo_entregado ? (
                <span className="rounded-full bg-verde-avanza-claro px-3 py-1 text-xs font-medium text-verde-avanza-oscuro">
                  Avisado por correo
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    Sin avisar
                  </span>
                  <a
                    href={enlaceCorreo}
                    className="text-sm text-verde-avanza-oscuro underline underline-offset-4"
                  >
                    Escribirle yo
                  </a>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
