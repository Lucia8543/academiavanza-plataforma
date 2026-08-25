# Modelo de datos

**Motor:** PostgreSQL 15+ (Supabase)
**Ficheros fuente:** [`database/schema/`](../../database/schema/)

---

## 1. Principios de diseño

**Normalización hasta la tercera forma normal, con desnormalización deliberada y
puntual.** El modelo está normalizado salvo en las métricas agregadas del
profesor (valoración media, número de reseñas, matches). Esas se mantienen por
disparador porque el listado del directorio es la consulta más frecuente de la
aplicación y no puede permitirse agregar sobre dos tablas en cada carga.

**Las reglas críticas de negocio viven en la base de datos.** La que impide revelar
el teléfono de un profesor sin pago no está sólo en el código de la aplicación:
está como restricción `CHECK`. Si algún día hay un fallo en el código, la base de
datos sigue protegiendo el ingreso.

**Los importes se congelan.** Cada propuesta guarda el precio que se le aplicó. Si
Lucía cambia la tarifa, los cobros pasados no se ven afectados. Es requisito
contable, no una preferencia.

**Nada se borra.** Borrado lógico mediante `eliminado_en`. Las propuestas y los
pagos son registros contables y sus referencias no pueden quedar huérfanas.

**Los datos de menores se minimizan en el propio esquema.** No hay columna para el
apellido completo del alumno ni para su dirección exacta. Lo que no existe en el
modelo no se puede filtrar por error.

**Separación por esquemas.** `app` para lo operativo, `catalogo` para los datos
maestros, `legacy` para el volcado del Excel, `auditoria` para la traza. Permite
dar permisos distintos a cada uno.

---

## 2. Vista general

Los diagramas completos —entidad-relación, máquinas de estados, flujo de cobro y
mapa de roles— están en **[diagramas-modelo-datos.md](diagramas-modelo-datos.md)**,
en formato Mermaid, que GitHub renderiza directamente.

Resumen de la estructura:

| Bloque | Tablas | Qué resuelve |
|---|---|---|
| **Identidad** | `perfiles`, `profesores`, `familias`, `alumnos` | Quién es quién. Herencia 1:1 sobre `perfiles`. |
| **Catálogo** | `colegios`, `asignaturas`, `niveles`, `zonas`, `certificaciones_idioma` | Datos maestros normalizados. Hacen posible el filtrado fiable. |
| **Oferta** | `profesor_asignaturas`, `profesor_certificaciones`, `profesor_disponibilidad` | Qué imparte cada profesor y hasta qué nivel. |
| **Demanda** | `necesidades`, `necesidad_asignaturas` | Qué busca cada familia. |
| **Núcleo** | `propuestas`, `propuesta_eventos` | El flujo completo de contacto. El match es el estado `pagada`. |
| **Dinero** | `tarifas`, `pagos`, `stripe_eventos`, `configuracion` | Precio con vigencia y cobros. |
| **Reputación** | `resenas` | Valoraciones verificadas. |
| **Avisos** | `notificaciones`, `plantillas_notificacion` | Email y WhatsApp. |
| **Migración** | `legacy.*`, `tokens_reclamacion` | Carga del Excel y reclamación de perfiles. |
| **Trazabilidad** | `auditoria.cambios` | Quién cambió qué. |

## 3. Las decisiones que importan

### 3.1 Una sola tabla para propuestas y matches

Un «match» no es una entidad distinta de una propuesta: es una propuesta que llegó
a su estado final. Modelarlos como dos tablas obligaría a mantener sincronizadas
dos filas que describen el mismo hecho, con el riesgo de que se desincronicen.

El flujo completo es una máquina de estados sobre `app.propuestas`:

```
                 ┌──────────────┐
                 │   enviada    │  (gratis para la familia)
                 └──┬────┬───┬──┘
        acepta      │    │   │      no responde en plazo
      ┌─────────────┘    │   └──────────────┐
      │                  │ rechaza          │
      ▼                  ▼                  ▼
┌──────────┐      ┌────────────┐     ┌───────────┐
│ aceptada │      │ rechazada  │     │ caducada  │
└─────┬──┬─┘      └────────────┘     └───────────┘
      │  │
paga  │  │ no paga en plazo
      ▼  └────────────┐
┌──────────┐          ▼
│  pagada  │   ┌───────────────┐
│ = MATCH  │   │ caducada_pago │
└──────────┘   └───────────────┘
      │
      ▼
 teléfono revelado
```

