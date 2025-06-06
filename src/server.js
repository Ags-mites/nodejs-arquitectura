import dotenv from 'dotenv';
import express, { text, json, urlencoded } from 'express';
import { listen } from 'soap';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

import { connectDatabase } from './database/connection.js';
import { soapLoggingMiddleware, getServiceDefinition, soapErrorHandler } from './controllers/soapController.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'SOAPAction', 'Authorization']
}));

app.use(text({ type: 'text/xml' }));
app.use(json());
app.use(urlencoded({ extended: true }));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
  });

  next();
});

app.use('/soap', soapLoggingMiddleware);

async function initializeSOAPServer() {
  try {
    const wsdlPath = join(__dirname, 'wsdl', 'tracking.wsdl');
    const wsdlContent = readFileSync(wsdlPath, 'utf8');

    _info('WSDL cargado exitosamente');

    const serviceDefinition = getServiceDefinition();

    const soapServer = listen(app, '/soap', serviceDefinition, wsdlContent, () => {
      _info('Servidor SOAP inicializado en /soap');
      _info(`WSDL disponible en: http://localhost:${PORT}/soap?wsdl`);
    });

    soapServer.log = (type, data) => {
      if (type === 'received') {
        debug('SOAP Request received:', data);
      } else if (type === 'replied') {
        debug('SOAP Response sent:', data);
      }
    };

    return soapServer;

  } catch (error) {
    _error('Error al inicializar servidor SOAP:', error);
    throw error;
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EnvíosExpress SOAP API',
    version: '1.0.0'
  });
});

app.get('/info', (req, res) => {
  res.json({
    service: 'EnvíosExpress S.A.C. - API SOAP de Seguimiento',
    version: '1.0.0',
    description: 'API SOAP para consulta de estado de paquetes',
    endpoints: {
      soap: '/soap',
      wsdl: '/soap?wsdl',
      health: '/health',
      info: '/info'
    },
    operations: [
      {
        name: 'GetTrackingStatus',
        description: 'Obtener estado de seguimiento de un paquete',
        input: 'trackingNumber (string)',
        output: 'status, currentLocation, estimatedDeliveryDate, history'
      }
    ],
    contact: {
      instructor: 'Ing. Geovanny Cudco',
      institution: 'Universidad de las Fuerzas Armadas ESPE',
      course: 'Arquitectura de Software'
    }
  });
});

app.get('/wsdl', (req, res) => {
  try {
    const wsdlPath = join(__dirname, 'wsdl', 'tracking-service.wsdl');
    const wsdlContent = readFileSync(wsdlPath, 'utf8');

    res.set('Content-Type', 'text/xml');
    res.send(wsdlContent);
  } catch (error) {
    _error('Error al leer WSDL:', error);
    res.status(500).json({ error: 'Error al cargar WSDL' });
  }
});

app.use('*', (req, res) => {
  warn(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en este servidor',
    availableEndpoints: ['/health', '/info', '/soap', '/soap?wsdl', '/wsdl']
  });
});

app.use(soapErrorHandler);

async function startServer() {
  try {
    logAppEvent('STARTING', 'Iniciando EnvíosExpress SOAP API');

    await connectDatabase();
    await initializeSOAPServer();

    const server = app.listen(PORT, () => {
      logAppEvent('STARTED', `Servidor corriendo en puerto ${PORT}`);
      _info('EnvíosExpress SOAP API iniciado exitosamente');
      _info(`Servidor disponible en: http://localhost:${PORT}`);
      _info(`Servicio SOAP en: http://localhost:${PORT}/soap`);
      _info(`WSDL en: http://localhost:${PORT}/soap?wsdl`);
      _info(`Health check en: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => {
      logAppEvent('SHUTTING_DOWN', 'Recibida señal SIGTERM');
      server.close(() => {
        logAppEvent('STOPPED', 'Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logAppEvent('SHUTTING_DOWN', 'Recibida señal SIGINT');
      server.close(() => {
        logAppEvent('STOPPED', 'Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    _error('Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default { app, startServer };
