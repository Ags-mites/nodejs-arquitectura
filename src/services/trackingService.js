import moment from 'moment';
import mockData from '../data/mockData';

class trackingService {
  /**
   * Obtiene el estado de seguimiento de un paquete
   * @param {string} trackingNumber - Número de tracking del paquete
   * @returns {Object} Información del paquete o error
   */
  async getTrackingStatus(trackingNumber) {
    try {
      if (!this.isValidTrackingNumber(trackingNumber)) {
        return {
          error: {
            errorCode: 400,
            errorMessage: 'Formato de número de tracking inválido',
            invalidField: 'trackingNumber'
          }
        };
      }

      const packageData = mockData.package.find(
        pkg => pkg.trackingNumber === trackingNumber
      );

      if (!packageData) {
        return {
          error: {
            errorCode: 404,
            errorMessage: "Número de tracking no encontrado",
            invalidField: "trackingNumber"
          }
        };
      }

      // Formatear la respuesta según el esquema SOAP
      const response = {
        status: packageData.status,
        currentLocation: packageData.currentLocation,
        estimatedDeliveryDate: packageData.estimatedDeliveryDate || null,
        history: {
          event: packageData.history.map(event => ({
            date: moment(event.date).toISOString(),
            description: event.description,
            location: event.location
          }))
        }
      };

      return response;

    } catch (error) {

      console.error('Error in getTrackingStatus:', error);
      return {
        error: {
          errorCode: 500,
          errorMessage: "Error interno del servidor",
          invalidField: null
        }
      };

    }
  }

/**
   * Valida el formato del número de tracking
   * @param {string} trackingNumber - Número a validar
   * @returns {boolean} True si es válido
   */
  isValidTrackingNumber(trackingNumber) {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return false;
    }

    // Formato esperado: PE seguido de 10 dígitos
    const trackingRegex = /^PE\d{10}$/;
    return trackingRegex.test(trackingNumber);
  }

  /**
   * Obtiene estadísticas del servicio (para monitoreo)
   * @returns {Object} Estadísticas básicas
   */
  getServiceStats() {
    const totalPackages = mockData.packages.length;
    const packagesByStatus = mockData.packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPackages,
      packagesByStatus,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Obtiene todos los números de tracking disponibles (para testing)
   * @returns {Array} Lista de tracking numbers
   */
  getAvailableTrackingNumbers() {
    return mockData.packages.map(pkg => pkg.trackingNumber);
  }
}

// Exportar una instancia singleton del servicio
module.exports = new TrackingService();
