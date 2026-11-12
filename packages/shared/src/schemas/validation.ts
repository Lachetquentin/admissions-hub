/**
 * Validation messages are stable keys, not prose: the API returns them in
 * `error.details[].message` and the web app translates them (apps/web/src/i18n).
 */
export const VALIDATION = {
  required: 'validation.required',
  tooLong: 'validation.tooLong',
  email: 'validation.email',
  phone: 'validation.phone',
  emptyPatch: 'validation.emptyPatch',
} as const;
export type ValidationKey = (typeof VALIDATION)[keyof typeof VALIDATION];
