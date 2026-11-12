import cors from 'cors';
import express, { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAuth, schoolScope } from './middleware/auth';
import { applicationsRouter } from './modules/applications/applications.routes';
import { authRouter } from './modules/auth/auth.routes';
import { schoolsRouter } from './modules/schools/schools.routes';
import { openApiDocument } from './openapi';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  const api = Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use('/auth', authRouter);
  // Data routes need a logged-in user and are filtered by school.
  const protectedRoute = [requireAuth, schoolScope];
  api.use('/schools', protectedRoute, schoolsRouter);
  api.use('/applications', protectedRoute, applicationsRouter);

  app.use('/api', api);
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
