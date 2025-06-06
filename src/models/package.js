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

  static async create(packageData) {
    try {
      const newPackage = await prisma.package.create({
        data: {
          trackingNumber: packageData.trackingNumber,
          senderName: packageData.senderName,
          receiverName: packageData.receiverName,
          origin: packageData.origin,
          destination: packageData.destination,
          weight: packageData.weight,
          dimensions: packageData.dimensions,
          status: packageData.status || 'RECEIVED',
          currentLocation: packageData.currentLocation,
          estimatedDeliveryDate: packageData.estimatedDeliveryDate
        },
        include: {
          trackingEvents: true
        }
      });

    } catch (error) {

    }
  }
}
