/**
 * Modelo para representar un evento de seguimiento
 */
class TrackingEvent {
  constructor({
    date,
    description,
    location,
    eventType = 'status_update',
    details = null
  } = {}) {
    this.date = date ? new Date(date) : new Date();
    this.description = description;
    this.location = location;
    this.eventType = eventType;
    this.details = details;
    this.id = this.generateEventId();
  }

  /**
   * Genera un ID único para el evento
   * @returns {string} ID único basado en timestamp y random
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida si el evento tiene los campos requeridos
   * @returns {Object} Resultado de la validación
   */
  validate() {
    const errors = [];

    if (!this.date || !(this.date instanceof Date) || isNaN(this.date.getTime())) {
      errors.push('Fecha del evento es requerida y debe ser válida');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Descripción del evento es requerida');
    }

    if (!this.location || this.location.trim().length === 0) {
      errors.push('Ubicación del evento es requerida');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Descripción del evento no puede exceder 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatea la fecha del evento en formato ISO
   * @returns {string} Fecha en formato ISO
   */
  getFormattedDate() {
    return this.date.toISOString();
  }

  /**
   * Formatea la fecha del evento en formato legible
   * @returns {string} Fecha en formato legible
   */
  getReadableDate() {
    return this.date.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Verifica si el evento es del mismo día que otra fecha
   * @param {Date} otherDate - Fecha a comparar
   * @returns {boolean} True si es el mismo día
   */
  isSameDay(otherDate) {
    if (!(otherDate instanceof Date)) {
      return false;
    }

    return this.date.getFullYear() === otherDate.getFullYear() &&
           this.date.getMonth() === otherDate.getMonth() &&
           this.date.getDate() === otherDate.getDate();
  }

  /**
   * Verifica si el evento es reciente (últimas 24 horas)
   * @returns {boolean} True si es reciente
   */
  isRecent() {
    const now = new Date();
    const diffHours = (now.getTime() - this.date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  /**
   * Convierte el evento a formato SOAP
   * @returns {Object} Representación para respuesta SOAP
   */
  toSOAPFormat() {
    return {
      date: this.getFormattedDate(),
      description: this.description,
      location: this.location
    };
  }

  /**
   * Convierte el evento a formato JSON completo
   * @returns {Object} Representación JSON completa
   */
  toJSON() {
    return {
      id: this.id,
      date: this.getFormattedDate(),
      description: this.description,
      location: this.location,
      eventType: this.eventType,
      details: this.details,
      isRecent: this.isRecent()
    };
  }

  /**
   * Crea un evento estándar de recepción
   * @param {string} location - Ubicación donde se recibió
   * @param {Date} date - Fecha del evento (opcional)
   * @returns {TrackingEvent} Nuevo evento de recepción
   */
  static createReceiptEvent(location, date = null) {
    return new TrackingEvent({
      date: date || new Date(),
      description: "Paquete recibido en oficina de origen",
      location: location,
      eventType: "receipt"
    });
  }

  /**
   * Crea un evento estándar de tránsito
   * @param {string} fromLocation - Ubicación de origen
   * @param {string} toLocation - Ubicación de destino
   * @param {Date} date - Fecha del evento (opcional)
   * @returns {TrackingEvent} Nuevo evento de tránsito
   */
  static createTransitEvent(fromLocation, toLocation, date = null) {
    return new TrackingEvent({
      date: date || new Date(),
      description: `Salida hacia ${toLocation}`,
      location: fromLocation,
      eventType: "transit",
      details: { destination: toLocation }
    });
  }

  /**
   * Crea un evento estándar de entrega
   * @param {string} location - Ubicación de entrega
   * @param {Date} date - Fecha del evento (opcional)
   * @returns {TrackingEvent} Nuevo evento de entrega
   */
  static createDeliveryEvent(location, date = null) {
    return new TrackingEvent({
      date: date || new Date(),
      description: "Entregado exitosamente",
      location: location,
      eventType: "delivery"
    });
  }

  /**
   * Crea un evento estándar de error
   * @param {string} errorDescription - Descripción del error
   * @param {string} location - Ubicación donde ocurrió el error
   * @param {Date} date - Fecha del evento (opcional)
   * @returns {TrackingEvent} Nuevo evento de error
   */
  static createErrorEvent(errorDescription, location, date = null) {
    return new TrackingEvent({
      date: date || new Date(),
      description: errorDescription,
      location: location,
      eventType: "error"
    });
  }
}

module.exports = TrackingEvent;
