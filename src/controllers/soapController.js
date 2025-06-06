import TrackingService from '../services/trackingService.js';
import errorUtils from '../utils/errors.js';
import { info, error, debug, logSOAPSuccess, logSOAPError } from '../utils/logger.js';

const { TrackingError, ERROR_CODES } = errorUtils;
class SoapController {
  static async GetTrackingStatus(args, callback) {
    const startTime = Date.now();
    let trackingNumber = null;

    try {
      trackingNumber = args.trackingNumber;
      info(`SOAP Request - GetTrackingStatus: trackingNumber:${trackingNumber}`);

      if (!trackingNumber) {
        throw new TrackingError(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'El número de tracking es requerido',
          'trackingNumber'
        );
      }

      const trackingInfo = await TrackingService.getTrackingStatus(trackingNumber);

      const soapResponse = {
        GetTrackingStatusResponse: {
          status: trackingInfo.status,
          currentLocation: trackingInfo.currentLocation,
          estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
          history: {
            event: trackingInfo.history
          }
        }
      };

      const responseTime = Date.now() - startTime;
      logSOAPSuccess(`GetTrackingStatus`, trackingNumber, responseTime);

      callback(null, soapResponse);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof TrackingError) {
        logSOAPError(`GetTrackingStatus`, error, trackingNumber);

        const soapFault = {
          Fault: {
            faultcode: 'Client',
            faultstring: error.errorMessage,
            detail: error.toSOAPFault()
          }
        };

        callback(soapFault);
      } else {
        error(`SOAP Internal Error - GetTrackingStatus: ${error.message}`);

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

  static getServiceDefinition() {
    return {
      TrackingService: {
        TrackingServicePort: {
          GetTrackingStatus: this.GetTrackingStatus
        }
      }
    };
  }

  static soapLoggingMiddleware(req, res, next) {
    const startTime = Date.now();

    info(`SOAP Request received: ${req.method} ${req.url}`);
    debug(`SOAP Request headers: ${JSON.stringify(req.headers)}`);

    if (req.body) {
      debug(`SOAP Request body: ${req.body}`);
    }

    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      info(`SOAP Response sent: ${res.statusCode} - ${responseTime}ms`);

      if (res.statusCode >= 400) {
        debug(`SOAP Response body: ${data}`);
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
    const soapAction = req.get('SOAPAction');

    if (!contentType || !contentType.includes('text/xml')) {
      warn(`Invalid Content-Type: ${contentType}`);
      return false;
    }

    return true;
  }
}

export {
  SoapController as default,
  SoapController
};

export const getServiceDefinition = SoapController.getServiceDefinition;
export const soapLoggingMiddleware = SoapController.soapLoggingMiddleware;
export const soapErrorHandler = SoapController.soapErrorHandler;
