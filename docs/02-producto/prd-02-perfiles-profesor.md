# PRD 02 — Perfiles de profesor

**Prioridad:** Imprescindible (v1)

---

## 1. Propósito

El perfil del profesor es lo que la familia lee antes de decidir si envía una
propuesta. Es, por tanto, la pieza que convierte una visita en un ingreso.

Este documento cubre el registro, el perfil público, el proceso de aprobación y el
panel del profesor.

---

## 2. Registro

### 2.1 Campos

**Identidad**

| Campo | Obligatorio | Notas |
|---|---|---|
| Nombre y apellidos | Sí | El apellido completo nunca se publica |
| Email | Sí | Clave de acceso y de reconciliación en la migración |
| Teléfono | Sí | Solo se revela tras un match pagado |
| Foto | Sí para publicar | Un perfil sin foto no genera confianza |

**Procedencia académica**

| Campo | Obligatorio | Notas |
|---|---|---|
| Colegio de procedencia | Sí | Del catálogo, con opción «otro» en texto libre |
| Titulación | Sí | Ej. Medicina |
| Universidad | Sí | Ej. Universidad Autónoma de Madrid |
| Curso actual | Sí si no ha terminado | |
| Titulación finalizada | Sí | Interruptor |
| Nota de EVAU | No, muy recomendable | Numérico, 0 a 14 |
| Nota de bachillerato | No | Numérico, 0 a 10 |
| Notas visibles al público | Sí | Por defecto, sí |
| Otros estudios | No | Texto libre |

Se separa la titulación en tres campos porque el formulario antiguo los mezclaba
en una sola cadena («Segundo de Medicina en la UAM») y eso impedía filtrar,
ordenar y presentar la información con formato consistente.

**Oferta**

| Campo | Obligatorio | Notas |
|---|---|---|
| Asignaturas y niveles | Sí | Se declara el par, no dos listas sueltas |
| Modalidad | Sí | Online, presencial o ambas |
| Zona | Sí si es presencial | Del catálogo de zonas |
| Tarifa orientativa | No | Solo informativa; el pago es directo |
| Acepta nuevos alumnos | Sí | Por defecto, sí |

**Credenciales adicionales**

| Campo | Obligatorio | Notas |
|---|---|---|
| Certificaciones de idiomas | No | Del catálogo, con justificante opcional |
| Logros académicos | No | Texto libre |
| Biografía | Sí para publicar | Mínimo 100 caracteres |

**Disponibilidad.** Se pide en el registro pero es orientativa: sirve para que la
familia se haga una idea, no para reservar. **No se migra del Excel** por estar
caducada.

### 2.2 Selección de asignaturas y niveles

Es la parte del formulario con más fricción, así que necesita cuidado. La
interacción propuesta: se elige una asignatura y a continuación se marcan los
niveles en los que se imparte, con atajos por etapa («toda la ESO», «todo
Bachillerato»). Cada combinación añadida aparece como una etiqueta eliminable.

---

## 3. Aprobación

Ningún perfil se publica solo. El circuito es:

```
registro ──▶ perfil completo ──▶ pendiente ──▶ administración revisa
                                                      │
                                        ┌─────────────┴─────────────┐
                                     aprueba                     rechaza
                                        │                           │
                                  activo, visible            aviso con motivo
```

**Qué comprueba administración:**

- Que la procedencia declarada es verosímil (marca `colegio_verificado`)
- Que la titulación es coherente con las asignaturas ofrecidas
- Que la foto y la biografía son apropiadas
- Que no hay datos de contacto colados en campos de texto libre

**Compromiso de plazo:** 48 horas laborables. Si se supera, administración recibe
un aviso.

El badge del colegio **solo aparece si administración lo ha verificado**. Un
perfil puede estar activo con el colegio sin verificar, en cuyo caso el colegio se
muestra sin badge y sin logo.

---

## 4. Perfil público

### 4.1 Contenido

**Cabecera** — foto, nombre e inicial, badge del colegio con logo, titulación y
universidad, valoración media, número de matches completados, y aviso si no acepta
nuevos alumnos.

**Acción principal** — botón de enviar propuesta, con el texto explicativo de que
es gratuito y de que solo se paga si el profesor acepta. Este mensaje es
importante: elimina la principal objeción antes de que surja.

**Sobre mí** — biografía, expediente si es público, certificaciones de idiomas con
indicador de verificación, y logros académicos.

**Qué imparte** — tabla de asignaturas por nivel, agrupada por etapa.

**Disponibilidad orientativa** — rejilla semanal, con la advertencia de que se
confirma directamente con el profesor.

**Reseñas** — listado con valoración desglosada, y respuesta del profesor si la
hubiera.

### 4.2 Lo que nunca se muestra

Apellido completo, email, teléfono, dirección exacta, y notas si el profesor las
ha marcado como privadas.

El teléfono solo se revela en el panel de la familia, tras un match pagado.

### 4.3 URL y posicionamiento

`/profesores/nombre-apellido-xxxx`, con `slug` estable e inmutable. Metadatos
Open Graph propios, datos estructurados de tipo `Person`, e indexable.

---

## 5. Panel del profesor

**Resumen** — propuestas pendientes de responder con su cuenta atrás, matches
activos, valoración media y tasa de respuesta.

**Propuestas** — el corazón del panel. Ver [PRD 04](prd-04-flujo-match.md).

**Mi perfil** — edición, con vista previa de cómo lo ve una familia. Los cambios
en campos sensibles (colegio, titulación) vuelven a pasar por revisión; el resto
se publican directamente.

**Mis reseñas** — con posibilidad de responder una vez a cada una.

**Estadísticas** — propuestas recibidas, aceptadas, rechazadas, tiempo medio de
respuesta y evolución de la valoración.

---

## 6. Estados del perfil

| Estado | Visible | Significado |
|---|---|---|
| `importado` | No | Migrado del Excel, sin reclamar. Ver [PRD 09](prd-09-onboarding-migrados.md) |
| `registrado` | No | Cuenta creada, perfil incompleto |
| `pendiente` | No | Completo, esperando aprobación |
| `activo` | Sí | Aprobado y publicado |
| `pausado` | No | Desactivado temporalmente por el profesor |
| `inactivo` | No | Baja |
| `rechazado` | No | No aprobado |

**Pausar el perfil** es una funcionalidad necesaria: los profesores son estudiantes
y en época de exámenes no pueden atender. Pausar retira el perfil del directorio
sin perder nada, y las propuestas ya aceptadas siguen su curso.

---

## 7. Reglas de negocio

- Un profesor tiene un máximo configurable de propuestas vivas, por defecto cinco
- Al alcanzarlo, deja de aparecer como disponible hasta que resuelva alguna
- No se puede pasar a `activo` sin titulación, universidad, biografía de al menos
  100 caracteres y colegio asignado (se garantiza en la base de datos)
- Tres rechazos consecutivos sin motivo generan un aviso a administración
- Bajar de 3,0 estrellas con más de tres reseñas genera un aviso a administración

---

## 8. Criterios de aceptación

- [ ] El registro se completa en menos de diez minutos
- [ ] No se puede publicar un perfil sin los campos mínimos
- [ ] El badge solo aparece con el colegio verificado por administración
- [ ] El perfil público no expone apellido completo, email ni teléfono
- [ ] La selección de asignatura y nivel guarda el par, no dos listas
- [ ] Pausar el perfil lo retira del directorio sin afectar a propuestas vivas
- [ ] Editar el colegio o la titulación devuelve el perfil a revisión
- [ ] La ficha es indexable y tiene metadatos sociales propios
