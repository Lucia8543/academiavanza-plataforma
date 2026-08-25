# ADR 0002 — Separación de frontend y backend por carpetas, no por despliegue

**Fecha:** Agosto 2026
**Estado:** Aceptada

---

## Contexto

El proyecto necesita una separación clara entre la capa de presentación y la lógica
de servidor, por dos motivos: que el código sea navegable para quien entre nuevo, y
que las reglas de negocio no acaben repartidas entre componentes de interfaz.

La pila elegida es Next.js con App Router, que por naturaleza mezcla ambas cosas:
un mismo fichero puede renderizar interfaz y ejecutar código de servidor.

Las opciones consideradas iban desde dos aplicaciones desplegadas por separado
hasta la estructura por defecto de Next.js sin separación explícita.

## Decisión

**Una sola aplicación Next.js, con frontend y backend separados en carpetas
distintas bajo `src/`, y reglas de dependencia verificadas automáticamente.**

```
src/
├── app/         Rutas. Capa fina que conecta ambos lados.
├── frontend/    Todo lo visual. Nunca importa de backend.
├── backend/     Toda la lógica de servidor. Nunca importa de frontend.
└── shared/      Tipos y validadores comunes a ambos.
```

Dentro de `backend`, la lógica se organiza en servicios (casos de uso),
repositorios (único punto de acceso a Prisma), integraciones (Stripe, Resend, WATI)
y tareas programadas.

Las reglas de dependencia se hacen cumplir con ESLint, no por convención.

## Consecuencias

### Favorables

La separación conceptual queda explícita y es visible al abrir el repositorio, que
era el objetivo.

Un solo despliegue, un solo `package.json`, una sola configuración. Con un
desarrollador, esto pesa mucho.

Se mantiene el tipado de extremo a extremo: los tipos de `shared` los usan ambas
capas sin generación de clientes ni sincronización manual.

Sin latencia entre capas ni serialización intermedia.

Si algún día hiciera falta separar de verdad, la frontera ya está trazada y el
trabajo sería mecánico.

### Desfavorables

**La separación no está impuesta por el sistema.** Un desarrollador puede saltársela
si desactiva la regla de ESLint. Con dos despliegues sería imposible por
construcción.

**No se pueden escalar las capas por separado.** A esta escala es irrelevante, pero
conviene anotarlo.

**El acoplamiento a Next.js es real.** Cambiar de marco supondría rehacer la capa de
rutas, aunque `backend` y `shared` serían reutilizables casi tal cual.

## Alternativas descartadas

**Dos aplicaciones separadas —Next.js e interfaz de programación aparte—.** Da la
separación más estricta, pero duplica despliegues, configuraciones y trabajo de
operación, obliga a mantener un contrato entre ambas y añade latencia. No hay ningún
problema real que resuelva a esta escala.

**Monorepo con espacios de trabajo.** Buena separación conservando un repositorio,
pero exige herramienta de orquestación y su configuración. Complejidad que hoy no
compensa; y si el proyecto creciera, migrar desde la estructura actual sería
sencillo.

**Estructura por defecto de Next.js.** Lo más simple, pero deja que la lógica de
negocio se disperse entre componentes, que es exactamente el problema que se quiere
evitar.

## Notas

La regla de ESLint que impide las importaciones cruzadas debe configurarse en la
etapa 0. Sin ella, esta decisión es una intención y no una arquitectura.
