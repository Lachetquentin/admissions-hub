import { z } from 'zod';
import { isoDateSchema } from './common';

/** GET /integrations/salesforce/status */
export const salesforceStatusSchema = z.object({
  /** false when the server runs with SALESFORCE_ENABLED=false (e.g. the public demo). */
  enabled: z.boolean(),
  connected: z.boolean(),
  instanceUrl: z.string().nullable(),
  connectedAt: isoDateSchema.nullable(),
});
export type SalesforceStatus = z.infer<typeof salesforceStatusSchema>;

/** GET /integrations/salesforce/connect: the Salesforce authorization page to open. */
export const salesforceConnectSchema = z.object({ url: z.url() });
export type SalesforceConnect = z.infer<typeof salesforceConnectSchema>;

/** Query flag set by the OAuth callback when it sends the user back to the app. */
export const SALESFORCE_CALLBACK_PARAM = 'salesforce';
export type SalesforceCallbackResult = 'connected' | 'error';
