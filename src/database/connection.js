import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { info, error, warn, debug } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    }, {
      emit: 'event',
      level: 'error'
    }, {
      emit: 'event',
      level: 'info'
    }, {
      emit: 'event',
      level: 'warn'
    },
  ]
});

prisma.$on('query', (e) => {
  debug(`Query: ${e.query}`);
  debug(`Params: ${e.params}`);
  debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  error('Database error:', e);
});

prisma.$on('info', (e) => {
  info(`Database info: ${e.message}`);
});

prisma.$on('warn', (e) => {
  warn(`Database warning: ${e.message}`);
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    info('Base de datos conectada exitosamente');
  } catch (err) {
    error(`Error al conectar con la base de datos: ${err}`);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    info('Desconectado de la base de datos');
  } catch (err) {
    error('Error al desconectar de la base de datos:', err);
  }
}

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export {
  prisma,
  connectDatabase,
  disconnectDatabase,
};
