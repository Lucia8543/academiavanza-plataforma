# Análisis competitivo
## AcademiAvanza

> Este documento cubre **el análisis de la competencia**. Los otros dos bloques de
> la investigación viven en documentos propios:
>
> - [Entrevistas a los tres perfiles de usuario](entrevistas-usuarios.md)
> - [Modelo de ingresos y análisis de precio](modelo-ingresos.md)

---

## 1. EXECUTIVE SUMMARY

AcademiAvanza opera hoy como un servicio artesanal: un intermediario humano (Lucía) que conecta manualmente a padres con profesores de clases particulares. El modelo funciona, genera confianza y tiene demanda real, pero no escala: todo depende de que Lucía esté disponible. El objetivo de este research es mapear qué están haciendo ya las plataformas líderes del sector, entender qué necesita cada tipo de usuario, e identificar cómo la nueva AcademiAvanza puede diferenciarse.

**Conclusión anticipada:** El modelo más cercano al que AcademiAvanza debe aspirar es una mezcla entre **TusClasesParticulares** (directorio navegable con filtros, orientado al mercado español) y **Wuolah** (monetización por contacto generado, no por suscripción mensual). La clave diferencial de AcademiAvanza no es la exclusividad Montpellier, sino la **verificación del colegio de origen de cada profesor** como señal de confianza: los padres pueden filtrar y elegir profesores que vienen del mismo entorno académico que su hijo. AcademiAvanza actúa como intermediario de confianza en el proceso de contacto, no como gestor de las clases ni de los pagos entre profe y alumno.

---

## 2. ANÁLISIS DE PLATAFORMAS COMPETIDORAS

### 2.1 Tabla Comparativa General

| Plataforma | Modelo de ingresos | ¿Quién paga? | Verificación profesores | Matching | Mercado objetivo | Clases presenciales |
|---|---|---|---|---|---|---|
| **Superprof** | Suscripción profe (€9,90/mes) + 10% por reserva | Profe + alumno | ❌ No | Búsqueda libre | Global / España | ✅ Sí |
| **TusClasesParticulares** | Suscripción profe (free/€9,99) + Student Pass alumno | Profe + alumno | ❌ No | Búsqueda libre | España | ✅ Sí |
| **Classgap** | Comisión 12-20% por clase | Alumno/padre | ⚠️ Básica | Búsqueda libre | España | ❌ Solo online |
| **GoStudent** | Suscripción alumno (€19-25/clase, 4-12 clases/mes) | Padre/alumno | ✅ Solo 8% aprobados | Asignado por plataforma | Internacional | ❌ Solo online |
| **Preply** | Comisión 33% (decrece con horas) | Alumno | ⚠️ Media | Búsqueda libre + filtros | Internacional | ❌ Solo online |
| **Wuolah** | Free + comisión por contacto generado | Profe | ❌ No | Búsqueda libre | Universitarios España | ⚠️ Depende |
| **AcademiAvanza (nuevo)** | Suscripción padre + fee de match (2 pasos) | Padre | ✅ Badge verificado de colegio de origen | Directorio filtrable + match mediado | Madrid y entorno | ✅ Sí (diferencial) |

---

### 2.2 Análisis en Profundidad por Plataforma

#### 🟠 SUPERPROF
**Cómo funciona:** Mercado abierto. Los profesores crean perfil gratuito y pagan €9,90/mes para mantenerlo activo y recibir solicitudes. Los padres/alumnos buscan libremente por materia, ciudad o precio. Posibilidad de clase de prueba gratis.

**Monetización:** Suscripción mensual del profesor + 10% de comisión por reserva (los perfiles Premium pagan 0%).

**Escala:** 40 millones de profesores en 70 países, 12.000 búsquedas diarias en España.

**✅ Qué hace bien:**
- Enorme tráfico y visibilidad
- Sin comisión estándar (atractivo para profesores)
- Registro en menos de 10 minutos
- Cubre cualquier materia y nivel

**❌ Qué hace mal:**
- Sin verificación de credenciales: cualquiera puede ser "profesor"
- Alta competencia (centenares de perfiles por materia/ciudad)
- Experiencia impersonal y abrumadora para padres
- Sin seguimiento ni comunicación directa con padres

**🎯 Aprendizaje para AcademiAvanza:** El tráfico es su ventaja, pero la falta de confianza y verificación es su talón de Aquiles. AcademiAvanza puede ganar a Superprof precisamente en esto: cada profesor tiene un badge verificado con su colegio de origen, lo cual da una señal de contexto que Superprof no ofrece en absoluto.

---

#### 🔵 TUSCLASESPARTICULARES
**Cómo funciona:** Marketplace español con plan free y premium para profesores, y "Student Pass" para alumnos (€14/mes) que desbloquea contactos ilimitados. +350 materias, +1 millón de profesores registrados.

**Monetización:** Free / €9,99/mes para profesores. €14/mes Student Pass para alumnos. Sin comisión sobre las clases.

