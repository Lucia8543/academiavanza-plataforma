# Informe de migración de datos históricos

**Proyecto:** AcademiAvanza — Plataforma
**Fecha:** Agosto 2026
**Estado:** Contrastado con los ficheros reales

---

> ### Estado de este documento
>
> Los ficheros originales ya se han analizado. Las cifras de volumetría, calidad de
> datos y recuento del histórico de clases que aparecen a continuación proceden de
> las cuatro fuentes reales: los dos formularios de Google y las hojas `PADRES`,
> `PROFESORES` y `CLASES` del Excel de trabajo.
>
> Los ficheros están en `database/etl/datos/`, fuera del repositorio: contienen
> datos personales de menores y la carpeta está excluida en `.gitignore`. Los
> guiones que producen estas cifras están en `database/etl/`.
>
> El análisis de qué migrar, qué descartar y con qué criterio no ha cambiado: sigue
> dependiendo de la estructura y del modelo de negocio, no del contenido de las
> celdas. Lo que sí ha cambiado es el apartado 4, donde los números reales
> condicionan la recomendación.

---

## 1. Resumen ejecutivo

AcademiAvanza dispone hoy de tres fuentes de datos: la hoja de respuestas del
formulario de padres, la del formulario de profesores, y un Excel principal donde
Lucía consolida ambas y registra las clases impartidas.

La recomendación es **migrar de forma selectiva, no íntegra**. Concretamente:

- **Migrar** la identidad y las credenciales académicas de los profesores. Es el
  activo real del negocio y lo que un directorio vacío no puede sustituir.
- **Migrar** el contacto de las familias y los datos básicos del alumno, con
  garantías reforzadas por tratarse de datos de menores.
- **Descartar** todo dato de naturaleza caduca: disponibilidad horaria, fechas de
  inicio deseadas, horas semanales.
- **Descartar por completo** todo lo relativo a pagos de clases: el teléfono de
  Bizum, los importes, el seguimiento de bonos. La plataforma nueva no intermedia
  en esos pagos, así que ese dato no tiene destino en el modelo.
- **Convertir** el histórico de clases en una única métrica agregada por profesor,
  en lugar de migrarlo registro a registro.

El resultado esperado es un directorio que arranca con contenido real desde el
primer día, pero sin arrastrar la deuda de un Excel construido a mano durante dos
años.

---

## 2. Fuentes de origen

### 2.1 Formulario de padres

| Columna original | Naturaleza | Decisión |
|---|---|---|
| Marca temporal | Metadato | Migrar como `creado_en` |
| Colegio del alumno | Texto libre | Migrar normalizado a `catalogo.colegios` |
| Nombre y apellidos del alumno/a | Dato de menor | Migrar **sólo nombre de pila + inicial** |
| Tu nombre y apellidos | Identidad | Migrar |
| Tu email | Identidad | Migrar (clave de reconciliación) |
| Tu número de teléfono | Contacto | Migrar |
| Curso del alumno | Texto libre | Migrar normalizado a `catalogo.niveles` |
| Asignaturas requeridas | Texto libre | **No migrar** — es una necesidad puntual, ya caducada |
| Modalidad de impartición | Texto libre | Migrar como preferencia por defecto |
| Dirección (presencialidad) | Dato sensible | Migrar **reducido a zona/barrio** |
| Horas por semana de clase | Caduco | **No migrar** |
| Disponibilidad (días y horas) | Caduco | **No migrar** |
| Coméntanos o pregúntanos… | Texto libre | **No migrar** — contexto de una conversación pasada |
| ¿Cuándo queréis comenzar? | Caduco | **No migrar** |
| Dirección de correo electrónico | Duplicado | Consolidar con «Tu email» |

### 2.2 Formulario de profesores

