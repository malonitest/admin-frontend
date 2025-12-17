/**
 * Funnel Report - Unit Tests
 * Testy pro utility funkce
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatNumber,
  formatPercent,
  normalizeStages,
  computeDropOff,
  getLatestNotes,
  validatePercentages,
  computeConversionRate,
  identifyBlockersFromNotes,
  generateActionItems,
  getLargestDropOff,
} from '../utils/formatters';
import type { IFunnelStageData, IFunnelNote, IDropOff } from '@/types/reporting';

describe('formatDate', () => {
  it('formatuje datum do ceskeho formatu', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('15.01.2024');
  });

  it('zpracuje datum jako string', () => {
    expect(formatDate('2024-12-31')).toBe('31.12.2024');
  });
});

describe('formatNumber', () => {
  it('formatuje cislo s oddelovaci tisicu', () => {
    expect(formatNumber(1234567)).toBe('1 234 567');
  });

  it('formatuje cislo s desetinnymi misty', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1 234,57');
  });
});

describe('formatPercent', () => {
  it('formatuje procento s 1 desetinnym mistem', () => {
    expect(formatPercent(45.678)).toBe('45.7%');
  });

  it('formatuje procento s vlastnim poctem mist', () => {
    expect(formatPercent(45.678, 2)).toBe('45.68%');
  });
});

describe('normalizeStages', () => {
  it('doplni chybejici stages a seradi', () => {
    const stages: IFunnelStageData[] = [
      { stage: 'Novy lead', count: 100, percentage: 100 },
      { stage: 'Konvertovano', count: 30, percentage: 30 },
    ];

    const normalized = normalizeStages(stages);

    expect(normalized).toHaveLength(4);
    expect(normalized[0].stage).toBe('Novy lead');
    expect(normalized[1].stage).toBe('Schvalen AM');
    expect(normalized[1].count).toBe(0);
    expect(normalized[2].stage).toBe('Predano technikovi');
    expect(normalized[3].stage).toBe('Konvertovano');
  });

  it('normalizuje nazev "Predano technikovi (Awaiting Documents)"', () => {
    const stages: IFunnelStageData[] = [
      { stage: 'Novy lead', count: 100, percentage: 100 },
      { stage: 'Predano technikovi (Awaiting Documents)', count: 50, percentage: 50 },
    ];

    const normalized = normalizeStages(stages);
    const techStage = normalized.find(s => s.stage === 'Predano technikovi');

    expect(techStage).toBeDefined();
    expect(techStage?.count).toBe(50);
  });
});

describe('computeDropOff', () => {
  it('spocita spravne drop-off mezi stages', () => {
    const stages: IFunnelStageData[] = [
      { stage: 'Novy lead', count: 100, percentage: 100 },
      { stage: 'Schvalen AM', count: 80, percentage: 80 },
      { stage: 'Predano technikovi', count: 50, percentage: 50 },
      { stage: 'Konvertovano', count: 30, percentage: 30 },
    ];

    const dropOffs = computeDropOff(stages);

    expect(dropOffs).toHaveLength(3);
    expect(dropOffs[0].from).toBe('Novy lead');
    expect(dropOffs[0].to).toBe('Schvalen AM');
    expect(dropOffs[0].dropCount).toBe(20);
    expect(dropOffs[0].dropRate).toBe(20);

    expect(dropOffs[1].dropCount).toBe(30);
    expect(dropOffs[1].dropRate).toBe(37.5);
  });

  it('zvladne stage s 0 leads (dropRate = 0)', () => {
    const stages: IFunnelStageData[] = [
      { stage: 'Novy lead', count: 0, percentage: 0 },
      { stage: 'Schvalen AM', count: 0, percentage: 0 },
    ];

    const dropOffs = computeDropOff(stages);

    expect(dropOffs[0].dropRate).toBe(0);
  });
});

describe('getLargestDropOff', () => {
  it('najde nejvetsi drop-off', () => {
    const dropOffs: IDropOff[] = [
      { from: 'A', to: 'B', dropCount: 20, dropRate: 20 },
      { from: 'B', to: 'C', dropCount: 50, dropRate: 50 },
      { from: 'C', to: 'D', dropCount: 10, dropRate: 10 },
    ];

    const largest = getLargestDropOff(dropOffs);

    expect(largest).not.toBeNull();
    expect(largest?.dropCount).toBe(50);
    expect(largest?.from).toBe('B');
  });

  it('vraci null pro prazdne pole', () => {
    expect(getLargestDropOff([])).toBeNull();
  });
});

describe('getLatestNotes', () => {
  it('seradi notes podle data a vezme posledni N', () => {
    const notes: IFunnelNote[] = [
      { text: 'Note 1', date: new Date('2024-01-01'), author: 'User1' },
      { text: 'Note 2', date: new Date('2024-01-03'), author: 'User2' },
      { text: 'Note 3', date: new Date('2024-01-02'), author: 'User3' },
    ];

    const latest = getLatestNotes(notes, 2);

    expect(latest).toHaveLength(2);
    expect(latest[0].text).toBe('Note 2');
    expect(latest[1].text).toBe('Note 3');
  });

  it('vraci prazdne pole pro undefined notes', () => {
    expect(getLatestNotes(undefined, 3)).toEqual([]);
  });
});

describe('validatePercentages', () => {
  it('validuje soucet procent s toleranci', () => {
    const items = [
      { percentage: 33.3 },
      { percentage: 33.4 },
      { percentage: 33.3 },
    ];

    const result = validatePercentages(items);

    expect(result.ok).toBe(true);
    expect(result.diff).toBeLessThan(0.5);
  });

  it('detekuje spatny soucet procent', () => {
    const items = [
      { percentage: 40 },
      { percentage: 40 },
      { percentage: 30 },
    ];

    const result = validatePercentages(items);

    expect(result.ok).toBe(false);
    expect(result.diff).toBe(10);
  });
});

describe('computeConversionRate', () => {
  it('spocita conversion rate', () => {
    expect(computeConversionRate(30, 100)).toBe(30);
  });

  it('fallback pro totalLeads = 0', () => {
    expect(computeConversionRate(0, 0)).toBe(0);
  });
});

describe('identifyBlockersFromNotes', () => {
  it('identifikuje typicke blokery z poznámek', () => {
    const notes: IFunnelNote[] = [
      { text: 'Zakaznik ceka na dokumenty', date: new Date(), author: 'User1' },
      { text: 'Nedovolano 3x', date: new Date(), author: 'User2' },
      { text: 'Ceka na posouzeni', date: new Date(), author: 'User3' },
    ];

    const blockers = identifyBlockersFromNotes(notes);

    expect(blockers).toContain('Cekani na dalsi krok');
    expect(blockers).toContain('Chybi dokumenty');
    expect(blockers).toContain('Problemy s kontaktem');
    expect(blockers).toContain('Ceka na posouzeni');
  });

  it('vraci prazdne pole pro notes bez blokeru', () => {
    const notes: IFunnelNote[] = [
      { text: 'Vse OK', date: new Date(), author: 'User1' },
    ];

    const blockers = identifyBlockersFromNotes(notes);

    expect(blockers).toHaveLength(0);
  });
});

describe('generateActionItems', () => {
  it('generuje akce podle nejvìtšího drop-off', () => {
    const largestDropOff: IDropOff = {
      from: 'Novy lead',
      to: 'Schvalen AM',
      dropCount: 50,
      dropRate: 50,
    };

    const avgTimeInStages = {
      'Novy lead': 2.5,
      'Schvalen AM': 5.3,
    };

    const actions = generateActionItems(largestDropOff, avgTimeInStages);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(a => a.includes('kvalifikaci'))).toBe(true);
  });

  it('generuje akce pri dlouhe dobe ve stage', () => {
    const avgTimeInStages = {
      'Predano technikovi': 10.5,
    };

    const actions = generateActionItems(null, avgTimeInStages);

    expect(actions.some(a => a.includes('Zkratit'))).toBe(true);
  });

  it('vraci defaultni akci kdyz neni problém', () => {
    const actions = generateActionItems(null, {});

    expect(actions).toContain('Udrzovat aktualni tempo, konverze bezi stabilne');
  });
});
