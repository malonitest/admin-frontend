import { useCallback } from 'react';
import cs from '@/i18n/cs.json';

type TranslationKey = string;
type Translations = typeof cs;

const translations: Translations = cs;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export function useTranslation() {
  const t = useCallback((key: TranslationKey): string => {
    return getNestedValue(translations as unknown as Record<string, unknown>, key);
  }, []);

  return { t };
}

export default useTranslation;
