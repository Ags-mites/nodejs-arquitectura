import express from 'express';
import fs from 'fs';
import { soap } from 'strong-soap';
import trackingService from './services/trackingService.js';

const app = express();
const port = 8000;

const wsdlXML = fs.readFileSync('./wsdl/service.wsdl', 'utf8');
soap.listen(app, '/soap/tracking', trackingService, wsdlXML);

app.listen(port, () => {
  console.log(`SOAP server listening at http://localhost:${port}/soap/tracking`);
});