| Columna original | Naturaleza | Decisión |
|---|---|---|
| Marca temporal | Metadato | Migrar como `creado_en` |
| ¿Has estudiado en el Montpellier? (si no, cuál) | **Crítico** | Migrar normalizado a `catalogo.colegios` |
| Tu nombre y apellidos | Identidad | Migrar |
| Tu número de teléfono | Contacto | Migrar |
| Teléfono para recibir el Bizum | Pago de clases | **No migrar — eliminar** |
| Tu email | Identidad | Migrar (clave de reconciliación) |
| Carrera y año actual u otros estudios | **Crítico** | Migrar, separando titulación / universidad / curso |
| Asignaturas que quieres impartir | Oferta | Migrar normalizado, **para revalidar** |
| Cursos a los que quieres dar clase | Oferta | Migrar normalizado, **para revalidar** |
| Modalidad de impartición | Oferta | Migrar, **para revalidar** |
| Dirección o zona donde vives | Semi-sensible | Migrar **reducido a zona** |
| Horas por semana de clase | Caduco | **No migrar** |
| Disponibilidad (días y horas) | Caduco | **No migrar** |
| Nota de EVAU y bachillerato | **Crítico** | Migrar, separando las dos notas y convirtiendo a numérico |
| Coméntanos o pregúntanos… | Texto libre | Revisar manualmente; puede contener material para la bio |
| Certificado de idiomas | **Crítico** | Migrar normalizado a `catalogo.certificaciones_idioma` |
| Habilidades o logros académicos | **Crítico** | Migrar como texto |
| Si vienes de parte de alguien | Metadato | Migrar como campo de referido, uso interno |

### 2.3 Excel principal — registro de clases

No hay un Excel principal, sino **cinco copias del mismo libro** guardadas en
fechas distintas del curso: 8 de marzo, 23 de abril, 7 de mayo, 23 de mayo y 8 de
agosto de 2026. Cada una tiene las tres hojas `CLASES`, `PADRES` y `PROFESORES`.

Lo primero que hay que saber es que **la copia más reciente no contiene todo**. Al
comparar las cinco aparecen 278 clases que están en copias antiguas y ya no están
en la del 8 de agosto: casi todo octubre y noviembre, y la actividad de dos
profesoras que se dieron de baja. La fuente para migrar es, por tanto, **la unión
de las cinco**, no la última.

| Fichero | Clases | Última semana registrada |
|---|---:|---|
| `historial-clases-2026-03-08.xlsx` | 1 130 | 29 de marzo |
| `historial-clases-2026-04-23.xlsx` | 1 270 | 26 de abril |
| `historial-clases-2026-05-07.xlsx` | 1 339 | 10 de mayo |
| `historial-clases-2026-05-23.xlsx` | 1 481 | 31 de mayo |
| `historial-clases-2026-08-08.xlsx` | 1 626 | 26 de julio |
| **Unión sin duplicados** | **1 904** | — |

La hoja `CLASES` no es una tabla limpia. Contiene, por este orden: una fila de
totales, un bloque de sumatorios semanales, una tabla de correspondencia entre
familias, alumnos y profesores, y sólo después el registro de clases propiamente
dicho. Las columnas útiles son colegio, profesor, alumno, curso, familia, semana y
duración en minutos; el resto son cálculos de bonos y pagos que no se migran.

**La hoja `CLASES` no registra la asignatura.** Es la ausencia más relevante: la
distribución de clases por materia no se puede calcular desde el histórico. Sólo
se conocen las asignaturas *declaradas* por familias y profesores en los
formularios, que son una intención, no un hecho.

Las hojas `PADRES` y `PROFESORES` son idénticas en las cinco copias, así que basta
una. `PROFESORES` no tiene fila de cabecera —los datos empiezan en la primera
fila— y sus columnas siguen el orden del formulario de profesores, incluidas las
cuatro últimas (comentarios, certificado de idiomas, habilidades y referido).

### 2.4 Volumetría y calidad de las cuatro fuentes

| Fuente | Registros | Columnas |
|---|---:|---:|
| Formulario de profesores (Google) | 106 | 18 |
| Formulario de padres (Google) | 79 | 15 |
| Excel · hoja `PROFESORES` | 107 | 18 |
| Excel · hoja `PADRES` | 91 | 16 |

**El email no sirve como clave principal.** El plan preveía reconciliar y
deduplicar por email, y descartar las filas sin él. Con los datos reales eso
supondría tirar un tercio del censo:

| Fuente | Con email | Con teléfono |
|---|---:|---:|
| Formulario de profesores | 65 % | 99 % |
| Excel · hoja `PROFESORES` | 70 % | 97 % |
| Formulario de padres | 59 % | 99 % |
| Excel · hoja `PADRES` | 67 % | 78 % |

