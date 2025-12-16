/**
 * Calculation utilities for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import { IFunnelTechnikLeadItem } from '../../../types/reporting';

/**
 * Status breakdown data
 */
export interface StatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Declined reason data
 */
export interface DeclinedReasonItem {
  reason: string;
  count: number;
  percentage: number;
}

/**
 * SLA bucket data
 */
export interface SLABucket {
  label: string;
  threshold: number;
  count: number;
  leads: IFunnelTechnikLeadItem[];
}

/**
 * Last note data
 */
export interface LastNote {
  text: string;
  date: Date;
  author: string;
}

/**
 * Compute status breakdown from leads
 * Fallback if statusBreakdown is missing from API
 */
export const computeStatusBreakdown = (
  leads: IFunnelTechnikLeadItem[]
): StatusBreakdownItem[] => {
  if (!leads || leads.length === 0) {
    return [];
  }

  const statusMap = new Map<string, number>();

  leads.forEach(lead => {
    const status = lead.currentStatusLabel || lead.currentStatus || 'Neznamy';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const total = leads.length;
  const breakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  return breakdown;
};

/**
 * Compute declined reasons from leads
 * Fallback if declinedReasons is missing from API
 */
export const computeDeclinedReasons = (
  leads: IFunnelTechnikLeadItem[]
): DeclinedReasonItem[] => {
  if (!leads || leads.length === 0) {
    return [];
  }

  // Filter only declined leads
  const declinedLeads = leads.filter(
    lead =>
      lead.currentStatusLabel?.includes('Zamitnuto') ||
      lead.currentStatus?.includes('DECLINED') ||
      lead.declinedReasonLabel
  );

  if (declinedLeads.length === 0) {
    return [];
  }

  const reasonMap = new Map<string, number>();

  declinedLeads.forEach(lead => {
    const reason =
      lead.declinedReasonLabel ||
      lead.declinedReason ||
      'Neznam duvod';
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
  });

  const total = declinedLeads.length;
  const reasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  return reasons;
};

/**
 * Compute SLA buckets (leads over threshold days)
 * @param leads - All leads
 * @param thresholds - Days thresholds (default: [3, 7])
 */
export const computeSlaBuckets = (
  leads: IFunnelTechnikLeadItem[],
  thresholds: number[] = [3, 7]
): SLABucket[] => {
  if (!leads || leads.length === 0) {
    return thresholds.map(threshold => ({
      label: `Nad ${threshold} dny`,
      threshold,
      count: 0,
      leads: []
    }));
  }

  // Filter only leads in progress
  const inProgressLeads = leads.filter(
    lead =>
      lead.currentStatusLabel?.includes('reseni') ||
      lead.currentStatusLabel?.includes('Predano technikovi') ||
      lead.currentStatus === 'UPLOAD_DOCUMENTS'
  );

  const buckets = thresholds.map(threshold => {
    const overThreshold = inProgressLeads.filter(
      lead => (lead.daysInTechnicianReview || 0) > threshold
    );

    return {
      label: `Nad ${threshold} dny`,
      threshold,
      count: overThreshold.length,
      leads: overThreshold.sort(
        (a, b) =>
          (b.daysInTechnicianReview || 0) - (a.daysInTechnicianReview || 0)
      )
    };
  });

  return buckets;
};

/**
 * Get last note from lead notes
 */
export const getLastNote = (
  notes: Array<{ text: string; date: Date | string; author: string }> | undefined
): LastNote | null => {
  if (!notes || notes.length === 0) {
    return null;
  }

  // Sort by date descending
  const sorted = [...notes].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateB.getTime() - dateA.getTime();
  });

  const last = sorted[0];
  return {
    text: last.text,
    date: typeof last.date === 'string' ? new Date(last.date) : last.date,
    author: last.author
  };
};

/**
 * Sort leads for display
 * Priority:
 * 1. In progress + longest days first
 * 2. Others by handedToTechnicianDate desc
 */
export const sortLeads = (
  leads: IFunnelTechnikLeadItem[]
): IFunnelTechnikLeadItem[] => {
  if (!leads || leads.length === 0) {
    return [];
  }

  const inProgress: IFunnelTechnikLeadItem[] = [];
  const others: IFunnelTechnikLeadItem[] = [];

  leads.forEach(lead => {
    const isInProgress =
      lead.currentStatusLabel?.includes('reseni') ||
      lead.currentStatusLabel?.includes('Predano technikovi') ||
      lead.currentStatus === 'UPLOAD_DOCUMENTS';

    if (isInProgress) {
      inProgress.push(lead);
    } else {
      others.push(lead);
    }
  });

  // Sort in progress by days desc
  inProgress.sort(
    (a, b) =>
      (b.daysInTechnicianReview || 0) - (a.daysInTechnicianReview || 0)
  );

  // Sort others by date desc
  others.sort((a, b) => {
    const dateA = new Date(a.handedToTechnicianDate);
    const dateB = new Date(b.handedToTechnicianDate);
    return dateB.getTime() - dateA.getTime();
  });

  return [...inProgress, ...others];
};

/**
 * Filter leads by search query
 */
export const filterLeads = (
  leads: IFunnelTechnikLeadItem[],
  query: string
): IFunnelTechnikLeadItem[] => {
  if (!query || query.trim() === '') {
    return leads;
  }

  const lowerQuery = query.toLowerCase().trim();

  return leads.filter(lead => {
    const uniqueId = lead.uniqueId?.toString() || '';
    const customerName = (lead.customerName || '').toLowerCase();
    const carBrand = (lead.carBrand || '').toLowerCase();
    const carModel = (lead.carModel || '').toLowerCase();
    const carVIN = (lead.carVIN || '').toLowerCase();

    return (
      uniqueId.includes(lowerQuery) ||
      customerName.includes(lowerQuery) ||
      carBrand.includes(lowerQuery) ||
      carModel.includes(lowerQuery) ||
      carVIN.includes(lowerQuery)
    );
  });
};

/**
 * Filter leads by status
 */
export const filterLeadsByStatus = (
  leads: IFunnelTechnikLeadItem[],
  status: string | null
): IFunnelTechnikLeadItem[] => {
  if (!status || status === 'all') {
    return leads;
  }

  return leads.filter(lead => {
    const currentStatus = lead.currentStatusLabel || lead.currentStatus || '';
    return currentStatus.includes(status);
  });
};

/**
 * Filter leads by declined reason
 */
export const filterLeadsByDeclinedReason = (
  leads: IFunnelTechnikLeadItem[],
  reason: string | null
): IFunnelTechnikLeadItem[] => {
  if (!reason || reason === 'all') {
    return leads;
  }

  return leads.filter(lead => {
    const declinedReason =
      lead.declinedReasonLabel || lead.declinedReason || '';
    return declinedReason.includes(reason);
  });
};
