# Cómo se trabaja en este repositorio

Este fichero es el contrato de trabajo del proyecto. Lo lee Claude antes de tocar
nada, y lo lee cualquier persona que se incorpore.

No repite lo que ya está en [`README.md`](README.md) ni en
[`docs/`](docs/README.md): recoge **los principios, los límites y las trampas
conocidas**. Si algo de aquí contradice a un documento de `docs/`, gana `docs/` y
hay que corregir este fichero.

---

## 1. El contexto que lo explica casi todo

AcademiAvanza era un servicio gestionado a mano. Lucía recibía solicitudes,
emparejaba, cobraba bonos y pagaba a los profesores cada domingo por Bizum. Este
repositorio es el rediseño de ese servicio **como plataforma que funciona sin
ella**, porque se va de Erasmus.

De ahí sale el criterio que resuelve la mayoría de las dudas de diseño:

> **Cualquier flujo que exija la presencia de Lucía es un defecto, no una
> funcionalidad.**

Si una propuesta de solución implica «y entonces alguien revisa», está mal
planteada salvo que ese alguien sea el propio usuario.

---

## 2. Las cinco cosas que no se tocan

Están en [`docs/README.md`](docs/README.md) y se repiten aquí porque son las que
más se olvidan a mitad de una tarea:

1. **La plataforma no gestiona los pagos de las clases.** Ni bonos, ni saldos, ni
   liquidaciones. Ese dinero va directo entre familia y profesor.
2. **La propuesta es gratis; solo se paga si el profesor acepta.**
3. **El badge del colegio es el producto.** Solo se muestra si administración ha
   verificado la procedencia.
4. **El precio es configurable desde el panel**, no es una constante del código.
5. **Nada debe requerir intervención diaria.**

Fuera de alcance de forma indefinida: pagos de clases, calendario, aula virtual,
mensajería interna y seguimiento académico. Si una tarea empuja hacia ahí, hay que
parar y preguntar, no implementarlo «por si acaso».

---

## 3. Antes de escribir la primera línea

Orden de lectura mínimo, en este orden:

1. [`docs/02-producto/00-vision-y-alcance.md`](docs/02-producto/00-vision-y-alcance.md)
2. [`docs/02-producto/prd-04-flujo-match.md`](docs/02-producto/prd-04-flujo-match.md) — el núcleo
3. [`docs/04-tecnico/diagramas-modelo-datos.md`](docs/04-tecnico/diagramas-modelo-datos.md)
4. El PRD concreto de lo que se vaya a tocar

Y los tres ADR, que explican por qué el proyecto es raro donde lo es:
cobrar solo el match, separar frontend y backend por carpetas, y nombrar la base
de datos en español.

---

## 4. Datos personales: la regla dura

**Ningún fichero con datos personales reales entra en el repositorio, ni siquiera
siendo privado.** Los Excel del histórico contienen nombres, teléfonos, direcciones
y correos de **menores de edad**.

- Viven en `database/etl/datos/` y `database/etl/analisis/salida/`, ambas excluidas
  en `.gitignore`.
- Tras cualquier tarea que los toque: `git status --ignored` y comprobar que siguen
  ignorados. Si aparece un `.xlsx`, un `.csv` o un PDF de esa carpeta en un
  `git status` normal, algo va mal y hay que parar.
- Los datos de ejemplo para pruebas se **inventan**, no se recortan de los reales.
- En documentación, capturas o mensajes de commit: cifras agregadas, nunca nombres.

Del menor solo se guardan nombre de pila, inicial del apellido, curso y colegio.
Esa minimización ya está en el modelo de datos y no se relaja por comodidad.

**Los ficheros de ofimática se abren y se miran por dentro.** Un `.docx` o un
`.pptx` es un contenedor comprimido: por fuera parece un documento de trabajo y por
dentro puede llevar un IBAN, un teléfono o el nombre de una alumna. La comprobación
por extensión no basta.

**Dos precedentes, y los dos son el mismo error:**

El `.gitignore` original excluía `db/etl/datos/`, carpeta que no existía. La
exclusión no protegía nada y solo el patrón `*.xlsx` evitó el problema. Las rutas
de `.gitignore` se comprueban, no se suponen.

Al ordenar la carpeta, cinco plantillas de mensajes en `.docx` se clasificaron como
documentación de negocio y entraron en `docs/01-negocio/`. Se comprobó que no se
colara ningún Excel ni PDF, pero no se abrió ningún Word. Tres de ellos contenían
el IBAN de Lucía y uno los nombres de dos alumnas y su madre. Llegaron a publicarse
en GitHub y hubo que reescribir el historial.

La lección de ambos es la misma: **lo que no se ha mirado, no está comprobado.**

---

## 5. Estructura y reglas de dependencia

```
app  →  frontend  →  shared
 │                      ↑
 └───→  backend  ───────┘
```

`frontend` nunca importa de `backend`, ni al revés. Solo `repositories` habla con
Prisma; ningún servicio, ruta o componente lo hace directamente. Esto lo hace
cumplir ESLint, así que si una regla estorba, la conversación es sobre el diseño,
no sobre desactivar la regla.