El teléfono es la única clave con cobertura casi completa. La conclusión práctica
es que **la clave principal debe ser el teléfono normalizado a nueve dígitos, y el
email la secundaria**, al revés de lo previsto en el apartado 6.3. Cruzando
formulario y Excel de profesores aparecen 113 teléfonos distintos frente a sólo 77
emails. Sin email no se puede enviar la invitación, así que a esos perfiles habrá
que llegar por WhatsApp: es un envío manual, pero son menos de cuarenta.

**Duplicados.** Pocos y explicables. En el formulario de profesores, dos personas
lo rellenaron dos veces (mismo nombre, email y teléfono). En el lado de las
familias hay siete emails repetidos en la hoja `PADRES` y cinco en el formulario:
casi todos son **hermanos dados de alta por el mismo progenitor**, que en el modelo
nuevo es una familia con dos alumnos, no dos familias. Deduplicar por email sin
mirar el nombre del alumno fusionaría hermanos.

**Campos vacíos que importan.** En el formulario de profesores: certificado de
idiomas 58 %, habilidades 76 %, zona 21 %, notas de EVAU 2 %. En el de familias:
colegio del alumno 13 %. La columna «Dirección de correo electrónico» del
formulario de padres está vacía al 100 %: es un duplicado de «Tu email» que nunca
llegó a recogerse y se puede ignorar sin más.

**Filas descuadradas.** Al menos dos registros de la hoja `PADRES` tienen las
columnas desplazadas un puesto (el nombre del alumno en la columna de colegio, el
email en la de familia). Se detectan porque el campo de colegio no parece un
centro y el de teléfono contiene texto. Hay que corregirlas a mano antes de
transformar.

**Notas de EVAU mezcladas con idiomas.** La columna de notas del Excel contiene
indistintamente notas («Evau: 12.4 Bachillerato: 9.4»), certificados («C1 inglés,
B2 francés»), ambos, o frases enteras. La separación en dos campos numéricos y un
catálogo de idiomas no es automática en todos los casos.

### 2.5 Valores distintos en las columnas de texto libre

Es lo que hace falta para construir las tablas de equivalencias. El recuento sobre
las cuatro fuentes juntas:

| Columna | Cadenas distintas | Se reducen a | Comentario |
|---|---:|---|---|
| Colegio de procedencia | 91 | **73 centros** | Ya volcados en `database/seeds/01_colegios.sql` |
| Asignaturas | 180 | ~25 materias | El grueso son variantes de grafía |
| Cursos y niveles | 170 | 13 niveles | Primaria 1.º-6.º, ESO 1.º-4.º, Bachillerato 1.º-2.º |
| Certificados de idiomas | 35 | ~10 combinaciones | Casi todo inglés B1-C2 |

**Colegios.** El Montpellier domina, pero con una asimetría que conviene tener
presente: es el colegio de **el 81 % de las familias** y sólo de **el 45 % de los
profesores**. Las 16 respuestas «Sí» son la respuesta afirmativa a la pregunta
«¿Has estudiado en el Montpellier?» y mapean también a Montpellier; son la
incidencia más numerosa y la más fácil de resolver. Los otros 72 centros tienen
uno o dos profesores cada uno y muchos están fuera de Madrid, así que como filtro
del directorio sirven poco: la demanda real de filtrado se concentra en un solo
colegio. Nueve respuestas no nombran un centro y quedan anotadas en el propio
fichero de semillas.

**Asignaturas.** Las 180 cadenas son engañosas: la mitad son la misma materia
escrita de otra forma («Matemáticas», «matemáticas», «Matematicas», «Mates»,
«mates», «Matemática», «Mate»). Las que de verdad aparecen son Matemáticas,
Inglés, Física, Química, Lengua, Biología, Historia, Economía, Francés, Dibujo
Técnico, Filosofía, Literatura, Latín, Griego, Geografía, Geología, Tecnología,
Ciencias Sociales, Ciencias Naturales, Alemán, Música e Informática. El problema
real no es la grafía sino que muchas respuestas son frases con condiciones
(«todas menos inglés», «química hasta 3.º de ESO», «física, pero en nivel bajo»).
Esas condiciones no caben en un catálogo y se pierden al normalizar: conviene
conservar el texto original en un campo aparte para que el profesor lo revise.

**Cursos.** Mismo patrón: «4º ESO», «4eso», «4 eso», «4º Eso» son el mismo nivel.
Los 13 niveles del catálogo cubren todo salvo las respuestas genéricas
(«Primaria», «ESO», «Todos»), que se resuelven expandiendo al rango completo.

