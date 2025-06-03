import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/', routes);

export default app;
