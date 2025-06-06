import TrackingService from '../services/trackingService.js';
import errorUtils from '../utils/errors.js';
import { info, error, debug, warn, logSOAPSuccess, logSOAPError } from '../utils/logger.js';

const { TrackingError, ERROR_CODES } = errorUtils;

class SoapController {
  // Método estático que será llamado por el servidor SOAP
  static async GetTrackingStatus(args, callback) {
    const startTime = Date.now();
    let trackingNumber = null;

    try {
      trackingNumber = args.trackingNumber;
      info(`SOAP Request - GetTrackingStatus: trackingNumber=${trackingNumber}`);

      if (!trackingNumber) {
        throw new TrackingError(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'El número de tracking es requerido',
          'trackingNumber'
        );
      }

      const trackingInfo = await TrackingService.getTrackingStatus(trackingNumber);

      const soapResponse = {
        status: trackingInfo.status,
        currentLocation: trackingInfo.currentLocation,
        estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
        history: {
          event: trackingInfo.history
        }
      };

      const responseTime = Date.now() - startTime;
      logSOAPSuccess('GetTrackingStatus', trackingNumber, responseTime);

      callback(null, soapResponse);

    } catch (err) {
      const responseTime = Date.now() - startTime;

      if (err instanceof TrackingError) {
        logSOAPError('GetTrackingStatus', err, trackingNumber);

        const soapFault = {
          Fault: {
            faultcode: 'Client',
            faultstring: err.errorMessage,
            detail: err.toSOAPFault()
          }
        };

        callback(soapFault);
      } else {
        error(`SOAP Internal Error - GetTrackingStatus: ${err.message}`);

        const internalError = new TrackingError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Error interno del servidor'
        );

        const soapFault = {
          Fault: {
            faultcode: 'Server',
            faultstring: 'Error interno del servidor',
            detail: internalError.toSOAPFault()
          }
        };

        callback(soapFault);
      }
    }
  }

  // Definición del servicio SOAP
  static getServiceDefinition() {
    console.log('� Creando definición del servicio SOAP...');

    const serviceDefinition = {
      TrackingService: {
        TrackingServicePort: {
          GetTrackingStatus: function(args, callback) {
            console.log('� GetTrackingStatus llamado con args:', args);
            return SoapController.GetTrackingStatus(args, callback);
          }
        }
      }
    };

    console.log('✅ Definición del servicio creada:', JSON.stringify(serviceDefinition, null, 2));
    return serviceDefinition;
  }

  static soapLoggingMiddleware(req, res, next) {
    const startTime = Date.now();

    info(`SOAP Request received: ${req.method} ${req.url}`);
    debug(`SOAP Request headers: ${JSON.stringify(req.headers)}`);

    if (req.body) {
      debug(`SOAP Request body: ${typeof req.body === 'string' ? req.body.substring(0, 500) : JSON.stringify(req.body)}`);
    }

    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      info(`SOAP Response sent: ${res.statusCode} - ${responseTime}ms`);

      if (res.statusCode >= 400) {
        debug(`SOAP Response body: ${typeof data === 'string' ? data.substring(0, 500) : JSON.stringify(data)}`);
      }

      originalSend.call(this, data);
    };

    next();
  }

  static soapErrorHandler(err, req, res, next) {
    error(`SOAP Error Handler: ${err.message}`);

    if (err instanceof TrackingError) {
      const soapFault = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <faultcode>Client</faultcode>
              <faultstring>${err.errorMessage}</faultstring>
              <detail>
                <TrackingError xmlns="http://logistica.com/ws/tracking">
                  <errorCode>${err.errorCode}</errorCode>
                  <errorMessage>${err.errorMessage}</errorMessage>
                  <invalidField>${err.invalidField || ''}</invalidField>
                </TrackingError>
              </detail>
            </soap:Fault>
          </soap:Body>
        </soap:Envelope>
      `;

      res.status(500)
        .set('Content-Type', 'text/xml; charset=utf-8')
        .send(soapFault);
    } else {
      const soapFault = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <faultcode>Server</faultcode>
              <faultstring>Error interno del servidor</faultstring>
              <detail>
                <TrackingError xmlns="http://logistica.com/ws/tracking">
                  <errorCode>1500</errorCode>
                  <errorMessage>Error interno del servidor</errorMessage>
                  <invalidField></invalidField>
                </TrackingError>
              </detail>
            </soap:Fault>
          </soap:Body>
        </soap:Envelope>
      `;

      res.status(500)
        .set('Content-Type', 'text/xml; charset=utf-8')
        .send(soapFault);
    }
  }

  static validateSOAPHeaders(req) {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('text/xml')) {
      warn(`Invalid Content-Type: ${contentType}`);
      return false;
    }

    return true;
  }
}

export default SoapController;

// Exportaciones nombradas
export const getServiceDefinition = SoapController.getServiceDefinition;
export const soapLoggingMiddleware = SoapController.soapLoggingMiddleware;
export const soapErrorHandler = SoapController.soapErrorHandler;