**Certificados de idiomas.** Sólo 42 % de los profesores contestó, y nueve
respondieron literalmente «No tengo». Los que hay son casi todos de inglés (B1,
B2, C1, C2, con y sin mención a Cambridge), más algún francés, alemán, italiano y
euskera sueltos. Se normaliza bien a pares idioma + nivel MCER.

---

## 3. Qué migrar y por qué

### 3.1 Datos obligatorios — el núcleo de la propuesta de valor

Estos son los campos por los que una familia decide contactar o no con un
profesor. Sin ellos, la ficha no vende y el directorio no cumple su función.

**Colegio de procedencia.** Es el diferencial del producto. Determina el badge del
perfil y alimenta el filtro principal del directorio. Merece un esfuerzo
específico de normalización: la columna original es texto libre y contendrá
variantes como «Montpellier», «montpellier», «Sí», «Sí, desde infantil», «No, en
el Pilar». Todas deben resolverse contra el catálogo, y las que no encajen quedan
marcadas para revisión, nunca descartadas en silencio.

**Titulación, universidad y curso.** La columna original mezcla los tres datos en
una sola cadena («Segundo de Medicina en la UAM»). Separarlos es lo que permite
después filtrar, ordenar y presentar la información con formato consistente. La
extracción será parcialmente automática y parcialmente manual.

**Nota de EVAU y de bachillerato.** Vienen en una única columna de texto libre y
hay que separarlas y convertirlas a numérico. Es el dato que más peso tiene en la
percepción de calidad por parte de una familia, y guardarlo como texto impide
ordenar el directorio por expediente.

**Certificaciones de idiomas.** Texto libre en origen, normalizado a catálogo en
destino. Es un criterio de filtrado con demanda real, especialmente para inglés.

**Logros y habilidades destacables.** Se migra tal cual. Es materia prima para la
biografía del perfil, que el profesor redactará al validar.

### 3.2 Datos que se migran pero deben revalidarse

La oferta académica —qué asignaturas, a qué cursos, en qué modalidad— se migra
porque ahorra al profesor rellenar el formulario desde cero, pero se marca como no
validada. El motivo es que un estudiante que declaró dar clase de Matemáticas
hasta 2º de Bachillerato hace dos años puede haber cambiado de carrera, o
sencillamente ya no querer dar ese nivel.

### 3.3 Datos que NO merece la pena migrar

**Disponibilidad horaria.** Es el caso más claro. Los horarios de un estudiante
universitario cambian cada cuatrimestre. Migrar franjas de hace dos cursos
produciría matches basados en información falsa, que es peor que no tener
información: la familia contacta, el profesor no puede, y se quema una propuesta.

**Horas semanales y fecha de inicio deseada.** Mismo razonamiento. Describen una
situación puntual ya resuelta o abandonada.

**Teléfono de Bizum del profesor.** No tiene destino en el modelo nuevo, porque la
plataforma ya no intermedia en los pagos de clases. Además, conservar un dato
financiero sin finalidad legítima vulnera el principio de limitación de la
finalidad del RGPD. Se elimina.

**Asignaturas solicitadas por las familias.** Describen una necesidad de un curso
académico concreto, ya cerrada. Cuando la familia vuelva, rellenará una nueva.

**Campos de comentarios libres.** Contienen fragmentos de conversación fuera de
contexto. Los del formulario de profesores merecen una lectura manual por si
contienen material aprovechable para la biografía; los de familias, no.

**Direcciones postales completas.** Se reducen a zona o barrio. La dirección exacta
sólo tiene sentido una vez cerrado el acuerdo entre familia y profesor, momento en
el que ya se comunican directamente y la plataforma no pinta nada.

---

## 4. El histórico de clases

### 4.1 Volumen y periodo

Uniendo las cinco copias del Excel y quitando duplicados quedan **1 904 clases**,
que suman **2 150 horas** impartidas entre el **1 de septiembre de 2025 y el 26 de
julio de 2026**: un curso académico completo, 49 semanas con actividad. La clase
típica dura una hora (media de 68 minutos, mediana de 60).

Detrás de esas clases hay **66 alumnos de 60 familias distintas**, atendidos por
**46 profesores**, en **104 parejas familia-profesor**.

Conviene decir de entrada que **el registro no cubre los dos años de vida del
negocio**, sólo el último curso. Las clases anteriores no están en ningún Excel de
los entregados.

