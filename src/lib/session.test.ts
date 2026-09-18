import { describe, it, expect } from 'vitest';
import { createSession } from './session';

function makeClock() {
  let t = 0;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe('createSession (free)', () => {
  it('завершает сессию после набора всего текста', () => {
    const s = createSession({ text: 'ab', mode: { type: 'free' } });
    expect(s.snapshot().finished).toBe(false);

    s.input('a');
    const snap = s.input('b');
    expect(snap.engine.finished).toBe(true);
    expect(snap.finished).toBe(true);
  });

  it('таймер стартует с первого печатного символа', () => {
    const clock = makeClock();
    const s = createSession({ text: 'ab', mode: { type: 'free' }, now: clock.now });

    expect(s.snapshot().started).toBe(false);

    clock.advance(500);
    const snap = s.input('a');
    expect(snap.started).toBe(true);
    expect(snap.elapsedMs).toBe(0);
  });

  it('backspace до первого символа не запускает таймер', () => {
    const clock = makeClock();
    const s = createSession({ text: 'ab', mode: { type: 'free' }, now: clock.now });

    const snap = s.input('Backspace');
    expect(snap.started).toBe(false);
  });

  it('фиксирует время по завершении (elapsed не растёт после finish)', () => {
    const clock = makeClock();
    const s = createSession({ text: 'a', mode: { type: 'free' }, now: clock.now });

    s.input('a'); // finished
    clock.advance(5000);
    const snap = s.snapshot();
    expect(snap.finished).toBe(true);
    expect(snap.elapsedMs).toBe(0);
  });
});

describe('createSession (timed)', () => {
  it('отсчитывает оставшееся время и завершает по таймауту', () => {
    const clock = makeClock();
    const s = createSession({ text: 'abc', mode: { type: 'timed', seconds: 60 }, now: clock.now });

    expect(s.snapshot().timeLeftMs).toBe(60_000);

    clock.advance(1000);
    const started = s.input('a');
    expect(started.timeLeftMs).toBe(60_000);
    expect(started.elapsedMs).toBe(0);

    clock.advance(60_000);
    const snap = s.snapshot();
    expect(snap.elapsedMs).toBe(60_000);
    expect(snap.timeLeftMs).toBe(0);
    expect(snap.timedOut).toBe(true);
    expect(snap.finished).toBe(true);
  });

  it('после таймаута игнорирует дальнейший ввод', () => {
    const clock = makeClock();
    const s = createSession({ text: 'abc', mode: { type: 'timed', seconds: 1 }, now: clock.now });

    s.input('a');
    clock.advance(1000);

    const before = s.snapshot();
    const after = s.input('b');
    expect(after.engine.position).toBe(before.engine.position);
  });
});

describe('createSession (restart)', () => {
  it('сбрасывает состояние и таймер', () => {
    const clock = makeClock();
    const s = createSession({ text: 'abc', mode: { type: 'timed', seconds: 60 }, now: clock.now });

    s.input('a');
    clock.advance(5000);

    const snap = s.restart();
    expect(snap.engine.position).toBe(0);
    expect(snap.engine.correct).toBe(0);
    expect(snap.started).toBe(false);
    expect(snap.elapsedMs).toBe(0);
  });
});
