# PRD 09 — Alta de perfiles migrados

**Prioridad:** Imprescindible (v1)
**Relacionado:** [Informe de migración](../05-migracion/informe-migracion.md)

---

## 1. Propósito

Los profesores y familias que ya trabajaban con AcademiAvanza existen en la base de
datos desde el primer día, importados del Excel histórico. Pero **no tienen cuenta,
ni han dado su consentimiento, ni han confirmado que sus datos siguen siendo
válidos**.

Este documento cubre cómo pasan de ser una fila importada a ser un usuario activo.

---

## 2. El problema que resuelve

Una plataforma de dos caras vacía no arranca: las familias no entran si no hay
profesores, y los profesores no se registran si no hay familias.

Migrar rompe ese punto muerto por el lado de la oferta. Pero un perfil importado no
puede publicarse sin más: los datos tienen dos años, la persona puede haber
terminado la carrera o no querer seguir, y nunca aceptó aparecer en una plataforma
pública.

De ahí la regla central: **un perfil migrado permanece oculto hasta que su titular
lo reclama y lo valida.**

---

## 3. Estados

```
   importado ──────▶ invitado ──────▶ reclamado ──────▶ validado ──────▶ activo
   (en la BD,        (email          (ha creado       (ha revisado    (aprobado,
    invisible)        enviado)        su cuenta)       sus datos)      visible)
                          │
                          ├──▶ caducado    (no respondió, token vencido)
                          └──▶ rechazado   (pidió no aparecer)
```

Mientras esté en `importado` o `invitado`, el perfil **no existe** para el resto de
la plataforma: no aparece en el directorio, no recibe propuestas, no es accesible
por URL.

---

## 4. La invitación

### 4.1 Token de un solo uso

Cada perfil recibe un token con caducidad de 30 días, del que **solo se guarda el
hash** en `app.tokens_reclamacion`. El valor en claro existe únicamente en el
correo enviado, de modo que ni siquiera con acceso a la base de datos se puede
suplantar a nadie.

### 4.2 Envío escalonado

**No se envía todo de golpe.** El orden es: primero un grupo de cinco perfiles
conocidos, se comprueba que el circuito funciona y se mide la respuesta; después
tandas de veinte cada pocos días.

Enviar cien correos el primer día y descubrir después un error en el enlace
significa quemar la lista entera de una vez.

### 4.3 El mensaje

Debe sonar a Lucía, no a un sistema. Es gente que la conoce.

> **Asunto:** [Nombre], AcademiAvanza ahora es una plataforma
>
> Hola [nombre],
>
> Te escribo porque durante este tiempo has dado clases con AcademiAvanza, y he
> montado algo nuevo: una plataforma donde las familias pueden encontrarte
> directamente, sin que yo tenga que hacer de intermediaria.
>
> He preparado tu perfil con los datos que ya tenía, pero **no está publicado**:
> quiero que lo revises tú antes. Tardas cinco minutos en confirmarlo o
> corregirlo.
>
> [Revisar mi perfil]
>
> Cómo funciona ahora: las familias te encuentran, te envían una propuesta y tú
> decides si la aceptas. Si aceptas, ellas desbloquean tu teléfono y os organizáis
> directamente. **Los pagos de las clases los acordáis vosotros**, yo ya no me meto
> en eso.
>
> Si no quieres seguir, no pasa nada: [darme de baja] y borro tus datos.
>
> Lucía

Los dos elementos que no pueden faltar: **el perfil no está publicado** —lo que
elimina la sensación de que se ha usado su información sin permiso— y **la baja en
un clic**, que además de ser una obligación legal es lo que hace creíble lo
anterior.

### 4.4 Recordatorios

Dos como máximo: a los siete y a los veintiún días. Después, silencio.

---

## 5. Revisión del perfil

Al pulsar el enlace, el profesor ve sus datos ya rellenos y los revisa por bloques.

**Bloque 1 — Identidad.** Nombre, email, teléfono. Confirmar o corregir.

**Bloque 2 — Procedencia y estudios.** Colegio, titulación, universidad, curso,
notas. Aquí es donde suele haber cambios: quien estaba en segundo ahora está en
cuarto. Se marca de forma visible qué campos no se pudieron interpretar del Excel
y quedaron vacíos.

**Bloque 3 — Qué imparte.** Asignaturas y niveles, precargados pero explícitamente
señalados como pendientes de confirmar.

**Bloque 4 — Lo que hay que rellenar de nuevo.** Se presenta como sección aparte y
se explica por qué: *«Estos datos cambian con el tiempo, así que preferimos
preguntártelos de nuevo.»*

- Disponibilidad horaria
- Foto
- Biografía
- Modalidad y zona actuales

**Bloque 5 — Consentimiento y contraseña.** Aceptación de la política de privacidad
y creación del acceso.

Al terminar, el perfil pasa a `pendiente` y entra en la cola de aprobación normal
descrita en [PRD 02](prd-02-perfiles-profesor.md).

---

## 6. Familias migradas

El circuito es equivalente pero más ligero: la familia solo revisa sus datos de
contacto, los de su hijo y sus preferencias. No hay perfil público que publicar,
así que no hay aprobación.

**Cautela adicional por tratarse de datos de menores.** El correo debe indicar
explícitamente qué datos del hijo se conservan —nombre de pila, curso y colegio,
nada más— y ofrecer la baja con la misma facilidad.

---

## 7. Baja directa

El enlace de baja del correo funciona **sin necesidad de iniciar sesión**. Un solo
clic, una pantalla de confirmación, y el perfil se elimina.

Exigir registrarse para poder borrarse sería absurdo, y legalmente indefendible.

---

## 8. Perfiles no reclamados

Pasados **doce meses** desde la invitación sin respuesta, el perfil se elimina.
Conservar datos personales sin consentimiento ni finalidad activa no tiene
justificación.

Se avisa por correo un mes antes.

---

## 9. Seguimiento

Desde el panel, apoyado en `app.gestion_pendientes_validacion`:

| Métrica | Objetivo |
|---|---|
| Invitaciones enviadas | — |
| Perfiles reclamados | > 40 % a los 6 meses |
| Bajas solicitadas | Informativo |
| Tokens caducados | Se pueden regenerar |
| Tiempo medio hasta reclamación | — |

Una tasa de reclamación muy baja no es solo un problema de conversión: indica que
el mensaje no está funcionando y conviene reescribirlo antes de seguir enviando.

---

## 10. Criterios de aceptación

- [ ] Un perfil migrado no aparece en el directorio ni es accesible por URL
- [ ] El token es de un solo uso, caduca a los 30 días y se guarda hasheado
- [ ] El envío es escalonado y controlable desde el panel
- [ ] El correo deja claro que el perfil no está publicado
- [ ] La baja funciona sin iniciar sesión, en un clic
- [ ] Los campos caducos se piden de nuevo, no se dan por válidos
- [ ] Se señalan los campos que no se pudieron interpretar del Excel
- [ ] Sin consentimiento explícito no se puede completar la validación
- [ ] Los perfiles no reclamados se eliminan a los 12 meses, con aviso previo
- [ ] Se pueden regenerar tokens caducados desde el panel
