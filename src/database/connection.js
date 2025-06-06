const { PrismaClient } = require("@prisma/client/extension");

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
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Params: ${e.params}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  logger.error('Database error:', e);
});

prisma.$on('info', (e) => {
  logger.info(`Database info: ${e.message}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`Database warning: ${e.message}`);
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Base de datos conectada exitosamente');
  } catch (error) {
    logger.error(`Error al conectar con la base de datos: ${error}`);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Desconectado de la base de datos');
  } catch (error) {
    logger.error('Error al desconectar de la base de datos:', error);
  }
}


process.on('SIGINT', async () => {
  await disconnectDatabase;
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase;
  process.exit(0);
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
}
