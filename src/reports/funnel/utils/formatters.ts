/**
 * Funnel Report - Utility Functions
 * Formatovani, vypocty, validace
 * Bez cestiny diakritiky
 */

import type { IFunnelStageData, IDropOff, IFunnelNote } from '@/types/reporting';

/**
 * Form�tov�n� data do �esk�ho form�tu
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Form�tov�n� ��sla s �esk�mi odd�lova�i
 */
export function formatNumber(value: number, decimals = 0): string {
  const formatted = value.toLocaleString('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Ensure deterministic output across environments (Intl may use NBSP/narrow NBSP as a thousands separator)
  return formatted.replace(/[\u00A0\u202F]/g, ' ');
}

/**
 * Form�tov�n� procenta
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Form�tov�n� obdob� do textu
 */
export function formatPeriod(dateFrom: Date | string, dateTo: Date | string): string {
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
}

/**
 * Form�tov�n� data a �asu
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Normalizace stages - dopln� chyb�j�c� stage a se�ad�
 */
export function normalizeStages(stages: IFunnelStageData[]): IFunnelStageData[] {
  const requiredStages = [
    'Novy lead',
    'Schvalen AM',
    'Predano technikovi',
    'Konvertovano',
  ];

  const stageMap = new Map<string, IFunnelStageData>();
  
  // Mapov�n� existuj�c�ch stages
  stages.forEach((stage) => {
    let normalizedName = stage.stage;
    
    // Normalizace n�zv�
    if (stage.stage.includes('P�ed�no technikovi') || stage.stage.includes('Awaiting Documents')) {
      normalizedName = 'Predano technikovi';
    }

    stageMap.set(normalizedName, {
      ...stage,
      stage: normalizedName,
    });
  });

  // Dopln�n� chyb�j�c�ch stages
  const result: IFunnelStageData[] = [];
  requiredStages.forEach((stageName) => {
    if (stageMap.has(stageName)) {
      result.push(stageMap.get(stageName)!);
    } else {
      result.push({
        stage: stageName,
        count: 0,
        percentage: 0,
        declinedReasons: [],
        notes: [],
      });
    }
  });

  return result;
}

/**
 * V�po�et drop-off mezi stages
 */
export function computeDropOff(stages: IFunnelStageData[]): IDropOff[] {
  const dropOffs: IDropOff[] = [];
  
  for (let i = 0; i < stages.length - 1; i++) {
    const currentStage = stages[i];
    const nextStage = stages[i + 1];
    
    const dropCount = currentStage.count - nextStage.count;
    const dropRate = currentStage.count > 0 
      ? (dropCount / currentStage.count) * 100 
      : 0;
    
    dropOffs.push({
      from: currentStage.stage,
      to: nextStage.stage,
      dropCount,
      dropRate,
    });
  }
  
  return dropOffs;
}

/**
 * Z�sk�n� nejv�t��ho drop-off
 */
export function getLargestDropOff(dropOffs: IDropOff[]): IDropOff | null {
  if (dropOffs.length === 0) return null;
  
  return dropOffs.reduce((max, current) => 
    current.dropCount > max.dropCount ? current : max
  );
}

/**
 * Z�sk�n� posledn�ch N pozn�mek se�azen�ch podle data
 */
export function getLatestNotes(notes: IFunnelNote[] | undefined, limit = 3): IFunnelNote[] {
  if (!notes || notes.length === 0) return [];
  
  return [...notes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/**
 * Validace sou�tu procent (tolerance 0.5%)
 */
export function validatePercentages(
  items: Array<{ percentage: number }>
): { ok: boolean; diff: number } {
  const sum = items.reduce((acc, item) => acc + item.percentage, 0);
  const diff = Math.abs(100 - sum);
  
  return {
    ok: diff <= 0.5,
    diff,
  };
}

/**
 * Fallback v�po�et conversion rate
 */
export function computeConversionRate(
  convertedLeads: number,
  totalLeads: number
): number {
  if (totalLeads === 0) return 0;
  return (convertedLeads / totalLeads) * 100;
}

/**
 * Identifikace typick�ch bloker� z pozn�mek
 */
export function identifyBlockersFromNotes(notes: IFunnelNote[]): string[] {
  const blockers: string[] = [];
  const notesText = notes.map(n => n.text.toLowerCase()).join(' ');
  
  if (notesText.includes('ceka') || notesText.includes('�ek�')) {
    blockers.push('Cekani na dalsi krok');
  }
  
  if (notesText.includes('dokument') || notesText.includes('doklad')) {
    blockers.push('Chybi dokumenty');
  }
  
  if (notesText.includes('nedovolano') || notesText.includes('nekontaktni')) {
    blockers.push('Problemy s kontaktem');
  }
  
  if (notesText.includes('posoudit') || notesText.includes('posouzeni') || notesText.includes('kontrola')) {
    blockers.push('Ceka na posouzeni');
  }
  
  return blockers;
}

/**
 * Generov�n� action items na z�klad� drop-off
 */
export function generateActionItems(
  largestDropOff: IDropOff | null,
  avgTimeInStages: Record<string, number>
): string[] {
  const actions: string[] = [];
  
  // If we don't have a drop-off, we can still generate actions based on time-in-stage.
  
  // Akce podle pozice nejv�t��ho drop-off
  if (largestDropOff?.from === 'Novy lead') {
    actions.push('Zlepsit prvotni kvalifikaci leadu a kontaktni strategii');
    actions.push('Analyzovat duvody ztrat v prvnim kroku (top decline reasons)');
    actions.push('Zvysit rychlost prvniho kontaktu s leadem');
  }
  
  if (largestDropOff?.from === 'Schvalen AM') {
    actions.push('Zrychlit proces predani technikovi');
    actions.push('Zkontrolovat SLA pro predani dokumentu');
    actions.push('Analyzovat duvody zam�tnuti v tech reviw');
  }
  
  if (largestDropOff?.from === 'Predano technikovi') {
    actions.push('Zkratit dobu technickych kontrol (SLA monitoring)');
    actions.push('Pro�kolit techniky - identifikovat cast� zam�tnuti');
    actions.push('Nastavit automaticke pripominky po 3 dnech v tech reviw');
  }
  
  // Akce podle dlouh� doby ve stage
  Object.entries(avgTimeInStages).forEach(([stage, days]) => {
    if (days > 7) {
      actions.push(`Zkratit prumernou dobu ve fazi "${stage}" (aktualne ${days.toFixed(1)} dni)`);
    }
  });
  
  // Obecn� doporu�en�
  if (actions.length === 0) {
    actions.push('Udrzovat aktualni tempo, konverze bezi stabilne');
  }
  
  return actions.slice(0, 5); // Max 5 akc�
}

/**
 * Export do JSON s metadaty
 */
export function exportToJSON(
  data: any,
  dateFrom: Date | string,
  dateTo: Date | string
): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    period: {
      from: typeof dateFrom === 'string' ? dateFrom : dateFrom.toISOString(),
      to: typeof dateTo === 'string' ? dateTo : dateTo.toISOString(),
    },
    data,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * P��prava n�zvu souboru pro export
 */
export function generateExportFilename(
  dateFrom: Date | string,
  dateTo: Date | string,
  extension: 'pdf' | 'json'
): string {
  const from = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom;
  const to = typeof dateTo === 'string' ? new Date(dateTo) : dateTo;
  
  const fromStr = `${from.getFullYear()}${(from.getMonth() + 1).toString().padStart(2, '0')}${from.getDate().toString().padStart(2, '0')}`;
  const toStr = `${to.getFullYear()}${(to.getMonth() + 1).toString().padStart(2, '0')}${to.getDate().toString().padStart(2, '0')}`;
  
  return `funnel-report-${fromStr}-${toStr}.${extension}`;
}
