import { APPLICATION_STATUSES } from '@admissions-hub/shared';
import { describe, expect, it } from 'vitest';
import { LEAD_STATUS, toLead } from './salesforce.mapping';

const application = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  firstName: 'Inès',
  lastName: 'Durand',
  email: 'ines.durand@example.com',
  phone: '+33 6 11 31 00 11',
  program: 'MSc Cybersécurité',
  status: 'REVIEWING' as const,
};

describe('toLead', () => {
  it('maps the candidate to the standard Lead fields, the school being the Company', () => {
    expect(toLead(application, "Institut d'Ingénierie Numérique")).toEqual({
      FirstName: 'Inès',
      LastName: 'Durand',
      Email: 'ines.durand@example.com',
      Phone: '+33 6 11 31 00 11',
      Company: "Institut d'Ingénierie Numérique",
      LeadSource: 'Web',
      Status: 'Working - Contacted',
      Description:
        'Programme visé : MSc Cybersécurité\nStatut Admissions Hub : En revue\n' +
        'Référence Admissions Hub : 7c9e6679-7425-40de-944b-e07fc1f90ae7',
    });
  });

  it.each([
    ['NEW', 'Open - Not Contacted'],
    ['REVIEWING', 'Working - Contacted'],
    ['ACCEPTED', 'Working - Contacted'],
    ['REJECTED', 'Closed - Not Converted'],
  ] as const)('maps status %s to Lead Status "%s"', (status, leadStatus) => {
    expect(toLead({ ...application, status }, 'ESC').Status).toBe(leadStatus);
  });

  it('has a Lead Status for every application status', () => {
    for (const status of APPLICATION_STATUSES)
      expect(LEAD_STATUS[status]).toEqual(expect.any(String));
  });
});
