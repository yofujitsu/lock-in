import { useEffect, useMemo, useRef } from 'react';
import type { EngineState } from '../lib/engine';
import { tokenize } from '../lib/text';

interface Props {
  engine: EngineState;
  started: boolean;
}

export function TypingArea({ engine, started }: Props) {
  const tokens = useMemo(() => tokenize(engine.text), [engine.text]);
  const areaRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  // Keep the caret in view as the text scrolls and when the area reflows.
  useEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [engine.position, engine.text]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      caretRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const caret = <span ref={caretRef} className={`caret${started ? ' caret-active' : ''}`} />;

  return (
    <div className="typing-area" ref={areaRef} tabIndex={-1}>
      {tokens.map((token, ti) => {
        if (token.type === 'space') {
          const caretHere = engine.position === token.start;
          return (
            <span key={ti} className="space">
              {caretHere && caret}
              {' '}
            </span>
          );
        }

        const len = token.chars.length;
        const caretOffset =
          engine.position >= token.start && engine.position < token.start + len
            ? engine.position - token.start
            : -1;

        return (
          <span key={ti} className="word">
            {token.chars.map((ch, ci) => {
              const gi = token.start + ci;
              return (
                <span key={ci} className="char-wrap">
                  {caretOffset === ci && caret}
                  <span
                    className={`char char-${engine.charStates[gi]}${gi === engine.position ? ' char-current' : ''}`}
                  >
                    {ch}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
      {engine.position === engine.text.length && engine.text.length > 0 && caret}
    </div>
  );
}
