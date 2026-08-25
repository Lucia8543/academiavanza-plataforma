import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente de base de datos.
 *
 * Es el ÚNICO sitio del proyecto donde se crea una conexión. Todo lo demás
 * pasa por los repositorios de esta carpeta, tal y como manda el ADR 0002.
 *
 * Usa DATABASE_URL, la dirección del pool de conexiones (puerto 6543). En
 * Vercel cada visita puede ejecutarse en un proceso distinto, y sin pool se
 * agotarían las conexiones de PostgreSQL en cuanto entraran cuatro familias a
 * la vez.
 */

function crearCliente() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'Falta DATABASE_URL. En local se define en .env.local; en Vercel, en la ' +
        'configuración del proyecto.',
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// En desarrollo, Next.js recarga los módulos con cada cambio de código. Sin
// esto se crearía un cliente nuevo en cada recarga y acabaríamos con decenas de
// conexiones abiertas contra Supabase.
const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const db = global_.prisma ?? crearCliente();

if (process.env.NODE_ENV !== 'production') {
  global_.prisma = db;
}
