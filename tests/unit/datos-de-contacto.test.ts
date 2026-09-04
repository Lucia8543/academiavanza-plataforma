import { describe, expect, it } from 'vitest';
import {
  detectarDatosDeContacto,
  mensajeDeAvisoContacto,
} from '@/shared/schemas/datos-de-contacto';

/**
 * El filtro que impide que alguien se pase el teléfono por el texto libre.
 *
 * Esta prueba está escrita del revés que casi todas: **la lista larga es la de
 * lo que NO debe saltar.** No es una manía de estilo, es dónde está el daño.
 *
 * Que se cuele un teléfono cuesta diez euros de una vez. Que salte con «va a
 * 3.º de la ESO» cuesta una familia, porque a esa madre el formulario le está
 * diciendo que no puede enviar un mensaje perfectamente normal, sin que ella
 * entienda qué ha hecho mal, y lo que hace es cerrar la pestaña. Nadie se
 * entera nunca de esa pérdida: no deja ni un error en el registro.
 *
 * Por eso, si un día hay que aflojar el filtro para que deje pasar algo de la
 * segunda lista, se afloja.
 */

describe('⭐ reconoce un teléfono, un correo o un usuario', () => {
  const conTelefono = [
    'Llámame al 600 123 456',
    'mi tel es 600111222',
    'Mejor por WhatsApp: 611-22-33-44',
    'mi numero 600.123.456 gracias',
    'Tel (+34) 600 123 456',
    '+34 600123456',
    // El paréntesis pegado detrás fue el que se colaba cuando contaba como
    // separador: diez cifras no son nueve y el número pasaba entero.
    'llamame al 600 123 456 (2 timbres)',
    'fijo 912345678',
    'telefono:600123456',
    '0034600123456',
  ];

  it.each(conTelefono)('«%s» tiene teléfono', (texto) => {
    expect(detectarDatosDeContacto(texto)?.tipo).toBe('telefono');
  });

  it('reconoce un correo', () => {
    const d = detectarDatosDeContacto('escríbeme a maria.lopez@gmail.com');
    expect(d?.tipo).toBe('correo');
    expect(d?.fragmento).toBe('maria.lopez@gmail.com');
  });

  it('reconoce un usuario de red social', () => {
    expect(
      detectarDatosDeContacto('mi insta es @maria_lopez88')?.tipo,
    ).toBe('usuario');
  });
});

describe('⭐ y sobre todo, no salta con lo normal', () => {
  const limpios = [
    'Va a 3.º de la ESO y le cuesta mates',
    'Nos vendría bien los martes y jueves a las 17:30',
    'Podemos pagar 15 euros la hora',
    'El curso 2025 2026, empezamos el 12/09/2026',
    'Tiene 12 años y saca un 6 en mates, un 7 en lengua',
    'Buscamos 2 días, 1 hora y media cada uno',
    'De 5 a 7 y de 8 a 9 nos viene bien',
    'Sacó 4,5 y necesita subir a 5',
    'Vivimos en la zona de Chamberí, cerca de Ríos Rosas',
    'Son 2 hermanos, uno de 5.º de Primaria y otra de 3.º ESO',
    'Empieza el 1 de octubre de 2026',
    'Necesitamos 3 horas a la semana, unas 12 al mes',
    'Mi hija nació en 2011 y su hermano en 2014',
    'Nada especial, gracias',
    '',
    '   ',
  ];

  it.each(limpios)('«%s» pasa limpio', (texto) => {
    expect(detectarDatosDeContacto(texto)).toBeNull();
  });
});

describe('el aviso', () => {
  it('no acusa a nadie de nada', () => {
    const d = detectarDatosDeContacto('mi tel es 600111222');
    const aviso = mensajeDeAvisoContacto(d!);

    // Dice qué quitar y por qué le conviene a ella, y no menciona el pago.
    expect(aviso).toContain('teléfono');
    expect(aviso.toLowerCase()).not.toContain('pagar');
    expect(aviso.toLowerCase()).not.toContain('saltar');
  });
});
