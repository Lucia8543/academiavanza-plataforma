## Qué hace

<!-- Descripción breve del cambio y por qué es necesario -->

## Tipo de cambio

- [ ] Nueva funcionalidad
- [ ] Corrección de error
- [ ] Cambio de esquema de base de datos
- [ ] Documentación
- [ ] Refactorización sin cambio de comportamiento

## Comprobaciones

- [ ] He probado el cambio en local
- [ ] `pnpm lint` y `pnpm typecheck` pasan
- [ ] He añadido o actualizado pruebas si el cambio lo requiere
- [ ] No he subido ningún secreto ni credencial
- [ ] No he subido ningún fichero con datos personales reales

## Si toca la base de datos

- [ ] El cambio de esquema está en `db/schema/` y es reproducible desde cero
- [ ] He actualizado `docs/04-arquitectura/modelo-datos.md`
- [ ] El cambio no rompe datos existentes, o he documentado la migración

## Si toca los pagos

- [ ] Probado con Stripe en modo prueba
- [ ] Los webhooks siguen siendo idempotentes
- [ ] Los importes históricos no se ven afectados

## Capturas

<!-- Si hay cambios visuales, adjuntar antes y después -->
