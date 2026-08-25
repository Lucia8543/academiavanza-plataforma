# Documentación de AcademiAvanza

---

## Por dónde empezar

Si es la primera vez que abres esta documentación, este es el orden que tiene
sentido:

1. **[Visión y alcance](02-producto/00-vision-y-alcance.md)** — qué es el producto,
   qué hace y, sobre todo, qué **no** hace. Diez minutos.
2. **[Flujo de propuesta y match](02-producto/prd-04-flujo-match.md)** — el núcleo.
   Si solo lees dos documentos, que sean este y el anterior.
3. **[Diagramas del modelo de datos](04-tecnico/diagramas-modelo-datos.md)** — la
   forma del sistema de un vistazo.

---

## 01 · Negocio

Investigación previa. Por qué el producto es como es.

| Documento | Contenido |
|---|---|
| [Análisis competitivo](01-negocio/analisis-competitivo.md) | Superprof, TusClasesParticulares, Classgap, GoStudent, Preply y Wuolah. Qué hace cada uno y qué se aprende. |
| [Entrevistas a usuarios](01-negocio/entrevistas-usuarios.md) | Los tres perfiles: familia, profesora y Lucía. Qué necesita cada uno. |
| [Modelo de ingresos](01-negocio/modelo-ingresos.md) | Cómo gana dinero la plataforma, análisis de precio y proyección. |

---

## 02 · Producto

Qué hay que construir.

| Documento | Contenido |
|---|---|
| [Visión y alcance](02-producto/00-vision-y-alcance.md) | Marco general, usuarios, principios e indicadores |
| [PRD 01 · Directorio y búsqueda](02-producto/prd-01-directorio-y-busqueda.md) | Listado, filtros —incluido el de colegio— y ordenación |
| [PRD 02 · Perfiles de profesor](02-producto/prd-02-perfiles-profesor.md) | Registro, perfil público, aprobación y verificación |
| [PRD 03 · Portal de la familia](02-producto/prd-03-portal-familia.md) | Registro, alumnos y panel |
| [PRD 04 · Flujo de match](02-producto/prd-04-flujo-match.md) | **El núcleo del producto** |
| [PRD 05 · Tarifas y pagos](02-producto/prd-05-tarifas-y-pagos.md) | Stripe y precio configurable |
| [PRD 06 · Panel de administración](02-producto/prd-06-panel-administracion.md) | Gestión y supervisión |
| [PRD 07 · Notificaciones](02-producto/prd-07-notificaciones.md) | Correo y WhatsApp |
| [PRD 08 · Reseñas](02-producto/prd-08-resenas.md) | Valoraciones verificadas |
| [PRD 09 · Perfiles migrados](02-producto/prd-09-onboarding-migrados.md) | Reclamación y validación |

---

## 03 · Diseño

Cómo se ve y cómo suena.

| Documento | Contenido |
|---|---|
| [Identidad y marca](03-diseno/identidad-y-marca.md) | Personalidad, logotipo, tono de voz y vocabulario |
| [Sistema de diseño](03-diseno/sistema-diseno.md) | Color, tipografía, componentes y accesibilidad |
| [Mapa de pantallas](03-diseno/mapa-de-pantallas.md) | Inventario de pantallas y recorridos |

---

## 04 · Técnico

Cómo se construye.

| Documento | Contenido |
|---|---|
| [Arquitectura del sistema](04-tecnico/arquitectura-sistema.md) | Pila tecnológica, estructura del código y costes |
| [Modelo de datos](04-tecnico/modelo-datos.md) | Esquema relacional y decisiones de diseño |
| [Diagramas](04-tecnico/diagramas-modelo-datos.md) | Entidad-relación, estados y flujos, en Mermaid |
| [Acceso a base de datos](04-tecnico/acceso-base-datos.md) | Guía de conexión con cliente SQL |
| [Plan de desarrollo](04-tecnico/plan-desarrollo.md) | Etapas, pruebas y criterios de lanzamiento |

---

## 05 · Migración

Qué hacer con los datos del Excel histórico.

| Documento | Contenido |
|---|---|
| [Informe de migración](05-migracion/informe-migracion.md) | Qué migrar, qué descartar y con qué criterio, ya contrastado con los ficheros reales |

> **Los números están.** 1 904 clases entre septiembre de 2025 y julio de 2026, 60
> familias y 46 profesores con actividad de un censo de 118. El análisis completo
> está en el apartado 4 del informe; los guiones que lo producen, en
> `database/etl/analisis/`.

---

## Decisiones de arquitectura

Las decisiones importantes quedan registradas con su contexto y sus consecuencias,
para que dentro de un año se sepa por qué se hizo así.

| ADR | Decisión |
|---|---|
| [0001](adr/0001-cobrar-solo-el-match.md) | La plataforma cobra solo el match, no las clases |
| [0002](adr/0002-separacion-frontend-backend.md) | Frontend y backend separados por carpetas, no por despliegue |
| [0003](adr/0003-esquema-base-datos-en-espanol.md) | El esquema de base de datos se nombra en español |

---

## Las cinco cosas que hay que tener claras

Si alguien solo se queda con esto, es suficiente para no equivocarse:

**① La plataforma no gestiona los pagos de las clases.** Ni bonos, ni saldos, ni
liquidaciones. Ese dinero se mueve directamente entre familia y profesor. Es la
carga que el rediseño elimina.

**② La propuesta es gratis; solo se paga si el profesor acepta.** Es lo que hace
defendible el cobro y elimina la principal objeción.

**③ El badge del colegio es el producto.** Solo se muestra si administración ha
verificado la procedencia. Si esa distinción se difumina, no queda diferencial.

**④ El precio es configurable desde el panel.** No es una constante en el código, y
cambiarlo no altera ningún cobro anterior.

**⑤ Nada debe requerir intervención diaria.** Cualquier flujo que exija la presencia
de Lucía es un defecto de diseño.

---

## Convenciones

Documentación en español, en prosa y sin abreviaturas innecesarias. Los diagramas
en Mermaid dentro del propio Markdown, para que GitHub los renderice y se puedan
versionar como texto.

Cada documento empieza explicando su propósito. Las decisiones no evidentes llevan
su porqué al lado, no en la cabeza de quien las tomó.
