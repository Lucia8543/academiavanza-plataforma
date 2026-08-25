/**
 * Convierte un texto en un identificador apto para una dirección web:
 * minúsculas, sin acentos y con guiones.
 *
 *   'Lucía Ordovás Pérez'  →  'lucia-ordovas-perez'
 */
export function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Dirección pública de la ficha de un profesor.
 *
 * Sólo lleva el nombre y la inicial del primer apellido, igual que lo que se
 * ve en el directorio: no tiene sentido ocultar los apellidos en la página y
 * luego publicarlos en la dirección.
 *
 * El sufijo aleatorio evita que dos «Lucía O.» choquen, y de paso hace que la
 * dirección no se pueda adivinar probando nombres.
 */
export function slugDeProfesor(nombre: string, apellidos: string): string {
  const inicial = apellidos.trim().charAt(0) ?? '';
  const base = aSlug(`${nombre} ${inicial}`) || 'profesor';
  const sufijo = Math.random().toString(36).slice(2, 6);

  return `${base}-${sufijo}`;
}
