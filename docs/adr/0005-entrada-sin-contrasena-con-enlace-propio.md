# ADR 0005 — El profesor entra con un enlace propio, sin contraseñas y sin Supabase Auth

**Fecha:** Agosto 2026
**Estado:** Aceptada
**Ámbito:** versión 1 ([ADR 0004](0004-lanzar-un-directorio-gratuito.md))

---

## Contexto

En la versión 1 sólo los profesores tienen algo parecido a una cuenta: entran
para editar su ficha, cambiar su interruptor de disponibilidad o darse de baja.
Las familias no se registran.

Hay que decidir cómo entran. Y hay una restricción que pesa más que las demás:
**Lucía se va, y el soporte que genere este flujo lo va a atender ella desde el
extranjero o no lo va a atender nadie.** El motivo número uno de soporte en
cualquier sitio con cuentas es «he perdido la contraseña».

El esquema completo de `database/schema/` da por hecho Supabase Auth: la tabla
`app.perfiles` tiene como clave primaria la de `auth.users`. Eso obliga a que
cada profesor sea un usuario de Supabase.

---

## Decisión

**Sin contraseñas y sin Supabase Auth.** El profesor escribe su correo, recibe un
enlace de un solo uso y entra. La aplicación genera y valida ese enlace por su
cuenta, con la tabla `app.accesos`.

En consecuencia, **`app.profesores` no depende de `auth.users`**: es una tabla que
se sostiene sola, con el correo como identificador único.

De la tabla `app.accesos` sólo se guarda el **hash** del código, nunca el código.
Quien pudiera leer esa tabla no podría entrar en ninguna ficha.

---

## Por qué no Supabase Auth

No es que esté mal: hace exactamente esto y lo hace bien. Se descarta por tres
razones concretas de este proyecto.

**Ya tenemos que enviar correos.** Resend hace falta igualmente para el aviso de
contacto, el de aprobación y el repaso trimestral. Usar Supabase Auth añadiría un
segundo sistema de envío, con su propia plantilla y su propio dominio que
configurar, para un cuarto correo.

**Evita arrastrar un modelo de usuarios que no necesitamos.** `auth.users` +
`app.perfiles` + `app.profesores` son tres tablas para representar a una persona
que, en esta versión, sólo tiene una ficha. La complejidad se justifica cuando
haya familias, pagos y roles; hoy no los hay.

**Menos piezas que entender.** El código lo escribe Claude, pero quien va a
convivir con esto durante meses es Lucía. Un enlace con caducidad guardado en una
tabla que se puede mirar desde el cliente SQL es explicable en dos frases.

---

## Consecuencias

**El día que se active el cobro habrá que revisarlo.** Con familias que pagan,
identificar a quien paga sí importa, y ahí Supabase Auth vuelve a ser la opción
razonable. La migración es abordable: se crea el usuario en `auth.users` y se
enlaza con la ficha existente por el correo, que ya es único.

**La seguridad recae en cómo se generan los enlaces.** Tienen que cumplir tres
cosas, y son obligaciones nuestras, no de un proveedor: código aleatorio de
suficiente longitud, caducidad corta —una hora— y un solo uso.

**Quien controle el correo del profesor controla su ficha.** Es igual que en
cualquier sistema con «he olvidado mi contraseña», pero conviene tenerlo escrito:
el correo es la llave. Como lo único que hay detrás es una ficha pública y
editable, y no hay dinero ni datos de menores, el daño posible es limitado.

**Hay que limpiar los enlaces caducados.** La tabla `app.accesos` crece con cada
petición. Se purga en la misma tarea programada que borra los contactos de más de
90 días.
