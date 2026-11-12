import { afterAll, describe, expect, it } from 'vitest';
import { VALIDATION } from '@admissions-hub/shared';
import { ApiRequestError } from '@/api/client';
import { i18n } from '@/i18n';
import { callbackErrorMessage, errorMessage, translateMessage } from './messages';

afterAll(() => i18n.changeLanguage('fr'));

describe.each([
  ['fr', 'Adresse e-mail invalide', 'Une synchronisation est déjà en cours pour cette candidature'],
  ['en', 'Invalid e-mail address', 'A sync is already in progress for this application'],
] as const)('in %s', (lng, email, syncBusy) => {
  it('translates shared validation keys, and leaves other text as is', async () => {
    await i18n.changeLanguage(lng);
    expect(translateMessage(VALIDATION.email)).toBe(email);
    expect(translateMessage('Required fields are missing: [Company]')).toBe(
      'Required fields are missing: [Company]',
    );
  });

  it('translates API error codes, falling back to the API message', async () => {
    await i18n.changeLanguage(lng);
    expect(errorMessage(new ApiRequestError(409, 'INVALID_SYNC_TRANSITION', 'busy'))).toBe(
      syncBusy,
    );
    expect(errorMessage(new ApiRequestError(418, 'TEAPOT', 'I am a teapot'))).toBe('I am a teapot');
  });
});

describe('callbackErrorMessage', () => {
  it('explains known OAuth outcomes and keeps unknown codes visible', async () => {
    await i18n.changeLanguage('en');
    expect(callbackErrorMessage('access_denied')).toBe('Access was denied in Salesforce');
    expect(callbackErrorMessage('invalid_grant')).toBe(
      'Could not connect to Salesforce (invalid_grant)',
    );
    expect(callbackErrorMessage(null)).toBe('Could not connect to Salesforce');
  });
});
