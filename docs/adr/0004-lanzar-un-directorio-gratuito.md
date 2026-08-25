# ADR 0004 — La primera versión es un directorio gratuito, sin cobro

**Fecha:** Agosto 2026
**Estado:** Aceptada
**Relación con otros ADR:** no anula el [ADR 0001](0001-cobrar-solo-el-match.md), lo aplaza

---

## Contexto

El [ADR 0001](0001-cobrar-solo-el-match.md) decidió el modelo de ingresos: la
propuesta es gratis y la familia paga una tarifa única cuando el profesor acepta.
Ese sigue siendo el destino del producto y nada de lo que aquí se decide lo
contradice.

Lo que ha cambiado son las circunstancias en las que hay que construirlo:

**Lucía se va de Erasmus en menos de un mes.** El servicio manual —el Excel, los
bonos, los Bizums de los domingos— deja de ser posible en esa fecha, haya
plataforma o no.

**Hay entre dos y tres semanas de trabajo disponibles**, con dedicación completa,
y ninguna experiencia previa de desarrollo. El código lo escribe Claude; Lucía
decide, prueba y publica.

**No hay presupuesto.** Todo tiene que caber en los planes gratuitos de los
servicios que se usen.

**Lucía no está dada de alta como autónoma.** Activar un cobro antes de
regularizar esa situación abre un problema fiscal y de consumo por unos pocos
euros de ingreso.

El plan de desarrollo original tiene cinco etapas. La etapa 2, el flujo de match
con cobro, es la más delicada del proyecto y la que arrastra a Stripe, a la
facturación, a las devoluciones y a la aprobación de plantillas de WhatsApp por
parte de Meta, que tarda semanas y no depende de nosotros.

No cabe. Y forzarlo produciría el peor resultado posible: una plataforma a medias
que cobra mal y que obliga a Lucía a intervenir desde el extranjero, que es
exactamente lo que el proyecto entero existe para evitar.

---

## Decisión

**La primera versión es un directorio público y gratuito de profesores, con
contacto por formulario. No hay cobro, no hay cuentas de familia y no hay
WhatsApp.**

Concretamente:

- El profesor se registra, completa su ficha y entra con un enlace que le llega al
  correo. Sin contraseñas.
- Administración aprueba cada ficha antes de que se publique.
- Cualquiera puede ver el directorio y filtrar sin registrarse.
- La familia rellena un formulario de contacto y al profesor le llega un correo
  con lo que ha escrito. La plataforma no publica el dato de contacto de nadie.
- Cada tres meses se pregunta al profesor si sigue disponible. Si no responde en
  dos semanas, su ficha se oculta sola.

**El precio y su infraestructura quedan preparados pero apagados.** La tabla de
tarifas del esquema se mantiene; simplemente no hay ninguna vigente. Encender el
cobro más adelante es añadir una etapa, no rehacer el producto.

---

## Alternativas consideradas

**Construir la versión 1 completa, con cobro.** Es el plan original. Se descarta
por tiempo: la etapa 2 sola consume el presupuesto de semanas disponible, y las
plantillas de WhatsApp bloquean sin que podamos hacer nada al respecto.

**Pausar el servicio hasta enero y construir con calma desde el extranjero.** Más
seguro técnicamente, pero se pierde la red de familias y profesores que ya existe,
que es el único activo real del negocio. El histórico dice que la actividad se
concentra entre febrero y mayo; llegar en enero con el directorio vacío es peor
que llegar en septiembre con un directorio pequeño y vivo.

**Delegar la gestión manual en otra persona durante el cuatrimestre.** Mantiene
los ingresos, pero traslada a alguien la carga que el rediseño quiere eliminar, y
deja el dinero pasando por las manos de una persona.

**Publicar una página estática con las fichas, sin registro ni panel.** Cabía en
mucho menos tiempo, pero cada profesor nuevo y cada corrección obligarían a Lucía
a intervenir. Incumple el principio fundacional del proyecto.

---

## Consecuencias

### Lo que desaparece de la primera versión

| Qué | Por qué |
|---|---|
| Stripe y todo el cobro | Decisión de este ADR |
| Cuentas y portal de familia | Sin cobro no hace falta identificar a la familia |
| Alta de alumnos menores | No se guarda ningún dato de menores. Desaparece la parte más delicada del proyecto |
| WhatsApp y el trámite con Meta | Sin propuestas que notificar con urgencia, el correo basta |
| Reseñas | Necesitan un match verificado, que no existe sin cobro |
| Migración del histórico | Los profesores se registran de cero, con su consentimiento recogido en el propio formulario |

La **disponibilidad horaria sí se recoge**, en contra de lo que decidió el informe
de migración. Aquella decisión era sobre el Excel viejo, cuyos horarios tenían dos
años; aquí el profesor la declara al registrarse y se le pregunta cada tres meses
si ha cambiado. Un horario que se refresca es útil; uno que no, engaña.

### Lo que gana

**No se trata ningún dato de menores.** Es la consecuencia más importante y no era
el objetivo. Al no haber cuentas de familia ni alta de alumnos, el dato más
delicado del proyecto deja de existir.

**El consentimiento se recoge limpio.** Como los profesores se registran de nuevo,
la autorización para publicar su ficha se pide en el propio formulario de alta, en
vez de tener que justificar el uso de unos datos recogidos hace dos años para otra
cosa.

**El coste fijo es cero** más allá del dominio.

### Lo que cuesta

**No hay ingresos** mientras dure esta versión. Se asume: el objetivo declarado es
que el servicio siga vivo, no que gane dinero.

**El directorio no tiene defensa contra quien lo use sin aportar nada.** Sin cobro,
nada impide que alguien copie los perfiles. Con cuarenta y tantos profesores y un
colegio de referencia, el riesgo real es bajo.

**Hay una intervención que se mantiene a propósito:** aprobar cada ficha nueva. Son
dos minutos por profesor y se puede hacer desde el móvil. Es la única barrera que
impide que cualquiera se publique en el directorio diciendo que estudió en el
Montpellier, y por eso se conserva.

---

## Cuándo se revisa

Cuando se cumplan las dos condiciones: que Lucía esté dada de alta como autónoma y
que el directorio tenga profesores activos suficientes para que el cobro tenga
sentido. La ventana natural es enero, que según el histórico es el segundo momento
de mayor entrada de familias del curso.
