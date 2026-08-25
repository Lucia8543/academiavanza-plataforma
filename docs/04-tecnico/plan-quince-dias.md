# Plan de construcción · quince días

Plan de trabajo para llegar al lanzamiento del
[directorio mínimo](../02-producto/prd-00-directorio-minimo.md) antes de que Lucía
se vaya de Erasmus. Sustituye al [plan de desarrollo](plan-desarrollo.md) mientras
dure esta etapa; aquel sigue siendo válido para el producto completo con cobro.

**Quince días de trabajo, no quince días de calendario.** Deja al menos tres días
de margen antes de tu fecha de salida: el día 15 es colchón, y aun así conviene
tener aire.

---

## 1. Cómo se reparte el trabajo

**Yo escribo el código.** Todo. Tú no vas a programar.

**Tú haces cuatro cosas:** dar de alta las cuentas que hacen falta, pegar los
comandos que te doy, mirar la pantalla y decirme si eso es lo que querías, y
escribir a los profesores. La última es la más importante y la que nadie puede
hacer por ti.

**Cada día termina con algo que se ve.** Si al final de un día no puedes abrir el
navegador y comprobar el resultado, ese día ha ido mal y hay que replantearlo, no
seguir adelante.

---

## 2. Día 0 · Lo que bloquea y solo puedes hacer tú

Hazlo antes de empezar. Son trámites, no desarrollo, pero si falta alguno el día 1
se para en seco.

| Qué | Dónde | Cuánto tarda |
|---|---|---|
| Cuenta de Supabase | supabase.com, plan gratuito | 5 min |
| Cuenta de Vercel, conectada a tu GitHub | vercel.com, plan gratuito | 5 min |
| Cuenta de Resend para los correos | resend.com, plan gratuito | 5 min |
| Node.js 20 y pnpm instalados | nodejs.org | 15 min |
| Saber dónde está contratado el dominio y poder entrar | tu proveedor | ? |

Y una cosa que no tiene que ver con la plataforma pero es la que más riesgo te
quita esta semana: **pon contraseña a los cinco Excel del histórico**. Tienen
nombres, teléfonos y direcciones de menores, y hoy están sin proteger.

> El dominio es el único que puede dar sorpresas. Si no recuerdas dónde lo
> contrataste, empieza por ahí: lanzamos igual en una dirección temporal, pero es
> mejor saberlo el día 0 que el día 14.

---

## 3. Semana 1 · Que exista

### Día 1 — Una página tuya, en internet

**Yo:** creo el proyecto Next.js con TypeScript y Tailwind sobre el repositorio que
ya tienes, con una portada provisional.

**Tú:** conectas el repositorio a Vercel y pegas cuatro comandos.

**Terminado cuando:** abres una dirección en el navegador, desde el móvil, y ves
algo tuyo. Aunque solo ponga «AcademiAvanza, en obras».

Es el día más importante de los quince. A partir de aquí todo lo demás es añadir.

### Día 2 — La base de datos

**Yo:** preparo el esquema recortado —profesores, catálogos, disponibilidad,
certificaciones y la tabla de contactos— y dejo los seeds listos.

**Tú:** creas el proyecto en Supabase, pegas los comandos que aplican el esquema y
las semillas, y copias tres claves a un fichero de configuración.

**Terminado cuando:** entras en Supabase, abres la tabla `catalogo.colegios` y ves
los 82 centros. Ese es el momento en que el trabajo de análisis empieza a servir
para algo.

### Días 3 y 4 — El formulario de alta del profesor

El formulario más largo del proyecto: datos personales, colegio, carrera,
asignaturas, niveles, modalidad, zona, idiomas, la rejilla de horarios, los puntos
fuertes y el consentimiento.

**Tú:** lo rellenas tú misma como si fueras una profesora. Dos veces. Es la mejor
forma de detectar lo que sobra o falta.

**Terminado cuando:** te has dado de alta a ti misma y el registro aparece en
Supabase.

### Día 5 — Aprobar fichas

La pantalla de administración: lista de pendientes, se abre una, se lee, se aprueba
o se rechaza con un motivo.

**Terminado cuando:** apruebas tu propia ficha **desde el móvil**. Si en el móvil
no se puede, no está hecho: es donde la vas a usar.

---

## 4. Semana 2 · Que funcione

### Días 6 y 7 — El directorio

La rejilla de tarjetas, los seis filtros con «Me es indiferente» por defecto, el
orden aleatorio y los filtros reflejados en la dirección de la página.

**Terminado cuando:** filtras por Montpellier y matemáticas, copias la dirección,
te la mandas por WhatsApp y al abrirla sale la misma lista.

### Día 8 — La ficha del profesor

Con los puntos fuertes, la rejilla de horarios, los certificados declarados, y los
dos avisos: el del colegio declarado y el de que no se comprueban antecedentes.

