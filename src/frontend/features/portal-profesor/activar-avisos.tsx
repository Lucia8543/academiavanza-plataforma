'use client';

import { useState, useSyncExternalStore } from 'react';
import { activarAvisos } from '@/app/avisos/acciones';

/**
 * El botón con el que un profesor acepta recibir avisos en el móvil.
 *
 * Todo lo importante pasa en el navegador y por eso vive aquí:
 *
 *   1. Se registra el trabajador de servicio, que es lo que seguirá vivo
 *      cuando el profesor cierre la web.
 *   2. Se pide permiso. Esto abre el diálogo del navegador y sólo se puede
 *      hacer como respuesta a un clic: si se pidiera al cargar la página, los
 *      navegadores lo bloquean, y con razón.
 *   3. Se manda al servidor la dirección de entrega que devuelve el navegador.
 *
 * El permiso sólo se puede pedir una vez. Si el profesor dice que no, el
 * navegador no vuelve a preguntar y hay que ir a los ajustes del sitio a
 * cambiarlo. Por eso antes del botón se explica para qué es: una pregunta sin
 * contexto se contesta que no.
 */

/** Lo que puede hacer este navegador. Se lee del navegador, no del estado. */
type Soporte =
  | 'comprobando'
  | 'no-soportado'
  | 'ios-sin-instalar'
  | 'denegado'
  | 'listo';

/** Lo que ha hecho el profesor. Esto sí es estado. */
type Accion = 'inicio' | 'pidiendo' | 'activado' | 'denegado' | 'error';

/** ¿Es un iPhone o un iPad que no se ha añadido a la pantalla de inicio? */
function iosSinInstalar(): boolean {
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!esIOS) return false;

  const instalada =
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS usa su propia propiedad, que no está en el estándar.
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  return !instalada;
}

/**
 * Qué admite este navegador.
 *
 * Es una lectura del navegador y no un estado nuestro, así que se lee con
 * `useSyncExternalStore`, que es la forma que da React de mirar algo de fuera
 * sin que el servidor y el navegador pinten cosas distintas. El servidor
 * devuelve siempre «comprobando» —allí no hay ni `navigator` ni permisos— y el
 * navegador devuelve lo que hay de verdad.
 */
function noCambia() {
  return () => {};
}

function leerSoporte(): Soporte {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return iosSinInstalar() ? 'ios-sin-instalar' : 'no-soportado';
  }
  if (iosSinInstalar()) return 'ios-sin-instalar';
  if (Notification.permission === 'denied') return 'denegado';
  return 'listo';
}

function enElServidor(): Soporte {
  return 'comprobando';
}

