/**
 * Modelo para representar un paquete en el sistema
 */
class Package {
  constructor({
    trackingNumber,
    senderName,
    receiverName,
    origin,
    destination,
    weight,
    dimensions,
    status,
    currentLocation,
    estimatedDeliveryDate,
    history = []
  } = {}) {
    this.trackingNumber = trackingNumber;
    this.senderName = senderName;
    this.receiverName = receiverName;
    this.origin = origin;
    this.destination = destination;
    this.weight = parseFloat(weight) || 0;
    this.dimensions = dimensions;
    this.status = status;
    this.currentLocation = currentLocation;
    this.estimatedDeliveryDate = estimatedDeliveryDate;
    this.history = history;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Valida si todos los campos requeridos están presentes
   * @returns {Object} Resultado de la validación
   */
  validate() {
    const errors = [];

    if (!this.trackingNumber) {
      errors.push('Tracking number es requerido');
    } else if (!/^PE\d{10}$/.test(this.trackingNumber)) {
      errors.push('Formato de tracking number inválido (debe ser PE + 10 dígitos)');
    }

    if (!this.senderName || this.senderName.trim().length === 0) {
      errors.push('Nombre del remitente es requerido');
    }

    if (!this.receiverName || this.receiverName.trim().length === 0) {
      errors.push('Nombre del destinatario es requerido');
    }

    if (!this.origin || this.origin.trim().length === 0) {
      errors.push('Origen es requerido');
    }

    if (!this.destination || this.destination.trim().length === 0) {
      errors.push('Destino es requerido');
    }

    if (!this.weight || this.weight <= 0) {
      errors.push('Peso debe ser mayor a 0');
    }

    if (!this.status) {
      errors.push('Estado es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Agrega un nuevo evento al historial del paquete
   * @param {Object} event - Evento a agregar
   */
  addTrackingEvent(event) {
    if (event && event.date && event.description && event.location) {
      this.history.push({
        date: new Date(event.date),
        description: event.description,
        location: event.location
      });
      this.updatedAt = new Date();
    }
  }

  /**
   * Actualiza el estado actual del paquete
   * @param {string} newStatus - Nuevo estado
   * @param {string} newLocation - Nueva ubicación
   */
  updateStatus(newStatus, newLocation) {
    this.status = newStatus;
    if (newLocation) {
      this.currentLocation = newLocation;
    }
    this.updatedAt = new Date();
  }

  /**
   * Obtiene el último evento del historial
   * @returns {Object|null} Último evento o null si no hay historial
   */
  getLatestEvent() {
    if (this.history.length === 0) {
      return null;
    }
    return this.history[this.history.length - 1];
  }

  /**
   * Verifica si el paquete ha sido entregado
   * @returns {boolean} True si está entregado
   */
  isDelivered() {
    return this.status === 'Entregado';
  }

  /**
   * Obtiene el tiempo estimado de entrega en días
   * @returns {number|null} Días hasta la entrega estimada o null
   */
  getDaysUntilDelivery() {
    if (!this.estimatedDeliveryDate) {
      return null;
    }

    const deliveryDate = new Date(this.estimatedDeliveryDate);
    const today = new Date();
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Convierte el paquete a formato JSON para respuestas SOAP
   * @returns {Object} Representación JSON del paquete
   */
  toSOAPResponse() {
    return {
      status: this.status,
      currentLocation: this.currentLocation,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      history: {
        event: this.history.map(event => ({
          date: event.date.toISOString(),
          description: event.description,
          location: event.location
        }))
      }
    };
  }

  /**
   * Convierte el paquete a formato JSON completo
   * @returns {Object} Representación JSON completa del paquete
   */
  toJSON() {
    return {
      trackingNumber: this.trackingNumber,
      senderName: this.senderName,
      receiverName: this.receiverName,
      origin: this.origin,
      destination: this.destination,
      weight: this.weight,
      dimensions: this.dimensions,
      status: this.status,
      currentLocation: this.currentLocation,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      history: this.history,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Package;
