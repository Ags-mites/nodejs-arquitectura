const { prisma } = require('../database/connection');
const logger = require('../utils/logger');

class Package {
  /**
   * @param {string} trackingNumber
   * @returns {Promise<Object|null>}
   */
  static async findByTrackingNumber(trackingNumber) {
    try {
      const packageData = await prisma.package.findUnique({
        where: {
          trackingNumber: trackingNumber
        },
        include: {
          trackingEvents: {
            orderBy: {
              date: 'asc'
            }
          }
        }
      });

      if (!packageData) {
        //todo agregar el logger
        return console.warn(`Paquete no encontrado: ${trackingNumber}`);
      }

      console.log(`Paquete encontrado: ${trackingNumber}`);
      return packageData;

    } catch (error) {
      //todo agregar el logger
      console.log(`Error al buscar paquete: ${error}`);
      throw new Error('Error interno al buscar el paquete');
    }
  }
}
