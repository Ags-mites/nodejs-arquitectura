require('dotenv').config();
const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const { connectDatabase } = require('./database/connection');
const SoapController = require('./controllers/SoapController');
const logger = require('./utils/logger');

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

app.use(express.text({ type: 'text/xml' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });

  next();
});

app.use('/soap', SoapController.soapLoggingMiddleware);

async function initializeSOAPServer() {
  try {
    const wsdlPath = path.join(__dirname, 'wsdl', 'tracking-service.wsdl');
    const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');

    logger.info('WSDL cargado exitosamente');

    const serviceDefinition = SoapController.getServiceDefinition();

    const soapServer = soap.listen(app, '/soap', serviceDefinition, wsdlContent, () => {
      logger.info('Servidor SOAP inicializado en /soap');
      logger.info(`WSDL disponible en: http://localhost:${PORT}/soap?wsdl`);
    });

    soapServer.log = (type, data) => {
      if (type === 'received') {
        logger.debug('SOAP Request received:', data);
      } else if (type === 'replied') {
        logger.debug('SOAP Response sent:', data);
      }
    };

    return soapServer;

  } catch (error) {
    logger.error('Error al inicializar servidor SOAP:', error);
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
    const wsdlPath = path.join(__dirname, 'wsdl', 'tracking-service.wsdl');
    const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');

    res.set('Content-Type', 'text/xml');
    res.send(wsdlContent);
  } catch (error) {
    logger.error('Error al leer WSDL:', error);
    res.status(500).json({ error: 'Error al cargar WSDL' });
  }
});

app.use('*', (req, res) => {
  logger.warn(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en este servidor',
    availableEndpoints: ['/health', '/info', '/soap', '/soap?wsdl', '/wsdl']
  });
});

app.use(SoapController.soapErrorHandler);

async function startServer() {
  try {
    logger.logAppEvent('STARTING', 'Iniciando EnvíosExpress SOAP API');

    await connectDatabase();
    await initializeSOAPServer();

    const server = app.listen(PORT, () => {
      logger.logAppEvent('STARTED', `Servidor corriendo en puerto ${PORT}`);
      logger.info('EnvíosExpress SOAP API iniciado exitosamente');
      logger.info(`Servidor disponible en: http://localhost:${PORT}`);
      logger.info(`Servicio SOAP en: http://localhost:${PORT}/soap`);
      logger.info(`WSDL en: http://localhost:${PORT}/soap?wsdl`);
      logger.info(`Health check en: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => {
      logger.logAppEvent('SHUTTING_DOWN', 'Recibida señal SIGTERM');
      server.close(() => {
        logger.logAppEvent('STOPPED', 'Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.logAppEvent('SHUTTING_DOWN', 'Recibida señal SIGINT');
      server.close(() => {
        logger.logAppEvent('STOPPED', 'Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    logger.error('Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
