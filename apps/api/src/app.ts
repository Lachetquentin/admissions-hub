import cors from 'cors';
import express, { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAuth, schoolScope } from './middleware/auth';
import { createApplicationsRouter } from './modules/applications/applications.routes';
import { authRouter } from './modules/auth/auth.routes';
import type { SalesforceClient } from './modules/salesforce/salesforce.client';
import { databaseTokenStore } from './modules/salesforce/salesforce.connection';
import { createHttpSalesforceClient } from './modules/salesforce/salesforce.http';
import { salesforceRouter } from './modules/salesforce/salesforce.routes';
import { schoolsRouter } from './modules/schools/schools.routes';
import { openApiDocument } from './openapi';

export type AppDeps = {
  /** Injected by tests (mock); null when Salesforce is disabled. */
  salesforce?: SalesforceClient | null;
};

const defaultSalesforceClient = () =>
  env.salesforce
    ? createHttpSalesforceClient(env.salesforce, databaseTokenStore(env.salesforce))
    : null;

export function createApp({ salesforce = defaultSalesforceClient() }: AppDeps = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: env.APP_URL }));
  app.use(express.json({ limit: '100kb' }));

  const api = Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use('/auth', authRouter);
  // Data routes need a logged-in user and are filtered by school.
  const protectedRoute = [requireAuth, schoolScope];
  api.use('/schools', protectedRoute, schoolsRouter);
  api.use('/applications', protectedRoute, createApplicationsRouter(salesforce));
  api.use('/integrations/salesforce', salesforceRouter);

  app.use('/api', api);
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
