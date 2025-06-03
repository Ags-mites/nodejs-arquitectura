import http from 'http';
import soap from 'soap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import soapService from './soap/soapService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

const server = http.createServer(app);

const wsdlPath = path.join(__dirname, 'wsdl', 'tracking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

server.listen(port, () => {
  console.log(`Servidor Express corriendo en puerto ${port}`);

  soap.listen(server, '/tracking', soapService, wsdlXML, (err) => {
    if (err) {
      console.error('Error creando servicio SOAP:', err);
    } else {
      console.log('Servicio SOAP disponible');
      console.log(`WSDL: http://localhost:${port}/tracking?wsdl`);
      console.log(`Endpoint SOAP: http://localhost:${port}/tracking`);
    }
  });
});
