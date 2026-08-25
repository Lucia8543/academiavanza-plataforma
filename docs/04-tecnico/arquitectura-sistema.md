# Arquitectura del sistema

---

## 1. Objetivos

**Funcionar sin supervisión.** El sistema debe operar semanas sin que nadie lo
toque. Es el requisito que condiciona todos los demás.

**Coste de operación bajo.** Un negocio que factura unos cientos de euros al mes no
puede gastar la mitad en infraestructura.

**Poco que mantener.** No hay equipo técnico. Todo lo que sea administrar
servidores, aplicar parches o vigilar procesos es tiempo que nadie va a dedicar.

**Escalar sin rediseñar.** Se arranca con decenas de usuarios; la arquitectura debe
aguantar miles sin cambiar de forma.

**Acceso directo a los datos.** Lucía debe poder consultar y corregir la base de
datos con un cliente SQL.

---

## 2. Decisiones de fondo

**Monolito modular, no microservicios.** Con un solo desarrollador, repartir el
sistema en servicios multiplica el trabajo de operación sin resolver ningún
problema real. La modularidad se consigue con estructura de carpetas y fronteras
claras dentro de un único despliegue.

**Servicios gestionados.** Base de datos, autenticación, correo, pagos: todo de
terceros. No hay servidores propios que administrar.

**PostgreSQL como red de seguridad.** Las reglas críticas —no revelar un teléfono
sin pago, no reseñar sin match— viven en la base de datos como restricciones, no
solo en el código. Si la aplicación falla, los datos siguen protegidos.

**Frontend y backend separados por carpetas, no por despliegue.** Ver
[ADR 0002](../adr/0002-separacion-frontend-backend.md).

---

## 3. Pila tecnológica

```
Capa de presentación
  Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui
  Lucide React · React Hook Form · Zustand · TanStack Query

Capa de servidor
  Next.js Route Handlers y Server Actions
  Prisma (ORM) · Zod (validación compartida)

Datos
  PostgreSQL 15 gestionado por Supabase
  Supabase Auth · Supabase Storage · Supabase Realtime

Servicios externos
  Stripe (cobros, tarjeta y Bizum)
  Resend + React Email (correo)
  WATI (WhatsApp Business API)

Infraestructura
  Vercel (despliegue y tareas programadas)
  GitHub Actions (integración continua)
  Sentry (errores) · Plausible (analítica)
```

### Por qué cada pieza

**Next.js.** Un solo marco para interfaz y servidor, un solo despliegue, un solo
lenguaje. El renderizado en servidor es imprescindible: el directorio tiene que
posicionar en buscadores.

**Supabase.** PostgreSQL gestionado con autenticación y almacenamiento incluidos.
Lo decisivo aquí es que expone una cadena de conexión estándar, así que Lucía puede
conectarse con DBeaver como a cualquier base de datos. Firebase no lo permitiría.

**Prisma.** Tipado de extremo a extremo y migraciones versionadas.

**Zod.** El mismo esquema valida en el navegador y en el servidor. Una sola
definición, imposible que se desincronicen.

**Stripe.** Estándar del sector, cumple normativa europea, y soporta Bizum de
forma nativa, que es lo que estas familias usan.

**WATI.** Más barato que Twilio para el volumen previsto y con gestión de
plantillas de Meta integrada.

### Descartados

| Alternativa | Motivo |
|---|---|
| WordPress con extensiones | No soporta el flujo de estados ni los procesos programados |
| Firebase | Sin SQL estándar: impediría el acceso directo de Lucía |
| Microservicios | Complejidad de operación sin beneficio a esta escala |
| Django o Rails | Segundo lenguaje que mantener |
| Servidor propio | Alguien tendría que administrarlo |

---

## 4. Estructura del código

```
src/
├── app/                    Rutas de Next.js. Capa fina: solo conecta.
│   ├── (publico)/          Directorio, perfiles, portada
│   ├── (familia)/          Portal privado de la familia
│   ├── (profesor)/         Portal privado del profesor
│   ├── (admin)/            Panel de gestión
│   └── api/                Endpoints y webhooks
│
├── frontend/               TODO lo visual
│   ├── components/ui/      Componentes base del sistema de diseño
│   ├── components/layout/  Cabecera, pie, navegación
│   ├── components/shared/  Badge de colegio, tarjeta de profesor…
│   ├── features/           Un módulo por dominio funcional
│   ├── hooks/
│   └── styles/
│
├── backend/                TODA la lógica de servidor
│   ├── services/           Casos de uso. El corazón de las reglas.
│   ├── repositories/       Acceso a datos. Único sitio que habla con Prisma.
│   ├── integrations/       Stripe, Resend, WATI, Supabase
│   ├── jobs/               Tareas programadas
│   └── middleware/         Autenticación, roles, límites de uso
│
└── shared/                 Compartido entre ambas capas
    ├── types/
    ├── schemas/            Esquemas Zod
    └── utils/
```

