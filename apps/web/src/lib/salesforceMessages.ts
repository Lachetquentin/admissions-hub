import { ApiRequestError } from '@/api/client';

/** French copy for the API error codes of the Salesforce integration. */
const API_ERRORS: Record<string, string> = {
  SALESFORCE_NOT_CONNECTED:
    "Salesforce n'est pas encore connecté. Un administrateur groupe doit le connecter",
  SALESFORCE_DISABLED: 'La synchronisation Salesforce est désactivée sur ce serveur',
  INVALID_SYNC_TRANSITION: 'Une synchronisation est déjà en cours pour cette candidature',
};

const CALLBACK_ERRORS: Record<string, string> = {
  access_denied: "L'accès a été refusé dans Salesforce",
  INVALID_STATE: 'Le lien de connexion a expiré, recommencez',
  SALESFORCE_DISABLED: 'La synchronisation Salesforce est désactivée sur ce serveur',
};

export function syncErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return API_ERRORS[error.code] ?? error.message;
  return 'La synchronisation a échoué, réessayez';
}

export const callbackErrorMessage = (reason: string | null): string =>
  (reason && CALLBACK_ERRORS[reason]) ??
  `Connexion à Salesforce impossible${reason ? ` (${reason})` : ''}`;