export function ActivarAvisos({ token }: { token: string }) {
  const soporte = useSyncExternalStore(noCambia, leerSoporte, enElServidor);
  const [accion, setAccion] = useState<Accion>('inicio');
  const [mensaje, setMensaje] = useState<string>();

  // Lo que ha hecho el profesor manda sobre lo que puede hacer el navegador:
  // si acaba de activarlos, se enseña eso y no la comprobación inicial.
  const estado: Soporte | Accion = accion === 'inicio' ? soporte : accion;

  async function activar() {
    setAccion('pidiendo');

    try {
      const registro = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setAccion('denegado');
        return;
      }

      const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!clave) {
        setAccion('error');
        setMensaje(
          'Los avisos al móvil no están disponibles ahora mismo por un problema nuestro.',
        );
        return;
      }

      const suscripcion = await registro.pushManager.subscribe({
        // Sin esto el navegador permitiría avisos silenciosos, y ninguno de los
        // grandes lo acepta ya.
        userVisibleOnly: true,
        applicationServerKey: claveABytes(clave),
      });

      const enviada = suscripcion.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const resultado = await activarAvisos(token, {
        endpoint: enviada.endpoint,
        keys: enviada.keys,
      });

      if (!resultado.ok) {
        setAccion('error');
        setMensaje(resultado.mensaje);
        return;
      }

      setAccion('activado');
    } catch (error) {
      console.error('[avisos]', error);
      setAccion('error');
      setMensaje(
        'Tu navegador no ha dejado activarlos. Puede ser un bloqueo suyo o un fallo pasajero.',
      );
    }
  }

  if (estado === 'comprobando') return null;

  return (
    <div className="rounded-xl border border-gris-borde bg-white p-5">
      <h3 className="font-bold text-azul-confianza">
        ¿Quieres que te avisemos al móvil?
      </h3>

      {estado === 'activado' ? (
        <p className="mt-2 text-sm text-verde-avanza-oscuro">
          Listo. Cuando una familia te escriba te saltará un aviso y podrás
          contestar desde ahí. Te lo mandaremos también por correo. Puedes
          quitar los avisos cuando quieras en los ajustes de tu navegador.
        </p>
      ) : estado === 'ios-sin-instalar' ? (
        <div className="mt-2 space-y-2 text-sm text-carbon">
          <p>
            En iPhone y iPad, Apple sólo deja avisar si añades la web a la
            pantalla de inicio. Son diez segundos:
          </p>
          <ol className="ml-4 list-decimal space-y-1 text-gris-medio">
            <li>Toca el botón de compartir, el cuadrado con la flecha.</li>
            <li>Baja y elige «Añadir a pantalla de inicio».</li>
            <li>Abre AcademiAvanza desde el icono nuevo y vuelve aquí.</li>
          </ol>
          <p className="text-gris-medio">
            Si prefieres no hacerlo, no pasa nada: te avisaremos por correo
            igualmente, y por WhatsApp si el correo tampoco llega.
          </p>
        </div>
      ) : estado === 'denegado' ? (
        /* El navegador sólo pregunta una vez, así que quien le dio a
           «Bloquear» no puede arreglarlo volviendo a pulsar el botón: tiene
           que ir a los ajustes del sitio. Decirle «cámbialo en los ajustes» y
           dejarle ahí es no decirle nada, porque cada navegador lo esconde en
           un sitio distinto. Van los pasos, con lo que va a ver escrito. */
        <div className="mt-2 space-y-3 text-sm text-carbon">
          <p>
            Le diste a «Bloquear», y tu navegador no te lo va a volver a
            preguntar. Se arregla en veinte segundos:
          </p>

          <ol className="ml-4 list-decimal space-y-2">
            <li>
              Toca el <strong>icono a la izquierda de la dirección</strong>,
              arriba del todo. Suele ser un candado, unos deslizadores o una
              «i» dentro de un círculo.
            </li>
            <li>
              Se abre un menú. Busca <strong>«Notificaciones»</strong> —puede
              estar dentro de «Configuración del sitio» o «Permisos»—.
            </li>
            <li>
              Cámbialo de <strong>«Bloquear»</strong> a{' '}
              <strong>«Permitir»</strong>.
            </li>
            <li>Recarga esta página y vuelve a darle al botón.</li>
          </ol>

          <p className="text-gris-medio">
            En el móvil es igual, tocando ese mismo icono junto a la dirección.
          </p>

          <p className="rounded-lg bg-gris-claro px-3 py-2">
            <span className="font-medium">Y si prefieres no tocar nada,</span>{' '}
            tampoco pasa nada: te avisaremos por correo igualmente, y por
            WhatsApp si el correo tampoco llega. Estate pendiente del correo.
          </p>
        </div>
      ) : estado === 'no-soportado' ? (
        <p className="mt-2 text-sm text-carbon">
          Este navegador no admite avisos. Te avisaremos por correo.
        </p>
      ) : (
        <>
          {/* Aquí no se vuelve a explicar para qué sirven los avisos: eso ya
              está tres párrafos más arriba, en el recuadro de «cómo te
              avisaremos». Lo único que hace falta decir aquí es qué va a pasar
              al pulsar, porque el navegador sólo pregunta una vez y quien le dé
              a «Bloquear» sin mirar tendrá que ir a los ajustes a arreglarlo. */}
          <p className="mt-2 text-sm text-carbon">
            Al pulsar, tu navegador te preguntará arriba del todo.{' '}
            <span className="font-semibold">Dale a «Permitir».</span> Si le das
            a «Bloquear» no volverá a preguntártelo.
          </p>

          {/* Si falla, lo importante no es el error: es que sepa que no se va a
              quedar sin enterarse. Un profesor que lee «no hemos podido» y
              nada más se queda pensando que ha perdido las solicitudes. */}
          {mensaje && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p>{mensaje}</p>
              <p className="mt-1 font-medium">
                No te vas a perder nada: te avisaremos por correo igualmente, y
                por WhatsApp si el correo tampoco llega. Estate pendiente del
                correo.
              </p>
              <p className="mt-1">
                Si quieres, puedes volver a intentarlo con el botón de abajo.
              </p>
            </div>
          )}

          <button
            onClick={activar}
            disabled={estado === 'pidiendo'}
            className="mt-4 rounded-lg bg-verde-avanza px-5 py-2.5 font-semibold text-white transition hover:bg-verde-avanza-oscuro disabled:opacity-60"
          >
            {estado === 'pidiendo'
              ? 'Esperando a que permitas…'
              : mensaje
                ? 'Volver a intentarlo'
                : 'Avisarme al móvil'}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * La clave pública viaja como texto en base64 con guiones, y el navegador la
 * quiere como bytes. Es una conversión mecánica y fea, pero es la que exige la
 * norma.
 */
function claveABytes(clave: string) {
  const relleno = '='.repeat((4 - (clave.length % 4)) % 4);
  const base64 = (clave + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = atob(base64);

  // El búfer se reserva aparte y no se deja al constructor. TypeScript
  // distingue ahora entre un array respaldado por un `ArrayBuffer` normal y uno
  // que podría estar compartido entre hilos, y `pushManager.subscribe` sólo
  // acepta el primero.
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}