### 4.2 Quién dio esas clases

Antes de mirar la distribución hay que descontar un problema: **289 clases, el
15,2 % del total, están atribuidas a «sustituto», «sustituta» o «anterior»**. No
son personas, son marcadores que Lucía usaba cuando cubría una baja o cuando el
profesor había cambiado. Esas clases no se pueden asignar a nadie.

De las **1 615 clases restantes**, repartidas entre 46 profesores:

| | Clases |
|---|---:|
| Media por profesor | 35 |
| **Mediana** | **28** |
| Percentil 25 | 13 |
| Percentil 75 | 46 |
| El que más | 147 |

| Umbral | Profesores | % del total |
|---|---:|---:|
| 100 clases o más | 2 | 4 % |
| 50 o más | 10 | 22 % |
| 30 o más | 21 | 46 % |
| 20 o más | 33 | 72 % |
| Menos de 10 | 6 | 13 % |

La concentración es moderada: los cinco primeros acumulan el 31 % de las clases y
los diez primeros el 49 %. No es un negocio sostenido por dos personas, pero
tampoco está repartido de forma plana.

**El dato que decide el diseño está en otro sitio.** El censo de profesores tiene
**118 nombres** entre el formulario y el Excel. Sólo **46 han dado alguna clase: el
39 %**. Los otros **72 profesores —el 61 % del directorio migrado— tendrían el
contador a cero**.

Sobre la reconciliación, la buena noticia: los 46 nombres del registro de clases se
corresponden todos con alguien del censo. Cuarenta coinciden literalmente, cinco
aparecen en el registro con nombre y un solo apellido frente al nombre completo del
censo, y uno lleva una errata («Cataneda» por «Castañeda»). No hay ningún profesor
con clases que no esté fichado.

### 4.3 Por nivel

| Etapa | Clases | % |
|---|---:|---:|
| ESO | 1 140 | 60 % |
| Bachillerato | 520 | 27 % |
| Primaria | 243 | 13 % |

Y por curso concreto, los cuatro que concentran la demanda son **4.º de ESO
(21 %), 2.º de ESO (18 %), 2.º de Bachillerato (17 %) y 3.º de ESO (11 %)**. Es
decir: cursos con examen al final. Primaria es marginal y se reduce a cuatro
alumnos con muchas horas cada uno.

**Por asignatura no hay dato.** La hoja `CLASES` no registra la materia impartida,
así que cualquier reparto por asignatura sería inventado. Lo único que se sabe es
lo que familias y profesores *declararon* querer en los formularios, donde
Matemáticas e Inglés están muy por delante del resto.

### 4.4 Estacionalidad

| Mes | Clases | % |
|---|---:|---:|
| Septiembre 2025 | 80 | 4 % |
| Octubre | 154 | 8 % |
| Noviembre | 177 | 9 % |
| Diciembre | 145 | 8 % |
| Enero 2026 | 181 | 10 % |
| **Febrero** | **319** | **17 %** |
| Marzo | 245 | 13 % |
| Abril | 248 | 13 % |
| Mayo | 247 | 13 % |
| Junio | 102 | 5 % |
| Julio | 6 | 0 % |

El curso arranca lento, sube durante el primer trimestre, **hace pico en febrero**
—justo después de las notas de la primera evaluación— y se mantiene alto hasta
final de mayo. **De febrero a mayo se concentra el 56 % de la actividad del año.**
Junio cae en picado y julio es prácticamente cero.

Esto tiene una consecuencia directa para el lanzamiento: la ventana buena para
captar familias son **septiembre y enero**, y muy especialmente los días
posteriores a la entrega de notas. Lanzar en junio sería lanzar contra el peor mes
del calendario.

### 4.5 Cuánto dura una relación

| | Valor |
|---|---:|
| Duración media de una pareja familia-profesor | 16,2 semanas (3,7 meses) |
| Mediana | 15,9 semanas |
| Clases por pareja (media / mediana) | 18,3 / 14 |
| Parejas que duran más de 12 semanas | 56 % |
| Parejas de una sola clase | 8 % |

Por familia, sumando todos sus profesores: **31,7 clases de media y 23,4 semanas de
permanencia**. Cada familia pasó por **1,73 profesores** de media, y **22 de las 60
(37 %) cambiaron de profesor** en algún momento del curso.

