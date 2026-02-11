export type AdminLeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type ReferrerLeadStatus = 'new' | 'pending' | 'closed' | 'lost';

export function mapStatusForReferrer(adminStatus: AdminLeadStatus): ReferrerLeadStatus {
  switch (adminStatus) {
    case 'new':
      return 'new';
    case 'contacted':
    case 'qualified':
      return 'pending';
    case 'converted':
      return 'closed';
    case 'lost':
      return 'lost';
    default:
      return 'pending';
  }
}

export function getReferrerStatusLabel(adminStatus: AdminLeadStatus): string {
  const mapped = mapStatusForReferrer(adminStatus);
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}
