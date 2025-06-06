class TrackingError extends Error {
  constructor(errorCode, errorMessage, invalidField = null) {
    super(errorMessage);
    this.name = 'TrackingError';
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.invalidField = invalidField;
  }

  /**
   * @returns {Object}
   */
  toSOAPFault() {
    return {
      TrackingError: {
        errorCode: this.errorCode,
        errorMessage: this.errorMessage,
        invalidField: this.invalidField || ''
      }
    };
  }

  /**
   * @return {Object}
   */
  toJSON(){
    return {
      error: true,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      invalidField: this.invalidField,
      timestamp: new Date().toISOString()
    };
  }
}

const ERROR_CODES = {
  INVALID_TRACKING_NUMBER: 1001,
  PACKAGE_NOT_FOUND: 1002,
  MISSING_REQUIRED_FIELD: 1003,
  INVALID_WEIGHT: 1004,
  INVALID_DATE_FORMAT: 1005,
  INVALID_STATUS: 1006,
  DATABASE_ERROR: 1500,
  INTERNAL_SERVER_ERROR: 1501,
  SOAP_PARSING_ERROR: 1502,
  AUTHENTICATION_ERROR: 1600,
  AUTHORIZATION_ERROR: 1601
};

/**
 * @param {number} errorCode
 * @param {string} customMessage
 * @param {string} invalidField
 * @returns {TrackingError}
 */
function createErrorByCode(errorCode, customMessage = null, invalidField = null) {
  const errorMessages = {
    [ERROR_CODES.INVALID_TRACKING_NUMBER]: 'Número de tracking inválido',
    [ERROR_CODES.PACKAGE_NOT_FOUND]: 'Paquete no encontrado',
    [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Campo requerido faltante',
    [ERROR_CODES.INVALID_WEIGHT]: 'Peso inválido',
    [ERROR_CODES.INVALID_DATE_FORMAT]: 'Formato de fecha inválido',
    [ERROR_CODES.INVALID_STATUS]: 'Estado inválido',
    [ERROR_CODES.DATABASE_ERROR]: 'Error de base de datos',
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Error interno del servidor',
    [ERROR_CODES.SOAP_PARSING_ERROR]: 'Error al procesar mensaje SOAP',
    [ERROR_CODES.AUTHENTICATION_ERROR]: 'Error de autenticación',
    [ERROR_CODES.AUTHORIZATION_ERROR]: 'No autorizado'
  };

  const message = customMessage || errorMessages[errorCode] || 'Error desconocido';
  return new TrackingError(errorCode, message, invalidField);
}

/**
 * @param {Error} error
 * @returns {TrackingError}
 */
function handlePrismaError(error) {
  if (error.code === 'P2002') {
    return createErrorByCode(
      ERROR_CODES.INVALID_TRACKING_NUMBER,
      'El número de tracking ya existe en el sistema',
      'trackingNumber'
    );
  }

  if (error.code === 'P2025') {
    return createErrorByCode(
      ERROR_CODES.PACKAGE_NOT_FOUND,
      'El registro solicitado no existe'
    );
  }

  return createErrorByCode(
    ERROR_CODES.DATABASE_ERROR,
    'Error de base de datos: ' + error.message
  );
}

/**
 * @param {any} value
 * @param {string} type
 * @param {string} fieldName
 * @returns {any}
 * @throws {TrackingError}
 */
function validateInput(value, type, fieldName) {
  if (value === null || value === undefined) {
    throw createErrorByCode(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      `El campo ${fieldName} es requerido`,
      fieldName
    );
  }

  switch (type) {
    case 'string':
      if (typeof value !== 'string' || value.trim() === '') {
        throw createErrorByCode(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          `El campo ${fieldName} debe ser una cadena no vacía`,
          fieldName
        );
      }
      return value.trim();

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw createErrorByCode(
          ERROR_CODES.INVALID_WEIGHT,
          `El campo ${fieldName} debe ser un número válido`,
          fieldName
        );
      }
      return num;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw createErrorByCode(
          ERROR_CODES.INVALID_DATE_FORMAT,
          `El campo ${fieldName} debe ser una fecha válida`,
          fieldName
        );
      }
      return date;

    default:
      return value;
  }
}

export default {
  TrackingError,
  ERROR_CODES,
  createErrorByCode,
  handlePrismaError,
  validateInput
};