Dos lecturas para el producto. La primera: **una relación que arranca, aguanta**.
Sólo el 8 % de las parejas se quedó en una clase, y más de la mitad pasó de tres
meses. Eso respalda cobrar una tarifa única por el match en vez de una comisión
por clase: el valor se concentra en el emparejamiento, y el emparejamiento
funciona. La segunda: **el 37 % de reasignaciones no es ruido**. En el modelo
antiguo Lucía reasignaba a mano; en el nuevo, una familia insatisfecha
simplemente vuelve al directorio y paga otra vez. Conviene decidir si eso se cobra
íntegro, se descuenta o se regala, porque afecta a una de cada tres familias.

### 4.6 Recomendación: qué mostrar y dónde

La pregunta era si compensa un contador por profesor, sólo una cifra agregada en
portada, o ambas. **La respuesta es ambas, pero el contador individual con un
umbral y sin excepciones.**

**En portada, la cifra agregada: sí, sin reservas.** «Más de 1 900 clases
impartidas a 60 familias» es cierto, es comprobable y es exactamente el tipo de
volumen que una plataforma recién nacida no puede fabricar. Va con una nota al pie
que aclare que procede de la etapa anterior del proyecto; sin esa nota es
publicidad engañosa, con ella es historial.

**En la ficha del profesor: sólo si el número aguanta solo.** Aquí es donde los
números obligan a matizar, y merece la pena decirlo claro:

- Para los 46 que dieron clase, **la mediana de 28 clases es una cifra buena**. No
  es un contador flojo: 28 clases son siete meses de trabajo semanal con un
  alumno, y 33 de los 46 llegan o superan las 20. Ese contador aporta
  credibilidad real.
- Para los **72 restantes, el 61 % del directorio, el contador es cero**. Y un
  perfil que muestra «0 clases impartidas» al lado de otro que muestra «47» no es
  neutro: es una etiqueta de novato puesta por la propia plataforma, en un
  directorio donde el 61 % la llevaría.

De ahí la regla concreta:

> Mostrar `clases_historicas` en la ficha **sólo a partir de 20 clases** —33
> profesores hoy—. Por debajo de ese umbral, no mostrar nada: ni cero, ni «sin
> datos», ni un contador vacío. La ausencia del dato no dice nada; un cero dice
> algo malo y falso.

El umbral de 20 no es arbitrario: es el punto donde el contador deja de ser
anecdótico y empieza a describir una relación sostenida, y coincide con el primer
cuartil largo de la distribución. Si más adelante el directorio crece y la
proporción de profesores con historial cae, el umbral debería subir, no bajar.

Tres precisiones de implementación:

**El contador cuenta clases, no horas.** «47 clases» se entiende mejor que «52,5
horas» y evita la conversación sobre duraciones desiguales.

**La suma de los contadores no cuadrará con la cifra de portada** (1 615 frente a
1 904), por las 289 clases sin profesor identificable. Es correcto y nadie lo va a
sumar, pero conviene que quede escrito para que dentro de un año nadie lo
interprete como un error.

**El dato se congela.** `profesores.clases_historicas` es un número fijo de la
etapa anterior; no crece con la actividad de la plataforma nueva, porque la
plataforma nueva no registra clases. Merece un texto que lo deje claro en la
ficha: «47 clases impartidas con AcademiAvanza antes de la plataforma».

**Lo que no recomiendo mostrar:** la duración media de la relación, el número de
familias por profesor y la estacionalidad. Son excelentes para que Lucía decida y
pésimos de cara al público: con 46 profesores, cualquier corte fino permite
identificar a personas concretas, y son alumnos menores de edad.

---

## 5. Migrar frente a empezar de cero

### 5.1 A favor de migrar

**El directorio arranca con contenido.** Es el argumento decisivo. Una plataforma
de dos caras vacía no tiene forma de arrancar: las familias no entran si no hay
profesores, y los profesores no se registran si no hay familias. Migrar rompe ese
punto muerto por el lado de la oferta.

**Los datos académicos no caducan.** Una nota de EVAU, un título de Cambridge o el
colegio de procedencia son los mismos hoy que hace dos años. Es exactamente la
información más cara de recopilar y la que no pierde vigencia.

**Reduce la fricción de alta.** Un profesor que recibe un enlace con su ficha
medio hecha y sólo tiene que revisarla completa el proceso mucho más a menudo que
uno al que se le presenta un formulario en blanco.

