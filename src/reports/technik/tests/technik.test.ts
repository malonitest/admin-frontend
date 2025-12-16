/**
 * Unit tests for Funnel Technik Report utilities
 * No Czech diacritics - ASCII only
 */

import { describe, it, expect } from 'vitest';
import {
  formatCzk,
  formatDate,
  formatPercentage,
  maskVin,
  getFullVin,
  formatCarName
} from '../utils/formatters';
import {
  computeStatusBreakdown,
  computeDeclinedReasons,
  computeSlaBuckets,
  getLastNote,
  sortLeads
} from '../utils/calculations';
import { IFunnelTechnikLeadItem } from '../../../types/reporting';

// ============================================================================
// FORMATTER TESTS
// ============================================================================

describe('formatCzk', () => {
  it('should format amount with thousand separators', () => {
    expect(formatCzk(1234567)).toBe('1 234 567 Kc');
    expect(formatCzk(1000)).toBe('1 000 Kc');
    expect(formatCzk(999)).toBe('999 Kc');
  });

  it('should handle edge cases', () => {
    expect(formatCzk(0)).toBe('0 Kc');
    expect(formatCzk(null)).toBe('0 Kc');
    expect(formatCzk(undefined)).toBe('0 Kc');
    expect(formatCzk(NaN)).toBe('0 Kc');
  });

  it('should round decimals', () => {
    expect(formatCzk(1234.56)).toBe('1 235 Kc');
    expect(formatCzk(1234.49)).toBe('1 234 Kc');
  });
});

describe('formatDate', () => {
  it('should format date to DD.MM.YYYY', () => {
    const date = new Date('2025-12-16');
    expect(formatDate(date)).toBe('16.12.2025');
  });

  it('should handle string dates', () => {
    expect(formatDate('2025-01-01')).toBe('01.01.2025');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('invalid')).toBe('-');
  });
});

describe('formatPercentage', () => {
  it('should format percentage to 1 decimal place', () => {
    expect(formatPercentage(54.5555)).toBe('54.6%');
    expect(formatPercentage(100)).toBe('100.0%');
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('should handle edge cases', () => {
    expect(formatPercentage(null)).toBe('0.0%');
    expect(formatPercentage(undefined)).toBe('0.0%');
    expect(formatPercentage(NaN)).toBe('0.0%');
  });
});

describe('maskVin', () => {
  it('should mask VIN showing only last 6 characters', () => {
    expect(maskVin('WF0XXGCGXBBY36496')).toBe('***********36496');
    expect(maskVin('12345678901234567')).toBe('***********34567');
  });

  it('should handle short VINs', () => {
    expect(maskVin('123456')).toBe('123456');
    expect(maskVin('12345')).toBe('12345');
  });

  it('should handle missing VINs', () => {
    expect(maskVin(null)).toBe('Neuvedeno');
    expect(maskVin(undefined)).toBe('Neuvedeno');
    expect(maskVin('Neuvedeno')).toBe('Neuvedeno');
  });
});

describe('getFullVin', () => {
  it('should return full VIN', () => {
    expect(getFullVin('WF0XXGCGXBBY36496')).toBe('WF0XXGCGXBBY36496');
  });

  it('should handle missing VINs', () => {
    expect(getFullVin(null)).toBe('Neuvedeno');
    expect(getFullVin(undefined)).toBe('Neuvedeno');
  });
});

describe('formatCarName', () => {
  it('should format brand + model', () => {
    expect(formatCarName('Ford', 'Mondeo')).toBe('Ford Mondeo');
    expect(formatCarName('Skoda', 'Octavia')).toBe('Skoda Octavia');
  });

  it('should handle missing values', () => {
    expect(formatCarName('Ford', undefined)).toBe('Ford');
    expect(formatCarName(undefined, 'Mondeo')).toBe('Mondeo');
    expect(formatCarName(undefined, undefined)).toBe('Neuvedeno');
  });
});

// ============================================================================
// CALCULATION TESTS
// ============================================================================

describe('computeStatusBreakdown', () => {
  it('should compute breakdown from leads', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      { currentStatusLabel: 'Schvaleno', uniqueId: 1 } as any,
      { currentStatusLabel: 'Schvaleno', uniqueId: 2 } as any,
      { currentStatusLabel: 'Zamitnuto', uniqueId: 3 } as any
    ];

    const breakdown = computeStatusBreakdown(leads);

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].status).toBe('Schvaleno');
    expect(breakdown[0].count).toBe(2);
    expect(breakdown[0].percentage).toBe(66.7);
    expect(breakdown[1].status).toBe('Zamitnuto');
    expect(breakdown[1].count).toBe(1);
    expect(breakdown[1].percentage).toBe(33.3);
  });

  it('should handle empty leads', () => {
    const breakdown = computeStatusBreakdown([]);
    expect(breakdown).toHaveLength(0);
  });

  it('should sort by count descending', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      { currentStatusLabel: 'A', uniqueId: 1 } as any,
      { currentStatusLabel: 'B', uniqueId: 2 } as any,
      { currentStatusLabel: 'B', uniqueId: 3 } as any,
      { currentStatusLabel: 'B', uniqueId: 4 } as any
    ];

    const breakdown = computeStatusBreakdown(leads);

    expect(breakdown[0].status).toBe('B');
    expect(breakdown[0].count).toBe(3);
    expect(breakdown[1].status).toBe('A');
    expect(breakdown[1].count).toBe(1);
  });
});

