import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_AI_SETTINGS, loadAiSettings, saveAiSettings, type AiSettings } from '../lib/ai';

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    loadAiSettings().then(setSettings).catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<AiSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      void saveAiSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