**✅ Qué hace bien:**
- Gratis para empezar (baja barrera de entrada)
- Orientado 100% al mercado español
- Sin comisión por clase (atractivo para profesores y alumnos)
- Funcional para ciudades medianas y pequeñas
- AI Tutor integrado (diferencial moderno)

**❌ Qué hace mal:**
- Menos tráfico que Superprof
- Sin verificación de profesores
- Contactos del plan free muy limitados
- Experiencia de búsqueda completamente manual: el padre tiene que explorar y contactar solo

**🎯 Aprendizaje para AcademiAvanza:** El modelo de monetización por acceso al contacto (Student Pass) es el más parecido a lo que queremos construir. La diferencia es que AcademiAvanza añade verificación de colegio de origen y media el proceso de contacto (el padre paga para que la plataforma envíe la propuesta al profe, y solo si este acepta se revela su teléfono).

---

#### 🟢 CLASSGAP
**Cómo funciona:** Plataforma online pura. Sin suscripción mensual: cobra 12-20% de comisión sobre cada clase. Tiene aula virtual integrada (pizarra, compartición de pantalla, editor de ecuaciones). Revisión básica de perfiles antes de publicar.

**Monetización:** Comisión por clase (modelo "solo pagas cuando ganas" para el profesor).

**✅ Qué hace bien:**
- No hay cuota fija: los profesores solo pagan si dan clases
- Aula virtual integrada de calidad
- Alguna revisión de perfiles (credibilidad básica)
- Alcance nacional sin importar ubicación geográfica

**❌ Qué hace mal:**
- Solo online: excluye el mercado presencial (muy relevante en España)
- La comisión acumulada puede ser alta (12-20% por clase)
- Base de usuarios menor que Superprof o TCP
- Poca verificación real de credenciales

**🎯 Aprendizaje para AcademiAvanza:** Classgap gestiona los pagos de cada clase, lo cual genera complejidad operativa y legal. AcademiAvanza evita este modelo deliberadamente: cobra solo por el proceso de match, y los pagos clase-a-clase los gestionan directamente el padre y el profe entre sí.

---

#### 🟡 GOSTUDENT
**Cómo funciona:** Plataforma premium curada. Solo el 8% de los candidatos superan el proceso de selección. Los padres se suscriben a paquetes (4, 6, 8 o 12 clases/mes, compromiso de 12 meses). El precio va de €19-25 por clase según cantidad. La plataforma asigna el tutor más adecuado. Incluye GoClass (aula virtual propia), resúmenes automáticos de clase, y GoStudent Learning (materiales + IA a €14,90/mes adicionales).

**Monetización:** Suscripción del padre/alumno. GoStudent cobra directamente y paga a los tutores.

**✅ Qué hace bien:**
- Proceso de selección riguroso = máxima confianza para padres
- Experiencia de asignación (el padre no tiene que buscar)
- Resúmenes automáticos de clase = tranquilidad para padres
- 96% de estudiantes progresan (potente argumento de venta)
- Plataforma tecnológica completa e integrada

**❌ Qué hace mal:**
- Solo online
- Precio elevado (€19-25/clase + 12 meses de compromiso)
- Sin opción presencial
- Modelo poco flexible para el alumno/padre
- Gestión de pagos entre plataforma y tutores: complejidad operativa y legal alta

**🎯 Aprendizaje para AcademiAvanza:** La selección rigurosa y el proceso de asignación son inspiradores, pero GoStudent asume toda la carga de gestión de pagos clase-a-clase. AcademiAvanza resuelve el mismo problema de confianza (verificación de origen del profe) sin asumir esa carga: los pagos de clases son siempre entre padre y profe.

---

#### 🔴 PREPLY
**Cómo funciona:** Plataforma internacional orientada a idiomas. Los profesores son evaluados con proceso riguroso. La comisión empieza en 33% y va bajando conforme aumentan las horas acumuladas con cada alumno. Sin suscripción mensual. Pago integrado en la plataforma.

**Monetización:** Comisión decreciente (máx. 33% al inicio) sobre cada clase.

**✅ Qué hace bien:**
- Proceso de selección serio (credibilidad para alumnos)
- Acceso a alumnos de 190 países
- Comisión que baja con fidelización = incentivo para retener alumnos
- Herramientas pedagógicas integradas

**❌ Qué hace mal:**
- 33% inicial es demasiado alto
- Solo online
- Enfocado en idiomas: no sirve para apoyo escolar general
- Muy alta competencia internacional
- Gestión de pagos clase-a-clase: complejidad operativa y legal

**🎯 Aprendizaje para AcademiAvanza:** Preply gestiona los pagos de cada clase, lo que lo hace complejo de replicar. El modelo de AcademiAvanza es más simple y escalable: cobra una vez por el match y deja los pagos de clases a los usuarios.

---

#### ⚪ WUOLAH
**Cómo funciona:** Plataforma de apuntes universitarios que ha incorporado clases particulares. 3+ millones de usuarios universitarios registrados. Perfil de profesor gratuito, comisión por contacto generado.

