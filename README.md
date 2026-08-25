<div align="center">

# AcademiAvanza

**Directorio verificado de profesores particulares.**
Las familias encuentran profesor sabiendo de qué colegio viene cada uno.

*Repositorio privado · Madrid*

</div>

---

## Qué es

AcademiAvanza empezó como un servicio gestionado a mano: Lucía recibía solicitudes,
buscaba un profesor que encajara, los ponía en contacto por WhatsApp, llevaba las
cuentas en un Excel y cada domingo hacía un Bizum a cada profesor por las clases de
la semana.

Funciona, pero no escala y depende por completo de que ella esté disponible. Este
repositorio contiene el rediseño de ese servicio como plataforma que funciona sola.

### Cómo funciona

Las familias navegan un directorio de profesores verificados y filtran por el
**colegio de procedencia** —el diferencial del producto—, además de por asignatura,
nivel, modalidad y zona.

Cuando encuentran a alguien que encaja, le envían una propuesta **sin coste**. El
profesor la recibe y responde si está disponible. **Solo si acepta**, la familia
paga una tarifa única y obtiene su teléfono. A partir de ahí se organizan por su
cuenta.

```
Buscar → Propuesta (gratis) → El profesor acepta → Pago → Teléfono
```

### Qué NO hace, y es deliberado

**La plataforma no interviene en los pagos de las clases.** No hay bonos, ni
liquidaciones, ni seguimiento de clases. Eso lo acuerdan familia y profesor
directamente.

Es exactamente la carga operativa que el rediseño elimina. Ver
[ADR 0001](docs/adr/0001-cobrar-solo-el-match.md).

---

## Estado

| Fase | Estado |
|---|---|
| Investigación y entrevistas | ✅ |
| Definición de producto | ✅ |
| Sistema de diseño | ✅ |
| Arquitectura técnica | ✅ |
| Modelo de datos | ✅ Validado contra PostgreSQL 16 |
| Análisis de migración | 🟡 Pendiente de los ficheros históricos |
| Desarrollo | ⬜ No iniciado |

---

## Documentación

Índice completo en **[docs/README.md](docs/README.md)**.

Los tres documentos que dan el contexto necesario para entender el resto:

- **[Visión y alcance](docs/02-producto/00-vision-y-alcance.md)** — qué es y qué no es
- **[Flujo de match](docs/02-producto/prd-04-flujo-match.md)** — el núcleo del producto
- **[Diagramas del modelo de datos](docs/04-tecnico/diagramas-modelo-datos.md)** — la forma del sistema

---

## Estructura del repositorio

```
academiavanza-plataforma/
│
├── src/                         Código de la aplicación
│   ├── app/                     Rutas de Next.js. Capa fina que conecta.
│   │
│   ├── frontend/                ── CAPA DE PRESENTACIÓN ──
│   │   ├── components/ui/       Componentes base del sistema de diseño
│   │   ├── components/layout/   Cabecera, pie, navegación
│   │   ├── components/shared/   Badge de colegio, tarjeta de profesor…
│   │   ├── features/            Un módulo por dominio funcional
│   │   ├── hooks/
│   │   └── styles/
│   │
│   ├── backend/                 ── CAPA DE SERVIDOR ──
│   │   ├── services/            Casos de uso. Las reglas de negocio.
│   │   ├── repositories/        Acceso a datos. Único punto que usa Prisma.
│   │   ├── integrations/        Stripe, Resend, WATI, Supabase
│   │   ├── jobs/                Tareas programadas
│   │   └── middleware/          Autenticación, roles, límites
│   │
│   └── shared/                  Compartido entre ambas capas
│       ├── types/
│       ├── schemas/             Validadores Zod
│       └── utils/
│
├── database/                    Base de datos
│   ├── schema/                  12 ficheros SQL, en orden de ejecución
│   ├── seeds/                   Datos iniciales de catálogo
│   ├── migrations/              Migraciones de Prisma
│   └── etl/                     Importación del Excel histórico
│
├── docs/                        Documentación
│   ├── 01-negocio/              Investigación y modelo de negocio
│   ├── 02-producto/             Visión y nueve PRD
│   ├── 03-diseno/               Marca, sistema de diseño y pantallas
│   ├── 04-tecnico/              Arquitectura, datos y plan de desarrollo
│   ├── 05-migracion/            Migración de datos históricos
│   └── adr/                     Decisiones de arquitectura
│
├── tests/                       unit · integration · e2e
├── scripts/                     Utilidades de desarrollo
└── .github/                     Integración continua y plantillas
```

