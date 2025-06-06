import Package from '../models/package.js';
import TrackingEvent from '../models/trackingEvent.js';
import { info, error } from '../utils/logger.js';
import TrackingError from '../utils/errors.js';

class TrackingService {
  /**
  * @param {string} trackingNumber
  * @returns {Promise<Object>}
  * @throws {TrackingError}
  */
  static async getTrackingStatus(trackingNumber) {
    try {
      if (!Package.validateTrackingNumber(trackingNumber)) {
        throw new TrackingError(
          1001,
          'Número de tracking inválido. Formato esperado: 2 letras + 10 dígitos (ej: PE1234567890)',
          'trackingNumber'
        );
      }

      const packageData = await Package.findByTrackingNumber(trackingNumber);

      if (!packageData) {
        throw new TrackingError(
          1002,
          `No se encontró ningún paquete con el número de tracking: ${trackingNumber}`,
          'trackingNumber'
        );
      }

      const response = {
        status: Package.getStatusString(packageData.status),
        currentLocation: packageData.currentLocation,
        estimatedDeliveryDate: packageData.estimatedDeliveryDate
          ? packageData.estimatedDeliveryDate.toISOString().split('T')[0]
          : null,
        history: packageData.trackingEvents.map(event => ({
          date: event.date.toISOString(),
          description: event.description,
          location: event.location
        }))
      };

      logger.info(`Consulta exitosa para tracking: ${trackingNumber}`);
      return response;

    } catch (error) {
      if (error instanceof TrackingError) {
        throw error;
      }

      logger.error('Error interno en getTrackingStatus:', error);
      throw new TrackingError(
        1500,
        'Error interno del servidor al procesar la consulta',
        null
      );
    }
  }

  /**
   * @param {Object} packageData
   * @returns {Promise<Object>}
   */
  static async createPackage(packageData) {
    try {
      this.validatePackageData(packageData);
      const newPackage = await Package.create(packageData);
      const initialEvent = {
        packageId: newPackage.id,
        date: new Date(),
        description: 'Paquete recibido en bodega central',
        location: packageData.origin
      };

      await TrackingEvent.create(initialEvent);

      logger.info(`Paquete creado exitosamente: ${newPackage.trackingNumber}`);
      return newPackage;

    } catch (error) {
      logger.error('Error al crear paquete:', error);
      throw error;
    }
  }

  /**
 * @param {string} trackingNumber
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
  static async updatePackageStatus(trackingNumber, updateData) {
    try {
      const packageData = await Package.findByTrackingNumber(trackingNumber);

      if (!packageData) {
        throw new TrackingError(
          1002,
          `No se encontró ningún paquete con el número de tracking: ${trackingNumber}`,
          'trackingNumber'
        );
      }

      const updatedPackage = await Package.updateStatus(trackingNumber, {
        status: updateData.status,
        currentLocation: updateData.currentLocation,
        estimatedDeliveryDate: updateData.estimatedDeliveryDate
      });

      if (updateData.eventDescription) {
        const newEvent = {
          packageId: packageData.id,
          date: new Date(),
          description: updateData.eventDescription,
          location: updateData.currentLocation,
        }

        await TrackingEvent.create(newEvent);
      }

      logger.info(`Paquete actualizado: ${trackingNumber}`);
      return updatedPackage;

    } catch (error) {
      logger.error(`Error al actualizar paquete: ${error}`);
    }
  }

  /**
  * @param {Object} packageData
  * @throws {TrackingError}
  */
  static validatePackageData(packageData) {
    const requiredFields = [
      'trackingNumber', 'senderName', 'receiverName',
      'origin', 'destination', 'weight', 'dimensions', 'currentLocation'
    ];

    for (const field of requiredFields) {
      if (!packageData[field]) {
        throw new TrackingError(
          1003,
          `Campo requerido faltante: ${field}`,
          field
        )
      }
    }

    if (!Package.validateTrackingNumber(packageData.trackingNumber)) {
      throw new TrackingError(
        1001,
        'Número de tracking inválido. Formato esperado: 2 letras + 10 dígitos',
        'trackingNumber'
      );
    }

    if (isNaN(packageData.weight) || packageData.weight <= 0) {
      throw new TrackingError(
        1004,
        'El peso debe ser un número positivo',
        'weight'
      );
    }
  }

  /**
 * @returns {Promise<Array>}
 */
  static async getAllPackages() {
    try {
      const packageResult = await Package.findAll();
      return packageResult.map(pkg => ({
        ...pkg,
        status: Package.getStatusString(pkg.status)
      }));

    } catch (error) {
      logger.error(`Error al obtener todos los paquetes: ${error}`);
      throw new TrackingError(
        1500,
        'Error interno del servidor',
        null
      );
    }
  }
}

export default TrackingService;
