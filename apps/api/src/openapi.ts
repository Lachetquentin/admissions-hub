import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  apiErrorSchema,
  applicationInputSchema,
  applicationListSchema,
  applicationSchema,
  applicationUpdateSchema,
  authUserSchema,
  loginResponseSchema,
  loginSchema,
  salesforceConnectSchema,
  salesforceStatusSchema,
  schoolSchema,
} from '@admissions-hub/shared';

/**
 * OpenAPI 3.1 document. Component schemas are generated from the shared Zod schemas,
 * so the docs cannot drift from the validation actually applied.
 */
const schema = (s: z.ZodType, io: 'input' | 'output' = 'output') =>
  z.toJSONSchema(s, { io, unrepresentable: 'any' });

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (name: string) => ({ content: { 'application/json': { schema: ref(name) } } });
const error = (description: string) => ({ description, ...json('ApiError') });

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const secured = { security: [{ bearerAuth: [] }] };
const authErrors = { 401: error('Missing or invalid token') };
const notFound = { 404: error('Not found, or outside your school') };
const invalid = { 400: error('Validation error') };

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Admissions Hub API',
    version: '1.0.0',
    description:
      'Multi-school admissions API. A SCHOOL_ADMIN only sees their own school: other schools answer 404.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      ApiError: schema(apiErrorSchema),
      Login: schema(loginSchema, 'input'),
      LoginResponse: schema(loginResponseSchema),
      AuthUser: schema(authUserSchema),
      School: schema(schoolSchema),
      Application: schema(applicationSchema),
      ApplicationInput: schema(applicationInputSchema, 'input'),
      ApplicationUpdate: schema(applicationUpdateSchema, 'input'),
      ApplicationList: schema(applicationListSchema),
      SalesforceStatus: schema(salesforceStatusSchema),
      SalesforceConnect: schema(salesforceConnectSchema),
    },
  },
  paths: {
    '/health': { get: { summary: 'Health check', responses: { 200: { description: 'OK' } } } },
    '/auth/login': {
      post: {
        summary: 'Log in with a seeded account',
        requestBody: { required: true, ...json('Login') },
        responses: {
          200: { description: 'JWT and user', ...json('LoginResponse') },
          ...invalid,
          ...authErrors,
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current user',
        ...secured,
        responses: { 200: { description: 'Current user', ...json('AuthUser') }, ...authErrors },
      },
    },
    '/schools': {
      get: {
        summary: 'Schools visible to the user',
        ...secured,
        responses: {
          200: {
            description: 'Schools',
            content: { 'application/json': { schema: { type: 'array', items: ref('School') } } },
          },
          ...authErrors,
        },
      },
    },
    '/schools/{id}': {
      get: {
        summary: 'One school',
        ...secured,
        parameters: [idParam],
        responses: {
          200: { description: 'School', ...json('School') },
          ...authErrors,
          ...notFound,
        },
      },
    },
    '/applications': {
      get: {
        summary: 'Paginated applications, newest first',
        ...secured,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: PAGE_SIZE_MAX,
              default: PAGE_SIZE_DEFAULT,
            },
          },
          { name: 'schoolId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: [...APPLICATION_STATUSES] },
          },
        ],
        responses: {
          200: { description: 'Page of applications', ...json('ApplicationList') },
          ...invalid,
          ...authErrors,
        },
      },
      post: {
        summary: 'Create an application',
        ...secured,
        requestBody: { required: true, ...json('ApplicationInput') },
        responses: {
          201: { description: 'Created', ...json('Application') },
          ...invalid,
          ...authErrors,
          404: error('School not found, or outside your school'),
        },
      },
    },
    '/applications/{id}': {
      get: {
        summary: 'One application',
        ...secured,
        parameters: [idParam],
        responses: {
          200: { description: 'Application', ...json('Application') },
          ...authErrors,
          ...notFound,
        },
      },
      patch: {
        summary: 'Update an application (school cannot change)',
        ...secured,
        parameters: [idParam],
        requestBody: { required: true, ...json('ApplicationUpdate') },
        responses: {
          200: { description: 'Updated', ...json('Application') },
          ...invalid,
          ...authErrors,
          ...notFound,
        },
      },
      delete: {
        summary: 'Delete an application',
        ...secured,
        parameters: [idParam],
        responses: { 204: { description: 'Deleted' }, ...authErrors, ...notFound },
      },
    },
    '/applications/{id}/sync': {
      post: {
        summary: 'Create or update the Lead in Salesforce (idempotent: reuses salesforceId)',
        description:
          'Moves syncStatus NOT_SYNCED|SYNCED|FAILED → PENDING → SYNCED|FAILED. A Salesforce failure is ' +
          'not an HTTP error: the application comes back FAILED with a readable lastSyncError.',
        ...secured,
        parameters: [idParam],
        responses: {
          200: {
            description: 'Application after the sync (SYNCED or FAILED)',
            ...json('Application'),
          },
          ...authErrors,
          ...notFound,
          409: error(
            'INVALID_SYNC_TRANSITION (sync already in progress) or SALESFORCE_NOT_CONNECTED',
          ),
          503: error('SALESFORCE_DISABLED'),
        },
      },
    },
    '/integrations/salesforce/status': {
      get: {
        summary: 'Salesforce connection state',
        ...secured,
        responses: { 200: { description: 'Status', ...json('SalesforceStatus') }, ...authErrors },
      },
    },
    '/integrations/salesforce/connect': {
      get: {
        summary: 'Authorization URL of the OAuth 2.0 Web Server Flow (PKCE), GROUP_ADMIN only',
        ...secured,
        responses: {
          200: { description: 'URL to open in the browser', ...json('SalesforceConnect') },
          ...authErrors,
          403: error('Not a GROUP_ADMIN'),
          503: error('SALESFORCE_DISABLED'),
        },
      },
    },
    '/integrations/salesforce/callback': {
      get: {
        summary: 'OAuth redirect target (called by Salesforce, not by clients)',
        parameters: [
          { name: 'code', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          302: {
            description: 'Back to the app with ?salesforce=connected or ?salesforce=error&reason=…',
          },
        },
      },
    },
  },
};
