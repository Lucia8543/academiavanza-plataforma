// =============================================================================
// Configuración de la herramienta de Prisma
// =============================================================================
// Desde la versión 7, la dirección de conexión ya no va en schema.prisma.
// Este fichero lo usa SÓLO la herramienta de línea de comandos: `db pull`,
// `generate`, `studio`. La aplicación se conecta por su cuenta, desde
// src/backend/repositories/cliente.ts.
//
// Aquí se usa DIRECT_URL, la conexión directa por el puerto 5432, porque las
// operaciones sobre la estructura de la base de datos no funcionan bien a
// través del pool de conexiones.
// =============================================================================

import { config as cargarEntorno } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Las variables viven en .env.local, que es el fichero que lee Next.js.
// Sin esta línea, la herramienta de Prisma no las encontraría: por defecto
// busca en `.env` y tendríamos las credenciales repartidas en dos sitios.
cargarEntorno({ path: '.env.local' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
});
