import { useCallback, useState } from 'react';
import { generateCustomWords } from '../lib/ai';
import type { Language } from '../lib/dictionary';

export function useAiWords() {
  const [customTopic, setCustomTopic] = useState('');
  const [customList, setCustomList] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (lang: Language, topic: string, force = false) => {
    setBusy(true);
    setError(null);
    try {
      setCustomList(await generateCustomWords(lang, topic, { force }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return { customTopic, setCustomTopic, customList, generate, busy, error };
}