**Es una excusa natural para reactivar la red.** El correo de «hemos montado algo
nuevo, revisa tu perfil» es mucho mejor que un «vuelve a registrarte».

**Preserva la relación existente.** Estas personas ya trabajaron con Lucía. Pedirles
que empiecen de cero transmite que su historial no cuenta.

### 5.2 En contra de migrar

**Calidad desconocida.** Son dos años de texto libre en formularios de Google. Habrá
duplicados, erratas, campos vacíos y respuestas que no encajan con la pregunta. La
limpieza es trabajo real y no del todo automatizable.

**Riesgo de arrastrar el desorden.** Si la transformación se hace de forma
descuidada, el resultado es una base de datos nueva con los problemas de la vieja.
Es lo que evita el diseño en dos etapas descrito más abajo.

**Perfiles que ya no están activos.** Parte de esos profesores habrán terminado la
carrera, se habrán mudado o simplemente no querrán seguir. Ocupan sitio y ensucian
las métricas.

**Complejidad de RGPD.** Migrar datos personales —y más aún de menores— exige base
legal, información previa y trazabilidad. Es asumible, pero es trabajo.

**Coste de desarrollo.** El proceso de importación, validación y reclamación de
perfiles no es gratis: es una funcionalidad completa, con su interfaz y su lógica.

### 5.3 Conclusión

**Migrar, pero de forma selectiva y con validación obligatoria.** El coste de
limpieza se paga una sola vez; el beneficio de arrancar con un directorio poblado
condiciona si la plataforma despega o no.

La regla que resuelve la mayoría de las dudas es sencilla: **se migra lo que no
caduca; se pide de nuevo lo que sí.**

---

## 6. Estrategia de carga

### 6.1 Diseño en dos etapas

```
   Excel / CSV
        │
        ▼
   ┌─────────────────┐   Volcado literal. Todo TEXT. Sin validar.
   │  esquema legacy │   Si una fila viene rara, entra igual.
   └────────┬────────┘   Objetivo: la carga nunca falla.
            │
            ▼  transformación (repetible)
   ┌─────────────────┐   Normalización, deduplicado, tipado.
   │  esquema app    │   Lo que no se puede mapear se marca,
   └────────┬────────┘   nunca se descarta en silencio.
            │
            ▼
   Perfiles en estado «importado», ocultos al público
            │
            ▼  enlace de reclamación por email
   Perfil validado por su titular → visible en el directorio
```

Separar las dos etapas hace la carga **repetible**. Si aparece un error de mapeo,
se corrige la transformación y se vuelve a ejecutar sin tocar el Excel original.

### 6.2 Fases

**Fase 1 — Volcado.** Los ficheros se cargan tal cual en el esquema `legacy`. Cada
ejecución queda registrada en `legacy.cargas` con su recuento de filas.

**Fase 2 — Normalización de catálogos.** Antes de transformar nada, se extraen los
valores distintos de las columnas de texto libre —colegios, asignaturas, cursos,
certificaciones— y se construye la tabla de equivalencias. Es la fase con más
trabajo manual y la que más condiciona la calidad del resultado.

**Fase 3 — Deduplicación.** Clave principal: el email normalizado. Clave secundaria:
el teléfono. Los casos ambiguos se resuelven a mano.

**Fase 4 — Transformación.** Creación de los registros en `app.*`, con
`origen = 'migracion'` y `datos_validados = FALSE`. Los profesores quedan en estado
`importado`: existen en la base de datos pero no aparecen en el directorio.

**Fase 5 — Invitación.** Se genera un token de un solo uso por perfil y se envía un
correo con el enlace de revisión. El envío es escalonado, no masivo: primero un
grupo pequeño para detectar problemas.

**Fase 6 — Validación por el titular.** El profesor revisa sus datos, corrige lo que
haga falta, rellena lo obligatorio que falte —disponibilidad, biografía, foto— y
publica. Sólo entonces pasa a `activo` y aparece en el directorio.

### 6.3 Reglas de decisión durante la transformación

| Situación | Acción |
|---|---|
| Email vacío o mal formado | No se migra. Sin email no hay forma de invitar. |
| Email duplicado | Se conserva el registro más reciente; el resto se marca para revisión |
| Colegio no reconocido | Se guarda en `colegio_otro` y se marca para revisión manual |
| Nota ilegible o ausente | Se deja a `NULL`. Se pedirá al validar. |
| Titulación no separable | Se vuelca íntegra en `otros_estudios` y se marca |
| Asignatura no reconocida | Se registra la incidencia y se revisa el catálogo |
| Fila sin nombre | No se migra |

