import trackingService from '../services/trackingService.js';

const soapService = {
  TrackingService: {
    TrackingPort: {
      GetTrackingStatus: async (args, callback) => {
        try {
          console.log('SOAP Request received:', args);

          if (!args.trackingNumber) {
            return callback({
              Fault: {
                Code: { Value: "soap:Sender" },
                Reason: { Text: "Tracking number is required" },
                Detail: {
                  TrackingError: {
                    errorCode: 400,
                    errorMessage: "El número de tracking es requerido",
                    invalidField: "trackingNumber"
                  }
                }
              }
            });
          }

          const result = await trackingService.getTrackingStatus(args.trackingNumber);

          if (result.error) {
            return callback({
              Fault: {
                Code: { Value: "soap:Receiver" },
                Reason: { Text: result.error.errorMessage },
                Detail: {
                  TrackingError: result.error
                }
              }
            });
          }

          callback(null, result);

        } catch (error) {
          console.error('Error procesando solicitud SOAP:', error);
          return callback({
            Fault: {
              Code: { Value: "soap:Receiver" },
              Reason: { Text: "Internal server error" },
              Detail: {
                TrackingError: {
                  errorCode: 500,
                  errorMessage: "Error interno del servidor",
                  invalidField: null
                }
              }
            }
          });
        }
      }
    }
  }
};

export default soapService;
