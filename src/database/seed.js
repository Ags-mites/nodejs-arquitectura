const { prisma } = require('./connection');
const logger = require('../utils/logger');

const samplePackages = [
  {
    trackingNumber: 'PE1234567890',
    senderName: 'Juan Pérez',
    receiverName: 'María González',
    origin: 'Lima',
    destination: 'Quito',
    weight: 2.5,
    dimensions: '30x20x15',
    status: 'IN_TRANSIT',
    currentLocation: 'Lima - Perú',
    estimatedDeliveryDate: new Date('2025-06-10')
  },
  {
    trackingNumber: 'EC9876543210',
    senderName: 'Ana Rodriguez',
    receiverName: 'Carlos Mendoza',
    origin: 'Guayaquil',
    destination: 'Bogotá',
    weight: 1.2,
    dimensions: '25x15x10',
    status: 'DELIVERED',
    currentLocation: 'Bogotá - Colombia',
    estimatedDeliveryDate: new Date('2025-06-08')
  },
  {
    trackingNumber: 'CO5555666677',
    senderName: 'Luis Torres',
    receiverName: 'Sandra Vargas',
    origin: 'Medellín',
    destination: 'Lima',
    weight: 3.8,
    dimensions: '40x25x20',
    status: 'RECEIVED',
    currentLocation: 'Medellín - Colombia',
    estimatedDeliveryDate: new Date('2025-06-12')
  },
  {
    trackingNumber: 'PE1111222233',
    senderName: 'Roberto Silva',
    receiverName: 'Elena Morales',
    origin: 'Arequipa',
    destination: 'Cuenca',
    weight: 0.8,
    dimensions: '20x15x8',
    status: 'OUT_FOR_DELIVERY',
    currentLocation: 'Cuenca - Ecuador',
    estimatedDeliveryDate: new Date('2025-06-06')
  },
  {
    trackingNumber: 'EC4444555566',
    senderName: 'Patricia Jiménez',
    receiverName: 'Fernando Castro',
    origin: 'Quito',
    destination: 'Cartagena',
    weight: 2.1,
    dimensions: '35x22x12',
    status: 'EXCEPTION',
    currentLocation: 'Aduana - Cartagena',
    estimatedDeliveryDate: new Date('2025-06-15')
  }
];

const sampleTrackingEvents = {
  'PE1234567890': [
    {
      description: 'Paquete recibido en bodega central',
      location: 'Lima',
      date: new Date('2025-06-01T08:00:00Z')
    },
    {
      description: 'Paquete en tránsito hacia destino',
      location: 'Lima',
      date: new Date('2025-06-02T14:30:00Z')
    },
    {
      description: 'Paquete llegó a aduana',
      location: 'Frontera Perú-Ecuador',
      date: new Date('2025-06-03T09:15:00Z')
    },
    {
      description: 'Paquete liberado de aduana',
      location: 'Frontera Perú-Ecuador',
      date: new Date('2025-06-03T16:45:00Z')
    }
  ],
  'EC9876543210': [
    {
      description: 'Paquete recibido en bodega central',
      location: 'Guayaquil',
      date: new Date('2025-06-01T10:00:00Z')
    },
    {
      description: 'Paquete en tránsito hacia destino',
      location: 'Guayaquil',
      date: new Date('2025-06-02T11:20:00Z')
    },
    {
      description: 'Paquete llegó a destino',
      location: 'Bogotá',
      date: new Date('2025-06-05T13:30:00Z')
    },
    {
      description: 'Paquete entregado exitosamente',
      location: 'Bogotá - Colombia',
      date: new Date('2025-06-05T16:00:00Z')
    }
  ],
  'CO5555666677': [
    {
      description: 'Paquete recibido en bodega central',
      location: 'Medellín',
      date: new Date('2025-06-04T09:00:00Z')
    },
    {
      description: 'Paquete preparado para envío',
      location: 'Medellín',
      date: new Date('2025-06-04T15:30:00Z')
    }
  ],
  'PE1111222233': [
    {
      description: 'Paquete recibido en bodega central',
      location: 'Arequipa',
      date: new Date('2025-06-02T07:30:00Z')
    },
    {
      description: 'Paquete en tránsito hacia destino',
      location: 'Arequipa',
      date: new Date('2025-06-03T08:45:00Z')
    },
    {
      description: 'Paquete llegó a ciudad destino',
      location: 'Cuenca',
      date: new Date('2025-06-04T12:00:00Z')
    },
    {
      description: 'Paquete asignado para entrega',
      location: 'Cuenca - Ecuador',
      date: new Date('2025-06-05T08:00:00Z')
    }
  ],
  'EC4444555566': [
    {
      description: 'Paquete recibido en bodega central',
      location: 'Quito',
      date: new Date('2025-06-01T11:00:00Z')
    },
    {
      description: 'Paquete en tránsito hacia destino',
      location: 'Quito',
      date: new Date('2025-06-02T09:30:00Z')
    },
    {
      description: 'Paquete retenido en aduana para inspección',
      location: 'Aduana - Cartagena',
      date: new Date('2025-06-04T14:15:00Z')
    }
  ]
};

