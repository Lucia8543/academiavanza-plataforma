# Sistema de diseño

Especificación visual para el desarrollo. Ver también
[identidad y marca](identidad-y-marca.md) y [mapa de pantallas](mapa-de-pantallas.md).

---

## 1. Color

### Paleta

```
── Principal ─────────────────────────────────────────────────
verde-avanza          #2E7D5E    Acciones principales, marca
verde-avanza-claro    #E8F5EF    Fondos destacados, badge verificado
verde-avanza-oscuro   #256650    Estado hover

── Secundario ────────────────────────────────────────────────
azul-confianza        #1A4A7A    Títulos, enlaces
azul-confianza-claro  #E8F0F8    Fondos informativos

── Neutros ───────────────────────────────────────────────────
carbon                #1F2937    Texto principal, pie de página
gris-medio            #6B7280    Texto secundario
gris-claro            #F3F4F6    Fondos alternos, campos
gris-borde            #E5E7EB    Bordes
blanco                #FFFFFF    Fondo base

── Estado ────────────────────────────────────────────────────
exito                 #16A34A    Aceptada, pagada, activo
aviso                 #D97706    Pendiente, plazo por vencer
error                 #DC2626    Rechazada, caducada, errores
estrella              #F59E0B    Valoraciones
```

### Contraste

Verificado contra WCAG 2.1 nivel AA:

| Combinación | Ratio | Resultado |
|---|---|---|
| carbon sobre blanco | 17,3:1 | ✅ |
| verde-avanza sobre blanco | 5,4:1 | ✅ |
| blanco sobre verde-avanza | 5,4:1 | ✅ |
| gris-medio sobre blanco | 4,8:1 | ✅ |
| azul-confianza sobre blanco | 9,1:1 | ✅ |

**El color nunca es el único portador de información.** Los estados de una
propuesta llevan siempre icono y texto además del color, para que funcionen con
daltonismo y en impresión.

### Uso por contexto

| Elemento | Color |
|---|---|
| Botón principal | verde-avanza, texto blanco |
| Botón secundario | borde y texto verde-avanza, fondo blanco |
| Botón destructivo | error |
| Badge de colegio verificado | fondo verde-avanza-claro, texto verde-avanza |
| Colegio sin verificar | fondo gris-claro, texto gris-medio, sin logo |
| Estado «enviada» | aviso |
| Estado «aceptada» | exito |
| Estado «pagada» | verde-avanza |
| Estado «rechazada» / «caducada» | gris-medio |
| Aviso de plazo por vencer | aviso |

---

## 2. Tipografía

```
Títulos    Plus Jakarta Sans    600, 700, 800
Texto      Inter                400, 500, 600
```

Ambas de Google Fonts, cargadas con `font-display: swap` y solo con los pesos
listados.

### Escala

| Nivel | Escritorio | Móvil | Peso |
|---|---|---|---|
| Titular de portada | 40 / 48 | 30 / 38 | 700 |
| Título de sección | 30 / 38 | 24 / 32 | 700 |
| Subtítulo | 24 / 32 | 20 / 28 | 600 |
| Título de tarjeta | 18 / 26 | 17 / 24 | 600 |
| Texto grande | 17 / 28 | 16 / 26 | 400 |
| Texto base | 15 / 24 | 15 / 24 | 400 |
| Texto pequeño | 13 / 20 | 13 / 20 | 400 |
| Pie | 12 / 16 | 12 / 16 | 400 |

Medidas en píxeles, como `tamaño / interlineado`.

**Ancho de línea:** máximo 70 caracteres en bloques de texto largo.

---

## 3. Espaciado y disposición

Escala en múltiplos de 4: `4, 8, 12, 16, 24, 32, 48, 64, 96`.

**Rejilla:** 12 columnas en escritorio con ancho máximo de 1200 px, 8 en tableta,
4 en móvil. Margen lateral de 16 px en móvil, 24 px en tableta, 32 px en escritorio.

**Puntos de ruptura:** 640, 768, 1024, 1280, 1536.

**Radios:** 4 px en elementos pequeños, 8 px en botones y campos, 12 px en
tarjetas, 16 px en modales, circular en avatares y píldoras.

**Sombras:**

```
sutil      0 1px 2px rgba(0,0,0,.05)      campos
tarjeta    0 2px 8px rgba(0,0,0,.08)      tarjetas
elevada    0 8px 24px rgba(0,0,0,.12)     hover, menús
modal      0 20px 48px rgba(0,0,0,.18)    diálogos
```

---

## 4. Componentes

### 4.1 Badge de colegio

El componente característico del producto.

```
┌──────────────────────────────┐
│ [logo]  Montpellier      ✓   │   verificado
└──────────────────────────────┘
   fondo verde-avanza-claro · texto verde-avanza · 12px 600

┌──────────────────────────────┐
│  Colegio San Patricio        │   declarado, sin verificar
└──────────────────────────────┘
   fondo gris-claro · texto gris-medio · sin logo · sin ✓
```

Tres tamaños: pequeño para la tarjeta del directorio, mediano para la cabecera del
perfil, grande para la portada.

Al pasar el cursor sobre la marca de verificación, aparece la explicación:
«Procedencia comprobada por AcademiAvanza».

### 4.2 Tarjeta de profesor

