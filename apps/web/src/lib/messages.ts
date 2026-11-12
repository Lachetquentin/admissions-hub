import { ApiRequestError } from '@/api/client';
import { i18n } from '@/i18n';

/**
 * Message → current language. Shared Zod schemas send keys (`validation.email`); anything
 * that is not a known key (e.g. a Salesforce message) is shown as is.
 */
export const translateMessage = (message: string): string =>
  i18n.exists(message) ? i18n.t(message as never) : message;

/** API error → readable sentence, by its stable code (`apiErrors.*`), else the API message. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return i18n.t('common.unexpectedError');
  const key = `apiErrors.${error.code}`;
  return i18n.exists(key) ? i18n.t(key as never) : error.message;
}

/** `?salesforce=error&reason=…` left by the OAuth callback → readable sentence. */
export function callbackErrorMessage(reason: string | null): string {
  if (!reason) return i18n.t('salesforce.callback.generic');
  const key = `salesforce.callback.${reason}`;
  return i18n.exists(key)
    ? i18n.t(key as never)
    : i18n.t('salesforce.callback.genericWithCode', { code: reason });
}