Dónde va cada cosa está en el árbol del [`README.md`](README.md). Dos avisos:

- **`src/backend/services/` es donde vive la regla de negocio.** Si aparece lógica
  de negocio en un componente o en una ruta, está en el sitio equivocado.
- **`docs/` no es un cajón.** Cada documento va en su carpeta temática, con nombre
  en minúsculas y guiones. Nada suelto en la raíz del repositorio.

---

## 6. Idioma

| Qué | Idioma |
|---|---|
| Documentación, comentarios, interfaz, commits | Español |
| Código: variables, funciones, tipos, ficheros | Inglés |
| **Esquema de base de datos** | **Español** |

La excepción del esquema es deliberada y está razonada en
[ADR 0003](docs/adr/0003-esquema-base-datos-en-espanol.md): Lucía consulta la base
de datos desde un cliente SQL con su propio usuario de lectura y escritura. Una
columna `nota_evau` se lee sin traducir; `evau_score` no.

La documentación se escribe **en prosa**, explicando el porqué al lado de la
decisión. Las listas de viñetas sin frases alrededor son un mal síntoma.

---

## 7. Base de datos

- Los ficheros de `database/schema/` se ejecutan **en orden numérico**: hay
  dependencias de claves foráneas.
- Un cambio de esquema es un fichero nuevo o una migración de Prisma, nunca una
  edición silenciosa de un fichero ya aplicado.
- Los seeds son idempotentes: `ON CONFLICT (slug) DO NOTHING`. Deben poder
  ejecutarse dos veces sin romper nada.
- Lucía tiene un rol nominal de lectura y escritura. El esquema `legacy` contiene
  datos crudos de menores y **no es accesible ni por el rol de la aplicación ni por
  el de solo lectura**.

---

## 8. Migración del histórico

Todo el detalle está en
[`docs/05-migracion/informe-migracion.md`](docs/05-migracion/informe-migracion.md).
Lo que hay que saber de memoria para no equivocarse:

- **Hay cinco copias del Excel, no una, y la más reciente no lo contiene todo.** Le
  faltan 278 clases que sí están en las antiguas. La fuente es la **unión de las
  cinco**, que produce `database/etl/analisis/consolidar.py`.
- **La clave de reconciliación es el teléfono, no el email.** El email falta en el
  30-40 % de los registros; el teléfono está en el 97-99 %.
- **Deduplicar familias por email fusiona hermanos.** La clave de alumno tiene que
  incluir su nombre, no solo el contacto del progenitor.
- **El 15,2 % de las clases no tiene profesor identificable** («sustituto»,
  «anterior»). No se reparten ni se estiman: se dejan sin atribuir.
- **Se migra lo que no caduca; se pide de nuevo lo que sí.** Disponibilidad
  horaria, horas semanales y fecha de inicio no se migran. El teléfono de Bizum se
  elimina.
- Los perfiles migrados quedan **ocultos** hasta que su titular los valide.
- Ninguna fila se descarta en silencio: lo que no se puede mapear se marca en
  `incidencias`.

---

## 9. Honestidad con los números

El histórico es material de marketing, y por eso hay que tratarlo con más cuidado,
no con menos.

- Las cifras que se muestran al público salen de los guiones de
  `database/etl/analisis/`, no de una estimación redondeada hacia arriba.
- **El contador de clases por profesor solo se muestra a partir de 20 clases.** Por
  debajo no se muestra nada: ni cero, ni «sin datos». Un cero es una etiqueta de
  novato puesta por la propia plataforma, y la llevaría el 61 % del directorio.
- La cifra agregada de portada lleva una nota que aclara que procede de la etapa
  anterior del proyecto. Sin esa nota es publicidad engañosa.
- No se publican métricas que permitan identificar a personas concretas. Con 46
  profesores y 66 alumnos menores de edad, casi cualquier corte fino lo permite.

---

## 10. Cómo colaborar en este repositorio

### 10.1 Git y GitHub los maneja Lucía, siempre

**Claude no ejecuta ningún comando que toque el historial de Git ni el repositorio
remoto.** Ni `commit`, ni `push`, ni `pull`, ni `merge`, ni `rebase`, ni `reset`,
ni `checkout` de ramas, ni `tag`, ni `remote`, ni nada que cambie el estado
publicado. Tampoco a través de la interfaz web de GitHub ni de `gh`.

Lo que sí hace Claude es **preparar los ficheros en el disco** —crear, editar,
mover, renombrar— y **darle a Lucía los comandos para que los suba ella**.

Cuando haya algo que subir, Claude entrega:

1. **Qué ha cambiado y por qué**, en dos o tres frases. Nada de listados de
   ficheros sin contexto.
2. **La comprobación de datos personales antes de nada**, porque es el error que no
   se puede deshacer una vez publicado.
3. **Los comandos, uno por uno y en el orden correcto**, listos para pegar en
   PowerShell.