```
┌─────────────────────────────────────────┐
│  ⬤ 64px      Ana G.                     │
│              2º Medicina · UAM          │
│              ★ 4,8 (12)                 │
│                                         │
│  [logo] Montpellier ✓                   │
│                                         │
│  Matemáticas · Física · Química  +2     │
│  ESO · Bachillerato                     │
│                                         │
│  💻 Online   📍 Chamartín                │
│  ~16 €/h orientativo                    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        Ver perfil                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Sombra `tarjeta`, radio 12, fondo blanco. Al pasar el cursor, sombra `elevada` y
borde verde suave. Toda la tarjeta es pulsable, no solo el botón.

Si no acepta alumnos, se atenúa al 60 % y muestra la etiqueta «Sin plazas».

### 4.3 Estados de propuesta

Siempre icono + texto + color, nunca solo color.

| Estado | Icono | Etiqueta |
|---|---|---|
| enviada | ⏳ | Esperando respuesta |
| aceptada | ✓ | ¡Disponible! Desbloquea el contacto |
| pagada | 🔓 | Contacto desbloqueado |
| rechazada | ✕ | No disponible |
| caducada | ⏱ | Sin respuesta a tiempo |
| caducada_pago | ⏱ | Plazo de pago vencido |

### 4.4 Cuenta atrás

Para plazos de respuesta y de pago.

Más de 24 h en gris-medio; entre 24 y 6 h en aviso; menos de 6 h en error y con
peso 600. Texto en lenguaje natural: «Quedan 6 horas», no «05:47:12». La precisión
al segundo genera ansiedad y no aporta nada.

### 4.5 Botones

```
Principal     fondo verde-avanza · texto blanco · 12px 24px · radio 8 · 15px 500
Secundario    borde 1,5px verde-avanza · texto verde-avanza · fondo blanco
Fantasma      sin fondo ni borde · texto verde-avanza
Destructivo   fondo error · texto blanco
```

Altura mínima táctil de 44 px. Estado de carga con indicador y botón deshabilitado
para evitar dobles envíos. Foco visible con anillo de 2 px.

### 4.6 Campos de formulario

Borde `gris-borde` de 1,5 px, radio 8, relleno 12/16, texto de 15 px. Al enfocar,
borde verde-avanza y sombra sutil. En error, borde rojo y mensaje debajo.

**Los mensajes de error explican qué hacer**, no solo qué está mal: «Nos falta tu
teléfono para que el profesor pueda contactarte».

Etiqueta siempre visible encima. Nunca se usa el marcador de posición como
etiqueta: desaparece al escribir y deja al usuario sin referencia.

### 4.7 Filtros del directorio

En escritorio, columna lateral fija. En móvil, panel deslizante desde abajo con
botón flotante que muestra el número de filtros activos.

El filtro de colegio va siempre primero, con logo y recuento por opción.

Los filtros activos aparecen como píldoras eliminables sobre los resultados, con
un enlace de «Quitar todos».

### 4.8 Estado vacío

Ilustración, un título que explique la situación, y **siempre una acción
concreta**. En el directorio, además, el número de resultados que se obtendrían al
relajar cada filtro.

---

## 5. Iconografía

**Lucide React.** Trazo de 1,5 px, tamaños de 16, 20 y 24.

| Icono | Uso |
|---|---|
| `GraduationCap` | Profesor, titulación |
| `School` | Colegio |
| `BadgeCheck` | Verificado |
| `BookOpen` | Asignatura |
| `Star` | Valoración |
| `Clock` | Plazo, disponibilidad |
| `MapPin` | Zona, presencial |
| `Monitor` | Online |
| `MessageCircle` | WhatsApp |
| `Lock` / `Unlock` | Contacto bloqueado / desbloqueado |
| `Send` | Enviar propuesta |
| `Users` | Familia, alumnos |

Todo icono decorativo lleva `aria-hidden`. Todo icono con función lleva
`aria-label`.

---

## 6. Movimiento

Discreto y funcional. 150 ms para cambios de estado, 200 ms para entradas y
salidas, 300 ms para paneles y modales. Curva `ease-out` al entrar, `ease-in` al
salir.

Se anima opacidad y transformación, nunca propiedades que fuercen recálculo de
disposición.

**Se respeta `prefers-reduced-motion`:** con esa preferencia activa, las
transiciones se reducen a cambios instantáneos.

---

## 7. Accesibilidad

Objetivo: **WCAG 2.1 nivel AA**.

- Contraste mínimo de 4,5:1 en texto normal y 3:1 en texto grande
- Todo navegable con teclado, con orden de tabulación lógico
- Foco siempre visible, nunca suprimido
- Etiquetas asociadas a sus campos
- Errores anunciados por lector de pantalla mediante `aria-live`
- Área táctil mínima de 44 × 44 px
- Estructura de encabezados coherente, sin saltos de nivel
- Texto alternativo en toda imagen con contenido
- El color nunca es el único portador de información

---

## 8. Rendimiento

| Métrica | Objetivo |
|---|---|
| Puntuación Lighthouse | > 90 en las cuatro categorías |
| LCP | < 2,5 s |
| CLS | < 0,1 |
| INP | < 200 ms |

Imágenes en WebP con respaldo, dimensiones declaradas para evitar saltos, carga
diferida fuera del área visible, y fuentes con `swap` y precarga de la principal.
