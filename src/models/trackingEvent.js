const { prisma } = require('../database/connection');
const logger = require('../utils/logger');

class TrackingEvent {

  /**
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  static async create(eventData) {
    try {
      const newEvent = await prisma.trackingEvent.create({
        data: {
          packageId: eventData.packageId,
          date: eventData.date || new Date(),
          description: eventData.description,
          location: eventData.location
        }
      });

      logger.info(`Evento de tracking creado para paquete: ${eventData.packageId}`);
      return newEvent;
    } catch (error) {
      logger.error('Error al crear evento de tracking:', error);
    }
  }

  /**
   * @param {string} packageId
   * @returns {Promise<Array>}
   */
  static async findByPackageId(packageId) {
    try {
      const events = await prisma.trackingEvent.findMany({
        where: {
          packageId: packageId
        },
        orderBy: {
          date: 'asc'
        }
      });

      logger.info(`Recuperados ${events.length} eventos para paquete: ${packageId}`);
      return events;
    } catch (error) {
      logger.error('Error al obtener eventos de tracking:', error);
    }
  }

  /**
   * @param {Array} eventsData
   * @returns {Promise<Array>}
   */
  static async createMany(eventsData) {
    try {
      const events = await prisma.trackingEvent.createMany({
        data: eventsData.map(event => ({
          packageId: event.packageId,
          date: event.date || new Date(),
          description: event.description,
          location: event.location
        }))
      });

      logger.info(`Creados ${events.count} eventos de tracking`);
      return events;
    } catch (error) {
      logger.error('Error al crear múltiples eventos:', error);
    }
  }

  /**
   * @param {string} eventId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async update(eventId, updateData) {
    try {
      const updatedEvent = await prisma.trackingEvent.update({
        where: {
          id: eventId
        },
        data: updateData
      });

      logger.info(`Evento de tracking actualizado: ${eventId}`);
      return updatedEvent;
    } catch (error) {
      logger.error('Error al actualizar evento:', error);
      throw new Error('Error interno al actualizar el evento de seguimiento');
    }
  }

  /**
   * @param {string} eventId
   * @returns {Promise<Object>}
   */
  static async delete(eventId) {
    try {
      const deletedEvent = await prisma.trackingEvent.delete({
        where: {
          id: eventId
        }
      });

      logger.info(`Evento de tracking eliminado: ${eventId}`);
      return deletedEvent;
    } catch (error) {
      logger.error('Error al eliminar evento:', error);
    }
  }

  /**
   * @param {string} packageId
   * @returns {Promise<Object|null>}
   */
  static async getLatestByPackageId(packageId) {
    try {
      const latestEvent = await prisma.trackingEvent.findFirst({
        where: {
          packageId: packageId
        },
        orderBy: {
          date: 'desc'
        }
      });

      if (latestEvent) {
        logger.info(`Último evento recuperado para paquete: ${packageId}`);
      }

      return latestEvent;
    } catch (error) {
      logger.error('Error al obtener último evento:', error);
    }
  }
}

module.exports = TrackingEvent;
