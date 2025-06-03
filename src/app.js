import express from "express";
import soap from "soap";
import fs from "fs";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import trackingService from './services/trackingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const soapService = {
  TrackingService: {
    TrackingPort: {
      GetTrackingStatus: async (args, callback) => {
        try {
          console.log('SOAP Request received:', args);

          if (!args.trackingNumber) {
            const error = {
              Fault: {
                Code: {
                  Value: "soap:Sender"
                },
                Reason: {
                  Text: "Tracking number is required"
                },
                Detail: {
                  TrackingError: {
                    errorCode: 400,
                    errorMessage: "El número de tracking es requerido",
                    invalidField: "trackingNumber"
                  }
                }
              }
            };
            return callback(error);
          }

          const result = await trackingService.GetTrackingStatus(args.trackingNumber);

          if (result.error) {
            const error = {
              Fault: {
                Code: {
                  Value: "soap:Receiver"
                },
                Reason: {
                  Text: result.error.errorMessage
                },
                Detail: {
                  TrackingError: result.error
                }
              }
            };
            return callback(error);
          }

          console.log('SOAP Response:', result);
          callback(null, result)

        } catch (error) {

          console.error('Error processing SOAP request:', error);

          const soapError = {
            Fault: {
              Code: {
                Value: "soap:Receiver"
              },
              Reason: {
                Text: "Internal server error"
              },
              Detail: {
                TrackingError: {
                  errorCode: 500,
                  errorMessage: "Error interno del servidor",
                  invalidField: null
                }
              }
            }
          };
          callback(soapError);

        }
      }
    }
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EnvíosExpress SOAP API'
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'EnvíosExpress SOAP API',
    version: '1.0.0',
    description: 'API SOAP para seguimiento de paquetes',
    endpoints: {
      wsdl: `http://localhost:${PORT}/tracking?wsdl`,
      soap: `http://localhost:${PORT}/tracking`,
      health: `http://localhost:${PORT}/health`
    },
    documentation: 'Ver README.md para instrucciones de uso'
  });
});

async function startServer() {
  try {
    const wsdlPath = path.join(__dirname, 'wsdl', 'tracking.wsdl');
    const wsdlXml = fs.readFileSync(wsdlPath, 'utf8');

    app.listen(PORT, () => {
      console.log(`Servidor iniciado en puerto ${PORT}`);
      console.log(`WSDL disponible en: http://localhost:${PORT}/tracking?wsdl`);
      console.log(`Endpoint SOAP: http://localhost:${PORT}/tracking`);
      console.log(`Health check: http://localhost:${PORT}/health`);

      soap.listen(app, '/traking', soapService, wsdlXml, (err, res) => {
        if (err) {
          console.error('Error creando el servicio SOAP', err);
          process.exit(1);
        }
        console.log('Servicio SOAP configurado correctamente');
        console.log('Metodos disponibles: GetTrackingStatus');
      });
    });

  } catch (error) {
    console.error('Error iniciando el servidor: ', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;
