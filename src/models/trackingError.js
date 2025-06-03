/**
 * Modelo para representar errores en el sistema de tracking
 */
class TrackingError extends Error {
  constructor({
    errorCode,
    errorMessage,
    invalidField = null,
    details = null
  } = {}) {
    super(errorMessage);

    this.name = 'TrackingError';
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.invalidField = invalidField;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Mantener el stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TrackingError);
    }
  }

  /**
   * Convierte el error a formato SOAP Fault
   * @returns {Object} Error en formato SOAP
   */
  toSOAPFault() {
    return {
      Fault: {
        Code: {
          Value: this.getSoapFaultCode()
        },
        Reason: {
          Text: this.errorMessage
        },
        Detail: {
          TrackingError: {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage,
            invalidField: this.invalidField,
            timestamp: this.timestamp
          }
        }
      }
    };
  }

  /**
   * Obtiene el código de fault SOAP apropiado
   * @returns {string} Código de fault SOAP
   */
  getSoapFaultCode() {
    if (this.errorCode >= 400 && this.errorCode < 500) {
      return "soap:Sender"; // Error del cliente
    }
    return "soap:Receiver"; // Error del servidor
  }

  /**
   * Convierte el error a formato JSON
   * @returns {Object} Error en formato JSON
   */
  toJSON() {
    return {
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      invalidField: this.invalidField,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  /**
   * Verifica si es un error de cliente (4xx)
   * @returns {boolean} True si es error de cliente
   */
  isClientError() {
    return this.errorCode >= 400 && this.errorCode < 500;
  }

  /**
   * Verifica si es un error de servidor (5xx)
   * @returns {boolean} True si es error de servidor
   */
  isServerError() {
    return this.errorCode >= 500 && this.errorCode < 600;
  }

  /**
   * Obtiene el nivel de severidad del error
   * @returns {string} Nivel de severidad
   */
  getSeverityLevel() {
    if (this.errorCode >= 500) {
      return 'critical';
    } else if (this.errorCode >= 400) {
      return 'warning';
    }
    return 'info';
  }

  // Métodos estáticos para crear errores comunes

  /**
   * Crea un error de tracking number no encontrado
   * @param {string} trackingNumber - Número de tracking
   * @returns {TrackingError} Error específico
   */
  static trackingNotFound(trackingNumber) {
    return new TrackingError({
      errorCode: 404,
      errorMessage: `Número de tracking '${trackingNumber}' no encontrado`,
      invalidField: "trackingNumber",
      details: { searchedTrackingNumber: trackingNumber }
    });
  }

  /**
   * Crea un error de formato inválido
   * @param {string} fieldName - Nombre del campo inválido
   * @param {string} value - Valor inválido
   * @returns {TrackingError} Error específico
   */
  static invalidFormat(fieldName, value) {
    return new TrackingError({
      errorCode: 400,
      errorMessage: `Formato inválido para el campo '${fieldName}'`,
      invalidField: fieldName,
      details: { invalidValue: value }
    });
  }

  /**
   * Crea un error de campo requerido
   * @param {string} fieldName - Nombre del campo requerido
   * @returns {TrackingError} Error específico
   */
  static requiredField(fieldName) {
    return new TrackingError({
      errorCode: 400,
      errorMessage: `El campo '${fieldName}' es requerido`,
      invalidField: fieldName
    });
  }

  /**
   * Crea un error de tracking number inválido
   * @param {string} trackingNumber - Número de tracking inválido
   * @returns {TrackingError} Error específico
   */
  static invalidTrackingNumber(trackingNumber) {
    return new TrackingError({
      errorCode: 400,
      errorMessage: "Formato de número de tracking inválido. Debe ser PE seguido de 10 dígitos",
      invalidField: "trackingNumber",
      details: {
        providedValue: trackingNumber,
        expectedFormat: "PE##########"
      }
    });
  }

  /**
   * Crea un error interno del servidor
   * @param {string} message - Mensaje de error (opcional)
   * @param {Object} details - Detalles adicionales (opcional)
   * @returns {TrackingError} Error específico
   */
  static internalServerError(message = "Error interno del servidor", details = null) {
    return new TrackingError({
      errorCode: 500,
      errorMessage: message,
      details: details
    });
  }

  /**
   * Crea un error de servicio no disponible
   * @param {string} service - Nombre del servicio no disponible
   * @returns {TrackingError} Error específico
   */
  static serviceUnavailable(service = "Servicio de tracking") {
    return new TrackingError({
      errorCode: 503,
      errorMessage: `${service} temporalmente no disponible`,
      details: { service: service }
    });
  }

  /**
   * Crea un error de timeout
   * @returns {TrackingError} Error específico
   */
  static requestTimeout() {
    return new TrackingError({
      errorCode: 408,
      errorMessage: "Tiempo de espera agotado para la solicitud"
    });
  }

  /**
   * Crea un error de datos corruptos
   * @param {string} description - Descripción del problema
   * @returns {TrackingError} Error específico
   */
  static dataCorruption(description) {
    return new TrackingError({
      errorCode: 500,
      errorMessage: "Datos del paquete corruptos o inconsistentes",
      details: { corruption: description }
    });
  }

  /**
   * Crea un error de acceso denegado
   * @param {string} resource - Recurso al que se negó el acceso
   * @returns {TrackingError} Error específico
   */
  static accessDenied(resource = "tracking information") {
    return new TrackingError({
      errorCode: 403,
      errorMessage: `Acceso denegado a ${resource}`,
      details: { resource: resource }
    });
  }
}

module.exports = TrackingError;
