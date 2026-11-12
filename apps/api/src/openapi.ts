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

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };
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
    },
  },
  paths: {
    '/health': { get: { summary: 'Health check', responses: { 200: { description: 'OK' } } } },
    '/auth/login': {
      post: {
        summary: 'Log in with a seeded account',
        requestBody: { required: true, ...json('Login') },
        responses: { 200: { description: 'JWT and user', ...json('LoginResponse') }, ...invalid, ...authErrors },
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
        responses: { 200: { description: 'School', ...json('School') }, ...authErrors, ...notFound },
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
            schema: { type: 'integer', minimum: 1, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_DEFAULT },
          },
          { name: 'schoolId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: [...APPLICATION_STATUSES] } },
        ],
        responses: { 200: { description: 'Page of applications', ...json('ApplicationList') }, ...invalid, ...authErrors },
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
        responses: { 200: { description: 'Application', ...json('Application') }, ...authErrors, ...notFound },
      },
      patch: {
        summary: 'Update an application (school cannot change)',
        ...secured,
        parameters: [idParam],
        requestBody: { required: true, ...json('ApplicationUpdate') },
        responses: { 200: { description: 'Updated', ...json('Application') }, ...invalid, ...authErrors, ...notFound },
      },
      delete: {
        summary: 'Delete an application',
        ...secured,
        parameters: [idParam],
        responses: { 204: { description: 'Deleted' }, ...authErrors, ...notFound },
      },
    },
  },
};