Ninguna fila se descarta sin dejar rastro: todas conservan su registro en `legacy`
con el motivo en la columna `incidencias`.

---

## 7. Protección de datos

La decisión de migrar también los datos de familias y alumnos exige una serie de
medidas que no son opcionales.

**Base legal.** El interés legítimo en la continuidad del servicio es defendible
para el contacto de los adultos. Para los datos del menor, el planteamiento más
sólido es minimizar hasta lo imprescindible —nombre de pila, curso y colegio— y
recabar la confirmación del progenitor en el primer acceso.

**Información previa.** Antes o durante el primer contacto hay que informar de qué
datos se conservan, con qué finalidad y cómo ejercer los derechos. El correo de
invitación es el vehículo natural.

**Minimización aplicada al modelo.** El diseño ya la incorpora: del menor sólo se
guarda nombre de pila e inicial del apellido; de la dirección, sólo la zona; y el
teléfono de Bizum se elimina por completo.

**Acceso restringido.** El esquema `legacy` contiene los datos crudos sin depurar,
incluidos los de menores. El rol de la aplicación no tiene acceso, y el rol de sólo
lectura tampoco. Sólo el rol nominal de administración.

**Plazo de retención.** Conviene fijar uno para los perfiles migrados que nunca se
reclaman. Una propuesta razonable son doce meses desde la invitación, tras los
cuales se eliminan.

**Derecho de oposición.** Cualquier persona debe poder pedir la eliminación de su
perfil migrado sin necesidad de registrarse antes. Basta un enlace de baja directa
en el propio correo de invitación.

---

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Baja tasa de reclamación de perfiles | Alto | Envío escalonado, dos recordatorios, mensaje personal de Lucía |
| Calidad del texto libre peor de lo previsto | Medio | Etapa de normalización con revisión manual; la carga es repetible |
| Duplicados no detectados | Medio | Doble clave (email + teléfono) y revisión de ambiguos |
| Queja por uso de datos previos | Bajo pero sensible | Información clara y baja en un clic desde el propio correo |
| El histórico de clases no es reconciliable con los profesores | **Descartado** | Comprobado: los 46 profesores con clases se corresponden todos con alguien del censo (40 literalmente, 5 por nombre y primer apellido, 1 con errata). Lo que sí queda sin atribuir es el 15,2 % de clases marcadas «sustituto» o «anterior» |
| El email no basta como clave de reconciliación | **Alto** | Confirmado: falta en el 30-40 % de los registros. Se pasa a teléfono como clave principal (apartado 2.4) |
| Deduplicar por email fusiona hermanos | Medio | Siete emails de familias están repetidos porque son hermanos. La clave de alumno debe incluir el nombre, no sólo el contacto del progenitor |
| El contador de clases desprestigia al 61 % del directorio | Medio | Umbral de 20 clases y ausencia total del dato por debajo (apartado 4.6) |

---

## 9. Trabajo pendiente

- [x] **Acceder a los ficheros reales** — están en `database/etl/datos/`, excluidos del repositorio
- [x] Análisis de volumetría y calidad de las fuentes (son cuatro, no tres: apartado 2.4)
- [x] **Recuento y análisis del histórico de clases** — apartado 4
- [x] Extracción de valores distintos de las columnas de texto libre — apartado 2.5
- [x] Ampliación del catálogo de colegios con los realmente presentes — `database/seeds/01_colegios.sql`
- [ ] Construcción de las tablas de equivalencias de asignaturas, cursos y certificados
- [ ] Corrección manual de las filas descuadradas de la hoja `PADRES`
- [ ] Decisión sobre las 289 clases sin profesor identificable
- [ ] Obtención de los logos de los colegios
- [ ] Redacción del correo de invitación
- [ ] Plan de contacto por WhatsApp para los perfiles sin email
- [ ] Redacción del texto informativo de protección de datos
- [ ] Implementación de los guiones de transformación
- [ ] Prueba de carga completa en entorno de desarrollo

---

*Documento vivo. Última actualización: agosto de 2026, tras el análisis de los
ficheros originales.*
