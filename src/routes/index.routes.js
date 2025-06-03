import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send(`
    <h1>Envíos Express - Servicio SOAP</h1>
    <p>Servicio funcionando correctamente</p>
    <ul>
    <li><a href="/tracking?wsdl">Ver WSDL</a></li>
    <li>Endpoint SOAP: /tracking</li>
    </ul>
    `);
})

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EnvíosExpress SOAP API'
  });
});

export default router;
