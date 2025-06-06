import dotenv from 'dotenv';
import express from 'express';
import { listen } from 'soap';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import { connectDatabase } from './database/connection.js';
import TrackingService from './services/trackingService.js';
import errorUtils from './utils/errors.js';
import { info, error as logError, warn, debug } from './utils/logger.js';

const { TrackingError, ERROR_CODES } = errorUtils;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/xml' }));

// Variable para rastrear el estado del SOAP
let soapInitialized = false;

// Función del servicio SOAP
async function GetTrackingStatus(args, callback) {
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
    info(`SOAP Success - GetTrackingStatus: trackingNumber=${trackingNumber}, responseTime=${responseTime}ms`);

    callback(null, soapResponse);

  } catch (err) {
    const responseTime = Date.now() - startTime;

    if (err instanceof TrackingError) {
      logError(`SOAP Error - GetTrackingStatus: ${JSON.stringify({
        operation: 'GetTrackingStatus',
        error: err.message,
        errorCode: err.errorCode,
        trackingNumber,
        responseTime
      })}`);

      const soapFault = {
        Fault: {
          faultcode: 'Client',
          faultstring: err.errorMessage,
          detail: err.toSOAPFault()
        }
      };

      callback(soapFault);
    } else {
      logError(`SOAP Internal Error - GetTrackingStatus: ${err.message}`);

      const soapFault = {
        Fault: {
          faultcode: 'Server',
          faultstring: 'Error interno del servidor',
          detail: {
            TrackingError: {
              errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
              errorMessage: 'Error interno del servidor',
              invalidField: ''
            }
          }
        }
      };

      callback(soapFault);
    }
  }
}

// Definición del servicio SOAP
const soapService = {
  TrackingService: {
    TrackingServicePort: {
      GetTrackingStatus: GetTrackingStatus
    }
  }
};

// Función para inicializar SOAP
async function initializeSOAP() {
  try {
    info('� Inicializando servidor SOAP...');

    // Cargar WSDL
    const wsdlPath = join(__dirname, 'wsdl', 'tracking.wsdl');
    info(`� Cargando WSDL desde: ${wsdlPath}`);

    const wsdlContent = readFileSync(wsdlPath, 'utf8');
    info(`✅ WSDL cargado: ${wsdlContent.length} caracteres`);

    // Crear servidor SOAP
    const soapServer = listen(app, '/soap', soapService, wsdlContent, (err) => {
      if (err) {
        logError('❌ Error en callback SOAP:', err);
        return;
      }

      soapInitialized = true;
      info('✅ Servidor SOAP inicializado correctamente');
      info(`� SOAP endpoint: http://localhost:${PORT}/soap`);
      info(`� WSDL disponible: http://localhost:${PORT}/soap?wsdl`);
    });

    // Configurar logging del servidor SOAP
    if (soapServer) {
      soapServer.log = (type, data) => {
        if (type === 'received') {
          debug('SOAP Request recibido');
        } else if (type === 'replied') {
          debug('SOAP Response enviado');
        }
      };
    }

    return soapServer;

  } catch (error) {
    logError('� Error fatal al inicializar SOAP:', error);
    throw error;
  }
}

// Rutas REST
app.get('/', (req, res) => {
  res.json({
    service: 'EnvíosExpress SOAP API',
    version: '1.0.0',
    status: 'running',
    soap: {
      initialized: soapInitialized,
      endpoint: '/soap',
      wsdl: '/soap?wsdl'
    },
    endpoints: {
      health: '/health',
      info: '/info',
      soap: '/soap',
      wsdl: '/soap?wsdl'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EnvíosExpress SOAP API',
    version: '1.0.0',
    soap: {
      initialized: soapInitialized,
      status: soapInitialized ? 'running' : 'not initialized'
    }
  });
});

app.get('/info', (req, res) => {
  res.json({
    service: 'EnvíosExpress S.A.C. - API SOAP de Seguimiento',
    version: '1.0.0',
    description: 'API SOAP para consulta de estado de paquetes',
    soap: {
      initialized: soapInitialized,
      endpoint: '/soap',
      wsdl: '/soap?wsdl'
    },
    operations: [
      {
        name: 'GetTrackingStatus',
        description: 'Obtener estado de seguimiento de un paquete',
        input: 'trackingNumber (string)',
        output: 'status, currentLocation, estimatedDeliveryDate, history'
      }
    ]
  });
});

app.get('/wsdl', (req, res) => {
  try {
    const wsdlPath = join(__dirname, 'wsdl', 'tracking.wsdl');
    const wsdlContent = readFileSync(wsdlPath, 'utf8');
    res.set('Content-Type', 'text/xml');
    res.send(wsdlContent);
  } catch (error) {
    logError('Error al leer WSDL:', error);
    res.status(500).json({ error: 'Error al cargar WSDL' });
  }
});

// Ruta para debug del SOAP
app.get('/soap-status', (req, res) => {
  res.json({
    soapInitialized,
    timestamp: new Date().toISOString(),
    message: soapInitialized ? 'SOAP está funcionando' : 'SOAP no está inicializado'
  });
});

// Favicon
app.get('/favicon.ico', (req, res) => res.status(204).send());

// Manejo de errores y rutas no encontradas
app.use((req, res) => {
  // Si es una ruta SOAP y no está inicializado, dar información específica
  if (req.path.startsWith('/soap') && !soapInitialized) {
    return res.status(503).json({
      error: 'Servicio SOAP no disponible',
      message: 'El servidor SOAP no se ha inicializado correctamente',
      suggestion: 'Verifica los logs del servidor para más información'
    });
  }

  // Otras rutas no encontradas
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: ['/', '/health', '/info', '/soap', '/soap?wsdl', '/wsdl', '/soap-status']
  });
});

// Función principal
async function startServer() {
  try {
    info('� Iniciando EnvíosExpress SOAP API...');

    // 1. Conectar base de datos
    info('� Conectando a la base de datos...');
    await connectDatabase();

    // 2. Inicializar SOAP
    await initializeSOAP();

    // 3. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      info('� Servidor iniciado exitosamente!');
      info(`� URL: http://localhost:${PORT}`);
      info(`� SOAP: http://localhost:${PORT}/soap`);
      info(`� WSDL: http://localhost:${PORT}/soap?wsdl`);
      info(`❤️  Health: http://localhost:${PORT}/health`);

      // Verificar que SOAP esté funcionando
      setTimeout(() => {
        if (soapInitialized) {
          info('✅ Verificación: SOAP está funcionando correctamente');
        } else {
          warn('⚠️  Advertencia: SOAP podría no estar funcionando');
        }
      }, 1000);
    });

    // Manejo de señales
    process.on('SIGTERM', () => {
      info('� Cerrando servidor...');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      info('� Cerrando servidor...');
      server.close(() => process.exit(0));
    });

    return server;

  } catch (error) {
    logError('� Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default { app, startServer };
