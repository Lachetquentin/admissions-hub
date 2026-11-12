import { z } from 'zod';
import { loadEnv } from './loadEnv';

const base64Key32 = z
  .string()
  .refine(
    (value) => Buffer.from(value, 'base64').length === 32,
    'must be 32 bytes encoded in base64',
  );

/** `KEY=` (empty, as in .env.example or `${KEY:-}` in Compose) means "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    /** Public URL of the web app: CORS origin and where the OAuth callback sends the user back. */
    APP_URL: z.url().default('http://localhost:5173'),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('8h'),

    /** false (e.g. the public demo): every Salesforce feature is off and answers 503. */
    SALESFORCE_ENABLED: z.stringbool().default(false),
    SALESFORCE_LOGIN_URL: z.url().default('https://login.salesforce.com'),
    SALESFORCE_CLIENT_ID: optional(z.string()),
    SALESFORCE_CLIENT_SECRET: optional(z.string()),
    SALESFORCE_REDIRECT_URI: optional(z.url()),
    SALESFORCE_API_VERSION: z
      .string()
      .regex(/^v\d+\.\d$/, 'e.g. v62.0')
      .default('v62.0'),
    /** AES-256-GCM key protecting the Salesforce tokens at rest. */
    TOKEN_ENCRYPTION_KEY: optional(base64Key32),
  })
  .superRefine((value, ctx) => {
    if (!value.SALESFORCE_ENABLED) return;
    for (const key of [
      'SALESFORCE_CLIENT_ID',
      'SALESFORCE_CLIENT_SECRET',
      'SALESFORCE_REDIRECT_URI',
      'TOKEN_ENCRYPTION_KEY',
    ] as const) {
      if (!value[key])
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'required when SALESFORCE_ENABLED=true',
        });
    }
  })
  .transform(({ SALESFORCE_ENABLED, ...rest }) => ({
    ...rest,
    salesforce: SALESFORCE_ENABLED
      ? {
          loginUrl: rest.SALESFORCE_LOGIN_URL,
          clientId: rest.SALESFORCE_CLIENT_ID!,
          clientSecret: rest.SALESFORCE_CLIENT_SECRET!,
          redirectUri: rest.SALESFORCE_REDIRECT_URI!,
          apiVersion: rest.SALESFORCE_API_VERSION,
          encryptionKey: Buffer.from(rest.TOKEN_ENCRYPTION_KEY!, 'base64'),
        }
      : null,
  }));

export type Env = z.infer<typeof envSchema>;
export type SalesforceConfig = NonNullable<Env['salesforce']>;

function readEnv(): Env {
  loadEnv();
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${problems}`);
  }
  return result.data;
}

export const env = readEnv();
