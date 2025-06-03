import express from 'express';
import soap from 'soap';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import trackingService from './services/trackingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Definir el servicio SOAP (como en el primer código)
const soapService = {
  TrackingService: {
    TrackingPort: {
      GetTrackingStatus: async (args, callback) => {
        try {
          console.log('SOAP Request received:', args);

          // Validación
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

          // Lógica de negocio
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

          console.log('SOAP Response:', result);
          callback(null, result);

        } catch (error) {
          console.error('Error processing SOAP request:', error);
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

// Leer archivo WSDL
const wsdlPath = path.join(__dirname, 'wsdl', 'tracking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

// Iniciar servidor y publicar el servicio SOAP
const server = app.listen(port, () => {
  console.log(`� Servidor Express corriendo en puerto ${port}`);
  soap.listen(server, '/tracking', soapService, wsdlXML, (err, res) => {
    if (err) {
      console.error('❌ Error creando servicio SOAP:', err);
      return;
    }
    console.log('✅ Servicio SOAP creado exitosamente');
    console.log(`� WSDL disponible en: http://localhost:${port}/tracking?wsdl`);
    console.log(`� Endpoint SOAP: http://localhost:${port}/tracking`);
  });
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.send(`
    <h1>Envíos Express - Servicio SOAP</h1>
    <p>Servicio funcionando correctamente</p>
    <ul>
      <li><a href="/tracking?wsdl">Ver WSDL</a></li>
      <li>Endpoint SOAP: /tracking</li>
    </ul>
  `);
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EnvíosExpress SOAP API'
  });
});

export default app;
