# PRD 01 — Directorio y búsqueda

**Prioridad:** Imprescindible (v1)
**Depende de:** PRD 02 (perfiles de profesor)

---

## 1. Propósito

El directorio es la puerta de entrada del producto y su principal argumento de
venta. Una familia debe poder encontrar en menos de un minuto a los profesores que
encajan con lo que busca, con el colegio de procedencia visible en cada ficha.

Es también la pantalla que justifica el cobro posterior: si el directorio no
transmite calidad y confianza, nadie paga por un contacto.

---

## 2. Diferencia con la competencia

Superprof y TusClasesParticulares presentan cientos de perfiles sin verificar. La
familia no tiene forma de saber si quien elige tiene algo que ver con el entorno
académico de su hijo.

AcademiAvanza hace visible y filtrable el dato que a las familias más les importa:
**en qué colegio estudió el profesor**.

---

## 3. Acceso

El directorio es **público**: se puede navegar sin registrarse. Solo se exige
cuenta para enviar una propuesta.

El motivo es doble. Por un lado, el posicionamiento en buscadores: las fichas
deben ser indexables. Por otro, la conversión: obligar a registrarse antes de ver
nada expulsa a la mayoría de visitantes.

---

## 4. Filtros

### 4.1 Filtro por colegio de procedencia

Es el filtro característico del producto y debe ser el más visible.

- Se presenta como una lista con el **logo de cada colegio** junto al nombre
- Los colegios marcados como destacados aparecen primero
- Permite selección múltiple
- Muestra el número de profesores disponibles de cada colegio
- Solo se listan colegios con al menos un profesor activo y verificado
- Valor por defecto: ninguno seleccionado, es decir, todos los profesores

Si la familia indicó un colegio preferido al registrarse, el filtro viene
preseleccionado con ese valor, y se le indica de forma clara para que pueda
quitarlo.

### 4.2 Resto de filtros

| Filtro | Tipo | Comportamiento |
|---|---|---|
| Asignatura | Selección múltiple | Del catálogo. Combinable con nivel. |
| Nivel | Selección múltiple, agrupada por etapa | Filtra por el par asignatura-nivel real |
| Modalidad | Online / Presencial / Indiferente | Por defecto, indiferente |
| Zona | Selección múltiple | Solo visible si la modalidad incluye presencial |
| Valoración mínima | 3+ / 4+ / 4,5+ | Por defecto, sin mínimo |
| Solo con plazas | Interruptor | Filtra por `acepta_nuevos_alumnos` |

**Combinación de filtros.** Entre filtros distintos se aplica intersección: quien
busca «Montpellier + Matemáticas» quiere ambas cosas. Dentro de un mismo filtro se
aplica unión: quien marca «Matemáticas + Física» quiere cualquiera de las dos.

El filtro de asignatura y nivel se aplica sobre el par real, no de forma
independiente. Un profesor que da Matemáticas hasta Bachillerato y Física solo
hasta 4º de ESO **no** debe aparecer al buscar «Física de 2º de Bachillerato».

---

## 5. Ordenación

| Criterio | Cuándo se usa |
|---|---|
| Recomendados | Por defecto |
| Mejor valorados | A elección |
| Más experiencia | A elección |
| Novedades | A elección |

El orden «Recomendados» combina valoración, tasa de aceptación de propuestas,
rapidez de respuesta y disponibilidad de plazas. Se prioriza deliberadamente a
quien responde: un profesor con cinco estrellas que nunca contesta genera una mala
experiencia y no debe encabezar el listado.

Los profesores sin reseñas todavía no se hunden al final: se intercalan usando su
experiencia previa y su expediente, para que puedan arrancar.

---

## 6. Tarjeta de profesor

Cada resultado muestra:

- Foto
- Nombre y inicial del primer apellido
- **Badge del colegio con su logo**, solo si está verificado
- Titulación, universidad y curso
- Valoración media y número de reseñas
- Hasta cuatro asignaturas, con indicador de cuántas más hay
- Etapas que cubre
- Modalidad y zona
- Tarifa orientativa por hora, con la aclaración de que se acuerda directamente
  con el profesor
- Aviso de «sin plazas» si no acepta nuevos alumnos

Nunca se muestra el apellido completo, el email ni el teléfono.

---

## 7. Estados de la búsqueda

**Sin resultados.** No basta con decir que no hay nada. Se ofrece la vía de salida:
qué filtro relajar, con el número de resultados que se obtendrían al quitarlo. Si
el filtro de colegio es el que está limitando, se sugiere explícitamente ampliarlo
a otros centros.

**Pocos resultados.** Por debajo de tres resultados se muestran también profesores
cercanos que cumplen casi todos los criterios, claramente separados y etiquetados
como coincidencias parciales.

**Directorio vacío en el arranque.** Mientras haya menos de diez profesores
activos, se oculta el recuento total y se da prioridad a la calidad de las fichas
sobre la sensación de volumen.

---

## 8. Requisitos técnicos

- El listado se sirve renderizado en servidor, para que los buscadores lo indexen
- Los filtros se reflejan en la URL, de modo que una búsqueda sea compartible
- Carga progresiva de 12 en 12 resultados
- La consulta se apoya en `app.v_directorio_profesores`
- Tiempo de respuesta objetivo por debajo de 500 ms con 200 profesores

---

## 9. Criterios de aceptación

- [ ] Se puede navegar el directorio sin haber iniciado sesión
- [ ] El filtro por colegio muestra logos y recuentos
- [ ] Un profesor sin colegio verificado no muestra badge
- [ ] El filtro asignatura-nivel respeta el par real, no las listas por separado
- [ ] Los filtros se conservan al compartir la URL
- [ ] Sin resultados, se ofrece qué filtro relajar y cuántos resultados daría
- [ ] Ningún perfil inactivo, pausado o pendiente aparece en el listado
- [ ] La tarjeta nunca expone apellido completo, email ni teléfono
- [ ] El listado es navegable con teclado y legible por lector de pantalla
