import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from '@admissions-hub/shared';
import type { LeadFields } from './salesforce.client';

/**
 * Admissions status → default Lead Status picklist values of a Developer Edition org.
 * ACCEPTED stays "Working": converting a Lead is a Salesforce action, not a field to set.
 */
export const LEAD_STATUS: Record<ApplicationStatus, string> = {
  NEW: 'Open - Not Contacted',
  REVIEWING: 'Working - Contacted',
  ACCEPTED: 'Working - Contacted',
  REJECTED: 'Closed - Not Converted',
};

export const LEAD_SOURCE = 'Web';

type MappedApplication = Pick<
  Application,
  'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'program' | 'status'
>;

/** Application → Lead. Pure, so it is unit-tested without Salesforce. */
export function toLead(application: MappedApplication, schoolName: string): LeadFields {
  return {
    FirstName: application.firstName,
    LastName: application.lastName,
    Email: application.email,
    Phone: application.phone,
    Company: schoolName,
    LeadSource: LEAD_SOURCE,
    Status: LEAD_STATUS[application.status],
    Description: [
      `Programme visé : ${application.program}`,
      `Statut Admissions Hub : ${APPLICATION_STATUS_LABELS[application.status]}`,
      `Référence Admissions Hub : ${application.id}`,
    ].join('\n'),
  };
}
