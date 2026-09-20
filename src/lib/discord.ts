import { invoke } from '@tauri-apps/api/core';

/**
 * Отправляет обновление Discord Rich Presence в Rust-слой.
 * В обычном браузере (pnpm dev) — no-op.
 */
export function updatePresence(details: string, state: string): void {
  if (typeof window === 'undefined') return;
  if (!('__TAURI_INTERNALS__' in window)) return;
  invoke('set_presence', { details, state }).catch(() => {
    // Discord not available — ignore silently.
  });
}
