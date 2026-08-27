/**
 * Trabajador de servicio.
 *
 * Es un trozo de código que el navegador del profesor guarda y ejecuta por su
 * cuenta, incluso con la web cerrada. Sólo hace dos cosas, y hace falta que
 * haga las dos para que un aviso sirva de algo:
 *
 *   1. Enseñar la notificación cuando llega.
 *   2. Abrir la pantalla correcta cuando el profesor la toca.
 *
 * Vive en `public/` y no en `src/` porque tiene que servirse desde la raíz del
 * dominio: un trabajador sólo puede controlar las direcciones que cuelgan de
 * donde está, y desde `/sw.js` controla toda la web.
 */

self.addEventListener('push', (evento) => {
  let aviso = {};

  try {
    aviso = evento.data ? evento.data.json() : {};
  } catch {
    // Si el contenido no se entiende se enseña algo genérico en vez de nada.
    // Una notificación sin texto es mejor que un profesor que no se entera.
    aviso = {};
  }

  const titulo = aviso.titulo || 'AcademiAvanza';

  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: aviso.cuerpo || 'Tienes una solicitud nueva.',
      icon: '/icono-192.png',
      badge: '/icono-192.png',
      // Con la misma etiqueta, un aviso nuevo sustituye al anterior en vez de
      // apilarse. Diez notificaciones iguales no informan más que una.
      tag: aviso.etiqueta || 'academiavanza',
      requireInteraction: true,
      data: { url: aviso.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.url || '/';

  // Si ya hay una pestaña de la web abierta, se reutiliza y se lleva al sitio.
  // Abrir una duodécima pestaña de lo mismo es una forma de molestar.
  evento.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((pestanas) => {
        for (const pestana of pestanas) {
          if (pestana.url.includes(destino) && 'focus' in pestana) {
            return pestana.focus();
          }
        }
        return self.clients.openWindow(destino);
      }),
  );
});
