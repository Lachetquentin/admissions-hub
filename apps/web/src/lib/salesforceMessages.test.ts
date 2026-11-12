import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/api/client';
import { callbackErrorMessage, syncErrorMessage } from './salesforceMessages';

describe('syncErrorMessage', () => {
  it('translates the known API codes', () => {
    const error = new ApiRequestError(
      409,
      'INVALID_SYNC_TRANSITION',
      'A synchronisation is already in progress',
    );
    expect(syncErrorMessage(error)).toBe(
      'Une synchronisation est déjà en cours pour cette candidature',
    );
  });

  it('falls back to the API message, then to a generic one', () => {
    expect(
      syncErrorMessage(new ApiRequestError(500, 'INTERNAL_ERROR', 'Something went wrong')),
    ).toBe('Something went wrong');
    expect(syncErrorMessage(new Error('boom'))).toBe('La synchronisation a échoué, réessayez');
  });
});

describe('callbackErrorMessage', () => {
  it('explains the usual OAuth outcomes, and keeps the code otherwise', () => {
    expect(callbackErrorMessage('access_denied')).toBe("L'accès a été refusé dans Salesforce");
    expect(callbackErrorMessage('invalid_grant')).toBe(
      'Connexion à Salesforce impossible (invalid_grant)',
    );
    expect(callbackErrorMessage(null)).toBe('Connexion à Salesforce impossible');
  });
});