async function clearDatabase() {
  try {
    logger.info('Limpiando base de datos...');

    await prisma.trackingEvent.deleteMany();
    await prisma.package.deleteMany();

    logger.info('Base de datos limpiada');
  } catch (error) {
    logger.error('Error al limpiar base de datos:', error);
    throw error;
  }
}


async function createSamplePackages() {
  try {
    logger.info('Creando paquetes de ejemplo...');

    for (const packageData of samplePackages) {
      const createdPackage = await prisma.package.create({
        data: packageData
      });

      logger.info(`Paquete creado: ${createdPackage.trackingNumber}`);
    }

    logger.info(`${samplePackages.length} paquetes creados exitosamente`);
  } catch (error) {
    logger.error('Error al crear paquetes:', error);
    throw error;
  }
}

async function createSampleTrackingEvents() {
  try {
    logger.info('Creando eventos de seguimiento...');

    let totalEvents = 0;

    for (const [trackingNumber, events] of Object.entries(sampleTrackingEvents)) {
      const packageData = await prisma.package.findUnique({
        where: { trackingNumber }
      });

      if (!packageData) {
        logger.warn(`⚠️ Paquete no encontrado: ${trackingNumber}`);
        continue;
      }

      for (const eventData of events) {
        await prisma.trackingEvent.create({
          data: {
            packageId: packageData.id,
            description: eventData.description,
            location: eventData.location,
            date: eventData.date
          }
        });
        totalEvents++;
      }

      logger.info(`Eventos creados para: ${trackingNumber}`);
    }

    logger.info(`${totalEvents} eventos de seguimiento creados exitosamente`);
  } catch (error) {
    logger.error('Error al crear eventos de seguimiento:', error);
    throw error;
  }
}

async function verifyData() {
  try {
    logger.info('Verificando datos creados...');

    const packageCount = await prisma.package.count();
    const eventCount = await prisma.trackingEvent.count();

    logger.info(`Paquetes en base de datos: ${packageCount}`);
    logger.info(`Eventos en base de datos: ${eventCount}`);

    const packages = await prisma.package.findMany({
      include: {
        trackingEvents: true
      },
      take: 3
    });

    logger.info('Ejemplos de paquetes creados:');
    packages.forEach(pkg => {
      logger.info(`  - ${pkg.trackingNumber}: ${pkg.status} (${pkg.trackingEvents.length} eventos)`);
    });

  } catch (error) {
    logger.error('Error al verificar datos:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    logger.info('Iniciando proceso de seeding...');

    await clearDatabase();
    await createSamplePackages();
    await createSampleTrackingEvents();
    await verifyData();

    logger.info('Proceso de seeding completado exitosamente');

  } catch (error) {
    logger.error('Error en proceso de seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function resetDatabase() {
  try {
    logger.info('Reseteando base de datos...');

    await clearDatabase();

    logger.info('Base de datos reseteada');

  } catch (error) {
    logger.error('Error al resetear base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'reset':
      resetDatabase();
      break;
    case 'seed':
    default:
      seedDatabase();
      break;
  }
}

module.exports = {
  seedDatabase,
  resetDatabase,
  clearDatabase,
  createSamplePackages,
  createSampleTrackingEvents,
  verifyData
};
