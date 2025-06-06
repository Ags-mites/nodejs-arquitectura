import { prisma } from '../database/connection.js';
import { info, error } from '../utils/logger.js';

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

      info(`Evento de tracking creado para paquete: ${eventData.packageId}`);
      return newEvent;
    } catch (err) {
      error('Error al crear evento de tracking:', err);
      throw err;
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

      info(`Recuperados ${events.length} eventos para paquete: ${packageId}`);
      return events;
    } catch (err) {
      error('Error al obtener eventos de tracking:', err);
      throw err;
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

      info(`Creados ${events.count} eventos de tracking`);
      return events;
    } catch (err) {
      error('Error al crear múltiples eventos:', err);
      throw err;
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

      info(`Evento de tracking actualizado: ${eventId}`);
      return updatedEvent;
    } catch (err) {
      error('Error al actualizar evento:', err);
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

      info(`Evento de tracking eliminado: ${eventId}`);
      return deletedEvent;
    } catch (err) {
      error('Error al eliminar evento:', err);
      throw err;
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
        info(`Último evento recuperado para paquete: ${packageId}`);
      }

      return latestEvent;
    } catch (err) {
      error('Error al obtener último evento:', err);
      throw err;
    }
  }
}

export default TrackingEvent;