4. **Qué hace cada comando**, en una línea por comando y en castellano llano. No se
   pega un comando sin saber qué hace.
5. **Qué debería verse al ejecutarlo**, para poder distinguir «ha ido bien» de «ha
   pasado algo raro».
6. **Dónde parar.** Si un comando puede dar un resultado que cambie los siguientes
   —típicamente `git fetch` y `git branch -r`—, Claude lo marca como punto de
   parada y espera a ver la salida real antes de seguir.

Ejemplo del formato esperado:

> ```powershell
> git add -A
> ```
> Marca todos los cambios para el próximo commit. Todavía no guarda nada.
>
> ```powershell
> git status --ignored --short | Select-String '^!!'
> ```
> Comprueba que las carpetas con datos personales siguen excluidas. Debe devolver
> exactamente `database/etl/datos/` y `database/etl/analisis/salida/`. Si devuelve
> algo más, para aquí.

Sólo hay una excepción, y es de lectura: Claude puede ejecutar comandos que
**consultan** el estado sin modificar nada —`git status`, `git diff`, `git log`,
`git show`— para saber qué está pasando antes de proponer nada. Si tiene dudas de
si un comando modifica algo, no lo ejecuta y lo pregunta.

El motivo no es desconfianza: es que el historial publicado es lo único de este
proyecto que no se puede rehacer desde cero, y quien responde de lo que hay en
GitHub es Lucía.

### 10.2 El resto

**Lo que no encaja se pregunta, no se decide.** Si un fichero, un dato o un
requisito no cabe en ninguna categoría, se deja donde está y se avisa. Es
preferible una pregunta a un movimiento silencioso que nadie recuerda seis meses
después.

**Lo que duplica o contradice se señala, no se fusiona.** En `docs/01-negocio/` y
`docs/03-diseno/assets/` hay material de un modelo de suscripción mensual que
contradice el [ADR 0001](docs/adr/0001-cobrar-solo-el-match.md). Está ahí a
propósito, pendiente de decisión. No se mezcla con la documentación nueva ni se
borra por iniciativa propia.

**Las decisiones no evidentes se registran.** Si al resolver algo se elige entre
dos caminos razonables, eso es un ADR nuevo en `docs/adr/`, no un comentario en el
código.

**Los números se contrastan.** Cualquier cifra que entre en la documentación tiene
que poder reproducirse ejecutando un guion del repositorio. Si no se puede
reproducir, no entra.

---

## 11. Antes de dar algo por terminado

```bash
pnpm lint          # estilo y reglas de dependencia
pnpm typecheck     # tipos, incluidos los de las pruebas
pnpm test          # unitarias: funciones puras, sin base de datos
pnpm build         # que compile de verdad

git status --ignored   # que ningún dato personal se haya colado
```

Hay un quinto comando que **no se ejecuta en local**, `pnpm test:integracion`.
Recorre los flujos completos —crear, aceptar, cobrar, el vale, las tareas
diarias— contra un PostgreSQL de verdad, y necesita uno levantado. Lo ejecuta
GitHub en cada subida, así que basta con mirar que el CI salga en verde.

Si alguna vez hace falta lanzarlo a mano, exige una base de datos de usar y
tirar: se niega a arrancar si `DATABASE_URL` apunta a Supabase o si la base no
se llama `academiavanza_test`. No es una molestia, es lo que impide que unas
pruebas que vacían tablas se lleven por delante los datos de las familias.

Estas pruebas existen porque los dos fallos más graves que ha tenido la
plataforma —el precio que se quedaba a cero y abría los teléfonos sin cobrar, y
el aviso de pago que dejaba solicitudes vivas para siempre— pasaron los cuatro
comandos de arriba sin despeinarse. El estilo estaba bien, los tipos estaban
bien, las unitarias pasaban y compilaba.

Todos son de sólo lectura o de comprobación, así que Claude puede ejecutarlos. Lo
que viene después —preparar, guardar y publicar el cambio— es de Lucía, con los
comandos y las explicaciones del apartado 10.1.

Y una comprobación que no automatiza nadie: **¿esto obliga a Lucía a intervenir?**
Si la respuesta es sí, no está terminado. La única excepción es Git: ahí la
intervención es deliberada.

---

## 12. Estado actual

| Fase | Estado |
|---|---|
| Investigación, producto, diseño, arquitectura | Hecho |
| Modelo de datos | Hecho, validado contra PostgreSQL 16 |
| Análisis de migración | Hecho, contrastado con los ficheros reales |
| Catálogo de colegios | 82 centros, 73 extraídos de los datos reales |
| Tablas de equivalencias de asignaturas, cursos e idiomas | Pendiente |
| Desarrollo | No iniciado |

Lo siguiente, por orden: las tablas de equivalencias, los guiones de
transformación del ETL, y después la versión 1 según
[`docs/04-tecnico/plan-desarrollo.md`](docs/04-tecnico/plan-desarrollo.md).

---

*Documento vivo. Si una regla de aquí estorba de forma repetida, probablemente esté
mal la regla: se discute y se cambia, no se ignora.*