**Tú:** lee esos dos avisos en voz alta. Si te suenan raros o exagerados, se
reescriben ahora. Son la parte del producto que te protege.

### Día 9 — El formulario de contacto y el correo

Que una familia escriba y que al profesor le llegue un correo con lo que ha
escrito, con el contacto de la familia en *responder a*.

**Terminado cuando:** te escribes a ti misma desde una ficha y te llega el correo.
Compruébalo también en la carpeta de correo no deseado.

### Día 10 — El panel del profesor

Entrada con enlace al correo sin contraseña, edición de la ficha, interruptor de
disponibilidad y baja definitiva.

**Terminado cuando:** entras con el enlace, cambias una asignatura, la ves cambiada
en el directorio, te ocultas y desapareces de la lista.

---

## 5. Semana 3 · Que aguante sola

### Día 11 — El repaso trimestral

La tarea programada y los cuatro correos. Es la pieza que hace que el directorio
siga vivo sin ti.

**Terminado cuando:** lanzamos la tarea a mano, te llega el correo de «¿sigues
disponible?», pulsas «no» y tu ficha desaparece del directorio.

### Día 12 — Los textos

Política de privacidad, aviso legal, condiciones y preguntas frecuentes. Y el
repaso del vocabulario: fuera **verificado**, **comprobado**, **garantizado**,
**avalado** y **certificado** de toda la web.

**Tú:** los lees enteros. Son tuyos y respondes de ellos.

### Día 13 — Tres personas reales

Le pides a tres profesores de confianza que se registren **sin que tú les
expliques nada**. Te sientas al lado y callas.

Es el día que más cosas rompe y el más valioso de los quince. Todo lo que
pregunten en voz alta es un fallo del formulario, no suyo.

**Yo:** arreglo lo que salga, ese mismo día.

### Día 14 — Lanzamiento

Dominio apuntando, revisión final y aviso a los profesores de que ya pueden
entrar.

### Día 15 — Colchón

No planifiques nada. Se va a usar.

---

## 6. Lo que va en paralelo, y es lo que de verdad decide

**Escribir a los profesores.** Empieza el día 6, no el día 14.

El riesgo real de este proyecto no es técnico: es **abrir un directorio vacío**. Si
el día del lanzamiento hay tres fichas, no hay producto, por bien que funcione todo
lo demás.

Tienes 46 profesores que dieron clase el curso pasado, y **29 de ellos son del
Montpellier**, que son los que dieron el 75 % de las clases. Empieza por esos 29,
uno a uno, por WhatsApp y con un mensaje escrito por ti, no un reenvío. Ya te
conocen: es la conversación más fácil que vas a tener en todo el proyecto.

El objetivo mínimo para lanzar: **quince fichas publicadas**. Con menos, el filtro
de asignatura devuelve listas vacías y la primera impresión es de sitio abandonado.

---

## 7. Qué se cae si vamos tarde

Por orden. Lo de arriba se sacrifica primero.

1. **El filtro de disponibilidad.** El horario se sigue viendo en la ficha; solo se
   pierde poder filtrar por él.
2. **El filtro de idioma.** Los certificados se siguen viendo.
3. **La baja automática del repaso trimestral.** El correo se manda igual y el
   interruptor funciona; solo se pierde que la ficha se oculte sola.
4. **El panel del profesor.** Se lanza sin él y las correcciones te las piden a ti
   durante unas semanas. Es feo, pero no impide abrir.

**Lo que no se sacrifica nunca:** la aprobación previa de las fichas, los dos
avisos legales de la ficha y que el correo de contacto llegue de verdad. Sin
cualquiera de esas tres, no se lanza.

---

## 8. Los riesgos, y qué hacer con cada uno

| Riesgo | Qué hacer |
|---|---|
| **El directorio abre vacío** | Empezar a escribir a los 29 del Montpellier el día 6 |
| **Los correos van a spam** | Configurar el dominio en Resend el día 9, no el 14 |
| **No aparece el acceso al dominio** | Lanzar en la dirección temporal y cambiarlo después |
| **Un día se atasca** | Mirar el apartado 7 y recortar, no alargar la jornada |
| **Aparece algo que quieras añadir** | Se apunta y se hace en enero. Ninguna idea nueva entra en estos quince días |

El último es el que más proyectos mata, y es el más difícil de cumplir.

---

## 9. Y el día 16

Te vas. La plataforma sigue sola: los profesores se registran, tú apruebas desde el
móvil cuando te llega el aviso, las familias escriben y el sistema pregunta cada
tres meses quién sigue ahí.

En enero, con el alta de autónoma hecha, se retoma el
[ADR 0001](../adr/0001-cobrar-solo-el-match.md) y se enciende el cobro.