### Reglas de dependencia

```
app  →  frontend  →  shared
 │                      ↑
 └───→  backend  ───────┘
```

- `frontend` **nunca** importa de `backend`
- `backend` **nunca** importa de `frontend`
- Ambos pueden importar de `shared`
- Solo `repositories` habla con Prisma; ningún servicio consulta la base de datos
  directamente
- `app` es una capa fina que conecta ambos lados

Se hace cumplir con reglas de ESLint, no solo por convención.

---

## 5. Flujos automáticos

### 5.1 Cobro y revelado

El diagrama de secuencia está en
[diagramas-modelo-datos.md](diagramas-modelo-datos.md), apartado 4.

Lo esencial: **el estado cambia en el webhook, nunca en la vuelta del navegador.**
El usuario puede cerrar la pestaña antes de que cargue la página de retorno y el
pago debe surtir efecto igual.

Cada evento de Stripe se registra por su identificador antes de procesarse. Un
reenvío no duplica nada.

### 5.2 Tareas programadas

Vercel Cron. Todas idempotentes y protegidas por `CRON_SECRET`.

| Tarea | Frecuencia | Qué hace |
|---|---|---|
| `recordar-propuestas` | Cada hora | Avisa al profesor a 24 h y a 6 h |
| `caducar-propuestas` | Cada hora | `enviada` vencida → `caducada` |
| `recordar-pagos` | Cada hora | Avisa a la familia a 24 h |
| `caducar-pagos` | Cada hora | `aceptada` vencida → `caducada_pago` |
| `pedir-resenas` | Diaria | A los 7 días del match |
| `resumen-admin` | Diaria | Correo agrupado de pendientes |
| `informe-mensual` | Día 1 | Informe del mes |
| `limpiar-migrados` | Semanal | Elimina perfiles no reclamados a los 12 meses |

**Idempotencia.** Cada tarea comprueba si ya actuó antes de volver a hacerlo. Un
doble recordatorio resta credibilidad al sistema.

---

## 6. Seguridad

**Autenticación** con Supabase Auth. Doble factor obligatorio para administración.

**Autorización en dos niveles.** El middleware protege las rutas por rol, y la
seguridad a nivel de fila de PostgreSQL protege los datos. Aunque un endpoint
tuviera un fallo, la base de datos no devolvería filas ajenas.

**Datos personales.** Ningún dato de tarjeta toca el sistema. Los datos de menores
están minimizados en el propio esquema: no existe columna para el apellido completo
del alumno ni para su dirección.

**Secretos** en variables de entorno, nunca en el repositorio.

**Auditoría** de todo cambio en profesores, propuestas, pagos, tarifas y reseñas,
distinguiendo si vino de la aplicación o de una edición manual por SQL.

---

## 7. Coste de operación

| Servicio | Plan | Coste |
|---|---|---|
| Vercel | Hobby | 0 € |
| Supabase | Free (hasta 500 MB) | 0 € |
| Resend | Free (3.000 correos/mes) | 0 € |
| Sentry | Free | 0 € |
| Stripe | 1,4 % + 0,25 € por cobro | ~3-10 € |
| WATI | Growth | ~45 € |
| Plausible | Starter | 9 € |
| **Total** | | **~57-65 €/mes** |

Con la tarifa a 14,99 €, **cuatro matches al mes cubren el gasto**. El coste es casi
todo fijo, así que el margen crece muy rápido con el volumen.

**Cuándo habrá que subir de plan:** Supabase al superar 500 MB (muy lejos), Resend
al pasar de 3.000 correos mensuales, y Vercel si el tráfico crece mucho.

---

## 8. Entornos

| Entorno | Base de datos | Stripe | WhatsApp |
|---|---|---|---|
| Local | Supabase local o proyecto de desarrollo | Pruebas | Simulado |
| Vista previa | Proyecto de desarrollo | Pruebas | Simulado |
| Producción | Proyecto de producción | Real | WATI real |

Cada rama genera un despliegue de vista previa propio. `main` despliega a
producción.

---

## 9. Observabilidad

**Errores** con Sentry, agrupados y notificados.

**Analítica** con Plausible: sin cookies, cumple normativa y no requiere banner de
consentimiento, lo que evita fricción en la portada.

**Registro de negocio** en las propias tablas: `propuesta_eventos`,
`notificaciones`, `stripe_eventos` y `auditoria.cambios`. Es lo que permite
reconstruir qué pasó sin depender de un servicio externo.

**Alertas** a Lucía por correo cuando fallan webhooks o se acumulan notificaciones
sin enviar.

---

## 10. Documentos relacionados

- [Modelo de datos](modelo-datos.md)
- [Diagramas](diagramas-modelo-datos.md)
- [Acceso a base de datos](acceso-base-datos.md)
- [Plan de desarrollo](plan-desarrollo.md)
