import { useCallback, useState } from 'react';
import { customListKey, generateCustomWords, matchCustomList } from '../lib/ai';
import type { Language } from '../lib/dictionary';

export function useAiWords() {
  const [customTopic, setCustomTopic] = useState('');
  const [customList, setCustomList] = useState<string[] | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (lang: Language, topic: string, force = false) => {
    setBusy(true);
    setError(null);
    try {
      const words = await generateCustomWords(lang, topic, { force });
      setCustomList(words);
      setGeneratedKey(customListKey(lang, topic));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const listFor = useCallback(
    (lang: Language, topic: string) => matchCustomList(generatedKey, customList, lang, topic),
    [generatedKey, customList],
  );

  return { customTopic, setCustomTopic, customList, listFor, generate, busy, error };
}