La restricción `prop_contacto_solo_si_pagada` garantiza a nivel de base de datos
que `contacto_revelado_en` sólo puede tener valor si el estado es `pagada`.

Cada transición se registra automáticamente en `app.propuesta_eventos`, lo que
permite reconstruir la vida de cualquier propuesta y calcular tiempos reales de
respuesta.

### 3.2 El precio, como dimensión con vigencia

Requisito: Lucía debe poder cambiar el precio cuando quiera, sin desplegar código.

La solución evidente sería una columna que se sobrescribe. Es la incorrecta,
porque destruiría el histórico: un cobro de hace tres meses pasaría a mostrar el
precio de hoy.

`app.tarifas` guarda cada precio con su periodo de vigencia. Un índice único
parcial garantiza que sólo haya una tarifa viva por concepto:

```sql
CREATE UNIQUE INDEX idx_tarifa_vigente_unica
    ON app.tarifas (concepto)
    WHERE vigente_hasta IS NULL;
```

Y `app.propuestas.tarifa_aplicada` guarda una instantánea del importe cobrado, que
no se recalcula nunca.

Ventajas añadidas: se puede programar un cambio de precio con antelación, queda
registro de quién lo cambió y por qué, y se puede medir el efecto de un cambio de
precio sobre la conversión.

### 3.3 El colegio como entidad, no como texto

En el Excel, el colegio es una respuesta de texto libre. Eso hace imposible
filtrar de forma fiable: «Montpellier», «montpellier» y «Sí, en el Montpellier»
son la misma cosa para una persona y tres cosas distintas para una consulta.

Como el filtro por colegio es el diferencial del producto, el colegio pasa a ser
una entidad de catálogo con logo, y la relación es una clave foránea. El badge sólo
se muestra si `colegio_verificado = TRUE`, lo que sólo ocurre tras comprobación
manual.

Existe `colegio_otro` como campo de respaldo para lo que no encaje en el catálogo,
pero nunca genera badge.

### 3.4 La oferta académica, al grano correcto

El Excel guardaba «asignaturas que quieres impartir» y «cursos a los que quieres
dar clase» como dos listas independientes. Eso obliga a asumir que el profesor da
todas sus asignaturas en todos sus niveles, lo cual es falso: alguien puede dar
Matemáticas hasta Bachillerato pero Física sólo hasta 4º de ESO.

`app.profesor_asignaturas` modela el par (asignatura, nivel) explícitamente. Es lo
que permite que el filtro «Física de 2º de Bachillerato» devuelva resultados
correctos.

### 3.5 Las reseñas, verificadas por construcción

Sólo puede reseñar quien completó un match pagado con ese profesor. La restricción
no está sólo en la aplicación: un disparador la comprueba antes de insertar y
lanza excepción si la propuesta no está en estado `pagada` o si las partes no
coinciden.

Además, `UNIQUE (propuesta_id)` impide que una misma familia reseñe dos veces al
mismo profesor por el mismo match.

Es lo que hace que estas reseñas valgan más que las de Superprof.

---

## 4. Inventario de tablas

### Esquema `catalogo`

| Tabla | Contenido |
|---|---|
| `colegios` | Colegios de procedencia, con logo. Alimenta el badge y el filtro. |
| `asignaturas` | Catálogo cerrado de materias |
| `niveles` | Cursos concretos, agrupados por etapa |
| `zonas` | Barrios y municipios para clases presenciales |
| `certificaciones_idioma` | Titulaciones de idiomas normalizadas |

### Esquema `app`

| Tabla | Contenido |
|---|---|
| `perfiles` | Datos comunes a todo usuario. Extiende `auth.users`. |
| `profesores` | Perfil del profesor: procedencia, titulación, notas, estado |
| `profesor_asignaturas` | Qué imparte y a qué nivel |
| `profesor_certificaciones` | Titulaciones de idiomas |
| `profesor_disponibilidad` | Franjas horarias. **No se migra del Excel.** |
| `familias` | Perfil de la familia |
| `alumnos` | Hijos. Datos minimizados. |
| `necesidades` | Qué busca la familia para un alumno |
| `necesidad_asignaturas` | Asignaturas de esa búsqueda |
| `propuestas` | **El flujo completo de contacto.** El match es el estado `pagada`. |
| `propuesta_eventos` | Traza inmutable de transiciones |
| `tarifas` | Precios con vigencia |
| `configuracion` | Parámetros operativos editables |
| `pagos` | Cobros de la plataforma. **No incluye pagos por clases.** |
| `stripe_eventos` | Control de idempotencia de webhooks |
| `resenas` | Reseñas verificadas |
| `plantillas_notificacion` | Textos de los mensajes automáticos |
| `notificaciones` | Registro de envíos |
| `tokens_reclamacion` | Enlaces de un solo uso para validar perfiles migrados |