describe('computeDeclinedReasons', () => {
  it('should compute reasons from declined leads', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      { currentStatusLabel: 'Zamitnuto', declinedReasonLabel: 'Spatny stav', uniqueId: 1 } as any,
      { currentStatusLabel: 'Zamitnuto', declinedReasonLabel: 'Spatny stav', uniqueId: 2 } as any,
      { currentStatusLabel: 'Schvaleno', uniqueId: 3 } as any
    ];

    const reasons = computeDeclinedReasons(leads);

    expect(reasons).toHaveLength(1);
    expect(reasons[0].reason).toBe('Spatny stav');
    expect(reasons[0].count).toBe(2);
    expect(reasons[0].percentage).toBe(100.0);
  });

  it('should handle no declined leads', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      { currentStatusLabel: 'Schvaleno', uniqueId: 1 } as any
    ];

    const reasons = computeDeclinedReasons(leads);
    expect(reasons).toHaveLength(0);
  });
});

describe('computeSlaBuckets', () => {
  it('should compute SLA buckets for in-progress leads', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      { currentStatusLabel: 'Predano technikovi', daysInTechnicianReview: 5, uniqueId: 1 } as any,
      { currentStatusLabel: 'Predano technikovi', daysInTechnicianReview: 10, uniqueId: 2 } as any,
      { currentStatusLabel: 'Predano technikovi', daysInTechnicianReview: 2, uniqueId: 3 } as any,
      { currentStatusLabel: 'Schvaleno', daysInTechnicianReview: 20, uniqueId: 4 } as any
    ];

    const buckets = computeSlaBuckets(leads, [3, 7]);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].threshold).toBe(3);
    expect(buckets[0].count).toBe(2); // 5 and 10 days
    expect(buckets[1].threshold).toBe(7);
    expect(buckets[1].count).toBe(1); // only 10 days
  });

  it('should handle empty leads', () => {
    const buckets = computeSlaBuckets([], [3, 7]);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].count).toBe(0);
    expect(buckets[1].count).toBe(0);
  });
});

describe('getLastNote', () => {
  it('should return most recent note', () => {
    const notes = [
      { text: 'Old note', date: new Date('2025-01-01'), author: 'User1' },
      { text: 'Recent note', date: new Date('2025-12-16'), author: 'User2' },
      { text: 'Middle note', date: new Date('2025-06-01'), author: 'User3' }
    ];

    const lastNote = getLastNote(notes);

    expect(lastNote).not.toBeNull();
    expect(lastNote?.text).toBe('Recent note');
    expect(lastNote?.author).toBe('User2');
  });

  it('should handle empty notes', () => {
    const lastNote = getLastNote([]);
    expect(lastNote).toBeNull();
  });

  it('should handle undefined notes', () => {
    const lastNote = getLastNote(undefined);
    expect(lastNote).toBeNull();
  });
});

describe('sortLeads', () => {
  it('should prioritize in-progress leads by days desc', () => {
    const leads: IFunnelTechnikLeadItem[] = [
      {
        currentStatusLabel: 'Schvaleno',
        daysInTechnicianReview: 1,
        handedToTechnicianDate: new Date('2025-01-01'),
        uniqueId: 1
      } as any,
      {
        currentStatusLabel: 'Predano technikovi',
        daysInTechnicianReview: 5,
        handedToTechnicianDate: new Date('2025-12-10'),
        uniqueId: 2
      } as any,
      {
        currentStatusLabel: 'Predano technikovi',
        daysInTechnicianReview: 10,
        handedToTechnicianDate: new Date('2025-12-05'),
        uniqueId: 3
      } as any
    ];

    const sorted = sortLeads(leads);

    expect(sorted[0].uniqueId).toBe(3); // 10 days, in progress
    expect(sorted[1].uniqueId).toBe(2); // 5 days, in progress
    expect(sorted[2].uniqueId).toBe(1); // approved (not in progress)
  });

  it('should handle empty leads', () => {
    const sorted = sortLeads([]);
    expect(sorted).toHaveLength(0);
  });
});
