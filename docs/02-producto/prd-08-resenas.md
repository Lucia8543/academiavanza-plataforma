# PRD 08 — Reseñas

**Prioridad:** Imprescindible (v1)

---

## 1. Propósito

Las reseñas son, junto al badge del colegio, lo que sostiene la confianza del
directorio. Y son lo que permite a un profesor nuevo construir reputación sin que
Lucía tenga que responder por él.

---

## 2. La diferencia con Superprof

En un marketplace abierto cualquiera puede escribir una reseña, lo que las
convierte en ruido: nadie sabe si detrás hay un alumno real o un amigo del
profesor.

En AcademiAvanza **solo puede reseñar quien ha completado y pagado un match con
ese profesor**. No es una promesa: es una restricción comprobada en la base de
datos mediante disparador. Un intento de insertar una reseña sobre una propuesta
no pagada lanza excepción.

Es una diferencia que merece comunicarse en la interfaz: «Reseñas verificadas.
Solo escriben familias que han contactado con este profesor a través de
AcademiAvanza.»

---

## 3. Cuándo se pide

A los **siete días** del match. Es el plazo en que razonablemente ya ha habido una
primera clase, sin ser tan tarde como para que se olvide.

Se pide una vez y se recuerda una sola vez más, a los quince días. Insistir más
resulta molesto y no mejora la tasa de respuesta.

---

## 4. Formulario

| Campo | Obligatorio | Formato |
|---|---|---|
| Valoración global | Sí | 1 a 5 estrellas |
| Trato con el alumno | No | 1 a 5 |
| Metodología | No | 1 a 5 |
| Puntualidad | No | 1 a 5 |
| Título | No | Texto corto |
| Comentario | Sí | Mínimo 40 caracteres |
| ¿Lo recomendarías? | No | Sí / No |

**El mínimo de 40 caracteres** existe para evitar reseñas vacías tipo «bien», que
no ayudan a decidir a nadie.

**Nombre visible:** nombre de pila del adulto e inicial del apellido. Nunca el
nombre del menor, ni el apellido completo.

---

## 5. Moderación

Por defecto, moderación previa, controlada por el parámetro
`resenas_moderacion_previa`.

Administración revisa que no haya datos de contacto, insultos, contenido ajeno a
las clases o datos identificativos del menor. Puede publicar, ocultar con motivo o
pedir modificación.

**Una reseña negativa legítima no se oculta.** Ocultar críticas fundadas destruye
el valor del sistema entero. El criterio de moderación es la forma, no el fondo.

Superado un volumen que haga inviable la moderación manual, el parámetro permite
pasar a publicación directa con moderación posterior.

---

## 6. Réplica del profesor

Cada profesor puede responder **una vez** a cada reseña. La respuesta se publica
bajo la reseña, con moderación equivalente.

Es especialmente importante ante una reseña negativa: una respuesta serena y
correcta suele decir más del profesor que la propia crítica.

---

## 7. Efecto en el perfil

La valoración media y el número de reseñas se recalculan por disparador al
publicar u ocultar una reseña. Solo cuentan las publicadas.

**Avisos automáticos a administración:**

| Situación | Acción |
|---|---|
| Media por debajo de 3,5 con más de 3 reseñas | Aviso |
| Media por debajo de 3,0 con más de 3 reseñas | Aviso destacado, posible suspensión |
| Reseña de 1 estrella | Aviso inmediato |

**Distintivo de excelencia** para quien supera 4,7 con al menos diez reseñas.

---

## 8. Visibilidad

En el perfil público, todas las publicadas con orden configurable. En la tarjeta
del directorio, media y recuento. En la portada, una selección destacada elegida
por administración.

Un profesor sin reseñas muestra «Aún sin reseñas» en lugar de cero estrellas, que
se lee como valoración mala en vez de como ausencia de valoración.

---

## 9. Reglas de negocio

- Una reseña por match. Índice único sobre `propuesta_id`.
- Solo sobre propuestas en estado `pagada`. Comprobado por disparador.
- La familia puede editar durante 48 horas; después vuelve a moderación.
- Eliminar la cuenta convierte las reseñas en anónimas pero no las borra.

---

## 10. Criterios de aceptación

- [ ] No se puede reseñar sin match pagado, ni siquiera manipulando la API
- [ ] No se puede reseñar dos veces el mismo match
- [ ] La petición sale a los 7 días y se recuerda una sola vez
- [ ] El comentario exige al menos 40 caracteres
- [ ] Nunca se muestra el nombre del menor ni el apellido completo del adulto
- [ ] La media se recalcula sola al publicar u ocultar
- [ ] Un profesor puede responder una vez a cada reseña
- [ ] Sin reseñas se muestra «Aún sin reseñas», no cero estrellas
- [ ] La moderación previa se puede desactivar por configuración
