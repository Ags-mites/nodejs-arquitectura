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
        logger.warn(`Paquete no encontrado: ${trackingNumber}`);
        return;
      }

      logger.info(`Paquete encontrado: ${trackingNumber}`);
      return packageData;

    } catch (error) {

      logger.error(`Error al buscar paquete: ${error}`);

    }
  }

  /**
  * @param {Object} packageData
  * @returns {Promise<Object>}
  */
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

      logger.info(`Paquete creado: ${newPackage.trackingNumber}`);
      return newPackage;

    } catch (error) {

      logger.error('Error al crear paquete:', error);

    }
  }

  /**
    * @param {string} trackingNumber
    * @param {Object} updateData
    * @returns {Promise<Object>}
    */
  static async updateStatus(trackingNumber, updateData) {
    try {
      const updatedPackage = await prisma.package.update({
        where: {
          trackingNumber: trackingNumber
        },
        data: updateData,
        include: {
          trackingEvents: {
            orderBy: {
              date: 'asc'
            }
          }
        }
      });

      logger.info(`Paquete actualizado: ${trackingNumber}`);
      return updatedPackage;
    } catch (error) {
      logger.error(`Error al actualizar paquete: ${error}`);
    }
  }

  /**
   * @returns {Promise<Array>}
   */
  static async findAll() {
    try {
      const packages = await prisma.package.findMany({
        include: {
          trackingEvents: {
            orderBy: {
              date: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      logger.info(`${packages.length} paquetes`);
      return packages;
    } catch (error) {
      logger.error('Error al obtener paquetes:', error);
    }
  }

  /**
   * @param {string} trackingNumber
   * @returns {boolean}
   */
  static validateTrackingNumber(trackingNumber) {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return false;
    }

    const trackingPattern = /^[A-Z]{2}\d{10}$/;
    return trackingPattern.test(trackingNumber);
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  static getStatusString(status) {
    const statusMap = {
      'RECEIVED': 'Recibido',
      'IN_TRANSIT': 'En tránsito',
      'OUT_FOR_DELIVERY': 'En reparto',
      'DELIVERED': 'Entregado',
      'EXCEPTION': 'Excepción',
      'RETURNED': 'Devuelto'
    };

    return statusMap[status] || status;
  }
}

module.exports = Package;