### Reglas de dependencia

```
app  →  frontend  →  shared
 │                      ↑
 └───→  backend  ───────┘
```

`frontend` nunca importa de `backend` y viceversa. Solo `repositories` habla con
Prisma. Se hace cumplir con ESLint, no por convención. Ver
[ADR 0002](docs/adr/0002-separacion-frontend-backend.md).

---

## Pila tecnológica

```
Presentación   Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui
Servidor       Next.js Route Handlers · Prisma · Zod
Datos          PostgreSQL 15 (Supabase) · Auth · Storage
Pagos          Stripe (tarjeta y Bizum)
Avisos         Resend (correo) · WATI (WhatsApp)
Despliegue     Vercel · GitHub Actions
Observación    Sentry · Plausible
```

Las razones de cada elección, y las alternativas descartadas, en
[arquitectura del sistema](docs/04-tecnico/arquitectura-sistema.md).

---

## Puesta en marcha

### Requisitos

Node.js 20+, pnpm 9+, una cuenta de Supabase y otra de Stripe en modo prueba.

### Instalación

```bash
git clone https://github.com/Lucia8543/academiavanza-plataforma.git
cd academiavanza-plataforma

pnpm install
cp .env.example .env.local     # rellenar las variables
```

### Base de datos

El orden importa: hay dependencias de claves foráneas entre ficheros.

```bash
for f in database/schema/*.sql; do psql "$DATABASE_URL" -f "$f"; done
for f in database/seeds/*.sql;  do psql "$DATABASE_URL" -f "$f"; done
```

### Desarrollo

```bash
pnpm dev          # http://localhost:3000
pnpm lint         # estilo y reglas de dependencia
pnpm typecheck    # tipos
pnpm test         # pruebas unitarias
pnpm test:e2e     # extremo a extremo
pnpm build        # compilación de producción
```

---

## Convenciones

### Ramas

```
main              Producción. Protegida, solo por pull request.
develop           Integración. Base del trabajo diario.
feat/<nombre>     Nueva funcionalidad
fix/<nombre>      Corrección
docs/<nombre>     Documentación
db/<nombre>       Cambios de esquema
```

### Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(directorio): añadir filtro por colegio de procedencia
fix(propuestas): corregir el cálculo del plazo de respuesta
docs(migracion): actualizar el mapeo de campos
db(tarifas): añadir vigencia temporal a la tabla de precios
```

### Idioma

Documentación, comentarios e interfaz en **español**. Código en **inglés**.

Excepción deliberada: **el esquema de base de datos está en español**, porque Lucía
lo consulta directamente desde un cliente SQL y una columna `nota_evau` se lee sin
traducir. Ver [ADR 0003](docs/adr/0003-esquema-base-datos-en-espanol.md).

---

## Seguridad

- Ningún secreto en el repositorio. Todo por variables de entorno.
- `.env.local` está en `.gitignore` y debe seguir estándolo.
- **Ningún fichero con datos personales reales entra en el repositorio**, ni
  siquiera siendo privado. Los Excel del histórico contienen datos de menores.
- Credenciales en un gestor de contraseñas, nunca en un fichero del proyecto.
- El repositorio es privado y debe seguir siéndolo.

---

## Licencia

Propiedad de AcademiAvanza. Todos los derechos reservados.