**Monetización:** Comisión por contacto/lead generado hacia el profesor.

**✅ Qué hace bien:**
- Base de usuarios enorme y orgánica
- Integrado en un ecosistema educativo previo
- Acceso gratuito para profesores
- Monetización limpia: cobra solo cuando se genera un contacto real, no por suscripción

**❌ Qué hace mal:**
- Solo útil para público universitario
- Sin verificación ni selección de profesores
- No apto para primaria/secundaria/bachillerato

**🎯 Aprendizaje para AcademiAvanza:** De todas las plataformas, Wuolah es la que tiene el modelo de monetización más parecido al que AcademiAvanza quiere implementar: cobrar por el contacto generado, no por suscripción ni por cada clase. La diferencia clave es que AcademiAvanza añade verificación, curación del perfil del profesor, y un proceso de match mediado en dos pasos que garantiza que el contacto es real y bilateral.

---

## 3. SÍNTESIS Y RECOMENDACIONES

### 3.1 Posicionamiento Único de AcademiAvanza

La nueva plataforma debe ocupar un espacio que ninguna de las alternativas actuales ocupa correctamente:

> **"El directorio verificado de profesores particulares donde sabes exactamente de dónde viene cada profesor: encontrar al tuyo es fácil, rápido y de confianza."**

AcademiAvanza no es ni un marketplace anónimo (Superprof) ni una plataforma que gestiona cada clase (GoStudent). Es un intermediario de confianza para el momento del contacto: verifica a los profesores, organiza el proceso de match entre padre y profe, y cobra solo por ese servicio. Una vez hecho el match, la relación es completamente autónoma.

### 3.2 Los 5 Diferenciadores Clave

**① Badge de colegio de origen verificado:** Cada profesor tiene en su perfil el badge con el logo de su colegio de procedencia, verificado por la administración. Los padres pueden filtrar por colegio (ej: "quiero ver solo profesores del Montpellier"). Esto no existe en ninguna plataforma competidora, y da una señal de contexto y confianza inmediata que va mucho más allá de las estrellas anónimas de Superprof.

**② Match mediado con pago solo en caso de éxito:** El padre envía una propuesta al profe sin coste. La plataforma la tramita y espera respuesta. Solo si el profe acepta, el padre paga una tarifa única para ver su teléfono. Este modelo es el más justo posible para el padre (no paga si el profe no está disponible) y garantiza que los profes solo reciben solicitudes de padres que han pasado por el proceso, filtrando el ruido.

**③ Presencialidad como opción real:** Todas las plataformas de calidad (GoStudent, Preply, Classgap) son solo online. AcademiAvanza ofrece presencial + online, lo cual es un diferencial enorme para familias que prefieren el trato cara a cara.

**④ Zero-touch para la administración:** AcademiAvanza debe funcionar 100% automáticamente: registro de profes, aprobación, matching, notificaciones, cobros. Lucía no interviene manualmente en ningún paso del flujo una vez que la plataforma está en marcha.

**⑤ Sin gestión de pagos de clases:** A diferencia de GoStudent, Classgap o Preply, AcademiAvanza no toca el dinero de las clases. Eso simplifica enormemente la operación, elimina la responsabilidad legal como intermediario financiero, y hace el modelo mucho más escalable.

### 3.3 Funcionalidades imprescindibles (v1)

1. Registro y perfil de profesor (con colegio de origen declarado y validado por admin)
2. Badge visual del colegio en el perfil del profe (logo del colegio, verificado por admin)
3. Directorio navegable de profesores con filtros: colegio de origen, asignatura, nivel, modalidad, zona
4. Registro de padre (nombre, asignatura buscada, nivel, preferencias) — sin coste
5. Flujo de match: el padre envía propuesta gratis → profe recibe notificación → profe responde OK/NOK → si OK, el padre paga el fee de match via Stripe → se revela el teléfono del profe
6. Precio del fee de match configurable desde el panel de admin (sin tocar código)
7. Confirmación del profe con tiempo límite de respuesta (configurable, default 48h)
8. Notificaciones automáticas a padre y profe en cada fase del proceso (email + WhatsApp)
9. Panel de admin: aprobación de profes, asignación de badge, precio del match, dashboard de métricas e ingresos
10. Sistema de reseñas post-match (el padre valora al profe tras la primera clase)

### 3.4 Funcionalidades deseables (v2)

- Suscripción mensual/anual para padres que hacen múltiples búsquedas
- Sistema de referidos (si un padre trae a otro padre, descuento en el siguiente match)
- Blog/recursos educativos para SEO y retención
- App móvil (PWA en primera instancia)
- Directorio de colegios con logos para que los padres filtren de forma intuitiva
- Integración con bases de datos de colegios de Madrid para autocompletar logos y nombres

---

*Documento generado como parte del rediseño de AcademiAvanza — Agosto 2026*
*Los requisitos derivados de este análisis están desarrollados en [docs/02-producto](../02-producto/).*
