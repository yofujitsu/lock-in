import { useMemo } from 'react';
import type { EngineState } from '../lib/engine';
import { tokenize } from '../lib/text';

interface Props {
  engine: EngineState;
}

export function TypingArea({ engine }: Props) {
  const tokens = useMemo(() => tokenize(engine.text), [engine.text]);

  return (
    <div className="typing-area">
      {tokens.map((token, ti) => {
        if (token.type === 'space') {
          const caretHere = engine.position === token.start;
          return (
            <span key={ti} className="space">
              {caretHere && <span className="caret" />}
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
                  {caretOffset === ci && <span className="caret" />}
                  <span className={`char char-${engine.charStates[gi]}`}>{ch}</span>
                </span>
              );
            })}
          </span>
        );
      })}
      {engine.position === engine.text.length && engine.text.length > 0 && (
        <span className="caret" />
      )}
    </div>
  );
}