### Esquema `legacy`

| Tabla | Contenido |
|---|---|
| `cargas` | Registro de cada ejecución de importación |
| `profes_raw` | Volcado literal de la hoja PROFES |
| `padres_raw` | Volcado literal de la hoja PADRES |
| `clases_raw` | Histórico de clases. Sólo para el agregado por profesor. |

### Esquema `auditoria`

| Tabla | Contenido |
|---|---|
| `cambios` | Quién cambió qué, distinguiendo aplicación de edición manual |

---

## 5. Lo que deliberadamente NO está en el modelo

**Pagos por clases entre familia y profesor.** No hay tabla de bonos, ni de
liquidaciones, ni de clases impartidas. Es la decisión de producto que define esta
plataforma: se cobra el match y nada más. Los pagos de clases se acuerdan y
liquidan entre las partes, por Bizum o transferencia, y la plataforma no los
conoce.

**Calendario de clases.** No se gestionan clases, luego no hay calendario. La
disponibilidad del profesor es orientativa, para el matching.

**Mensajería interna.** El contacto se produce por WhatsApp una vez revelado el
teléfono. Montar un chat propio añadiría complejidad sin resolver ningún problema
real.

**Teléfono de Bizum del profesor.** Existía en el formulario antiguo y se elimina
en la migración: sin finalidad legítima, no se conserva.

---

## 6. Índices

Los índices responden a las consultas reales de la aplicación, no a la intuición.

**Directorio.** `idx_prof_estado_activo`, `idx_prof_colegio`, `idx_prof_modalidad`
y `idx_prof_valoracion` son parciales sobre `estado = 'activo'`: el directorio
nunca consulta perfiles inactivos, así que el índice no tiene por qué contenerlos.

**Procesos programados.** `idx_prop_pendientes_respuesta` e
`idx_prop_pendientes_pago` son parciales sobre el estado correspondiente. El
proceso que caduca propuestas se ejecuta cada hora y sólo mira esas filas.

**Integridad.** `idx_prop_sin_duplicados_vivos` es un índice único parcial que
impide que una familia tenga dos propuestas vivas con el mismo profesor para el
mismo alumno. Evita duplicados por doble clic.

---

## 7. Orden de ejecución

```bash
psql "$DATABASE_URL" -f database/schema/01_extensiones_y_tipos.sql
psql "$DATABASE_URL" -f database/schema/02_catalogos.sql
psql "$DATABASE_URL" -f database/schema/03_usuarios_y_perfiles.sql
psql "$DATABASE_URL" -f database/schema/04_profesores.sql
psql "$DATABASE_URL" -f database/schema/05_familias_y_alumnos.sql
psql "$DATABASE_URL" -f database/schema/06_tarifas_y_configuracion.sql
psql "$DATABASE_URL" -f database/schema/07_propuestas_y_matches.sql
psql "$DATABASE_URL" -f database/schema/08_pagos.sql
psql "$DATABASE_URL" -f database/schema/09_resenas_y_notificaciones.sql
psql "$DATABASE_URL" -f database/schema/10_legacy_migracion.sql
psql "$DATABASE_URL" -f database/schema/11_vistas.sql
psql "$DATABASE_URL" -f database/schema/12_roles_y_seguridad.sql

psql "$DATABASE_URL" -f database/seeds/01_colegios.sql
psql "$DATABASE_URL" -f database/seeds/02_niveles_y_asignaturas.sql
```

El orden importa: hay dependencias de claves foráneas entre ficheros.

---

## 8. Pendiente

- [ ] Ampliar el catálogo de colegios con los valores reales del Excel
- [ ] Ampliar el catálogo de zonas con los barrios reales
- [ ] Definir la política de retención de perfiles migrados no reclamados
- [ ] Decidir si el histórico de clases se muestra por profesor, en agregado o ambos
      (depende del análisis de volumetría, pendiente de los ficheros)
