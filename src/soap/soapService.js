const soap = require('soap');
const fs = require('fs');
const path = require('path');
const TrackingService = require('../services/trackingService');

const setupSoapService = (app, prisma) => {
  const wsdlPath = path.join(__dirname, 'tracking-service.wsdl');
  const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');

  const serviceDefinition = {
    TrackingService: {
      TrackingPort: {
        GetTrackingStatus: async function (args, callback) {
          try {
            const trackingNumber = args.trackingNumber;
            if (!trackingNumber) {
              return callback({
                Fault: {
                  Code: { Value: 'Client' },
                  Reason: { Text: 'Número de tracking requerido' },
                  Detail: {
                    TrackingError: {
                      errorCode: 'INVALID_INPUT',
                      errorMessage: 'El número de tracking es obligatorio',
                      invalidField: 'trackingNumber',
                    }
                  }
                }
              });
            }

            const service = new TrackingService(prisma);
            const result = await service.getTrackingStatus(trackingNumber);

            if (!result.success) {
              return callback({
                Fault: {
                  Code: { Value: 'Server' },
                  Reason: { Text: result.error },
                  Detail: {
                    TrackingError: {
                      errorCode: result.errorCode || 'NOT_FOUND',
                      errorMessage: result.error,
                      invalidField: 'trackingNumber',
                    }
                  }
                }
              });
            }

            return callback(null, {
              status: result.data.status,
              currentLocation: result.data.currentLocation,
              estimatedDeliveryDate: result.data.estimatedDeliveryDate,
              history: result.data.history.map(e => ({
                date: e.date,
                description: e.description,
                location: e.location
              }))
            });
          } catch (err) {
            return callback({
              Fault: {
                Code: { Value: 'Server' },
                Reason: { Text: 'Error interno del servidor' },
                Detail: {
                  TrackingError: {
                    errorCode: 'INTERNAL_ERROR',
                    errorMessage: 'Error interno del servidor',
                    invalidField: null,
                  }
                }
              }
            });
          }
        }
      }
    }
  };

  soap.listen(app, '/tracking', serviceDefinition, wsdlContent, (err) => {
    if (err) {
      console.error('Error iniciando SOAP:', err);
    } else {
      console.log('SOAP activo en /tracking');
    }
  });
};

module.exports = setupSoapService;
