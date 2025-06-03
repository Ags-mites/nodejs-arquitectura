// Simula un servicio de tracking real
export default {
  async getTrackingStatus(trackingNumber) {
    // Aquí normalmente se conectaría a una base de datos o API externa
    if (trackingNumber === '12345') {
      return {
        status: 'En tránsito',
        estimatedDelivery: '2025-06-05'
      };
    }

    return {
      error: {
        errorCode: 404,
        errorMessage: 'Tracking no encontrado',
        invalidField: 'trackingNumber'
      }
    };
  }
};
