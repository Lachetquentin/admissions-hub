/** Lead fields written by Admissions Hub (standard Lead object). */
export type LeadFields = {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  /** Required on Lead: the school the candidate applied to. */
  Company: string;
  LeadSource: string;
  Status: string;
  Description: string;
};

/**
 * The only thing the rest of the API knows about Salesforce. The HTTP implementation lives in
 * salesforce.http.ts; tests inject a mock, so CI never calls Salesforce.
 */
export interface SalesforceClient {
  /** Updates the Lead `existingId` when it still exists, otherwise creates one. Returns the Lead id. */
  upsertLead(fields: LeadFields, existingId: string | null): Promise<string>;
}

/** A failure reported by Salesforce (or reaching it), with its Salesforce error code. */
export class SalesforceError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'SalesforceError';
  }
}
